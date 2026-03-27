import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

const RATE_LIMIT = 100 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function getRateLimitKey(request: NextRequest): string {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const path = request.nextUrl.pathname
    return `${ip}:${path}`
}

function checkRateLimit(key: string): boolean {
    const now = Date.now()
    const record = rateLimitMap.get(key)

    if (!record) {
        rateLimitMap.set(key, {count: 1, lastReset: now})
        return true
    }

    if (now - record.lastReset > RATE_LIMIT_WINDOW) {
        record.count = 1
        record.lastReset = now
        return true
    }

    if (record.count >= RATE_LIMIT) {
        return false
    }

    record.count++
    return true
}

// Clean up old rate limit records periodically
setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
        if (now - record.lastReset > RATE_LIMIT_WINDOW) {
            rateLimitMap.delete(key)
        }
    }
}, RATE_LIMIT_WINDOW)

// Protected paths that require authentication
const PROTECTED_PATHS = [
    '/dashboard',
    '/discover',
    '/messages',
    '/matches',
    '/profile',
    '/settings',
    '/events/create',
    '/live-location',
]

// Public paths that should redirect if authenticated (auth pages)
const AUTH_PATHS = ['/auth/signin', '/auth/signup', '/auth/forgot-password']

export async function middleware(request: NextRequest) {
    const {pathname} = request.nextUrl
    const response = NextResponse.next()

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' https://r2cdn.perplexity.ai",
        "connect-src 'self'",
        "frame-ancestors 'none'",
    ].join('; ')
    response.headers.set('Content-Security-Policy', csp)

    // Rate limiting for API routes
    if (pathname.startsWith('/api/')) {
        const rateLimitKey = getRateLimitKey(request)
        if (!checkRateLimit(rateLimitKey)) {
            return new NextResponse(
                JSON.stringify({error: 'Too many requests', retryAfter: 60}),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '60',
                    },
                }
            )
        }
    }

    // Check authentication for protected routes
    const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
    const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path))
    const userId = request.headers.get('x-user-id')

    // Redirect to signin if accessing protected route without auth
    if (isProtectedPath && !userId) {
        const signInUrl = new URL('/auth/signin', request.url)
        signInUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(signInUrl)
    }

    // Redirect to dashboard if accessing auth pages while logged in
    if (isAuthPath && userId) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Input validation for query parameters
    const searchParams = request.nextUrl.searchParams
    for (const [key, value] of searchParams.entries()) {
        // Block potentially malicious patterns
        if (value.includes('<script>') || value.includes('javascript:') || value.includes('data:')) {
            return new NextResponse(
                JSON.stringify({error: 'Invalid input detected'}),
                {
                    status: 400,
                    headers: {'Content-Type': 'application/json'},
                }
            )
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
}