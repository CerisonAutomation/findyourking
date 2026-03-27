import {headers} from 'next/headers'
import {auth} from '@/lib/auth/better-auth'

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        return Response.json({session})
    } catch (error) {
        console.error('Session error:', error)
        return Response.json({session: null}, {status: 401})
    }
}
