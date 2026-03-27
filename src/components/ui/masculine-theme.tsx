'use client'

import * as React from 'react'
import {createContext, useContext, useEffect, useState} from 'react'

interface MasculineThemeContextType {
    isMasculineMode: boolean
    toggleMasculineMode: () => void
    accentColor: 'crimson' | 'cobalt' | 'emerald' | 'gold'
    setAccentColor: (color: 'crimson' | 'cobalt' | 'emerald' | 'gold') => void
}

const MasculineThemeContext = createContext<MasculineThemeContextType | undefined>(undefined)

export function MasculineThemeProvider({children}: { children: React.ReactNode }) {
    const [isMasculineMode, setIsMasculineMode] = useState(true)
    const [accentColor, setAccentColor] = useState<'crimson' | 'cobalt' | 'emerald' | 'gold'>('crimson')

    useEffect(() => {
        // Apply theme to document
        const root = document.documentElement

        if (isMasculineMode) {
            root.classList.add('masculine-mode')

            // Set accent color CSS variable based on selection
            const accentColors = {
                crimson: 'hsl(0, 80%, 55%)',
                cobalt: 'hsl(217, 91%, 60%)',
                emerald: 'hsl(142, 76%, 36%)',
                gold: 'hsl(38, 92%, 50%)'
            }

            root.style.setProperty('--king-accent', accentColors[accentColor])
        } else {
            root.classList.remove('masculine-mode')
        }
    }, [isMasculineMode, accentColor])

    const toggleMasculineMode = () => setIsMasculineMode(!isMasculineMode)

    return (
        <MasculineThemeContext.Provider
            value={{
                isMasculineMode,
                toggleMasculineMode,
                accentColor,
                setAccentColor
            }}
        >
            {children}
        </MasculineThemeContext.Provider>
    )
}

export function useMasculineTheme() {
    const context = useContext(MasculineThemeContext)
    if (context === undefined) {
        throw new Error('useMasculineTheme must be used within a MasculineThemeProvider')
    }
    return context
}

// Utility function for conditional masculine styling
export function masculineStyles(
    masculineClass: string,
    defaultClass: string = ''
): string {
    // This can be used with the useMasculineTheme hook
    // to conditionally apply masculine-specific styles
    return `${defaultClass} ${masculineClass}`.trim()
}
