'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

function VerifyLinkComponent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying your session...');

  useEffect(() => {
    // Supabase handles session verification automatically via the onAuthStateChange listener
    // in the provider. We just need to wait for the user object to be populated.
    if (!isUserLoading) {
        if (user) {
            setStatus('Sign-in successful. Redirecting...');
            toast.success('Welcome back, King.');
            router.push('/');
        } else {
            setStatus('Verification Failed');
            toast.error('Sign In Failed', {
                description: 'Could not verify your session. Please try again.',
            });
            router.push('/login');
        }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <Logo className="mb-8" />
        <Loader2 className="size-12 animate-spin text-primary mb-6" />
        <h1 className="text-2xl font-bold mb-2">{status}</h1>
        <p className="text-muted-foreground">Please wait while we grant you access to the kingdom.</p>
    </div>
  );
}


export default function VerifyLinkPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyLinkComponent />
    </Suspense>
  );
}
