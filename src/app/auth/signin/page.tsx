'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Crown, Eye, EyeOff, Lock, Shield, User, Zap} from 'lucide-react'

export default function SignInPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // Simulate authentication
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Success - redirect to dashboard
            router.push('/dashboard')
        } catch (err) {
            setError('Authentication failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            className="min-h-screen bg-black text-cyan-400 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background grid */}
            <div className="absolute inset-0 cyber-grid opacity-20"/>

            {/* Floating orbs */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl animate-pulse"/>
            <div
                className="absolute bottom-20 right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-pulse delay-1000"/>
            <div
                className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl animate-pulse delay-500"/>

            <div className="w-full max-w-md relative z-10">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl mb-4 shadow-neon">
                        <Crown className="w-10 h-10 text-black"/>
                    </div>
                    <h1 className="text-4xl font-bold text-cyan-400 mb-2 neon-text tracking-wider">
                        ZENITH KING
                    </h1>
                    <p className="text-gray-500 text-sm tracking-wide uppercase">
                        Enter Your Kingdom
                    </p>
                </div>

                {/* Sign In Form */}
                <Card className="bg-black/50 border-2 border-cyan-400/20 backdrop-blur-sm cyber-scan">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <User
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50"/>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 placeholder-cyan-400/30 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                    placeholder="king@zenith.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50"/>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 placeholder-cyan-400/30 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                    placeholder="••••••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400/50 hover:text-cyan-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 bg-black/50 border-2 border-cyan-400/20 rounded text-cyan-400 focus:ring-cyan-400 focus:ring-1"
                                />
                                <span className="text-xs text-cyan-300 uppercase tracking-wider">
                  Remember Me
                </span>
                            </label>
                            <button
                                type="button"
                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
                            >
                                Forgot?
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
                                <p className="text-red-400 text-xs text-center">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="accent"
                            size="lg"
                            loading={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Entering Kingdom...' : 'Enter Kingdom'}
                        </Button>

                        {/* Security Badge */}
                        <div className="flex items-center justify-center space-x-2 pt-4">
                            <Shield className="w-4 h-4 text-cyan-400/50"/>
                            <span className="text-xs text-cyan-400/50 uppercase tracking-wider">
                Secured by AES-256 Encryption
              </span>
                            <Zap className="w-4 h-4 text-cyan-400/50"/>
                        </div>
                    </form>
                </Card>

                {/* Sign Up Link */}
                <div className="text-center mt-6">
                    <p className="text-cyan-400/50 text-sm">
                        Not a King yet?{' '}
                        <button
                            onClick={() => router.push('/auth/signup')}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors font-bold uppercase tracking-wider"
                        >
                            Claim Your Crown
                        </button>
                    </p>
                </div>
            </div>

            {/* Bottom decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"/>
        </div>
    )
}
