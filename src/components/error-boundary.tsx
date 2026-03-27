'use client'

import React from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {AlertTriangle, RefreshCw} from 'lucide-react'

interface ErrorBoundaryProps {
    children: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {hasError: false, error: null}
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {hasError: true, error}
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to error reporting service
        console.error('Global Error Boundary caught an error:', error, errorInfo)
        
        // In production, send to error tracking service like Sentry
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to error tracking service
            // Example: Sentry.captureException(error, { extra: errorInfo })
        }
    }

    handleRetry = () => {
        this.setState({hasError: false, error: null})
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                    <Card className="max-w-md w-full">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <CardTitle className="text-xl">Something went wrong</CardTitle>
                            <CardDescription>
                                We apologize for the inconvenience. An unexpected error has occurred.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="bg-gray-100 p-3 rounded text-sm font-mono text-red-600 overflow-auto max-h-32">
                                    {this.state.error.message}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button onClick={this.handleRetry} className="flex-1">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                                <Button variant="outline" onClick={() => window.location.href = '/'}>
                                    Go Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}

// Error fallback component for individual sections
export function ErrorFallback({
    error,
    resetError,
}: {
    error: Error
    resetError: () => void
}) {
    return (
        <Card className="m-4">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Error Loading Content
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                    Failed to load this section. Please try again.
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mb-4">
                        {error.message}
                    </pre>
                )}
                <Button onClick={resetError} size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </CardContent>
        </Card>
    )
}
