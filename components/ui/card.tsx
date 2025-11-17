import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card component - Container for content with consistent styling
 * Serves as a wrapper for CardHeader, CardContent, and CardFooter
 * Provides rounded borders, shadows, and semantic theming
 * 
 * @param props - Standard HTML div attributes
 * @param ref - Forward ref to underlying div element
 * @returns React div component styled as card container
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * CardHeader component - Header section of a Card
 * Provides padding and typography styling for card headers
 * Used for titles or introductory content within a card
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * CardTitle component - Title text within CardHeader
 * Applies semibold font weight and tight letter spacing
 * 
 * @param props - Standard HTML div attributes
 * @param ref - Forward ref to underlying div element
 * @returns React div component styled as card title
 */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * CardDescription component - Descriptive text within CardHeader
 * Uses muted color and reduced font size for secondary information
 * 
 * @param props - Standard HTML div attributes
 * @param ref - Forward ref to underlying div element
 * @returns React div component styled as card description
 */
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * CardContent component - Main content area of a Card
 * Provides padding for body content between header and footer
 * 
 * @param props - Standard HTML div attributes
 * @param ref - Forward ref to underlying div element
 * @returns React div component styled as card content container
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * CardFooter component - Footer section of a Card
 * Typically contains actions or secondary information
 * Aligns children to the right with flex layout
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
