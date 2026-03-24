import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 — Page Not Found',
};

/**
 * Global 404 page — replaces the default Next.js not found UI.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-muted-foreground text-lg">This page could not be found.</p>
      <Link
        href="/discover"
        className="mt-4 rounded-md bg-primary px-6 py-2 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Back to Discover
      </Link>
    </main>
  );
}
