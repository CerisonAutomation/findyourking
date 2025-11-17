"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Dialog component - Container for modal dialog functionality
 * Built on Radix UI Dialog primitive with focus management and escaping
 * Supports controlled and uncontrolled usage
 * 
 * @example
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogTrigger>Open Dialog</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader><DialogTitle>Dialog Title</DialogTitle></DialogHeader>
 *   </DialogContent>
 * </Dialog>
 */
const Dialog = DialogPrimitive.Root

/**
 * DialogTrigger - Button element that opens the dialog
 * Works as a direct child of Dialog root
 */
const DialogTrigger = DialogPrimitive.Trigger

/**
 * DialogPortal - Portal container for dialog content (outside DOM tree)
 * Renders dialog at document body to avoid stacking context issues
 */
const DialogPortal = DialogPrimitive.Portal

/**
 * DialogClose - Close button element within dialog
 * Triggers close when clicked or can be used programmatically
 */
const DialogClose = DialogPrimitive.Close

/**
 * DialogOverlay component - Backdrop overlay behind dialog
 * Shows dark semi-transparent background with fade animation
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * DialogContent component - Main dialog container with styling
 * Center-positioned modal with animations and close button
 * Contains slots for header, content, and footer
 * 
 * @param props - Radix DialogPrimitive.Content props
 * @param ref - Forward ref to underlying dialog content element
 * @returns React component with dialog styling
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

/**
 * DialogHeader - Container for dialog header content
 * Typically holds DialogTitle and DialogDescription
 * Responsive text alignment (center on mobile, left on desktop)
 */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

/**
 * DialogFooter - Container for dialog action buttons
 * Flex row layout with right-aligned buttons on desktop
 * Column layout on mobile with reversed stacking
 */
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

/**
 * DialogTitle component - Heading for dialog
 * Semantic title element for dialog content
 * Typically placed in DialogHeader
 * 
 * @param props - Radix DialogPrimitive.Title props
 * @param ref - Forward ref to underlying heading element
 * @returns React heading component styled as dialog title
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

/**
 * DialogDescription component - Description text for dialog
 * Provides supplementary information about dialog purpose
 * Typically placed in DialogHeader below DialogTitle
 * 
 * @param props - Radix DialogPrimitive.Description props
 * @param ref - Forward ref to underlying element
 * @returns React component styled as dialog description
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
