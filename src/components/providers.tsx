'use client';

import { type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import { UserProvider } from '@/hooks/use-user';

/**
 * Root provider tree — order is intentional:
 * ThemeProvider → QueryProvider → UserProvider → children
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
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              classNames: { toast: 'font-sans text-sm' },
            }}
          />
        </UserProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
