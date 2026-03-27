'use client'

import {createContext, useContext, useEffect, useState} from 'react'

// Professional color palette for Find Your King
export const appColors = {
    // Primary colors - Dark theme with blue accents
    primary: {
        50: '#0a0a0a',
        100: '#1a1a1a',
        200: '#2a2a2a',
        300: '#3a3a3a',
        400: '#4a4a4a',
        500: '#5a5a5a',
        600: '#6a6a6a',
        700: '#7a7a7a',
        800: '#8a8a8a',
        900: '#9a9a9a',
    },

    // Accent colors - Blue and purple tones
    accent: {
        blue: '#00d4ff',
        cyan: '#00ff88',
        purple: '#9945ff',
        pink: '#ff006e',
        orange: '#ff6b35',
        red: '#ff0040',
    },

    // Glow effects
    glow: {
        blue: 'rgba(0, 212, 255, 0.8)',
        cyan: 'rgba(0, 255, 136, 0.8)',
        purple: 'rgba(153, 69, 255, 0.8)',
        pink: 'rgba(255, 0, 110, 0.8)',
    },

    // Gradients
    gradients: {
        primary: 'linear-gradient(135deg, #0a0a0a 0%, #2a2a2a 50%, #4a4a4a 100%)',
        accent: 'linear-gradient(135deg, #00d4ff 0%, #9945ff 50%, #ff006e 100%)',
        dark: 'linear-gradient(45deg, #0a0a0a 25%, #00d4ff 25% 50%, #9945ff 50% 75%, #ff006e 75%)',
        glow: 'radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%)',
    },

    // Shadows
    shadows: {
        neon: '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)',
        dark: '0 0 30px rgba(153, 69, 255, 0.4), 0 0 60px rgba(153, 69, 255, 0.2)',
        danger: '0 0 25px rgba(255, 0, 64, 0.6), 0 0 50px rgba(255, 0, 64, 0.3)',
    }
}

// Theme context
interface AppTheme {
    colors: typeof appColors
    isDark: boolean
    accentColor: keyof typeof appColors.accent
    glowEffects: boolean
    toggleTheme: () => void
    setAccentColor: (color: keyof typeof appColors.accent) => void
    toggleGlowEffects: () => void
}

const ThemeContext = createContext<AppTheme | undefined>(undefined)

export function useAppTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useAppTheme must be used within AppThemeProvider')
    }
    return context
}

export function AppThemeProvider({children}: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(true)
    const [accentColor, setAccentColor] = useState<keyof typeof appColors.accent>('blue')
    const [glowEffects, setGlowEffects] = useState(true)

    useEffect(() => {
        // Apply theme to document
        const root = document.documentElement

        if (isDark) {
            root.classList.add('dark')
            root.style.setProperty('--background', appColors.primary[50])
            root.style.setProperty('--foreground', appColors.primary[800])
        } else {
            root.classList.remove('dark')
            root.style.setProperty('--background', '#ffffff')
            root.style.setProperty('--foreground', appColors.primary[200])
        }

        // Apply accent color
        root.style.setProperty('--accent', appColors.accent[accentColor])
        root.style.setProperty('--accent-glow', appColors.glow[accentColor as keyof typeof appColors.glow])

        // Apply glow effects
        if (glowEffects) {
            root.classList.add('glow-effects')
        } else {
            root.classList.remove('glow-effects')
        }
    }, [isDark, accentColor, glowEffects])

    const toggleTheme = () => setIsDark(!isDark)
    const toggleGlowEffects = () => setGlowEffects(!glowEffects)

    const value: AppTheme = {
        colors: appColors,
        isDark,
        accentColor,
        glowEffects,
        toggleTheme,
        setAccentColor,
        toggleGlowEffects,
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

// Utility functions for theme
export function getAppGradient(type: keyof typeof appColors.gradients) {
    return appColors.gradients[type]
}

export function getAppShadow(type: keyof typeof appColors.shadows) {
    return appColors.shadows[type]
}

export function getAppColor(color: keyof typeof appColors.primary | keyof typeof appColors.accent) {
    if (color in appColors.primary) {
        return appColors.primary[color as keyof typeof appColors.primary]
    }
    return appColors.accent[color as keyof typeof appColors.accent]
}

// CSS-in-JS styles
export const appStyles = `
  :root {
    --background: #0a0a0a;
    --foreground: #9a9a9a;
    --accent: #00d4ff;
    --accent-glow: rgba(0, 212, 255, 0.8);
    --border: #4a4a4a;
    --muted: #2a2a2a;
    --muted-foreground: #7a7a7a;
  }

  .dark {
    --background: #0a0a0a;
    --foreground: #9a9a9a;
  }

  .glow-effects {
    --shadow-neon: 0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3);
    --shadow-dark: 0 0 30px rgba(153, 69, 255, 0.4), 0 0 60px rgba(153, 69, 255, 0.2);
    --shadow-danger: 0 0 25px rgba(255, 0, 64, 0.6), 0 0 50px rgba(255, 0, 64, 0.3);
  }

  * {
    transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }

  body {
    font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 500;
    letter-spacing: 0.02em;
    background: var(--background);
    color: var(--foreground);
  }

  .grid-background {
    background-image: 
      linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
  }

  .glow-text {
    text-shadow: 0 0 10px var(--accent-glow);
  }

  .border-gradient {
    border: 2px solid transparent;
    background: linear-gradient(var(--background), var(--background)) padding-box,
                linear-gradient(45deg, var(--accent), var(--border)) border-box;
  }

  .app-card {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(26, 26, 26, 0.8));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 212, 255, 0.2);
    box-shadow: 
      0 0 20px rgba(0, 212, 255, 0.1),
      inset 0 0 20px rgba(0, 212, 255, 0.05);
  }

  .app-button {
    position: relative;
    overflow: hidden;
    background: linear-gradient(45deg, var(--accent), var(--border));
    border: 2px solid var(--accent);
    color: var(--background);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: all 0.3s ease;
  }

  .app-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  .app-button:hover::before {
    left: 100%;
  }

  .app-button:hover {
    box-shadow: var(--shadow-neon);
    transform: translateY(-2px);
  }

  .app-input {
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid var(--border);
    color: var(--accent);
    font-weight: 500;
    letter-spacing: 0.05em;
    transition: all 0.3s ease;
  }

  .app-input:focus {
    border-color: var(--accent);
    box-shadow: var(--shadow-neon);
    outline: none;
  }

  .app-input::placeholder {
    color: var(--muted-foreground);
  }

  @keyframes glow-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }

  .glow-pulse {
    animation: glow-pulse 2s ease-in-out infinite;
  }

  .scan-effect {
    position: relative;
    overflow: hidden;
  }

  .scan-effect::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    animation: scan 3s ease-in-out infinite;
  }
`
