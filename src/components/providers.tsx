'use client';

import { type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/providers/query-provider';
import { UserProvider } from '@/hooks/use-user';

/**
 * Root client-side provider tree.
 * Order matters: Theme → Query → User → children.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <UserProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </UserProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
