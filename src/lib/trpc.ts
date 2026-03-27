import {initTRPC} from '@trpc/server'
import {cache} from 'react'
import {getServerSession} from 'next-auth/next'
import {headers} from 'next/headers'

/**
 * This is the actual context you'll use in your router
 * It will be filled with the session data when a request is made
 */
export const createContext = cache(async () => {
    const session = await getServerSession(
        await headers()
    )

    return {
        session,
        user: session?.user ?? null,
    }
})

export type Context = Awaited<ReturnType<typeof createContext>>

/**
 * 1. Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
    /**
     * @see https://trpc.io/docs/server/data-transformers
     */
    transformer: {
        serialize: (data) => data,
        deserialize: (data) => data,
    },
    /**
     * @see https://trpc.io/docs/server/error-formatting
     */
    errorFormatter({shape, error}) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.code === 'BAD_REQUEST' && error.cause instanceof Error
                    ? error.cause.message
                    : null,
            },
        }
    },
})

/**
 * 2. Create router with your procedures
 */
export const router = t.router
export const publicProcedure = t.procedure

/**
 * 3. Create protected procedures
 */
export const protectedProcedure = t.procedure.use(({ctx, next}) => {
    if (!ctx.session || !ctx.user) {
        throw new Error('Unauthorized')
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
        },
    })
})

/**
 * 4. Export API handler
 */
export const api = t.router({
    hello: publicProcedure
        .input((val: unknown) => {
            if (typeof val === 'string') return val
            throw new Error(`Invalid input: ${typeof val}`)
        })
        .query(({input}) => {
            return {
                greeting: `Hello ${input}!`,
                time: new Date().toISOString(),
            }
        }),

    getUser: protectedProcedure.query(({ctx}) => {
        return ctx.user
    }),
})

export type AppRouter = typeof api
