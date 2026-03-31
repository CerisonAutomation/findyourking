import Link from 'next/link';
import { login, signInWithOAuth } from '@/app/auth/login/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to Find Your King.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-2">
        <Logo className="size-10" />
        <h1 className="text-2xl font-bold tracking-tight">Find Your King</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue</p>
      </div>

      {/* OAuth */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <form action={signInWithOAuth.bind(null, 'google')}>
          <Button variant="outline" className="w-full" type="submit">
            <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>
        </form>
      </div>

      <div className="w-full max-w-sm flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Email / Password */}
      <form action={login} className="w-full max-w-sm flex flex-col gap-4">
        {searchParams.next && (
          <input type="hidden" name="next" value={searchParams.next} />
        )}

        {searchParams.error && (
          <p className="text-sm text-destructive text-center rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2">
            {decodeURIComponent(searchParams.error)}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
