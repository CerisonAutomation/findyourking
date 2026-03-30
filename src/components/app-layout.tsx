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
import { useProfile } from '@/hooks/use-profile';
import { createClient } from '@/lib/supabase-client';
import type { UserProfile } from '@/lib/types';

// Lazy-loaded heavy components
const AiKingDock = React.lazy(() =>
  import('@/components/ai-king-dock').then((m) => ({ default: m.AiKingDock })),
);
const QuantumAvatarDock = React.lazy(() =>
  import('@/components/quantum-avatar-dock').then((m) => ({ default: m.default })),
);

// ─── Nav items ────────────────────────────────────────────────────────────────
type NavItem = { href: string; label: string; icon: React.ElementType };

const BASE_NAV: readonly NavItem[] = [
  { href: '/discover',       label: 'Discover',     icon: LayoutGrid    },
  { href: '/favorites',      label: 'Favorites',    icon: Sparkles      },
  { href: '/meet-now',       label: 'Meet Now',     icon: Zap           },
  { href: '/bookings',       label: 'Bookings',     icon: Calendar      },
  { href: '/messages',       label: 'Messages',     icon: MessageSquare },
  { href: '/photo-curation', label: 'Photo Oracle', icon: Wand2         },
] as const;

// ─── Auth + onboarding guard ──────────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: profile, isLoading: isProfileLoading } = useProfile(user?.id);
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading || (user && isProfileLoading)) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (profile !== undefined && profile !== null && !profile.onboarded) {
      router.replace('/onboarding');
    }
  }, [user, profile, isUserLoading, isProfileLoading, router]);

  const isSettling = isUserLoading || (user && (isProfileLoading || profile === undefined));
  const isBlocked = !user || (profile !== undefined && !profile?.onboarded);

  if (isSettling || isBlocked) return <RootPageLoader />;

  return <AppShell profile={profile!}>{children}</AppShell>;
}

// ─── App shell ────────────────────────────────────────────────────────────────
function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: UserProfile;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push('/login');
  };

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [...BASE_NAV];
    if (profile.role === 'admin') {
      items.push({ href: '/admin', label: 'Admin', icon: Shield });
    }
    return items;
  }, [profile.role]);

  const displayName = (profile as UserProfile & { displayName?: string }).displayName
    ?? (profile as UserProfile & { id?: string }).id
    ?? 'Account';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <Logo />
            <SidebarTrigger />
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <nav aria-label="Main navigation">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                  >
                    <Link href={item.href}>
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </nav>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/account'}
                tooltip={{ children: 'Account' }}
              >
                <Link href="/account">
                  <Avatar className="size-6">
                    <AvatarImage
                      src={(profile as UserProfile & { avatarUrl?: string }).avatarUrl ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback>
                      <UserIcon className="size-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{displayName}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip={{ children: 'Sign out' }}
                className="text-destructive hover:text-destructive"
              >
                <LogOut aria-hidden="true" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>

      <Suspense fallback={null}>
        <AiKingDock />
      </Suspense>
      <Suspense fallback={null}>
        <QuantumAvatarDock />
      </Suspense>
    </SidebarProvider>
  );
}

// ─── Public exports ───────────────────────────────────────────────────────────
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RootPageLoader />}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}

export function RootPageLoader() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 bg-background"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading application"
    >
      <Logo />
      <Loader2 className="size-12 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Initializing Your Kingdom…</p>
    </main>
  );
}

// Back-compat re-export
export { LogIn };
