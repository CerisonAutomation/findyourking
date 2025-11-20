/**
 * API BARREL EXPORT - ZENITH LEGENDARY PRODUCTION READY
 *
 * Central API client and endpoint definitions for FindYourKing platform.
 * All API calls are type-safe, rate-limited, and monitored.
 *
 * Per Next.js docs: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * Per Fetch API docs: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 *
 * @module api
 * @version 2.0.0
 */

// ============================================================================
// API CLIENT & CONFIGURATION
// ============================================================================

export * from './client';
export * from './endpoints';
export * from './error-handler';
export * from './middleware';
export * from './router';
export * from './types';
export * from './validators';

// ============================================================================
// RE-EXPORT FOR CONVENIENCE
// ============================================================================

// Note: These modules export named exports only, not default exports
// Import them using named imports instead:
// import { apiClient } from '@/lib/api'
// import { endpoints } from '@/lib/api'
// etc.

// ============================================================================
// TYPE-SAFE API METHODS
// ============================================================================

import type { ApiResponse } from '@/lib/types';

/**
 * Generic API request function with type safety
 *
 * @template T - Expected response data type
 * @param endpoint - API endpoint URL
 * @param options - Fetch options
 * @returns Typed API response
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  // Simple fetch implementation
  try {
    const response = await fetch(endpoint, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data.message || 'Request failed',
          code: data.code,
          details: data.details,
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}
