import Link from 'next/link';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

/**
 * Find Your King wordmark + crown icon.
 * Renders as a home link; pass iconOnly=true for compact sidebar state.
 */
export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 font-bold tracking-tight text-foreground hover:text-primary transition-colors',
        className,
      )}
      aria-label="Find Your King — Home"
    >
      <Crown
        className="size-6 text-primary flex-shrink-0"
        aria-hidden="true"
        strokeWidth={2.5}
      />
      {!iconOnly && (
        <span className="text-sm font-semibold">
          Find Your <span className="text-primary">King</span>
        </span>
      )}
    </Link>
  );
}
