'use client'

import {useEffect} from 'react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error)
    }, [error])

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="text-center space-y-4">
                    <div
                        className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        !
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        Something went wrong
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                        We apologize for the inconvenience. Our team has been notified.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === 'development' && (
                        <div
                            className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200 font-mono break-all">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={reset} className="flex-1">
                            Try Again
                        </Button>
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/">
                                Go Home
                            </Link>
                        </Button>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            Need help? Contact our{' '}
                            <Link href="/support"
                                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium">
                                Support Team
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
