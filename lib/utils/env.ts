/**
 * Environment Variable Validation
 * Per Next.js: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 * Per OWASP: Never expose secrets, validate all env vars on startup
 */

import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These must NEVER be exposed to the client
 */
const serverEnvSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Stream (Server-only)
  STREAM_API_SECRET: z.string().optional(),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

/**
 * Client-side environment variables schema
 * These are safe to expose to the browser
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  NEXT_PUBLIC_STREAM_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
});

/**
 * Validate environment variables on startup
 */
function validateEnv() {
  // Validate server env (only on server)
  if (typeof window === 'undefined') {
    const serverResult = serverEnvSchema.safeParse(process.env);

    if (!serverResult.success) {
      console.error('❌ Invalid server environment variables:');
      console.error(serverResult.error.flatten().fieldErrors);
      throw new Error('Invalid server environment variables');
    }
  }

  // Validate client env (always)
  const clientResult = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STREAM_API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  });

  if (!clientResult.success) {
    console.error('❌ Invalid client environment variables:');
    console.error(clientResult.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  return {
    server: typeof window === 'undefined'
      ? (serverEnvSchema.parse(process.env) as z.infer<typeof serverEnvSchema>)
      : null,
    client: clientResult.data,
  };
}

/**
 * Type-safe environment variables
 * Validates on first access
 */
let env: ReturnType<typeof validateEnv> | null = null;

export function getEnv() {
  if (!env) {
    env = validateEnv();
  }
  return env;
}

/**
 * Utility to check if required services are configured
 */
export function isServiceConfigured(service: 'supabase' | 'stream' | 'sentry'): boolean {
  try {
    const env = getEnv();

    switch (service) {
      case 'supabase':
        return Boolean(
          env.client.NEXT_PUBLIC_SUPABASE_URL &&
          env.client.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

      case 'stream':
        return Boolean(env.client.NEXT_PUBLIC_STREAM_API_KEY);

      case 'sentry':
        return Boolean(env.server?.SENTRY_DSN);

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Get a required environment variable
 * Throws if not found
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * Get an optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Get the public app URL
 */
export function getAppUrl(): string {
  return getEnv().client.NEXT_PUBLIC_APP_URL;
}

/**
 * Get Supabase configuration
 */
export function getSupabaseConfig() {
  const env = getEnv();
  return {
    url: env.client.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.client.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.server?.SUPABASE_SERVICE_ROLE_KEY,
  };
}

// Validate environment on module load (fail fast)
if (process.env.NODE_ENV !== 'test') {
  try {
    getEnv();
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
