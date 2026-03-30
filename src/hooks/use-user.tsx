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
  /** Server-verified current user — never stale from a client-side cookie. */
  user: User | null;
  isLoading: boolean;
  /** Re-verify auth state — call after OAuth redirects or profile updates. */
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const refresh = useCallback(async () => {
    const {
      data: { user: freshUser },
    } = await supabase.auth.getUser();
    setUser(freshUser ?? null);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // getUser() is server-verified — safe to rely on
    void supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (mounted) {
        setUser(u ?? null);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({ user, isLoading, refresh }),
    [user, isLoading, refresh],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Returns the current Supabase user and auth state.
 * Must be called inside a component wrapped by `<UserProvider>`.
 */
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
