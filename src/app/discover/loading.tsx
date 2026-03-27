import {Card, CardContent} from '@/components/ui/card'
import {Skeleton} from '@/components/ui/skeleton'

export default function DiscoverLoading() {
    return (
        <div className="min-h-screen bg-king-bg">
            {/* Header Skeleton */}
            <div className="bg-king-bg-1 border-b border-king-border px-4 py-3">
                <div className="flex items-center justify-between max-w-128 mx-auto">
                    <Skeleton className="h-8 w-24 bg-king-bg-2"/>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-20 bg-king-bg-2"/>
                        <Skeleton className="h-8 w-20 bg-king-bg-2"/>
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="max-w-128 mx-auto p-4">
                {/* Swipe View Skeleton */}
                <div className="relative h-[600px] max-w-md mx-auto">
                    <Card className="h-full overflow-hidden bg-king-bg-1 border-king-border">
                        {/* Image Skeleton */}
                        <div className="relative h-3/4 bg-king-bg-2">
                            <Skeleton className="w-full h-full bg-king-bg-3"/>
                            
                            {/* Online Status Badge Skeleton */}
                            <div className="absolute top-4 right-4">
                                <Skeleton className="h-6 w-16 bg-king-bg-3"/>
                            </div>

                            {/* Profile Info Overlay Skeleton */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <Skeleton className="h-8 w-48 mb-2 bg-king-bg-3"/>
                                <Skeleton className="h-4 w-32 bg-king-bg-3"/>
                            </div>
                        </div>

                        {/* Info Section Skeleton */}
                        <CardContent className="p-4">
                            <Skeleton className="h-4 w-full mb-2 bg-king-bg-2"/>
                            <Skeleton className="h-4 w-3/4 mb-3 bg-king-bg-2"/>
                            
                            <div className="flex flex-wrap gap-1">
                                <Skeleton className="h-6 w-16 bg-king-bg-2"/>
                                <Skeleton className="h-6 w-20 bg-king-bg-2"/>
                                <Skeleton className="h-6 w-14 bg-king-bg-2"/>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons Skeleton */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full bg-king-bg-2"/>
                        <Skeleton className="h-16 w-16 rounded-full bg-king-bg-2"/>
                        <Skeleton className="h-16 w-16 rounded-full bg-king-bg-2"/>
                    </div>
                </div>
            </div>
        </div>
    )
}