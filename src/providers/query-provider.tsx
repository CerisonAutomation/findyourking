'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, lazy, Suspense, type ReactNode } from 'react';
import { makeQueryClient } from '@/lib/query-client';

/**
 * ReactQueryDevtools are lazily imported so the package is never bundled
 * in production builds. The dynamic import is only evaluated when
 * NODE_ENV === 'development' at runtime.
 *
 * Install for local dev only:
 *   pnpm add -D @tanstack/react-query-devtools
 */
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((m) => ({
          default: m.ReactQueryDevtools,
        }))
      )
    : null;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
