/**
 * API Types - Type definitions for API responses
 */

export interface ApiResponse<T = any> {
    data?: T
    error?: string
    message?: string
    success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        limit: number
        offset: number
        total: number
        hasMore: boolean
        cursor?: string
    }
}

export interface ErrorResponse {
    error: string
    details?: Record<string, any>
    code?: string
    timestamp: string
}

export interface SuccessResponse<T = any> {
    data: T
    message?: string
    timestamp: string
}

// HTTP Method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// Request options
export interface RequestOptions<T = any> {
    method?: HttpMethod
    body?: T
    headers?: Record<string, string>
    params?: Record<string, string | number>
    cache?: RequestCache
    revalidate?: number
}