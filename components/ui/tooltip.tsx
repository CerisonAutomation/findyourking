"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

/**
 * TooltipProvider - Context provider for tooltip accessibility
 * Manages tooltip delay and accessibility features
 */
const TooltipProvider = TooltipPrimitive.Provider

/**
 * Tooltip component - Small contextual information overlay
 * Built on Radix UI Tooltip primitive with accessibility support
 * Shows brief information when hovering over elements
 * 
 * @example
 * <TooltipProvider>
 *   <Tooltip>
 *     <TooltipTrigger>Hover me</TooltipTrigger>
 *     <TooltipContent>Tooltip text</TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 */
const Tooltip = TooltipPrimitive.Root

/**
 * TooltipTrigger - Element that triggers tooltip display
 * Typically used with interactive elements
 */
const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * TooltipContent component - Content container for tooltip
 * Portal-rendered with animations and automatic positioning
 * 
 * @param props - Radix TooltipPrimitive.Content props (sideOffset, etc.)
 * @param ref - Forward ref to underlying content element
 * @returns React component with tooltip styling
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
