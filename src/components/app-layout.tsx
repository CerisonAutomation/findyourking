'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  MessageSquare,
  Sparkles,
  User as UserIcon,
  LogOut,
  LogIn,
  Zap,
  Loader2,
  Wand2,
  Calendar,
  Shield,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from './logo';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import type { UserProfile } from '@/lib/types';

const QuantumAvatarDock = React.lazy(() =>
  import('@/components/quantum-avatar-dock').then((mod) => ({ default: mod.default }))
);

async function fetchUserProfile(userId?: string): Promise<UserProfile | null> {
  if (!userId) return null;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message, { cause: error });
    }
    return data as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Optionally re-throw or handle as needed, for now returning null
    return null;
  }
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfile(user?.id),
    enabled: !!user,
  });
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading || (user && isProfileLoading)) return;

    if (!user) {
      router.replace('/login');
    } else if (user && !profile?.onboarded) {
      router.replace('/onboarding');
    }
  }, [user, profile, isUserLoading, isProfileLoading, router]);

  if (isUserLoading || (user && (isProfileLoading || !profile))) {
    return <RootPageLoader />;
  }

  if (!user || !profile?.onboarded) {
    return <RootPageLoader />;
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}

function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: UserProfile | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = useMemo(
    () => {
      const items = [
        { href: '/discover', label: 'Discover', icon: LayoutGrid },
        { href: '/favorites', label: 'Favorites', icon: Sparkles },
        { href: '/meet-now', label: 'Meet Now', icon: Zap },
        { href: '/bookings', label: 'Bookings', icon: Calendar },
        { href: '/messages', label: 'Messages', icon: MessageSquare },
        { href: '/photo-curation', label: 'Photo Oracle', icon: Wand2 },
      ];

      // Add admin nav item if user is admin
      if (profile?.role === 'admin') {
        items.push({ href: '/admin', label: 'Admin', icon: Shield });
      }

      return items;
    },
    [profile?.role]
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <Logo />
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent as="nav" className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href} asChild>
                <Link href={item.href} aria-label={item.label}>
                  <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={{ children: item.label }}>
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            {profile ? (
              <>
                <SidebarMenuItem asChild>
                  <Link href="/account">
                    <SidebarMenuButton isActive={pathname === '/account'} tooltip={{ children: 'Account' }}>
                      <Avatar className="size-6">
                        <AvatarImage src={profile.avatarUrl || undefined} />
                        <AvatarFallback>
                          <UserIcon />
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{profile?.id || 'Account'}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout} tooltip={{ children: 'Logout' }}>
                    <LogOut />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            ) : (
              <SidebarMenuItem asChild>
                <Link href="/login">
                  <SidebarMenuButton tooltip={{ children: 'Login' }}>
                    <LogIn />
                    <span>Login</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>

      <Suspense fallback={null}>
        <QuantumAvatarDock />
      </Suspense>
    </SidebarProvider>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RootPageLoader />}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}

export const RootPageLoader = () => (
  <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background gap-4" aria-live="polite">
    <Logo />
    <Loader2 className="size-12 animate-spin text-primary" />
    <p className="text-muted-foreground">Initializing Your Kingdom...</p>
  </main>
);
