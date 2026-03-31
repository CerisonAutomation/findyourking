'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Email + password sign-in */
export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email:    formData.get('email')    as string,
    password: formData.get('password') as string,
  });

  if (error) redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/', 'layout');
  redirect('/discover');
}

/** Email + password sign-up — sends confirmation email */
export async function signup(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email:    formData.get('email')    as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/', 'layout');
  redirect('/discover');
}

/** OAuth providers (Google, Apple, etc.) */
export async function signInWithOAuth(provider: 'google' | 'apple') {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error) redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  if (data.url) redirect(data.url);
}
