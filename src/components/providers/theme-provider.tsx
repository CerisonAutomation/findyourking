'use client'

// Theme Provider — Dark/Light/System theme support
// Extracted from ZENITH_ULTIMATE — wraps next-themes

import {ThemeProvider as NextThemesProvider} from 'next-themes'
import {ReactNode} from 'react'

interface ThemeProviderProps {
    children: ReactNode
    defaultTheme?: string
    enableSystem?: boolean
}

export function ThemeProvider({children}: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            themes={['light', 'dark', 'system']}
        >
            {children}
        </NextThemesProvider>
    )
}

export {useTheme} from 'next-themes'