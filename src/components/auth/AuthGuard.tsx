'use client';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Loader2, ShieldAlert} from 'lucide-react';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {useAuth} from '@/components/providers/auth-provider';

interface AuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireAuth?: boolean;
    requireVerified?: boolean;
    requiredRole?: string;
    redirectTo?: string;
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'unverified';

export function AuthGuard({
                              children,
                              fallback,
                              requireAuth = true,
                              requireVerified = false,
                              requiredRole,
                              redirectTo = '/auth/login',
                          }: AuthGuardProps) {
    const router = useRouter();
    const {user, isLoading: authLoading} = useAuth();
    const [authState, setAuthState] = useState<AuthState>('loading');
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;

        const checkAuth = async () => {
            if (requireAuth && !user) {
                setAuthState('unauthenticated');
                return;
            }

            if (user) {
                // If we need a more complex verification check, we can use user metadata
                const isVerified = user.email_confirmed_at !== null;
                const role = user.user_metadata?.role || 'user';

                if (requireVerified && !isVerified) {
                    setAuthState('unverified');
                    return;
                }

                if (requiredRole && role !== requiredRole) {
                    setAuthState('unauthenticated');
                    return;
                }

                setUserRole(role);
                setAuthState('authenticated');
            } else {
                setAuthState('unauthenticated');
            }
        };

        checkAuth();
    }, [user, authLoading, requireAuth, requireVerified, requiredRole]);

    useEffect(() => {
        if (authState === 'unauthenticated') {
            const currentPath = window.location.pathname;
            router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [authState, router, redirectTo]);

    if (authState === 'loading') {
        return (
            fallback || (
                <div className="flex min-h-screen items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        <p className="text-sm text-muted-foreground">Verifying authentication...</p>
                    </div>
                </div>
            )
        );
    }

    if (authState === 'unverified') {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="mx-auto max-w-md text-center">
                    <div
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 mx-auto mb-4">
                        <ShieldAlert className="h-8 w-8 text-yellow-500"/>
                    </div>
                    <h1 className="text-xl font-bold mb-2">Verification Required</h1>
                    <p className="text-muted-foreground mb-6">
                        Please verify your email address to access this page. Check your inbox for a verification
                        link.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button onClick={() => router.push('/auth/verify-email')}>Resend Verification Email</Button>
                        <Link href="/">
                            <Button variant="outline" className="w-full">
                                Go to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (authState === 'unauthenticated') {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}

// Convenience wrapper for pages that require authentication
export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    options?: Omit<AuthGuardProps, 'children'>
) {
    return function AuthenticatedComponent(props: P) {
        return (
            <AuthGuard {...options}>
                <Component {...props} />
            </AuthGuard>
        );
    };
}
