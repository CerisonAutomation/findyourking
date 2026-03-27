import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'

export default function NotFound() {
    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="text-center space-y-4">
                    <div
                        className="mx-auto w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        Z
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        Page Not Found
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                        The page you're looking for doesn't exist or has been moved.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button asChild className="flex-1">
                            <Link href="/">
                                Go Home
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/auth">
                                Sign In
                            </Link>
                        </Button>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            Lost? Let our{' '}
                            <Link href="/ai-coach"
                                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium">
                                AI Coach
                            </Link>
                            {' '}guide you.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
