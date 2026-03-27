'use client'

import {useEffect} from 'react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'

export default function GlobalError({
                                        error,
                                        reset,
                                    }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global application error:', error)
    }, [error])

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0">
                <CardHeader className="text-center space-y-4">
                    <div
                        className="mx-auto w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl animate-pulse">
                        ⚠
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-900 dark:text-red-100">
                        Critical Error
                    </CardTitle>
                    <CardDescription className="text-red-700 dark:text-red-300">
                        A critical error occurred. We're working to fix this immediately.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === 'development' && (
                        <div
                            className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg border border-red-300 dark:border-red-700">
                            <p className="text-sm text-red-900 dark:text-red-100 font-mono break-all">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={reset} className="flex-1 bg-red-600 hover:bg-red-700">
                            Reload Application
                        </Button>
                        <Button variant="outline" asChild
                                className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20">
                            <Link href="/">
                                Emergency Home
                            </Link>
                        </Button>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-red-600 dark:text-red-400">
                            For immediate assistance:{' '}
                            <Link href="mailto:support@findyourking.app" className="font-medium underline">
                                support@findyourking.app
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
