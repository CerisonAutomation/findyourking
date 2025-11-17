import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea component - Multi-line text input field
 * Provides accessible, styled form input for longer text
 * Features focus ring, disabled states, and responsive sizing
 * 
 * @param props - Standard HTML textarea attributes (placeholder, value, onChange, etc.)
 * @param ref - Forward ref to underlying textarea element
 * @returns React textarea component with applied styling
 * 
 * @example
 * <Textarea placeholder="Enter your message..." value={text} onChange={e => setText(e.target.value)} />
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }