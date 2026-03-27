'use client'

import {useEffect} from 'react'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {AlertTriangle, RefreshCw} from 'lucide-react'

export default function DiscoverError({
                                          error,
                                          reset,
                                      }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Discover page error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-king-bg flex items-center justify-center p-4">
            <Card className="max-w-md w-full bg-king-bg-1 border-king-border">
                <CardContent className="p-6 text-center">
                    <div className="mb-4">
                        <AlertTriangle className="h-12 w-12 text-king-crimson mx-auto"/>
                    </div>

                    <h2 className="text-king-h2 mb-2">Something went wrong</h2>

                    <p className="text-king-muted mb-6">
                        We couldn't load the profiles. Please try again.
                    </p>

                    {error.message && (
                        <div className="mb-6 p-3 bg-king-bg-2 rounded-king">
                            <p className="text-king-small text-king-faint">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <Button
                            onClick={reset}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4"/>
                            Try Again
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                        >
                            Go Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}