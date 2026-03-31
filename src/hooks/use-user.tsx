'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UserContextValue {
  user:      User | null;
  isLoading: boolean;
  signOut:   () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user:      null,
  isLoading: true,
  signOut:   async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [user, setUser]           = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // getUser() makes a network call to validate the JWT — safe client-side
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    await fetch('/auth/signout', { method: 'POST' });
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signOut }),
    [user, isLoading, signOut],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}
