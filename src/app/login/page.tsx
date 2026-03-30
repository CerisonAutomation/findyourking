import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Find Your King.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="min-h-svh flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo className="size-12" />
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, King</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          By signing in you agree to our{' '}
          <Link href="/legal/terms" className="underline underline-offset-4 hover:text-primary">Terms</Link>{' '}and{' '}
          <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
