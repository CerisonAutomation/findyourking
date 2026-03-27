import * as React from "react"
import {Slot} from "@radix-ui/react-slot"
import {cva, type VariantProps} from "class-variance-authority"

import {cn} from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                // Professional variants
                primary: "bg-black text-cyan-400 border-2 border-cyan-400 hover:bg-gray-900 hover:shadow-[0_0_20px_rgba(0,212,255,0.5),0_0_40px_rgba(0,212,255,0.3)] font-bold tracking-wider uppercase",
                accent: "bg-transparent text-cyan-400 border-2 border-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,212,255,0.5),0_0_40px_rgba(0,212,255,0.3)] font-bold tracking-wider uppercase",
                professional: "bg-gray-900 text-cyan-300 border-2 border-gray-700 hover:bg-gray-800 hover:border-cyan-400 font-bold tracking-wider uppercase",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                xl: "h-14 rounded-lg px-12 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
    loading?: boolean
    icon?: React.ReactNode
    iconPosition?: 'left' | 'right'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
         className,
         variant,
         size,
         asChild = false,
         loading,
         icon,
         iconPosition = 'left',
         children,
         disabled,
         ...props
     }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({variant, size, className}), "relative group")}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {/* Background gradient overlay for professional variants */}
                {(variant === 'primary' || variant === 'accent' || variant === 'professional') && (
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-md"/>
                )}

                {/* Content */}
                <div className="relative flex items-center justify-center gap-2">
                    {loading && (
                        <div
                            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                    )}

                    {icon && iconPosition === 'left' && !loading && (
                        <span className="transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
                    )}

                    <span>{children}</span>

                    {icon && iconPosition === 'right' && !loading && (
                        <span className="transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
                    )}
                </div>
            </Comp>
        )
    }
)
Button.displayName = "Button"

export {Button, buttonVariants}