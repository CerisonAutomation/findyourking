'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
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
  PartyPopper,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { useUser } from '@/hooks/use-user';
import { useUnreadCount } from '@/hooks/use-unread-count';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { href: '/discover',  label: 'Discover',  icon: Compass },
  { href: '/meet-now',  label: 'Meet Now',  icon: Zap },
  { href: '/events',    label: 'Events',    icon: PartyPopper },
  { href: '/messages',  label: 'Messages',  icon: MessageCircle, badge: true },
  { href: '/favorites', label: 'Saved',     icon: Heart },
  { href: '/bookings',  label: 'Bookings',  icon: CalendarDays },
  { href: '/ai-king',   label: 'Oracle',    icon: BrainCircuit },
];

const SECONDARY_ITEMS = [
  { href: '/profile', label: 'Profile',  icon: Crown },
  { href: '/account', label: 'Settings', icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  compact = false,
  badgeCount = 0,
}: {
  href:        string;
  label:       string;
  icon:        React.ElementType;
  compact?:    boolean;
  badgeCount?: number;
}) {
  const pathname = usePathname();
  const active   = pathname === href || pathname.startsWith(`${href}/`);

  const inner = (
    <span className="relative">
      <Icon className={compact ? 'size-5' : 'size-5 shrink-0'} aria-hidden="true" />
      {badgeCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground"
          aria-label={`${badgeCount} unread`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </span>
  );

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
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {inner}
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
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      )}
    >
      {inner}
      <span>{label}</span>
    </Link>
  );
}

function MobileNavItem({ href, label, icon: Icon, badgeCount = 0 }: {
  href:        string;
  label:       string;
  icon:        React.ElementType;
  badgeCount?: number;
}) {
  const pathname = usePathname();
  const active   = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors relative',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <span className="relative">
        <Icon className="size-5" aria-hidden="true" />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const unreadCount = useUnreadCount(user?.id);

  const isAdmin = false; // TODO: derive from user claims/role

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col gap-2 w-60 shrink-0 border-r p-4"
        aria-label="Main navigation"
      >
        <Link href="/discover" className="flex items-center gap-2 mb-4 px-1">
          <Logo className="size-7" />
          <span className="font-bold tracking-tight text-sm">Find Your King</span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              badgeCount={item.badge ? unreadCount : 0}
            />
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t pt-3">
          {SECONDARY_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
          {isAdmin && (
            <NavItem href="/admin" label="Admin" icon={ShieldCheck} />
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" id="main-content">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Suspense>{children}</Suspense>
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background/90 backdrop-blur-sm z-50"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-1 py-1 safe-area-inset-bottom">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <MobileNavItem
              key={item.href}
              {...item}
              badgeCount={item.badge ? unreadCount : 0}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
