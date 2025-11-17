import { cn } from "@/lib/utils"

/**
 * Skeleton component - Loading placeholder element
 * Displays animated pulse while content is loading
 * Useful for skeleton screens and content loaders
 * 
 * @param props - Standard HTML div attributes (className, style, etc.)
 * @returns React div component with loading animation
 * 
 * @example
 * <div className="space-y-2">
 *   <Skeleton className="h-12 w-12 rounded-full" />
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-4 w-3/4" />
 * </div>
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
