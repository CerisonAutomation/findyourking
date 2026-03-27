'use client'

import {createContext, type ReactNode, useCallback, useContext, useEffect, useState,} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextType {
    user: any | null;
    session: any | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: Error | null;
    signOut: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isLoading: true,
    isInitialized: false,
    error: null,
    signOut: async () => {
    },
    signIn: async () => ({error: null}),
    signUp: async () => ({error: null}),
    resetPassword: async () => ({error: null}),
    clearError: () => {
    },
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [session, setSession] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // ── Initialize session on mount ──────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    setSession(data.session);
                    setUser(data.session?.user ?? null);
                }
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
                setIsInitialized(true);
            }
        };
        init();
    }, []);

    // ── Auth actions ─────────────────────────────────────────────────────────
    const signIn = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            const response = await fetch('/api/auth/sign-in', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password})
            });
            if (!response.ok) {
                const data = await response.json();
                const e = new Error(data.error || 'Sign in failed');
                setError(e);
                return {error: e};
            }
            const data = await response.json();
            setSession(data.session);
            setUser(data.session?.user ?? null);
            return {error: null};
        } catch (e) {
            setError(e as Error);
            return {error: e as Error};
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string, displayName: string) => {
        setError(null);
        try {
            const response = await fetch('/api/auth/sign-up', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password, displayName})
            });
            if (!response.ok) {
                const data = await response.json();
                const e = new Error(data.error || 'Sign up failed');
                setError(e);
                return {error: e};
            }
            const data = await response.json();
            setSession(data.session);
            setUser(data.session?.user ?? null);
            return {error: null};
        } catch (e) {
            setError(e as Error);
            return {error: e as Error};
        }
    }, []);

    const signOut = useCallback(async () => {
        setError(null);
        try {
            await fetch('/api/auth/sign-out', {method: 'POST'});
            setUser(null);
            setSession(null);
        } catch (e) {
            setError(e as Error);
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        setError(null);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email})
            });
            if (!response.ok) {
                const data = await response.json();
                const e = new Error(data.error || 'Reset password failed');
                setError(e);
                return {error: e};
            }
            return {error: null};
        } catch (e) {
            setError(e as Error);
            return {error: e as Error};
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isLoading,
                isInitialized,
                error,
                signIn,
                signUp,
                signOut,
                resetPassword,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}