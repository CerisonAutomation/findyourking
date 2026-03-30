/**
 * Next.js Instrumentation hook.
 * Add OpenTelemetry / Sentry initialisation here.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // e.g. await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    // e.g. await import('./sentry.edge.config');
  }
}
