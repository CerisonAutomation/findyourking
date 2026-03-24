'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-client';

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  /** Force re-fetch the auth user (e.g. after profile update) */
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient(); // singleton — safe

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user ?? null);
  }, [supabase]);

  useEffect(() => {
    // getUser() hits the auth server — cryptographically verified (unlike getSession)
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <UserContext.Provider value={{ user, isLoading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
