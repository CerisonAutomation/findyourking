import type {Config} from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            // FIND YOUR KING - ULTIMATE COLOR SYSTEM
            colors: {
                // Base CSS Variables
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },

                // FIND YOUR KING PREMIUM PALETTE
                'king-bg': '#06060E',
                'king-bg-1': '#0A0A16',
                'king-bg-2': '#0F0F1E',
                'king-bg-3': '#141428',
                'king-border': 'rgba(255,255,255,0.07)',
                'king-crimson': '#DC2020',
                'king-crimson-bright': '#FF2E2E',
                'king-gold': '#F5A623',
                'king-cobalt': '#3B82F6',
                'king-emerald': '#22C55E',
                'king-muted': 'rgba(255,255,255,0.35)',
                'king-faint': 'rgba(255,255,255,0.08)',

                // Gradient System
                'gradient-crimson': 'linear-gradient(135deg,#DC2020,#FF6B35)',
                'gradient-king': 'linear-gradient(135deg,var(--king-crimson),var(--king-gold))',
                'gradient-cobalt': 'linear-gradient(135deg,var(--king-cobalt),var(--king-crimson))',
                'gradient-emerald': 'linear-gradient(135deg,var(--king-emerald),var(--king-cobalt))',

                // Glass Effects
                'glass-bg': 'rgba(10,10,22,0.6)',
                'glass-border': 'rgba(255,255,255,0.05)',
                'glass-shadow': '0 8px 32px 0 rgba(0,0,0,0.37)',
            },

            // Advanced Typography System
            fontFamily: {
                'king': ['Space Grotesk', 'system-ui', 'sans-serif'],
                'display': ['Inter', 'system-ui', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },

            // Responsive Typography Scale
            fontSize: {
                'king-hero': ['56px', {lineHeight: '1', letterSpacing: '-1.5px', fontWeight: '900'}],
                'king-h1': ['28px', {lineHeight: '1.1', letterSpacing: '-0.5px', fontWeight: '800'}],
                'king-h2': ['22px', {lineHeight: '1.2', letterSpacing: '-0.3px', fontWeight: '800'}],
                'king-body': ['14px', {lineHeight: '1.55'}],
                'king-small': ['11px', {letterSpacing: '0.12em', fontWeight: '700'}],
                'king-label': ['10px', {letterSpacing: '0.18em', fontWeight: '800'}],
            },

            // Advanced Spacing System
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
                '144': '36rem',
            },

            // Enhanced Border Radius
            borderRadius: {
                'king': '0.75rem',
                'none': '0',
                'sharp': '0',
            },

            // Advanced Box Shadow System
            boxShadow: {
                'king-glow': '0 0 20px rgba(220,32,32,0.3)',
                'king-gold': '0 4px 20px rgba(245,166,35,0.4)',
                'king-cobalt': '0 4px 20px rgba(59,130,246,0.4)',
                'king-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'king-dialog': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                'glass': '0 8px 32px 0 rgba(0,0,0,0.37)',
            },

            // Advanced Animation System
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'slide-left': 'slideLeft 0.3s ease-out',
                'slide-right': 'slideRight 0.3s ease-out',
                'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'pulse-king': 'pulseKing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 3s linear infinite',
                'bounce-king': 'bounceKing 1s infinite',
                'shimmer': 'shimmer 2s infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 3s ease-in-out infinite',
                'slide-up-hero': 'slideUpHero 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                'rotate-3d': 'rotate3d 8s linear infinite',
            },

            // Complex Keyframes
            keyframes: {
                fadeIn: {
                    '0%': {opacity: '0'},
                    '100%': {opacity: '1'},
                },
                slideUp: {
                    '0%': {transform: 'translateY(10px)', opacity: '0'},
                    '100%': {transform: 'translateY(0)', opacity: '1'},
                },
                slideDown: {
                    '0%': {transform: 'translateY(-10px)', opacity: '0'},
                    '100%': {transform: 'translateY(0)', opacity: '1'},
                },
                slideLeft: {
                    '0%': {transform: 'translateX(10px)', opacity: '0'},
                    '100%': {transform: 'translateX(0)', opacity: '1'},
                },
                slideRight: {
                    '0%': {transform: 'translateX(-10px)', opacity: '0'},
                    '100%': {transform: 'translateX(0)', opacity: '1'},
                },
                pulseKing: {
                    '0%, 100%': {transform: 'scale(1)', opacity: '1'},
                    '50%': {transform: 'scale(1.05)', opacity: '0.8'},
                },
                bounceKing: {
                    '0%, 80%, 100%': {transform: 'translateY(0)'},
                    '40%': {transform: 'translateY(-12px)'},
                },
                shimmer: {
                    '0%': {backgroundPosition: '-1000px 0'},
                    '100%': {backgroundPosition: '1000px 0'},
                },
                glow: {
                    '0%': {boxShadow: '0 0 5px rgba(220,32,32,0.5)'},
                    '50%': {boxShadow: '0 0 20px rgba(220,32,32,0.8)'},
                    '100%': {boxShadow: '0 0 30px rgba(220,32,32,1)'},
                },
                float: {
                    '0%, 100%': {transform: 'translateY(0px)'},
                    '50%': {transform: 'translateY(-10px)'},
                },
                slideUpHero: {
                    '0%': {transform: 'translateY(30px)', opacity: '0'},
                    '100%': {transform: 'translateY(0)', opacity: '1'},
                },
                scaleIn: {
                    '0%': {transform: 'scale(0.9)', opacity: '0'},
                    '100%': {transform: 'scale(1)', opacity: '1'},
                },
                rotate3d: {
                    '0%': {transform: 'rotateX(0deg) rotateY(0deg)'},
                    '100%': {transform: 'rotateX(360deg) rotateY(360deg)'},
                },
            },

            // Advanced Grid System
            gridTemplateColumns: {
                'king': 'repeat(auto-fit, minmax(280px, 1fr))',
                'king-dense': 'repeat(auto-fit, minmax(200px, 1fr))',
                'king-cards': 'repeat(auto-fill, minmax(300px, 1fr))',
                'king-profile': 'repeat(auto-fill, minmax(250px, 1fr))',
            },

            // Advanced Flex System
            flex: {
                'king-card': '1 1 300px',
                'king-profile': '0 1 auto',
                'king-grow': '1 1 0%',
            },

            // Advanced Aspect Ratios
            aspectRatio: {
                'king-card': '4/3',
                'king-hero': '16/9',
                'king-profile': '1/1',
                'king-banner': '3/1',
            },

            // Advanced Transforms
            transform: {
                'king-3d': 'perspective(1000px) rotateX(10deg) rotateY(10deg)',
                'king-flip': 'perspective(1000px) rotateY(180deg)',
                'king-slide': 'perspective(1000px) translateZ(100px)',
            },

            // Advanced Filters
            backdropBlur: {
                'king': '20px',
                'ultra': '40px',
            },

            // Advanced Transitions
            transitionProperty: {
                'king': 'all',
                'king-transform': 'transform, opacity',
                'king-colors': 'color, background-color, border-color',
            },

            transitionDuration: {
                'king-fast': '150ms',
                'king-normal': '300ms',
                'king-slow': '500ms',
                'king-ultra': '1000ms',
            },

            transitionTimingFunction: {
                'king': 'cubic-bezier(0.4, 0, 0.2, 1)',
                'king-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'king-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            },

            // Z-Index System
            zIndex: {
                'king-modal': '1000',
                'king-dropdown': '100',
                'king-sticky': '10',
                'king-base': '1',
                'king-bg': '-1',
            },

            // Advanced Cursor
            cursor: {
                'king-pointer': 'pointer',
                'king-grab': 'grab',
                'king-grabbing': 'grabbing',
                'king-not-allowed': 'not-allowed',
            },

            // Advanced Object Position
            objectPosition: {
                'king-top': 'top',
                'king-center': 'center',
                'king-bottom': 'bottom',
            },

            // Advanced List Styles
            listStyleType: {
                'king-none': 'none',
                'king-disc': 'disc',
                'king-circle': 'circle',
                'king-square': 'square',
            },

            // Advanced Text Decoration
            textDecorationStyle: {
                'king-solid': 'solid',
                'king-double': 'double',
                'king-dotted': 'dotted',
                'king-dashed': 'dashed',
                'king-wavy': 'wavy',
            },

            // Advanced Letter Spacing
            letterSpacing: {
                'king-tight': '-0.05em',
                'king-normal': '0',
                'king-wide': '0.025em',
                'king-wider': '0.05em',
                'king-widest': '0.1em',
            },

            // Advanced Line Height
            lineHeight: {
                'king-none': '1',
                'king-tight': '1.25',
                'king-snug': '1.375',
                'king-normal': '1.5',
                'king-relaxed': '1.625',
                'king-loose': '2',
            },

            // Advanced Font Weight
            fontWeight: {
                'king-thin': '100',
                'king-extralight': '200',
                'king-light': '300',
                'king-normal': '400',
                'king-medium': '500',
                'king-semibold': '600',
                'king-bold': '700',
                'king-extrabold': '800',
                'king-black': '900',
            },
        },
    },
    plugins: [],
}

export default config