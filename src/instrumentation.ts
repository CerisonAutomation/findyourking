/**
 * Next.js 16 Instrumentation — runs once when the server starts.
 * Register OpenTelemetry / logging / monitoring here.
 * @see https://nextjs.org/docs/app/guides/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only import heavy server-side SDKs in the Node.js runtime
    // e.g. await import('./lib/otel');
  }
}

/**
 * onRequestError — called for every unhandled error in Server Components,
 * Server Actions, and Route Handlers. Wire up your error monitoring here.
 */
export async function onRequestError(
  error: unknown,
  _request: { path: string; method: string },
  _context: { routeType: string }
) {
  // e.g. Sentry.captureException(error);
  if (process.env.NODE_ENV === 'production') {
    console.error('[onRequestError]', error);
  }
}
