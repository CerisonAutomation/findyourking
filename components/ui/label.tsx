"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Label variants using CVA (Class Variance Authority)
 * Applies consistent styling for form labels:
 * - Small font size for secondary text
 * - Semibold weight for emphasis
 * - Disabled opacity when paired with disabled inputs (peer-disabled)
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

/**
 * Label component - Accessible form label element
 * Built on Radix UI Label primitive for proper semantic HTML
 * Automatically handles disabled state styling when associated input is disabled
 * 
 * @param props - Radix LabelPrimitive.Root props (htmlFor, etc.)
 * @param ref - Forward ref to underlying label element
 * @returns React label component with applied styling
 * 
 * @example
 * <Label htmlFor="email">Email Address</Label>
 * <Input id="email" type="email" />
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
