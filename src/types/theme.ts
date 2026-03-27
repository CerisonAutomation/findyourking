/**
 * Theme Types - Type definitions for theming
 */

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
    // Primary colors
    primary: string
    primaryForeground: string

    // Secondary colors
    secondary: string
    secondaryForeground: string

    // Background colors
    background: string
    foreground: string

    // Card colors
    card: string
    cardForeground: string

    // Input colors
    input: string
    inputForeground: string

    // Border colors
    border: string

    // Ring colors
    ring: string

    // Status colors
    success: string
    warning: string
    error: string
    info: string
}

export interface ThemeConfig {
    mode: ThemeMode
    colors: Partial<ThemeColors>
    customCSS?: string
}