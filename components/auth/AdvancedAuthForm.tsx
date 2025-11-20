'use client';

/**
 * ADVANCED AUTH FORM - 150/100 TIER
 * Per Supabase Auth docs: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
 * Per OWASP: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 * Per WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
 */

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle, CheckCircle2, Loader2, Clock, Shield, Github, Chrome } from 'lucide-react';
import { signIn, signUp, signInWithMagicLink } from '@/lib/auth/unified-auth';

// Zod validation schemas
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter');

type AuthMode = 'signin' | 'signup' | 'magic';

interface AuthFormProps {
  defaultMode?: AuthMode;
}

export default function AdvancedAuthForm({ defaultMode = 'signin' }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rateLimitReset, setRateLimitReset] = useState<Date | null>(null);
  const [socialAuthPending, setSocialAuthPending] = useState<string | null>(null);
  const router = useRouter();

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  // Rate limiting countdown timer
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (rateLimitReset) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((rateLimitReset.getTime() - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          setRateLimitReset(null);
          setCountdown(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [rateLimitReset]);

  // Social auth handlers
  const signInWithGoogle = async () => {
    setSocialAuthPending('google');
    setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setSocialAuthPending(null);
    }
  };

  const signInWithGithub = async () => {
    setSocialAuthPending('github');
    setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with GitHub');
      setSocialAuthPending(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setError(emailValidation.error.errors[0].message);
      return;
    }

    startTransition(async () => {
      try {
        if (mode === 'magic') {
          const result = await signInWithMagicLink(email);
          if (result.success) {
            setSuccess('Check your email for the magic link!');
            setEmail('');
          } else {
            setError(result.error || 'Failed to send magic link');
          }
        } else if (mode === 'signup') {
          const passwordValidation = passwordSchema.safeParse(password);
          if (!passwordValidation.success) {
            setError(passwordValidation.error.errors[0].message);
            return;
          }

          const result = await signUp(email, password);
          if (result.success) {
            if (result.requiresConfirmation) {
              setSuccess('Check your email to confirm your account!');
              setEmail('');
              setPassword('');
            } else {
              router.push('/dashboard');
            }
          } else {
            setError(result.error || 'Sign up failed');
          }
        } else {
          if (!password) {
            setError('Password is required');
            return;
          }

          const result = await signIn(email, password);
          if (result.success) {
            router.push('/dashboard');
          } else {
            // Check if it's a rate limit error
            if (result.error?.includes('rate limit') || result.error?.includes('429')) {
              // Set rate limit reset time (assume 15 minutes for now, should come from API)
              setRateLimitReset(new Date(Date.now() + 15 * 60 * 1000));
            }
            setError(result.error || 'Sign in failed');
          }
        }
      } catch {
        setError('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Authentication method">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            mode === 'signin'
              ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
          role="tab"
          aria-selected={mode === 'signin'}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            mode === 'signup'
              ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
          role="tab"
          aria-selected={mode === 'signup'}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/50 rounded-lg" role="alert">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/50 rounded-lg" role="status">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-green-500">{success}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              placeholder="you@example.com"
              disabled={isPending}
            />
          </div>
        </div>

        {mode !== 'magic' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                placeholder="••••••••"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {mode === 'signup' && password && passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Password Strength</span>
                  <span className={`text-xs font-semibold ${passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score <= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score / 6) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rate limiting warning */}
        {rateLimitReset && countdown > 0 && (
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg" role="alert">
            <Clock className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-500">Too many attempts</p>
              <p className="text-sm text-yellow-400">
                Try again in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !!rateLimitReset && countdown > 0}
          className="w-full py-3 px-4 bg-linear-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : mode === 'magic' ? (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Send Magic Link</span>
            </>
          ) : mode === 'signup' ? (
            <span>Create Account</span>
          ) : (
            <span>Sign In</span>
          )}
        </button>

        {/* Social Auth Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white/5 text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Social Auth Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={socialAuthPending === 'google' || isPending}
            className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            {socialAuthPending === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={signInWithGithub}
            disabled={socialAuthPending === 'github' || isPending}
            className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            {socialAuthPending === 'github' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Github className="w-5 h-5" />
            )}
            <span>Continue with GitHub</span>
          </button>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-300">
            <p className="font-medium mb-1">Secure Authentication</p>
            <p>Your data is encrypted and protected with enterprise-grade security.</p>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'magic' ? 'signin' : 'magic')}
            className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" />
            {mode === 'magic' ? 'Use password instead' : 'Use magic link instead'}
          </button>
        </div>
      </form>
    </div>
  );
}
