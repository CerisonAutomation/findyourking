'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting (Sentry, etc.) here
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-svh flex items-center justify-center bg-background text-foreground p-6">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            {error.message ?? 'An unexpected error occurred. Our team has been notified.'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
          )}
          <Button onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
