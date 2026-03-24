'use client';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Something went wrong',
};

/**
 * Global error boundary — catches errors in the root layout.
 * Must be a Client Component.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-2 rounded-md bg-primary px-6 py-2 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
