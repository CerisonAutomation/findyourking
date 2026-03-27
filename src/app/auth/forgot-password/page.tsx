'use client'

import {useState} from 'react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {ArrowLeft, CheckCircle2, Crown, Loader2} from 'lucide-react'
import {toast} from 'sonner'
import {z} from 'zod'

const emailSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        try {
            const validated = emailSchema.parse({email})

            setIsLoading(true)

            const response = await fetch('/api/auth/forget-password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: validated.email,
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset email')
            }

            setSuccess(true)
            toast.success('Password reset email sent!')
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0].message)
            } else if (err instanceof Error) {
                setError(err.message)
                toast.error(err.message)
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-20 w-32 h-32 bg-amber-500/30 rounded-full blur-2xl animate-pulse"/>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-500/20 rounded-full blur-2xl animate-pulse delay-1000"/>
            </div>

            <Card className="w-full max-w-md bg-gray-900/90 border-amber-500/20 relative z-10">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Crown className="w-8 h-8 text-white"/>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Forgot Password</CardTitle>
                    <CardDescription className="text-gray-400">
                        Enter your email and we&apos;ll send you a reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0"/>
                                <div>
                                    <p className="font-semibold text-sm">Check your inbox</p>
                                    <p className="text-sm opacity-90">We&apos;ve sent a password reset link to {email}</p>
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-sm text-gray-400">
                                    Didn&apos;t receive the email?{' '}
                                    <button
                                        onClick={() => setSuccess(false)}
                                        className="text-amber-400 hover:text-amber-300 font-medium"
                                    >
                                        Try again
                                    </button>
                                </p>
                                <Link href="/auth/signin" className="text-sm text-amber-400 hover:text-amber-300">
                                    Back to Sign In
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                                    disabled={isLoading}
                                />
                                {error && <p className="text-red-400 text-sm">{error}</p>}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-semibold"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>

                            <div className="text-center">
                                <Link
                                    href="/auth/signin"
                                    className="inline-flex items-center text-sm text-gray-400 hover:text-amber-400 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2"/>
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
