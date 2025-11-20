/**
 * API Endpoint Router
 * Senior-level routing system with middleware, validation, and error handling
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ApiResponse,
  ApiError,
  EndpointDefinition,
  EndpointContext,
  HttpMethod,
  EndpointMetadata,
  ErrorCode,
} from './types';
import { ApiErrorHandler, ApiException } from './error-handler';

interface RouterOptions {
  enableLogging?: boolean;
  enableRateLimit?: boolean;
  globalErrorHandler?: (error: ApiError) => void;
}

interface RouteMatch {
  endpoint: EndpointDefinition;
  params: Record<string, string>;
  metadata: EndpointMetadata;
}

export class ApiRouter {
  private endpoints: Map<string, EndpointDefinition<unknown, unknown>> = new Map();
  private options: RouterOptions;
  private requestLog: Map<string, { timestamp: number; count: number }> = new Map();

  constructor(options: RouterOptions = {}) {
    this.options = {
      enableLogging: true,
      enableRateLimit: true,
      ...options,
    };
  }

  /**
   * Register an endpoint
   */
  register<TRequest, TResponse>(
    path: string,
    method: HttpMethod,
    definition: EndpointDefinition<TRequest, TResponse>
  ): void {
    const key = this.buildRouteKey(path, method);
    
    if (this.endpoints.has(key)) {
      console.warn(`Route ${key} is already registered. Overwriting...`);
    }

    this.endpoints.set(key, definition as EndpointDefinition<unknown, unknown>);

    if (this.options.enableLogging) {
      console.log(`✓ Registered: ${method} ${path}`);
    }
  }

  /**
   * Match request to endpoint
   */
  match(path: string, method: HttpMethod): RouteMatch | null {
    const key = this.buildRouteKey(path, method);
    const endpoint = this.endpoints.get(key);

    if (endpoint) {
      return {
        endpoint,
        params: {},
        metadata: endpoint.metadata,
      };
    }

    // Try pattern matching
    for (const [registeredKey, endpoint] of this.endpoints) {
      const [registeredPath, registeredMethod] = registeredKey.split(' ');
      
      if (registeredMethod !== method) continue;

      const paramMatch = this.matchPathPattern(path, registeredPath);
      if (paramMatch) {
        return {
          endpoint,
          params: paramMatch,
          metadata: endpoint.metadata,
        };
      }
    }

    return null;
  }

  /**
   * Handle a request through the router
   */
  async handle<TRequest, TResponse>(
    path: string,
    method: HttpMethod,
    request: TRequest,
    context: Partial<EndpointContext> = {}
  ): Promise<ApiResponse<TResponse>> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      // Create context
      const endpointContext: EndpointContext = {
        ...context,
        timestamp: context.timestamp || new Date(),
        requestId,
      };

      // Find matching endpoint
      const match = this.match(path, method);
      if (!match) {
        const error = ApiErrorHandler.notFoundError(`${method} ${path}`);
        throw new ApiException(error.code as ErrorCode, error.message, error.statusCode);
      }

      const { endpoint, metadata } = match;

      // Check authentication
      if (metadata.authLevel === 'authenticated' && !endpointContext.userId) {
        const error = ApiErrorHandler.authError();
        throw new ApiException(error.code as ErrorCode, error.message, error.statusCode);
      }

      // Check admin role
      if (metadata.authLevel === 'admin' && endpointContext.userRole !== 'admin') {
        const error = ApiErrorHandler.forbiddenError();
        throw new ApiException(error.code as ErrorCode, error.message, error.statusCode);
      }

      // Check rate limit
      if (this.options.enableRateLimit && metadata.rateLimit) {
        const limited = this.checkRateLimit(endpointContext.userId || 'anonymous', metadata.rateLimit);
        if (limited) {
          const error = ApiErrorHandler.rateLimitError();
          throw new ApiException(error.code as ErrorCode, error.message, error.statusCode);
        }
      }

      // Validate request
      if (endpoint.validator) {
        const validationResult = endpoint.validator(request);
        if (!validationResult.valid) {
          const error = ApiErrorHandler.validationError(
            'request',
            validationResult.error
          );
          throw new ApiException(error.code as ErrorCode, error.message, error.statusCode, error.details);
        }
      }

      // Execute handler
      const data = await endpoint.handler(request, endpointContext);

      const duration = Date.now() - startTime;
      this.logRequest(path, method, 200, duration, requestId);

      return {
        success: true,
        data: data as TResponse,
        code: 'SUCCESS',
        timestamp: new Date().toISOString(),
        meta: {
          requestId,
          duration: `${duration}ms`,
        },
      };
    } catch (error) {
      const apiError = error instanceof ApiException
        ? {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            details: error.details,
          }
        : ApiErrorHandler.handleUnknownError(error);

      const duration = Date.now() - startTime;
      this.logRequest(path, method, apiError.statusCode, duration, requestId);

      if (this.options.globalErrorHandler) {
        this.options.globalErrorHandler(apiError);
      }

      return {
        success: false,
        error: apiError.message,
        code: apiError.code,
        timestamp: new Date().toISOString(),
        meta: {
          requestId,
          duration: `${duration}ms`,
        },
      };
    }
  }

  /**
   * Get all registered endpoints (for documentation)
   */
  getEndpoints(): EndpointMetadata[] {
    return Array.from(this.endpoints.values()).map(e => e.metadata);
  }

  /**
   * Get documentation for all endpoints
   */
  getDocumentation(): Record<string, Record<HttpMethod, EndpointMetadata>> {
    const docs: Record<string, Record<HttpMethod, EndpointMetadata>> = {};

    for (const [key, endpoint] of this.endpoints) {
      const [path, method] = key.split(' ');
      if (!docs[path]) {
        docs[path] = {} as Record<HttpMethod, EndpointMetadata>;
      }
      docs[path][method as HttpMethod] = endpoint.metadata;
    }

    return docs;
  }

  /**
   * Build route key
   */
  private buildRouteKey(path: string, method: HttpMethod): string {
    return `${path} ${method}`;
  }

  /**
   * Match path pattern (e.g., /users/:id)
   */
  private matchPathPattern(
    requestPath: string,
    patternPath: string
  ): Record<string, string> | null {
    const requestParts = requestPath.split('/');
    const patternParts = patternPath.split('/');

    if (requestParts.length !== patternParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const part = patternParts[i];

      if (part.startsWith(':')) {
        // Parameter
        const paramName = part.substring(1);
        params[paramName] = requestParts[i];
      } else if (part !== requestParts[i]) {
        // Literal doesn't match
        return null;
      }
    }

    return params;
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(
    identifier: string,
    limit: { requests: number; windowMs: number }
  ): boolean {
    const now = Date.now();
    const key = `${identifier}`;
    const record = this.requestLog.get(key);

    if (!record) {
      this.requestLog.set(key, { timestamp: now, count: 1 });
      return false;
    }

    if (now - record.timestamp > limit.windowMs) {
      // Window has passed, reset
      this.requestLog.set(key, { timestamp: now, count: 1 });
      return false;
    }

    if (record.count >= limit.requests) {
      return true; // Rate limited
    }

    record.count++;
    return false;
  }

  /**
   * Log request
   */
  private logRequest(
    path: string,
    method: HttpMethod,
    statusCode: number,
    duration: number,
    requestId: string
  ): void {
    if (!this.options.enableLogging) return;

    const statusEmoji = statusCode < 300 ? '✓' : statusCode < 400 ? '→' : statusCode < 500 ? '⚠' : '✗';
    console.log(
      `${statusEmoji} [${requestId}] ${method} ${path} ${statusCode} ${duration}ms`
    );
  }

  /**
   * Clear rate limit cache
   */
  clearRateLimitCache(): void {
    this.requestLog.clear();
  }
}

// Export singleton instance
export const apiRouter = new ApiRouter({
  enableLogging: true,
  enableRateLimit: true,
});
