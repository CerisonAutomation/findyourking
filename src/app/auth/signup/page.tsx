'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Calendar, Crown, Eye, EyeOff, Lock, Mail, MapPin, Shield, User, Zap} from 'lucide-react'

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        location: '',
        gender: '',
        interests: [] as string[]
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState(1)
    const router = useRouter()

    const interests = [
        'Fitness', 'Travel', 'Technology', 'Music', 'Art', 'Cooking',
        'Photography', 'Gaming', 'Reading', 'Sports', 'Movies', 'Nature',
        'Fashion', 'Business', 'Science', 'History', 'Philosophy', 'Dancing'
    ]

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleInterestToggle = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
        }

        try {
            // Simulate registration
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Success - redirect to sign in
            router.push('/auth/signin?message=registration-success')
        } catch (err) {
            setError('Registration failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const nextStep = () => {
        if (step === 1 && formData.username && formData.email && formData.password) {
            setStep(2)
        } else if (step === 2 && formData.firstName && formData.lastName && formData.dateOfBirth) {
            setStep(3)
        }
    }

    const prevStep = () => {
        setStep(Math.max(1, step - 1))
    }

    return (
        <div
            className="min-h-screen bg-black text-cyan-400 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 cyber-grid opacity-20"/>
            <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl animate-pulse"/>
            <div
                className="absolute bottom-20 right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-pulse delay-1000"/>

            <div className="w-full max-w-md relative z-10">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl mb-4 shadow-neon">
                        <Crown className="w-10 h-10 text-black"/>
                    </div>
                    <h1 className="text-4xl font-bold text-cyan-400 mb-2 neon-text tracking-wider">
                        CLAIM YOUR CROWN
                    </h1>
                    <p className="text-gray-500 text-sm tracking-wide uppercase">
                        Step {step} of 3 - Become a King
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex space-x-2">
                        {[1, 2, 3].map((num) => (
                            <div
                                key={num}
                                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                                    num <= step ? 'bg-cyan-400 shadow-neon' : 'bg-gray-800'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Sign Up Form */}
                <Card className="bg-black/50 border-2 border-cyan-400/20 backdrop-blur-sm cyber-scan">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {step === 1 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-cyan-300 uppercase tracking-wider">
                                    Account Details
                                </h2>

                                {/* Username */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <User
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50"/>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 placeholder-cyan-400/30 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                            placeholder="king_username"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50"/>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 placeholder-cyan-400/30 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                            placeholder="king@zenith.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50"/>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
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

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50"/>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-12 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 placeholder-cyan-400/30 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                            placeholder="••••••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400/50 hover:text-cyan-400 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4"/> :
                                                <Eye className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-cyan-300 uppercase tracking-wider">
                                    Personal Information
                                </h2>

                                {/* First Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 placeholder-cyan-400/30 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                        placeholder="John"
                                        required
                                    />
                                </div>

                                {/* Last Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 placeholder-cyan-400/30 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                        placeholder="Doe"
                                        required
                                    />
                                </div>

                                {/* Date of Birth */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                        Date of Birth
                                    </label>
                                    <div className="relative">
                                        <Calendar
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50"/>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 placeholder-cyan-400/30 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="prefer_not_to_say">Prefer not to say</option>
                                    </select>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                        Location
                                    </label>
                                    <div className="relative">
                                        <MapPin
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50"/>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-cyan-400/20 rounded-lg text-cyan-400 placeholder-cyan-400/30 focus:border-cyan-400 focus:outline-none focus:shadow-neon transition-all duration-300"
                                            placeholder="New York, NY"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-cyan-300 uppercase tracking-wider">
                                    Interests & Preferences
                                </h2>
                                <p className="text-sm text-cyan-400/50">
                                    Select at least 3 interests to help us find your perfect match
                                </p>

                                <div className="grid grid-cols-3 gap-2">
                                    {interests.map((interest) => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => handleInterestToggle(interest)}
                                            className={`px-3 py-2 rounded-lg border-2 transition-all duration-300 text-xs font-bold uppercase tracking-wider ${
                                                formData.interests.includes(interest)
                                                    ? 'bg-cyan-400 text-black border-cyan-400 shadow-neon'
                                                    : 'bg-black/50 text-cyan-400 border-cyan-400/20 hover:border-cyan-400/40'
                                            }`}
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>

                                {formData.interests.length < 3 && (
                                    <p className="text-xs text-red-400">
                                        Please select at least 3 interests
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
                                <p className="text-red-400 text-xs text-center">{error}</p>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex space-x-3">
                            {step > 1 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="default"
                                    onClick={prevStep}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                            )}

                            {step < 3 ? (
                                <Button
                                    type="button"
                                    variant="accent"
                                    size="default"
                                    onClick={nextStep}
                                    className="flex-1"
                                >
                                    Next Step
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    variant="accent"
                                    size="default"
                                    loading={isLoading}
                                    disabled={formData.interests.length < 3}
                                    className="flex-1"
                                >
                                    {isLoading ? 'Claiming Crown...' : 'Claim Crown'}
                                </Button>
                            )}
                        </div>

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

                {/* Sign In Link */}
                <div className="text-center mt-6">
                    <p className="text-cyan-400/50 text-sm">
                        Already a King?{' '}
                        <button
                            onClick={() => router.push('/auth/signin')}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors font-bold uppercase tracking-wider"
                        >
                            Enter Kingdom
                        </button>
                    </p>
                </div>
            </div>

            {/* Bottom decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"/>
        </div>
    )
}
