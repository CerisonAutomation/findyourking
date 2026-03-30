import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Find Your King.',
};

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/discover');

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your kingdom</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
