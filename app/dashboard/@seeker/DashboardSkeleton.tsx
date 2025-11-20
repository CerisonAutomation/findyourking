import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <Skeleton className="h-12 w-96 mb-4 bg-white/10" />
          <Skeleton className="h-6 w-80 bg-white/10" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2 bg-white/10" />
                <Skeleton className="h-4 w-24 bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Section */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-48 bg-white/10" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4 bg-white/10" />
                <Skeleton className="h-4 w-3/4 bg-white/10" />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-white/10" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-2 bg-white/10" />
                      <Skeleton className="h-3 w-24 bg-white/10" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-white/10" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-white/10 rounded-lg" />
                ))}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Skeleton className="h-6 w-28 bg-white/10" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-3 w-3/4 bg-white/10" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}