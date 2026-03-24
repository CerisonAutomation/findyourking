'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, Crown } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const authSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleSignIn = async (data: AuthFormValues) => {
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      toast.error('Sign in failed', { description: error.message });
      return;
    }
    toast.success('Welcome back, King!');
    router.push('/discover');
    router.refresh();
  };

  const handleSignUp = async (data: AuthFormValues) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error('Sign up failed', { description: error.message });
      return;
    }
    toast.success('Check your inbox', {
      description: 'We sent a confirmation link to your email.',
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailCheck = z.string().email().safeParse(magicEmail);
    if (!emailCheck.success) {
      toast.error('Enter a valid email address');
      return;
    }
    setIsMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setIsMagicLoading(false);
    if (error) {
      toast.error('Failed to send magic link', { description: error.message });
      return;
    }
    setMagicLinkSent(true);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <Crown className="absolute -bottom-40 -right-40 size-[600px] text-primary/5 rotate-12" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo />
          <p className="text-muted-foreground text-sm">
            The premier gay dating &amp; booking platform
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
          <Tabs defaultValue="signin">
            <TabsList className="w-full rounded-none border-b bg-transparent px-6 pt-4 pb-0 h-auto">
              <TabsTrigger
                value="signin"
                className="flex-1 pb-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="flex-1 pb-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <Form {...form}>
              <TabsContent value="signin" asChild>
                <form onSubmit={form.handleSubmit(handleSignIn)} noValidate>
                  <CardContent className="space-y-4 pt-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                              <Input
                                type="email"
                                placeholder="king@fyking.men"
                                className="pl-9"
                                autoComplete="email"
                                aria-label="Email address"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pl-9 pr-10"
                                autoComplete="current-password"
                                aria-label="Password"
                                {...field}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                              >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="pb-6">
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        'Enter the Kingdom'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="signup" asChild>
                <form onSubmit={form.handleSubmit(handleSignUp)} noValidate>
                  <CardContent className="space-y-4 pt-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                              <Input
                                type="email"
                                placeholder="king@fyking.men"
                                className="pl-9"
                                autoComplete="email"
                                aria-label="Email address"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min. 8 characters"
                                className="pl-9 pr-10"
                                autoComplete="new-password"
                                aria-label="Password"
                                {...field}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                              >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="pb-6">
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        'Claim Your Crown'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Form>
          </Tabs>

          <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            {magicLinkSent ? (
              <p className="text-center text-sm text-muted-foreground py-2">
                ✉️ Magic link sent — check your inbox.
              </p>
            ) : (
              <form onSubmit={handleMagicLink} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Passwordless sign-in via email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  className="flex-1"
                  aria-label="Email for magic link"
                />
                <Button type="submit" variant="outline" disabled={isMagicLoading}>
                  {isMagicLoading ? <Loader2 className="size-4 animate-spin" /> : 'Send Link'}
                </Button>
              </form>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground px-4">
          By continuing you agree to our{' '}
          <a href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</a>.
          This platform is for adults 18+.
        </p>
      </div>
    </main>
  );
}
