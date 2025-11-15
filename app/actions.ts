"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signInSchema, signUpSchema, sendMagicLinkSchema, forgotPasswordSchema, updatePasswordSchema, updateProfileSchema, createBookingSchema } from "@/lib/validation";

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return redirect(`/auth/login?message=${message}`);
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/auth/login?message=Could not authenticate user");
  }

  return redirect("/protected");
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return redirect(`/auth/sign-up?message=${message}`);
  }

  const origin = headers().get("origin");
  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return redirect("/auth/sign-up?message=Could not authenticate user");
  }

  return redirect("/auth/sign-up-success");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/auth/login");
}

export async function forgotPassword(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return redirect(`/auth/forgot-password?message=${message}`);
  }

  const { email } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${headers().get("origin")}/auth/update-password`,
  });

  if (error) {
    return redirect("/auth/forgot-password?message=Could not send reset email");
  }

  return redirect("/auth/forgot-password?message=Password reset email sent");
}

export async function sendMagicLink(formData: FormData) {
  const parsed = sendMagicLinkSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return redirect(`/auth/login?message=${message}`);
  }

  const origin = headers().get("origin");
  const { email } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`, // Or a dedicated magic link confirmation page
    },
  });

  if (error) {
    return redirect("/auth/login?message=Could not send magic link");
  }

  return redirect("/auth/login?message=Magic link sent! Check your email.");
}

export async function updatePassword(formData: FormData) {
  const parsed = updatePasswordSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return redirect(`/auth/update-password?message=${message}`);
  }

  const { password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return redirect("/auth/update-password?message=Could not update password");
  }

  return redirect("/auth/login?message=Password updated successfully");
}

export async function updateProfile(formData: FormData) {
  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return { error: message };
  }

  const { userId, username, fullName, avatarUrl, bio } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: fullName,
      avatar_url: avatarUrl,
      bio,

    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function createBooking(formData: FormData) {
  const parsed = createBookingSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return { error: message };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated." };
  }

  const { king_id, start_time, end_time } = parsed.data;

  // Fetch king details to calculate total_price
  const { data: king, error: kingError } = await supabase
    .from("kings")
    .select("price_per_hour")
    .eq("id", king_id)
    .single();

  if (kingError || !king) {
    return { error: kingError?.message || "King not found." };
  }

  const durationHours =
    (new Date(end_time).getTime() - new Date(start_time).getTime()) /
    (1000 * 60 * 60);
  const parsedPrice = parseFloat(king.price_per_hour);
  if (isNaN(parsedPrice)) {
    return { error: "Invalid king price." };
  }
  const total_price = durationHours * parsedPrice;

  const { data, error } = await supabase.from("bookings").insert({
    user_id: user.id,
    king_id,
    start_time,
    end_time,
    total_price,
    status: "pending", // Default status
  }).select();

  if (error) {
    return { error: error.message };
  }

  return { error: null, bookingId: data[0].id };
}

export async function resendVerificationEmail(formData: FormData) {
  const parsed = sendMagicLinkSchema.safeParse(Object.fromEntries(formData.entries())); // Re-using sendMagicLinkSchema as it only needs email

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return { error: message };
  }

  const origin = headers().get("origin");
  const { email } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null, message: "Verification email re-sent. Check your inbox." };
}
