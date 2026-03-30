/**
 * Next.js Instrumentation hook.
 * Runs once when the server process starts (not per-request).
 * Use for OpenTelemetry, Sentry, or other observability SDKs.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // e.g. await import('./lib/observability').then((m) => m.init());
  }
}
