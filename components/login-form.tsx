'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth/unified-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  className?: string;
  redirectUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginForm({
  className,
  redirectUrl = '/dashboard',
  onSuccess,
  onError,
}: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email/Username validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email or Username is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await signIn(formData.email, formData.password);

        if (!result.success) {
          const errorMessage = result.error || 'Failed to sign in';
          setErrors({ general: errorMessage });
          onError?.(errorMessage);
          return;
        }

        // Success
        onSuccess?.();
        router.push(redirectUrl);
        router.refresh();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';
        setErrors({ general: errorMessage });
        onError?.(errorMessage);
      }
    });
  };

  /**
   * Handle input changes
   */
  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      noValidate
      aria-label="Login form"
    >
      {/* General error message */}
      {errors.general && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
          aria-live="assertive"
        >
          <p className="font-medium">Error</p>
          <p className="mt-1">{errors.general}</p>
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email or Username
        </Label>
        <Input
          id="email"
          name="email"
          type="text"
          autoComplete="username"
          required
          value={formData.email}
          onChange={handleChange('email')}
          disabled={isPending}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          placeholder="you@example.com or username"
          className={cn(errors.email && 'border-destructive')}
        />
        {errors.email && (
          <p
            id="email-error"
            role="alert"
            className="text-sm text-destructive"
            aria-live="polite"
          >
            {errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <a
            href="/auth/forgot-password"
            className="text-sm text-primary hover:text-primary/80 transition-colors focus:outline-none focus:underline"
            tabIndex={isPending ? -1 : 0}
          >
            Forgot password?
          </a>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleChange('password')}
          disabled={isPending}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          placeholder="Enter your password"
          className={cn(errors.password && 'border-destructive')}
        />
        {errors.password && (
          <p
            id="password-error"
            role="alert"
            className="text-sm text-destructive"
            aria-live="polite"
          >
            {errors.password}
          </p>
        )}
      </div>

      {/* Remember me checkbox */}
      <div className="flex items-center space-x-2">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          checked={formData.rememberMe}
          onChange={handleChange('rememberMe')}
          disabled={isPending}
          className={cn(
            'h-4 w-4 rounded border-input text-primary',
            'focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
        <Label
          htmlFor="remember-me"
          className="text-sm font-normal cursor-pointer select-none"
        >
          Remember me for 30 days
        </Label>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full"
        size="lg"
        aria-label={isPending ? 'Signing in...' : 'Sign in'}
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      {/* Sign up link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <a
          href="/auth/sign-up"
          className="font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none focus:underline"
          tabIndex={isPending ? -1 : 0}
        >
          Sign up
        </a>
      </p>
    </form>
  );
}
