"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

/**
 * HoverCard component - Information card that appears on hover
 * Built on Radix UI HoverCard primitive with smooth animations
 * Shows contextual information when hovering over trigger elements
 * 
 * @example
 * <HoverCard>
 *   <HoverCardTrigger>Hover me</HoverCardTrigger>
 *   <HoverCardContent>Additional information</HoverCardContent>
 * </HoverCard>
 */
const HoverCard = HoverCardPrimitive.Root

/**
 * HoverCardTrigger - Element that triggers hover card display
 * Typically used with interactive elements like buttons or links
 */
const HoverCardTrigger = HoverCardPrimitive.Trigger

/**
 * HoverCardContent component - Content container for hover card
 * Portal-rendered with animations and automatic positioning
 * 
 * @param props - Radix HoverCardPrimitive.Content props (align, sideOffset, etc.)
 * @param ref - Forward ref to underlying content element
 * @returns React component with hover card styling
 */
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-hover-card-content-transform-origin]",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
