"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// SIGN UP WITH EMAIL & PASSWORD
// =====================================================
// Reference: https://supabase.com/docs/guides/auth/passwords
export async function signUpWithPassword(
  email: string,
  password: string,
  options?: { redirectTo?: string }
) {
  if (!email || !password) {
    return {
      error: "Email and password are required",
      success: false,
    };
  }

  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters",
      success: false,
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: options?.redirectTo || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
      },
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    if (data.user && !data.session) {
      return {
        error: "Please check your email for a confirmation link",
        success: true,
        requiresConfirmation: true,
      };
    }

    revalidatePath("/");
    return {
      success: true,
      user: data.user,
      message: "Account created successfully",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return {
      error: errorMessage,
      success: false,
    };
  }
}

// =====================================================
// SIGN IN WITH EMAIL & PASSWORD
// =====================================================
// Reference: https://supabase.com/docs/guides/auth/passwords
export async function signInWithPassword(email: string, password: string) {
  if (!email || !password) {
    return {
      error: "Email and password are required",
      success: false,
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    if (!data.session) {
      return {
        error: "Failed to create session",
        success: false,
      };
    }

    revalidatePath("/");
    return {
      success: true,
      user: data.user,
      message: "Signed in successfully",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return {
      error: errorMessage,
      success: false,
    };
  }
}

// =====================================================
// FORGOT PASSWORD - REQUEST RESET EMAIL
// =====================================================
// Reference: https://supabase.com/docs/guides/auth/passwords
export async function requestPasswordReset(email: string) {
  if (!email) {
    return {
      error: "Email is required",
      success: false,
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/reset-password`,
      }
    );

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    // Don't reveal if email exists (security best practice)
    return {
      success: true,
      message: "If an account exists with this email, you will receive a password reset link",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return {
      error: errorMessage,
      success: false,
    };
  }
}

// =====================================================
// UPDATE PASSWORD (used after reset)
// =====================================================
// Reference: https://supabase.com/docs/guides/auth/passwords
export async function updatePassword(newPassword: string) {
  if (!newPassword) {
    return {
      error: "New password is required",
      success: false,
    };
  }

  if (newPassword.length < 8) {
    return {
      error: "Password must be at least 8 characters",
      success: false,
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    revalidatePath("/");
    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return {
      error: errorMessage,
      success: false,
    };
  }
}

// =====================================================
// MAGIC LINK AUTHENTICATION
// =====================================================
// Reference: https://supabase.com/docs/guides/auth/auth-email-passwordless
export async function signInWithMagicLink(email: string) {
  if (!email) {
    return {
      error: "Email is required",
      success: false,
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      success: true,
      message: "Check your email for the magic login link",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return {
      error: errorMessage,
      success: false,
    };
  }
}

// =====================================================
// VERIFY OTP (for magic links)
// =====================================================
// Reference: https://supabase.com/docs/guides/auth/auth-email-passwordless
export async function verifyOtp(email: string, token: string, type: "email" | "sms" = "email") {
  if (!email || !token) {
    return {
      error: "Email and token are required",
      success: false,
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: token.trim(),
      type: type as "email",
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    if (!data.session) {
      return {
        error: "Failed to create session",
        success: false,
      };
    }

    revalidatePath("/");
    return {
      success: true,
      user: data.user,
      message: "Signed in successfully",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return {
      error: errorMessage,
      success: false,
    };
  }
}

// =====================================================
// SIGN OUT
// =====================================================
export async function signOut() {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    revalidatePath("/");
    redirect("/auth");
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return {
      error: errorMessage,
      success: false,
    };
  }
}

// =====================================================
// GET CURRENT USER
// =====================================================
export async function getCurrentUser() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return {
        user: null,
        error: error.message,
      };
    }

    return {
      user,
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return {
      user: null,
      error: errorMessage,
    };
  }
}
