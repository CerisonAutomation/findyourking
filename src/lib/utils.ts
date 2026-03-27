/**
 * Utils - Consolidated Utility Functions
 * Common utility functions for the Find Your King dating platform
 */

import {type ClassValue, clsx} from 'clsx'
import {twMerge} from 'tailwind-merge'

// Tailwind CSS utility
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Date utilities
export function formatDate(date: string | Date): string {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export function formatTime(date: string | Date): string {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatDateTime(date: string | Date): string {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`
    return formatDate(d)
}

export function isToday(date: string | Date): boolean {
    const d = new Date(date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
}

export function isYesterday(date: string | Date): boolean {
    const d = new Date(date)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return d.toDateString() === yesterday.toDateString()
}

// String utilities
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str
    return str.slice(0, length) + '...'
}

export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2)
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

export function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

export function unique<T>(array: T[]): T[] {
    return [...new Set(array)]
}

// Number utilities
export function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)}m`
    if (km < 10) return `${km.toFixed(1)}km`
    return `${Math.round(km)}km`
}

// Validation utilities
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

// Color utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null
}

export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

// Storage utilities
export function getStorageItem<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue || null
    try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue || null
    } catch {
        return defaultValue || null
    }
}

export function setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
        console.error('Failed to save to localStorage:', error)
    }
}

export function removeStorageItem(key: string): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.removeItem(key)
    } catch (error) {
        console.error('Failed to remove from localStorage:', error)
    }
}

// Debounce utility (already exists as hook but also needed as function)
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

// Random utilities
export function randomId(): string {
    return Math.random().toString(36).substr(2, 9)
}

export function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

// Error utilities
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    return 'An unknown error occurred'
}

export function isError(error: unknown): error is Error {
    return error instanceof Error
}

// Type guards
export function isString(value: unknown): value is string {
    return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean'
}

export function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value)
}

export function isFunction(value: unknown): value is Function {
    return typeof value === 'function'
}

export function isNull(value: unknown): value is null {
    return value === null
}

export function isUndefined(value: unknown): value is undefined {
    return value === undefined
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
    return isNull(value) || isUndefined(value)
}