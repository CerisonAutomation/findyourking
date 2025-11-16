"use client";

import { createClient } from "@/lib/supabase/client";
import { Notifications } from "@/components/notifications";
import { LoadingBar } from "@/components/loading-bar";
import { SmoothScroll } from "@/components/smooth-scroll";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogoutButton } from "@/components/auth-button";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <LoadingBar />
      <SmoothScroll />
      
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <a 
              href="/" 
              className="flex items-center space-x-2 text-lg font-bold tracking-tight transition-colors hover:text-primary"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent" />
              <span>FindYourKing</span>
            </a>
            {user && (
              <div className="hidden md:flex items-center gap-1">
                <a 
                  href="/discover" 
                  className="px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  Discover
                </a>
                <a 
                  href="/account/bookings" 
                  className="px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  Bookings
                </a>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <>
                <a 
                  href="/account/profile"
                  className="px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  Profile
                </a>
                <Notifications />
                <LogoutButton />
              </>
            )}
            {!user && (
              <a 
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </nav>
      
      <main id="main-content" className="min-h-[calc(100vh-4rem)] flex flex-col">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </>
  );
}

