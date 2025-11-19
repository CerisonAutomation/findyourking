"use client";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user ?? null);
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
          setUser(session?.user ?? null);
          if (event === "SIGNED_OUT") {
            setError(null);
          }
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to check auth status";
        setError(errorMessage);
        console.error("Auth check error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [supabase]);

  const clearError = () => setError(null);

  async function signOut() {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
      router.push("/auth");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error signing out";
      setError(errorMessage);
      console.error("Sign out error:", err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
