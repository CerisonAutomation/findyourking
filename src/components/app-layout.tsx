'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  Compass,
  Crown,
  CalendarDays,
  MessageCircle,
  Heart,
  Zap,
  Settings,
  BrainCircuit,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { useUser } from '@/hooks/use-user';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { href: '/discover',       label: 'Discover',   icon: Compass },
  { href: '/meet-now',       label: 'Meet Now',   icon: Zap },
  { href: '/bookings',       label: 'Bookings',   icon: CalendarDays },
  { href: '/messages',       label: 'Messages',   icon: MessageCircle },
  { href: '/favorites',      label: 'Saved',      icon: Heart },
  { href: '/ai-king',        label: 'Oracle',     icon: BrainCircuit },
];

const SECONDARY_ITEMS = [
  { href: '/profile',        label: 'Profile',    icon: Crown },
  { href: '/account',        label: 'Settings',   icon: Settings },
];

function NavItem({
  href, label, icon: Icon, compact = false,
}: {
  href: string; label: string; icon: React.ElementType; compact?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  if (compact) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center justify-center size-10 rounded-xl transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon className="size-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useUser();

  const adminItem = user ? { href: '/admin', label: 'Admin', icon: ShieldCheck } : null;

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col gap-2 w-60 shrink-0 border-r p-4"
        aria-label="Main navigation"
      >
        <Link href="/discover" className="flex items-center gap-2 mb-4 px-1">
          <Logo className="size-7" />
          <span className="font-bold tracking-tight text-sm">Find Your King</span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => <NavItem key={item.href} {...item} />)}
        </nav>

        <div className="flex flex-col gap-1 border-t pt-3">
          {SECONDARY_ITEMS.map((item) => <NavItem key={item.href} {...item} />)}
          {adminItem && <NavItem {...adminItem} />}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background/90 backdrop-blur-sm z-50"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
            const active = pathname === href;
            return (
              <Link
                key={href} href={href} aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
