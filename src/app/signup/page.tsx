'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { createClient } from '@/lib/supabase/client';

const SignupSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters').max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type SignupValues = z.infer<typeof SignupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupValues>({
    resolver: zodResolver(SignupSchema),
  });

  const onSubmit = (values: SignupValues) => {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error) { toast.error('Sign up failed', { description: error.message }); return; }
      setSent(true);
    });
  };

  if (sent) {
    return (
      <main className="min-h-svh flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Logo className="size-12 mx-auto" />
          <h1 className="text-2xl font-bold">Check your inbox</h1>
          <p className="text-muted-foreground text-sm">
            We sent a confirmation link to your email. Click it to activate your account and start your journey.
          </p>
          <Button variant="outline" onClick={() => router.push('/login')}>Back to Sign In</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo className="size-12" />
          <h1 className="text-2xl font-bold tracking-tight">Claim your throne</h1>
          <p className="text-sm text-muted-foreground">Create your free account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com"
              aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="••••••••" className="pr-10" {...register('password')} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide' : 'Show'}>
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive" role="alert">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              placeholder="••••••••" {...register('confirm')} />
            {errors.confirm && <p className="text-xs text-destructive" role="alert">{errors.confirm.message}</p>}
          </div>

          <Button type="submit" className="w-full h-11" disabled={isPending}>
            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Create Account
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you confirm you are 18+ and agree to our{' '}
          <Link href="/legal/terms" className="underline underline-offset-4 hover:text-primary">Terms</Link> and{' '}
          <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
