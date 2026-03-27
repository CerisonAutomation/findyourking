'use client'

import {useState} from 'react'
import {Card, CardFooter} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {cn} from '@/lib/utils'
import {
    Bookmark,
    Calendar,
    Clock,
    Crown,
    Eye,
    Heart,
    MapPin,
    MoreHorizontal,
    Share2,
    Shield,
    Star,
    Users
} from 'lucide-react'

interface AdvancedCardProps {
    title: string
    description: string
    image?: string
    avatar?: string
    badges?: string[]
    stats?: {
        likes?: number
        views?: number
        distance?: number
        attendees?: number
        rating?: number
    }
    actions?: {
        primary?: { label: string; onClick: () => void; icon?: React.ComponentType<{ className?: string }> }
        secondary?: { label: string; onClick: () => void; icon?: React.ComponentType<{ className?: string }> }
        tertiary?: { label: string; onClick: () => void; icon?: React.ComponentType<{ className?: string }> }
    }
    metadata?: {
        location?: string
        date?: string
        author?: string
        verified?: boolean
        premium?: boolean
        lastActive?: string
    }
    variant?: 'default' | 'profile' | 'event' | 'message'
    hover?: boolean
    aspectRatio?: 'square' | 'video' | 'portrait'
    className?: string
}

export function AdvancedCard({
                                 title,
                                 description,
                                 image,
                                 avatar,
                                 badges,
                                 stats,
                                 actions,
                                 metadata,
                                 variant = 'default',
                                 hover = true,
                                 aspectRatio = 'portrait',
                                 className
                             }: AdvancedCardProps) {
    const [isLiked, setIsLiked] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    const handleLike = () => setIsLiked(!isLiked)
    const handleBookmark = () => setIsBookmarked(!isBookmarked)

    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case 'square':
                return 'aspect-square'
            case 'video':
                return 'aspect-video'
            case 'portrait':
            default:
                return 'aspect-[3/4]'
        }
    }

    const getVariantStyles = () => {
        switch (variant) {
            case 'profile':
                return 'border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700'
            case 'event':
                return 'border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700'
            case 'message':
                return 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
            default:
                return 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }
    }

    return (
        <Card className={cn(
            'group relative overflow-hidden transition-all duration-300',
            hover && 'hover:shadow-lg hover:-translate-y-1',
            getVariantStyles(),
            className
        )}>
            {/* Image Section */}
            {image && (
                <div className="relative overflow-hidden">
                    <div className={cn('relative', getAspectRatioClass())}>
                        <img
                            src={image}
                            alt={title}
                            className={cn(
                                'object-cover transition-transform duration-300',
                                hover && 'group-hover:scale-105',
                                !imageLoaded && 'blur-sm'
                            )}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageLoaded(false)}
                        />

                        {/* Overlay Actions */}
                        <div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute top-2 right-2 flex gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 border-white/20 hover:border-white/40"
                                    onClick={handleBookmark}
                                >
                                    <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current text-white')}/>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 border-white/20 hover:border-white/40"
                                >
                                    <Share2 className="h-4 w-4"/>
                                </Button>
                            </div>

                            {stats?.views && (
                                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-sm">
                                    <Eye className="h-4 w-4"/>
                                    {stats.views.toLocaleString()}
                                </div>
                            )}
                        </div>

                        {/* Verification Badge */}
                        {metadata?.verified && (
                            <div className="absolute top-2 left-2">
                                <div
                                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                    <Shield className="h-4 w-4 text-white"/>
                                </div>
                            </div>
                        )}

                        {/* Premium Badge */}
                        {metadata?.premium && (
                            <div className="absolute top-2 left-2">
                                <div
                                    className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                    <Crown className="h-4 w-4 text-white"/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content Section */}
            <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {avatar && (
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={avatar} alt={metadata?.author}/>
                                    <AvatarFallback className="text-xs">
                                        {metadata?.author?.charAt(0) || title.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            <h3 className="font-semibold text-lg truncate">{title}</h3>
                            {metadata?.premium && (
                                <Badge variant="secondary"
                                       className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                                    Premium
                                </Badge>
                            )}
                        </div>

                        {metadata?.author && (
                            <p className="text-sm text-muted-foreground">by {metadata.author}</p>
                        )}
                    </div>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="h-4 w-4"/>
                    </Button>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {description}
                </p>

                {/* Badges */}
                {badges && badges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {badges.slice(0, 3).map((badge, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {badge}
                            </Badge>
                        ))}
                        {badges.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{badges.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Stats */}
                {stats && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                            {stats.likes && (
                                <div className="flex items-center gap-1">
                                    <Heart className={cn('h-4 w-4', isLiked && 'fill-current text-rose-500')}/>
                                    {stats.likes.toLocaleString()}
                                </div>
                            )}
                            {stats.distance && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4"/>
                                    {stats.distance} km
                                </div>
                            )}
                            {stats.attendees && (
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4"/>
                                    {stats.attendees}
                                </div>
                            )}
                            {stats.rating && (
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400"/>
                                    {stats.rating.toFixed(1)}
                                </div>
                            )}
                        </div>

                        {metadata?.lastActive && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4"/>
                                {metadata.lastActive}
                            </div>
                        )}
                    </div>
                )}

                {/* Metadata */}
                {metadata && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-3">
                        {metadata.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3"/>
                                {metadata.location}
                            </div>
                        )}
                        {metadata.date && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3"/>
                                {metadata.date}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            {actions && (
                <CardFooter className="p-4 pt-0 gap-2">
                    {actions.primary && (
                        <Button
                            onClick={actions.primary.onClick}
                            className="flex-1"
                            size="sm"
                        >
                            {actions.primary.icon && <actions.primary.icon className="h-4 w-4 mr-2"/>}
                            {actions.primary.label}
                        </Button>
                    )}
                    {actions.secondary && (
                        <Button
                            onClick={actions.secondary.onClick}
                            variant="outline"
                            size="sm"
                        >
                            {actions.secondary.icon && <actions.secondary.icon className="h-4 w-4 mr-2"/>}
                            {actions.secondary.label}
                        </Button>
                    )}
                    {actions.tertiary && (
                        <Button
                            onClick={actions.tertiary.onClick}
                            variant="ghost"
                            size="sm"
                        >
                            {actions.tertiary.icon && <actions.tertiary.icon className="h-4 w-4 mr-2"/>}
                            {actions.tertiary.label}
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    )
}

// Specialized card variants
export function ProfileCard(props: Omit<AdvancedCardProps, 'variant'>) {
    return <AdvancedCard {...props} variant="profile"/>
}

export function EventCard(props: Omit<AdvancedCardProps, 'variant'>) {
    return <AdvancedCard {...props} variant="event"/>
}

export function MessageCard(props: Omit<AdvancedCardProps, 'variant'>) {
    return <AdvancedCard {...props} variant="message"/>
}
