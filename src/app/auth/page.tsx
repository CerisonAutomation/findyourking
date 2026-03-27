'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {isValidEmail} from '@/lib/utils'
import {Eye, EyeOff, Lock, Mail, User} from 'lucide-react'

export default function AuthPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('signin')
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        handle: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({...prev, [field]: value}))
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: ''}))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!isValidEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        if (activeTab === 'signup') {
            if (!formData.displayName.trim()) {
                newErrors.displayName = 'Display name is required'
            }
            if (!formData.handle.trim()) {
                newErrors.handle = 'Handle is required'
            }
            if (formData.handle.length < 3) {
                newErrors.handle = 'Handle must be at least 3 characters'
            }
        }

        if (activeTab !== 'magic' && !formData.password) {
            newErrors.password = 'Password is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        try {
            if (activeTab === 'signin') {
                const response = await fetch('/api/auth/sign-in', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    })
                })
                if (!response.ok) throw new Error('Sign in failed')
                router.push('/discover')
            } else if (activeTab === 'signup') {
                const response = await fetch('/api/auth/sign-up', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        displayName: formData.displayName,
                        handle: formData.handle
                    })
                })
                if (!response.ok) throw new Error('Sign up failed')
                router.push('/discover')
            } else if (activeTab === 'magic') {
                const response = await fetch('/api/auth/magic-link', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        email: formData.email
                    })
                })
                if (!response.ok) throw new Error('Magic link failed')
                // Show success message
            }
        } catch (error) {
            console.error('Auth error:', error)
            setErrors({general: 'Authentication failed. Please try again.'})
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">
                        Welcome to Find Your King
                    </CardTitle>
                    <p className="text-muted-foreground">
                        Privacy-first P2P dating for the modern LGBTQ+ community
                    </p>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="signin">Sign In</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                            <TabsTrigger value="magic">Magic Link</TabsTrigger>
                        </TabsList>

                        {/* Sign In Form */}
                        <TabsContent value="signin" className="space-y-4 mt-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className="pl-10 pr-10"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                            disabled={loading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <p className="text-sm text-destructive">{errors.general}</p>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Sign Up Form */}
                        <TabsContent value="signup" className="space-y-4 mt-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            id="displayName"
                                            type="text"
                                            placeholder="Your display name"
                                            value={formData.displayName}
                                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.displayName && (
                                        <p className="text-sm text-destructive">{errors.displayName}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="handle">Handle</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            id="handle"
                                            type="text"
                                            placeholder="@username"
                                            value={formData.handle}
                                            onChange={(e) => handleInputChange('handle', e.target.value)}
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.handle && (
                                        <p className="text-sm text-destructive">{errors.handle}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            id="signup-password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className="pl-10 pr-10"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                            disabled={loading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <p className="text-sm text-destructive">{errors.general}</p>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Creating account...' : 'Sign Up'}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Magic Link Form */}
                        <TabsContent value="magic" className="space-y-4 mt-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="magic-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                        <Input
                                            id="magic-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email}</p>
                                    )}
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    We'll send you a magic link to sign in instantly.
                                </p>

                                {errors.general && (
                                    <p className="text-sm text-destructive">{errors.general}</p>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Sending magic link...' : 'Send Magic Link'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}