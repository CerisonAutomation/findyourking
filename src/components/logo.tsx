import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

export const CrownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);


export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-primary', className)}>
      <CrownIcon className="size-6 text-foreground fill-current" />
      <span className="text-lg font-bold tracking-tight text-foreground">
        FYKING
      </span>
    </div>
  );
}
