import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        verified: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        // REGAL THEMED VARIANTS
        royal:
          "border-2 border-purple-600 dark:border-purple-400 bg-linear-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white shadow-lg shadow-purple-500/50",
        gold:
          "border-2 border-amber-500 bg-linear-to-r from-amber-400 via-yellow-500 to-amber-400 text-gray-900 shadow-lg shadow-amber-500/50 font-bold",
        crown:
          "border-2 border-yellow-600 bg-linear-to-br from-yellow-400 via-amber-500 to-yellow-600 text-gray-900 shadow-xl shadow-yellow-500/50 font-bold",
        diamond:
          "border-2 border-cyan-400 bg-linear-to-r from-cyan-200 via-blue-200 to-cyan-200 dark:from-cyan-800 dark:via-blue-800 dark:to-cyan-800 text-cyan-900 dark:text-cyan-100 shadow-lg shadow-cyan-400/50",
        ruby:
          "border-2 border-red-600 bg-linear-to-r from-red-600 via-rose-600 to-red-600 text-white shadow-lg shadow-red-500/50",
        emerald:
          "border-2 border-emerald-600 bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/50",
        platinum:
          "border-2 border-gray-400 bg-linear-to-r from-gray-300 via-gray-100 to-gray-300 dark:from-gray-700 dark:via-gray-500 dark:to-gray-700 text-gray-900 dark:text-white shadow-lg shadow-gray-400/50",
        legendary:
          "border-2 border-pink-500 bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-xl shadow-pink-500/50 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
