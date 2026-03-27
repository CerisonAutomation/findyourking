import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {z} from 'zod'

// Security configuration
export const securityConfig = {
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
        expiresIn: '24h',
        issuer: 'findyourking-app',
        audience: 'findyourking-users'
    },

    // Password Configuration
    password: {
        saltRounds: 12,
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    },

    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // Limit each IP to 100 requests per windowMs
        maxAuthRequests: 5, // Limit auth attempts
        maxAiRequests: 50 // Limit AI requests
    },

    // Encryption
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16
    }
}

// Validation schemas
export const securitySchemas = {
    // User registration validation
    userRegistration: z.object({
        email: z.string().email('Invalid email format'),
        username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
        password: z.string()
            .min(securityConfig.password.minLength)
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        dateOfBirth: z.string().datetime().optional(),
        gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional()
    }),

    // User login validation
    userLogin: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1)
    }),

    // Password change validation
    passwordChange: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string()
            .min(securityConfig.password.minLength)
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
    }),

    // API key validation
    apiKey: z.object({
        name: z.string().min(1).max(100),
        permissions: z.array(z.string()),
        expiresAt: z.string().datetime().optional()
    })
}

// Security utilities
export class SecurityService {
    // Password hashing
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, securityConfig.password.saltRounds)
    }

    // Password verification
    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash)
    }

    // JWT token generation
    static generateToken(payload: object, expiresIn?: string): string {
        const options: jwt.SignOptions = {
            expiresIn: (expiresIn || securityConfig.jwt.expiresIn) as jwt.SignOptions['expiresIn'],
            issuer: securityConfig.jwt.issuer,
            audience: securityConfig.jwt.audience
        }
        return jwt.sign(payload, securityConfig.jwt.secret, options)
    }

    // JWT token verification
    static verifyToken(token: string): any {
        try {
            return jwt.verify(token, securityConfig.jwt.secret, {
                issuer: securityConfig.jwt.issuer,
                audience: securityConfig.jwt.audience
            })
        } catch (error) {
            throw new Error('Invalid token')
        }
    }

    // Data encryption
    static encrypt(data: string, key: string): { encrypted: string; iv: string; tag: string } {
        const iv = crypto.randomBytes(securityConfig.encryption.ivLength)
        const keyBuffer = Buffer.from(key, 'hex')
        const cipher = crypto.createCipheriv(securityConfig.encryption.algorithm, keyBuffer, iv)
        cipher.setAAD(Buffer.from('findyourking-app'))

        let encrypted = cipher.update(data, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        const tag = cipher.getAuthTag()

        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        }
    }

    // Data decryption
    static decrypt(encryptedData: string, key: string, iv: string, tag: string): string {
        const ivBuffer = Buffer.from(iv, 'hex')
        const keyBuffer = Buffer.from(key, 'hex')
        const decipher = crypto.createDecipheriv(securityConfig.encryption.algorithm, keyBuffer, ivBuffer)
        decipher.setAAD(Buffer.from('findyourking-app'))
        decipher.setAuthTag(Buffer.from(tag, 'hex'))

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    }

    // Generate secure random string
    static generateSecureRandom(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex')
    }

    // Generate API key
    static generateApiKey(): string {
        const prefix = 'zk_'
        const randomPart = crypto.randomBytes(24).toString('hex')
        return prefix + randomPart
    }

    // Validate email format
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // Sanitize input
    static sanitizeInput(input: string): string {
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim()
    }

    // Rate limiting check
    static checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
        // This would typically use Redis or similar
        // For now, return true (implement with Redis in production)
        return true
    }

    // CSRF token generation
    static generateCSRFToken(): string {
        return crypto.randomBytes(32).toString('hex')
    }

    // CSRF token validation
    static validateCSRFToken(token: string, sessionToken: string): boolean {
        return token === sessionToken
    }

    // Content Security Policy header
    static getCSPHeader(): string {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.app",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.openai.com https://translate.googleapis.com",
            "media-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
        ].join('; ')
    }

    // Security headers
    static getSecurityHeaders(): Record<string, string> {
        return {
            'Content-Security-Policy': this.getCSPHeader(),
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
        }
    }
}

// Rate limiting middleware
export class RateLimiter {
    private static requests = new Map<string, { count: number; resetTime: number }>()

    static isAllowed(identifier: string, maxRequests: number, windowMs: number): boolean {
        const now = Date.now()
        const key = identifier

        const existing = this.requests.get(key)

        if (!existing || now > existing.resetTime) {
            this.requests.set(key, {
                count: 1,
                resetTime: now + windowMs
            })
            return true
        }

        if (existing.count >= maxRequests) {
            return false
        }

        existing.count++
        return true
    }

    static cleanup(): void {
        const now = Date.now()
        for (const [key, data] of this.requests.entries()) {
            if (now > data.resetTime) {
                this.requests.delete(key)
            }
        }
    }
}

// Audit logging
export class AuditLogger {
    static log(action: string, userId: string, details: any, ipAddress?: string): void {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            action,
            userId,
            details,
            ipAddress,
            userAgent: global.navigator?.userAgent
        }

        // In production, this would go to a secure audit database
        console.log('AUDIT:', JSON.stringify(auditEntry))
    }

    static logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', details: any): void {
        const securityEntry = {
            timestamp: new Date().toISOString(),
            event,
            severity,
            details,
            alertSent: severity === 'high'
        }

        // In production, this would trigger alerts and go to SIEM
        console.log('SECURITY:', JSON.stringify(securityEntry))
    }
}

// Data masking utilities
export class DataMasker {
    static maskEmail(email: string): string {
        const [username, domain] = email.split('@')
        if (username.length <= 2) {
            return `${username[0]}***@${domain}`
        }
        return `${username.slice(0, 2)}***@${domain}`
    }

    static maskPhone(phone: string): string {
        return phone.slice(0, 3) + '***' + phone.slice(-2)
    }

    static maskCreditCard(cardNumber: string): string {
        return '****-****-****-' + cardNumber.slice(-4)
    }

    static maskSSN(ssn: string): string {
        return '***-**-' + ssn.slice(-4)
    }
}

// Initialize security cleanup
setInterval(() => {
    RateLimiter.cleanup()
}, 60000) // Cleanup every minute
