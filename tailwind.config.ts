import type { Config } from "tailwindcss";

export default {
  darkMode: ["class", "class"],
  content: [
    "./{app,pages,components,src}/**/*.{js,ts,jsx,tsx,mdx}",
    "./{app,pages,components,src}/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx,mdx}", // Catch files directly in the root
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		animation: {
  			'slide-up': 'slideUp 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
  			'slide-down': 'slideDown 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
  			'fade-in': 'fadeIn 0.3s ease-in',
  			'fade-out': 'fadeOut 0.3s ease-out',
  			'shimmer': 'shimmer 2s linear infinite',
  			'mesh': 'mesh 8s ease-in-out infinite',
  			'float': 'float 6s ease-in-out infinite',
  		},
  		keyframes: {
  			slideUp: {
  				'0%': { opacity: '0', transform: 'translateY(20px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			slideDown: {
  				'0%': { opacity: '0', transform: 'translateY(-20px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			fadeOut: {
  				'0%': { opacity: '1' },
  				'100%': { opacity: '0' },
  			},
  			shimmer: {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' },
  			},
  			mesh: {
  				'0%, 100%': { transform: 'translate(0, 0) scale(1)' },
  				'33%': { transform: 'translate(30px, -50px) scale(1.1)' },
  				'66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
  			},
  			float: {
  				'0%, 100%': { transform: 'translateY(0px) rotateZ(0deg)' },
  				'50%': { transform: 'translateY(-20px) rotateZ(5deg)' },
  			},
  		},
  		boxShadow: {
  			'glow-primary': '0 0 20px rgba(var(--primary), 0.3)',
  			'glow-accent': '0 0 20px rgba(var(--accent), 0.3)',
  			'3d-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.1)',
  			'3d-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  			'3d-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  			'3d-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  			'3d-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  		},
  		backdropBlur: {
  			'glass': '20px',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
