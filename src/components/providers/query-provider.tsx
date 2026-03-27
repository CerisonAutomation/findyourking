'use client'

import * as React from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error) => {
                if (error instanceof Error && error.message.includes('404')) {
                    return false
                }
                return failureCount < 3
            },
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
})

export function QueryProvider({children}: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}