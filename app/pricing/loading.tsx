/**
 * PRICING PAGE LOADING SKELETON - 150/100 TIER
 * Per WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
 * Per UX Best Practices: Loading states prevent user confusion
 */

import { SkeletonCard, SkeletonText } from "@/components/ui/skeleton-enhanced";

export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="h-12 bg-muted rounded-lg w-96 mx-auto animate-pulse" />
          <div className="h-6 bg-muted rounded-lg w-64 mx-auto animate-pulse" />
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="space-y-4 mt-12">
          <div className="h-8 bg-muted rounded-lg w-32 animate-pulse" />
          <SkeletonText lines={6} />
        </div>
      </div>
    </div>
  );
}
