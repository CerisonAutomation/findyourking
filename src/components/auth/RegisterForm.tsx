'use client';

import React, {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ArrowLeft, ArrowRight, Check, Eye, EyeOff, Heart, Loader2, Lock, Mail, User,} from 'lucide-react';
import {cn} from '@/lib/utils';

interface RegisterFormProps {
    className?: string;
    onSuccess?: () => void;
}

interface FormData {
    email: string;
    username: string;
    displayName: string;
    password: string;
    confirmPassword: string;
    birthDate: string;
    agreedToTerms: boolean;
}

interface FormErrors {
    email?: string;
    username?: string;
    displayName?: string;
    password?: string;
    confirmPassword?: string;
    birthDate?: string;
    agreedToTerms?: string;
    general?: string;
}

const steps = ['Account', 'Profile', 'Verify'];

export function RegisterForm({className, onSuccess}: RegisterFormProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        username: '',
        displayName: '',
        password: '',
        confirmPassword: '',
        birthDate: '',
        agreedToTerms: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateStep = (step: number): boolean => {
        const newErrors: FormErrors = {};

        if (step === 0) {
            if (!formData.email) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            }
            if (!formData.password) {
                newErrors.password = 'Password is required';
            } else if (formData.password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters';
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
                newErrors.password = 'Must include uppercase, lowercase, and a number';
            }
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        if (step === 1) {
            if (!formData.username) {
                newErrors.username = 'Username is required';
            } else if (formData.username.length < 3) {
                newErrors.username = 'Username must be at least 3 characters';
            } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
                newErrors.username = 'Only letters, numbers, and underscores allowed';
            }
            if (!formData.displayName) {
                newErrors.displayName = 'Display name is required';
            }
            if (!formData.birthDate) {
                newErrors.birthDate = 'Birth date is required';
            } else {
                const age = Math.floor(
                    (Date.now() - new Date(formData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                );
                if (age < 18) {
                    newErrors.birthDate = 'You must be at least 18 years old';
                }
            }
            if (!formData.agreedToTerms) {
                newErrors.agreedToTerms = 'You must agree to the terms';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;

        setIsLoading(true);
        setErrors({});

        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            onSuccess?.();
            router.push('/');
        } catch {
            setErrors({general: 'Registration failed. Please try again.'});
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string | boolean } }
    ) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({...prev, [name]: undefined}));
        }
    };

    const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 1) return {level: 1, label: 'Weak', color: 'bg-red-500'};
        if (strength <= 2) return {level: 2, label: 'Fair', color: 'bg-orange-500'};
        if (strength <= 3) return {level: 3, label: 'Good', color: 'bg-yellow-500'};
        if (strength <= 4) return {level: 4, label: 'Strong', color: 'bg-green-500'};
        return {level: 5, label: 'Very Strong', color: 'bg-green-600'};
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className={cn('w-full max-w-md', className)}>
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600">
                        <Heart className="h-7 w-7 text-white"/>
                    </div>
                </div>
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground mt-1">Join Find Your King and start connecting</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {steps.map((step, index) => (
                    <div key={step} className="flex items-center">
                        <div
                            className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                                index < currentStep
                                    ? 'bg-primary text-primary-foreground'
                                    : index === currentStep
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                            )}
                        >
                            {index < currentStep ? <Check className="h-4 w-4"/> : index + 1}
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    'h-0.5 w-12 mx-1',
                                    index < currentStep ? 'bg-primary' : 'bg-muted'
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {errors.general}
                    </div>
                )}

                {/* Step 1: Account */}
                {currentStep === 0 && (
                    <>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={cn('pl-10', errors.email && 'border-destructive')}
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={cn('pl-10 pr-10', errors.password && 'border-destructive')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <div
                                                key={level}
                                                className={cn(
                                                    'h-1 flex-1 rounded-full',
                                                    level <= passwordStrength.level ? passwordStrength.color : 'bg-muted'
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Password strength: {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                            {errors.password && (
                                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={cn('pl-10', errors.confirmPassword && 'border-destructive')}
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </>
                )}

                {/* Step 2: Profile */}
                {currentStep === 1 && (
                    <>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="yourusername"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={cn('pl-8', errors.username && 'border-destructive')}
                                />
                            </div>
                            {errors.username && (
                                <p className="mt-1 text-xs text-destructive">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium mb-1.5">
                                Display Name
                            </label>
                            <div className="relative">
                                <User
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                <Input
                                    id="displayName"
                                    name="displayName"
                                    type="text"
                                    placeholder="How others see you"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className={cn('pl-10', errors.displayName && 'border-destructive')}
                                />
                            </div>
                            {errors.displayName && (
                                <p className="mt-1 text-xs text-destructive">{errors.displayName}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="birthDate" className="block text-sm font-medium mb-1.5">
                                Birth Date
                            </label>
                            <Input
                                id="birthDate"
                                name="birthDate"
                                type="date"
                                value={formData.birthDate}
                                onChange={handleChange}
                                className={cn(errors.birthDate && 'border-destructive')}
                                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
                                    .toISOString()
                                    .split('T')[0]}
                            />
                            {errors.birthDate && (
                                <p className="mt-1 text-xs text-destructive">{errors.birthDate}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">You must be 18 or older</p>
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                id="agreedToTerms"
                                name="agreedToTerms"
                                type="checkbox"
                                checked={formData.agreedToTerms}
                                onChange={(e) =>
                                    handleChange({
                                        target: {name: 'agreedToTerms', value: e.target.checked},
                                    })
                                }
                                className="mt-1 h-4 w-4 rounded border-border accent-primary"
                            />
                            <label htmlFor="agreedToTerms" className="text-sm text-muted-foreground">
                                I agree to the{' '}
                                <Link href="/terms" className="text-primary hover:underline">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link href="/privacy" className="text-primary hover:underline">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>
                        {errors.agreedToTerms && (
                            <p className="text-xs text-destructive">{errors.agreedToTerms}</p>
                        )}
                    </>
                )}

                {/* Step 3: Verification */}
                {currentStep === 2 && (
                    <div className="text-center space-y-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                            <Mail className="h-8 w-8 text-primary"/>
                        </div>
                        <h3 className="text-lg font-semibold">Verify your email</h3>
                        <p className="text-sm text-muted-foreground">
                            We&apos;ve sent a verification link to{' '}
                            <span className="font-medium text-foreground">{formData.email}</span>. Click the link
                            to activate your account.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Didn&apos;t receive it? Check your spam folder or{' '}
                            <button type="button" className="text-primary hover:underline">
                                resend the email
                            </button>
                        </p>
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-3 pt-2">
                    {currentStep > 0 && currentStep < steps.length - 1 && (
                        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Back
                        </Button>
                    )}
                    {currentStep < steps.length - 1 ? (
                        <Button type="button" onClick={handleNext} className="flex-1">
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    ) : (
                        <Button type="submit" className="flex-1" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    Creating account...
                                </>
                            ) : (
                                'Get Started'
                            )}
                        </Button>
                    )}
                </div>

                {/* Login link */}
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-primary font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}
