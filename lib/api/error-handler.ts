/**
 * API Error Handler
 * Senior-level error handling with proper status codes and error codes
 */

import {
  ApiError,
  ErrorCode,
  HttpStatusCode,
} from './types';

export class ApiErrorHandler {
  /**
   * Create a standardized API error
   */
  static createError(
    code: ErrorCode,
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown>
  ): ApiError {
    return {
      code,
      message,
      statusCode,
      details,
    };
  }

  /**
   * Handle validation errors
   */
  static validationError(field: string, reason: string): ApiError {
    return this.createError(
      ErrorCode.VALIDATION_ERROR,
      `Validation failed for field "${field}": ${reason}`,
      HttpStatusCode.BAD_REQUEST,
      { field, reason }
    );
  }

  /**
   * Handle authentication errors
   */
  static authError(message = 'Authentication required'): ApiError {
    return this.createError(
      ErrorCode.AUTH_ERROR,
      message,
      HttpStatusCode.UNAUTHORIZED
    );
  }

  /**
   * Handle authorization errors
   */
  static forbiddenError(message = 'Access denied'): ApiError {
    return this.createError(
      ErrorCode.FORBIDDEN,
      message,
      HttpStatusCode.FORBIDDEN
    );
  }

  /**
   * Handle not found errors
   */
  static notFoundError(resource: string): ApiError {
    return this.createError(
      ErrorCode.NOT_FOUND,
      `${resource} not found`,
      HttpStatusCode.NOT_FOUND
    );
  }

  /**
   * Handle conflict errors
   */
  static conflictError(message: string, details?: Record<string, unknown>): ApiError {
    return this.createError(
      ErrorCode.CONFLICT,
      message,
      HttpStatusCode.CONFLICT,
      details
    );
  }

  /**
   * Handle rate limit errors
   */
  static rateLimitError(resetAt?: Date): ApiError {
    return this.createError(
      ErrorCode.RATE_LIMIT,
      'Rate limit exceeded',
      HttpStatusCode.RATE_LIMIT,
      resetAt ? { resetAt: resetAt.toISOString() } : undefined
    );
  }

  /**
   * Handle database errors
   */
  static databaseError(details?: string): ApiError {
    return this.createError(
      ErrorCode.DATABASE_ERROR,
      'Database operation failed',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      details ? { details } : undefined
    );
  }

  /**
   * Handle file upload errors
   */
  static fileUploadError(message: string, details?: Record<string, unknown>): ApiError {
    return this.createError(
      ErrorCode.FILE_UPLOAD_ERROR,
      message,
      HttpStatusCode.BAD_REQUEST,
      details
    );
  }

  /**
   * Handle service unavailable errors
   */
  static serviceUnavailableError(service: string): ApiError {
    return this.createError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `${service} is temporarily unavailable`,
      HttpStatusCode.SERVICE_UNAVAILABLE
    );
  }

  /**
   * Parse unknown error into ApiError
   */
  static handleUnknownError(error: unknown): ApiError {
    if (error instanceof ApiException) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      };
    }

    if (error instanceof Error) {
      const message = error.message || 'An unexpected error occurred';
      
      // Check for common patterns
      if (message.includes('not authenticated')) {
        return this.authError(message);
      }
      if (message.includes('not found')) {
        return this.notFoundError('Resource');
      }
      if (message.includes('validation')) {
        return this.createError(
          ErrorCode.VALIDATION_ERROR,
          message,
          HttpStatusCode.BAD_REQUEST
        );
      }

      return this.createError(
        ErrorCode.INTERNAL_ERROR,
        message,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    return this.createError(
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  /**
   * Format error response for API
   */
  static formatResponse(error: ApiError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
      timestamp: new Date().toISOString(),
    };
  }
}

// Extend Error class for API-specific errors
export class ApiException extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}
