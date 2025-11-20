/**
 * MODULAR ROUTE SKELETON LOADERS - PER ROUTE
 * Doc Verified: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 * 
 * Each skeleton loader is optimized for its specific route's content type
 * and uses Suspense boundaries for proper streaming
 */

"use client";

import {
  SkeletonDashboardStats,
  SkeletonTable,
  SkeletonMatchCard,
  SkeletonChatMessage,
  SkeletonProfile,
  SkeletonCard,
  SkeletonText,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonGallery,
} from "@/components/ui/skeleton-enhanced";

/**
 * Dashboard Loading - Stats cards + activity feed
 */
export function DashboardLoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats Cards */}
      <SkeletonDashboardStats />

      {/* Activity Feed */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Matches Discovery Loading - Grid of match cards
 */
export function MatchesLoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-24 bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Match Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonMatchCard key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Chat Loading - Message list + input
 */
export function ChatLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4 space-y-3">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonChatMessage key={i} />
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t p-4 space-y-3">
        <div className="h-12 w-full bg-muted rounded-lg" />
        <div className="flex gap-2">
          <SkeletonButton />
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>
    </div>
  );
}

/**
 * Profile Loading - User profile with sections
 */
export function ProfileLoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Profile Header */}
      <SkeletonProfile />

      {/* Photos Section */}
      <div className="space-y-4">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <SkeletonGallery count={4} columns={2} />
      </div>

      {/* About Section */}
      <div className="space-y-4">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <SkeletonText lines={4} />
      </div>

      {/* Preferences Section */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <SkeletonTable rows={5} columns={2} />
      </div>
    </div>
  );
}

/**
 * Authentication Loading - Login/Signup form
 */
export function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-muted">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />

        {/* Social Auth */}
        <div className="space-y-3 pt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-muted" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-sm text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Footer Link */}
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Settings Loading - Settings form with sections
 */
export function SettingsLoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>

      {/* Settings Sections */}
      <div className="space-y-8 max-w-2xl">
        {[1, 2, 3, 4].map((section) => (
          <div key={section} className="space-y-4 pb-6 border-b last:border-b-0">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex gap-3">
        <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}