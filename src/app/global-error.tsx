'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="max-w-md text-gray-500">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
