# Quick Implementation Guide - Zenith Audit Utilities
**Created:** November 17, 2025  
**Utilities:** API Error Handler + API Security  
**Status:** Ready for deployment

---

## 🚀 Quick Start

All utilities have been created and are ready to use. Here's how to implement them:

---

## API Error Handler Quick Reference

### Import
```typescript
import {
  createErrorResponse,
  logApiError,
  getRequestId,
  safeParseJson,
  ErrorCategory,
} from '@/lib/api-error-handler'
```

### Basic Usage - Stripe Checkout Example
```typescript
import type { NextRequest } from 'next/server'
import { createErrorResponse, logApiError, getRequestId } from '@/lib/api-error-handler'
import { authenticateRequest, getSecurityHeaders } from '@/lib/api-security'

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req)
  
  try {
    // Authenticate
    const auth = await authenticateRequest(req)
    if (!auth.authenticated) {
      return createErrorResponse(
        new Error('Unauthorized'),
        requestId,
        401,
        'Authentication required'
      )
    }

    // Do something...
    
    return Response.json(
      { success: true },
      {
        status: 200,
        headers: { ...getSecurityHeaders() }
      }
    )
  } catch (error: unknown) {
    logApiError('my-route', error, requestId)
    return createErrorResponse(error instanceof Error ? error : new Error('Unknown error'), requestId)
  }
}
```

---

## API Security Quick Reference

### Import
```typescript
import {
  validateCorsOrigin,
  getCorsHeaders,
  authenticateRequest,
  sanitizeString,
  validateEmail,
  getClientIp,
  getSecurityHeaders,
} from '@/lib/api-security'
```

### Authentication Example
```typescript
import type { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api-security'

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req)
  
  if (!auth.authenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = auth.userId  // Use user ID for row-level operations
  // ...
}
```

### Input Validation Example
```typescript
import { sanitizeString, validateEmail, validateUrl } from '@/lib/api-security'

// Sanitize user-generated content
const userContent = sanitizeString(userInput)

// Validate email
if (!validateEmail(email)) {
  return Response.json({ error: 'Invalid email' }, { status: 400 })
}

// Validate URL
if (!validateUrl(urlString)) {
  return Response.json({ error: 'Invalid URL' }, { status: 400 })
}
```

### Security Headers Example
```typescript
import { getSecurityHeaders } from '@/lib/api-security'

export async function GET(req: NextRequest) {
  const data = { /* response data */ }
  
  return Response.json(data, {
    status: 200,
    headers: {
      ...getSecurityHeaders(),
      'Content-Type': 'application/json',
    }
  })
}
```

---

## Implementation Checklist

### Immediate (Required for all API routes)

- [ ] **Add Security Headers**
  ```typescript
  const { getSecurityHeaders } = await import('@/lib/api-security')
  headers: { ...getSecurityHeaders() }
  ```

- [ ] **Replace Error Handling**
  ```typescript
  // Before: catch (error: any)
  // After:
  } catch (error: unknown) {
    logApiError('context', error, requestId)
    return createErrorResponse(error instanceof Error ? error : new Error('Unknown'), requestId)
  }
  ```

- [ ] **Add Request Tracing**
  ```typescript
  const requestId = getRequestId(req)
  // Pass to all error/log functions
  ```

### Short-term (Recommended this week)

- [ ] Add CORS headers to all responses
  ```typescript
  const corsHeaders = getCorsHeaders(req)
  return Response.json(data, { headers: { ...corsHeaders, ...getSecurityHeaders() } })
  ```

- [ ] Implement retry logic for external APIs
  ```typescript
  import { retryWithBackoff } from '@/lib/api-error-handler'
  const result = await retryWithBackoff(() => stripeApi.call(), 3, 100, 5000)
  ```

- [ ] Add input validation
  ```typescript
  import { validateEmail, validateUrl, validateUuid } from '@/lib/api-security'
  // Use in request validation
  ```

### Medium-term (Next sprint)

- [ ] Implement RBAC authorization
  ```typescript
  const userRole = user?.user_metadata?.role || 'user'
  if (userRole !== 'admin') return createErrorResponse(..., 403)
  ```

- [ ] Add DOMPurify for rich text
  ```typescript
  import DOMPurify from 'dompurify'
  const sanitizedHtml = DOMPurify.sanitize(userContent)
  ```

- [ ] Rotate exposed credentials
  - Rotate Supabase keys
  - Rotate Stripe keys
  - Rotate OpenAI keys
  - Clean git history

---

## Error Categories Reference

```typescript
enum ErrorCategory {
  VALIDATION = 'VALIDATION',           // 400
  AUTHENTICATION = 'AUTHENTICATION',   // 401
  AUTHORIZATION = 'AUTHORIZATION',    // 403
  NOT_FOUND = 'NOT_FOUND',             // 404
  CONFLICT = 'CONFLICT',               // 409
  RATE_LIMIT = 'RATE_LIMIT',           // 429
  EXTERNAL_API = 'EXTERNAL_API',       // 502
  DATABASE = 'DATABASE',               // 500
  INTERNAL = 'INTERNAL',               // 500
}
```

---

## Utility Functions Reference

### api-error-handler.ts

| Function | Purpose | Returns |
|----------|---------|---------|
| `getRequestId(req)` | Extract/generate request ID for tracing | `string` |
| `categorizeError(error)` | Classify error type | `ErrorCategory` |
| `getUserMessage(category)` | Get user-friendly error message | `string` |
| `getStatusCode(category)` | Get HTTP status for category | `number` |
| `logApiError(context, error, requestId, additionalContext)` | Log error with context | `void` |
| `createErrorResponse(error, requestId, overrideStatus, overrideMessage)` | Create standardized error response | `NextResponse<ApiError>` |
| `createSuccessResponse(data, status)` | Create success response | `NextResponse<T>` |
| `validateQueryParams(url, required)` | Validate required query params | `{ valid: boolean; missing?: string[] }` |
| `safeParseJson(request)` | Safely parse JSON body | `{ success: boolean; data?: T; error?: string }` |
| `retryWithBackoff(fn, maxRetries, baseDelayMs, maxDelayMs)` | Retry with exponential backoff | `Promise<T>` |

### api-security.ts

| Function | Purpose | Returns |
|----------|---------|---------|
| `validateCorsOrigin(request)` | Validate CORS origin | `boolean` |
| `getCorsHeaders(request)` | Generate CORS headers | `Record<string, string>` |
| `validateCsrfToken(request, headerName)` | Validate CSRF token | `boolean` |
| `authenticateRequest(request)` | Check Supabase auth | `{ authenticated: boolean; userId?: string; error?: string }` |
| `sanitizeString(input)` | Sanitize XSS in strings | `string` |
| `validateEmail(email)` | Validate email format | `boolean` |
| `validateUuid(uuid)` | Validate UUID format | `boolean` |
| `validateUrl(url)` | Validate URL format | `boolean` |
| `checkRateLimitSecurity(identifier, limit, windowSeconds)` | Check rate limit | `{ allowed: boolean; remaining: number; resetTime: number }` |
| `validateMethod(request, allowedMethods)` | Validate HTTP method | `boolean` |
| `getClientIp(request)` | Extract client IP | `string` |
| `validateContentType(request, expected)` | Validate Content-Type header | `boolean` |
| `getSecurityHeaders()` | Get security headers | `Record<string, string>` |

---

## Deployment Checklist

### Before Production Deployment

- [ ] **All TypeScript errors fixed** (Phase 2)
- [ ] **Security headers added** to all routes
- [ ] **CORS configured** for your domain
- [ ] **Credentials rotated** and git history cleaned
- [ ] **Rate limiting verified** on all public endpoints
- [ ] **Error handling tested** for all error scenarios
- [ ] **Logging verified** in monitoring system
- [ ] **Tests passing** (type-check, unit, integration)

### Monitoring & Observability

**Recommended setup:**
- [ ] Sentry for error tracking
- [ ] LogRocket for session replay
- [ ] Datadog for performance monitoring
- [ ] New Relic for application monitoring

**Log Format Example:**
```json
{
  "timestamp": "2025-11-17T12:00:00Z",
  "context": "stripe-checkout",
  "category": "EXTERNAL_API",
  "message": "Failed to create Stripe session",
  "requestId": "req_1234567890_abc",
  "statusCode": 502,
  "clientIp": "192.168.1.1",
  "userId": "user_uuid"
}
```

---

## Testing

### Manual Testing Steps

1. **Test Error Handling**
   ```bash
   # Test validation error
   curl -X POST http://localhost:3000/api/stripe/checkout \
     -H "Content-Type: application/json" \
     -d '{}' \
     # Should return 400 with validation message
   
   # Test auth error
   curl -X POST http://localhost:3000/api/stripe/checkout \
     -H "Content-Type: application/json" \
     -d '{"bookingId": "invalid"}' \
     # Should return 401 with auth message
   ```

2. **Test Security Headers**
   ```bash
   curl -i http://localhost:3000/api/health
   # Should include:
   # X-Content-Type-Options: nosniff
   # X-Frame-Options: DENY
   # X-XSS-Protection: 1; mode=block
   ```

3. **Test Rate Limiting**
   ```bash
   # Make 101 requests in quick succession
   for i in {1..101}; do
     curl -X POST http://localhost:3000/api/ai/chat/coach \
       -H "Authorization: Bearer $TOKEN" \
       -d '{"messages": [...]}'
   done
   # Request 101 should return 429
   ```

---

## Next Steps

1. **Implement in existing routes** (1-2 hours)
   - Update all 8 API routes to use new utilities
   - Test each route thoroughly

2. **Add missing utilities** (2-3 hours)
   - Complete RBAC system
   - Add DOMPurify integration
   - Implement Redis rate limiting for production

3. **Production deployment** (1 hour)
   - Verify all tests pass
   - Deploy to staging
   - Run production-like tests
   - Deploy to production

4. **Post-deployment** (ongoing)
   - Monitor error rates
   - Verify logging is working
   - Check performance metrics
   - Iterate on improvements

---

## Support & Resources

- **Error Handling Docs:** `lib/api-error-handler.ts` - JSDoc comments
- **Security Docs:** `lib/api-security.ts` - JSDoc comments
- **Audit Reports:** `ZENITH_AUDIT_REPORT_PHASE1.md`, `ZENITH_SECURITY_AUDIT_PHASE3.md`
- **Session Summary:** `ZENITH_SESSION_SUMMARY.md`

---

## FAQ

**Q: How do I migrate existing error handling?**
A: Replace `catch (error: any)` with the pattern shown in the examples. Use `logApiError()` for logging and `createErrorResponse()` for responses.

**Q: How do I add a new error category?**
A: Add to `ErrorCategory` enum in `lib/api-error-handler.ts`, update `getUserMessage()` and `getStatusCode()` functions.

**Q: Can I customize error messages?**
A: Yes, pass `overrideMessage` to `createErrorResponse()` for custom messages, or override `getUserMessage()` function.

**Q: How do I integrate with Sentry?**
A: Use `logApiError()` which already logs to console. Integrate Sentry by wrapping console.error in Sentry.captureException().

**Q: Can I disable CORS for specific routes?**
A: Yes, check route context in `getCorsHeaders()` before including headers.

---

**Ready to deploy! 🚀**

For questions or issues, refer to the comprehensive audit reports and JSDoc comments in the utility files.
