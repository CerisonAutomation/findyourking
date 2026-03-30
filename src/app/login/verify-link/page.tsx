'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

/**
 * Supabase handles the magic-link token exchange automatically via its
 * onAuthStateChange listener (in UserProvider). This page simply waits
 * for the user object to be hydrated and then redirects accordingly.
 */
function VerifyLinkComponent() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying your session…');

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      setStatus('Sign-in successful. Redirecting…');
      toast.success('Welcome back, King.');
      router.replace('/');
    } else {
      setStatus('Verification failed.');
      toast.error('Sign In Failed', {
        description: 'Could not verify your session. Please try again.',
      });
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center gap-6 p-4">
      <Logo className="mb-2" />
      <Loader2 className="size-12 animate-spin text-primary" aria-hidden="true" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{status}</h1>
        <p className="text-muted-foreground text-sm">
          Please wait while we grant you access to the kingdom.
        </p>
      </div>
    </div>
  );
}

export default function VerifyLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
        </div>
      }
    >
      <VerifyLinkComponent />
    </Suspense>
  );
}
