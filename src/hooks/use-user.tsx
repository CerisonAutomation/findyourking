'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-client';

interface UserContextValue {
  /** Verified server-side user — never stale from client cookie */
  user: User | null;
  isLoading: boolean;
  /** Force re-verify auth (e.g. after OAuth redirect or profile update) */
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Stable singleton — never recreated
  const supabase = useMemo(() => createClient(), []);

  const refresh = useCallback(async () => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    setUser(freshUser ?? null);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // getUser() calls the auth server — cryptographically verified
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (mounted) {
        setUser(u ?? null);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      },
    );

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

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
