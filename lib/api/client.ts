/**
 * Centralized API Client
 * Enterprise-grade API layer with retry, caching, and error handling
 * 
 * Per Next.js docs: https://nextjs.org/docs/app/building-your-application/data-fetching
 * Per Vercel docs: https://vercel.com/docs/functions/edge-functions/edge-runtime
 * 
 * @module APIClient
 */

import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
  requestId?: string;
}

export interface APIRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  retry?: number;
  timeout?: number;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private retryAttempts: number;
  private timeout: number;

  constructor(config?: {
    baseURL?: string;
    headers?: Record<string, string>;
    retry?: number;
    timeout?: number;
  }) {
    this.baseURL = config?.baseURL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };
    this.retryAttempts = config?.retry ?? 3;
    this.timeout = config?.timeout ?? 30000;
  }

  /**
   * Make API request with retry and error handling
   */
  async request<T>(
    endpoint: string,
    config: APIRequestConfig = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const method = config.method || 'GET';
    const headers = { ...this.defaultHeaders, ...config.headers };
    const retries = config.retry ?? this.retryAttempts;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: config.body ? JSON.stringify(config.body) : undefined,
          cache: config.cache,
          next: config.next,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          data: data as T,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('HTTP 4')) {
          break;
        }

        // Exponential backoff
        if (attempt < retries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Request failed',
      code: 'REQUEST_FAILED',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: Omit<APIRequestConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, config?: Omit<APIRequestConfig, 'method'>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, config?: Omit<APIRequestConfig, 'method'>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, config?: Omit<APIRequestConfig, 'method'>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: Omit<APIRequestConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// DEFAULT CLIENT INSTANCE
// ============================================================================

export const apiClient = new APIClient({
  baseURL: '/api',
  retry: 3,
  timeout: 30000,
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function successResponse<T>(data: T, status = 200): Response {
  return Response.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } satisfies APIResponse<T>,
    { status }
  );
}

export function errorResponse(error: string, code: string, status = 400): Response {
  return Response.json(
    {
      success: false,
      error,
      code,
      timestamp: new Date().toISOString(),
    } satisfies APIResponse,
    { status }
  );
}

// ============================================================================
// EDGE RUNTIME UTILITIES
// ============================================================================

export function withEdgeRuntime(handler: (req: Request) => Promise<Response>) {
  return handler;
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
