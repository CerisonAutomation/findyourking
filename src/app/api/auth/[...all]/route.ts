/**
 * Better-Auth API Route Handler
 * Handles all authentication endpoints
 */

import {auth} from '@/lib/auth/better-auth'
import {NextRequest} from 'next/server'

export async function GET(request: NextRequest) {
    return auth.handler(request)
}

export async function POST(request: NextRequest) {
    return auth.handler(request)
}