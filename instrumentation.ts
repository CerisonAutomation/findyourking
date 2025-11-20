export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        // Add custom context for AI-related errors
        if (event.exception) {
          const errorMessage = event.exception.values?.[0]?.value || '';
          if (errorMessage.includes('AI') || errorMessage.includes('OpenAI') || errorMessage.includes('Gemini')) {
            event.tags = { ...event.tags, category: 'ai_error' };
          }
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    });

    // Edge runtime specific monitoring
    Sentry.setTag('runtime', 'edge');
    Sentry.setContext('edge', {
      region: process.env.VERCEL_REGION || 'unknown',
      deployment: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
    });
  }
}