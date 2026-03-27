'use client';

import React, {useState} from 'react';
import Link from 'next/link';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Clock, Heart, MapPin, MessageCircle, Sparkles, Verified,} from 'lucide-react';
import {cn} from '@/lib/utils';
import {FavoriteButton} from './FavoriteButton';

interface ProfileCardProps {
    profile: {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        bio: string | null;
        birth_date: string;
        location_city: string | null;
        location_state: string | null;
        interests: string[];
        is_verified: boolean;
        is_online: boolean;
        last_seen: string | null;
        is_premium: boolean;
    };
    className?: string;
    variant?: 'default' | 'compact' | 'featured';
    onLike?: (id: string) => void;
    onMessage?: (id: string) => void;
}

function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function formatLocation(city: string | null, state: string | null): string | null {
    if (!city && !state) return null;
    if (city && state) return `${city}, ${state}`;
    return city || state;
}

function formatLastSeen(lastSeen: string | null, isOnline: boolean): string {
    if (isOnline) return 'Online now';
    if (!lastSeen) return 'Offline';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function ProfileCard({
                                profile,
                                className,
                                variant = 'default',
                                onLike,
                                onMessage,
                            }: ProfileCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const age = calculateAge(profile.birth_date);
    const location = formatLocation(profile.location_city, profile.location_state);
    const lastSeen = formatLastSeen(profile.last_seen, profile.is_online);

    return (
        <Card
            className={cn(
                'group relative overflow-hidden transition-all duration-300 hover:shadow-lg',
                variant === 'featured' && 'border-primary/30 ring-1 ring-primary/10',
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Cover / Avatar area */}
            <div className="relative">
                <div
                    className="aspect-[4/3] bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 relative overflow-hidden">
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.display_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
              <span className="text-5xl font-bold text-primary/30">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
                        </div>
                    )}

                    {/* Online indicator */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                        {profile.is_online && (
                            <span
                                className="flex items-center gap-1.5 rounded-full bg-green-500/90 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"/>
                Online
              </span>
                        )}
                        {profile.is_premium && (
                            <span
                                className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-xs font-medium text-white">
                <Sparkles className="h-3 w-3"/>
                Premium
              </span>
                        )}
                    </div>

                    {/* Favorite button */}
                    <div
                        className={cn(
                            'absolute top-3 right-3 transition-opacity',
                            isHovered ? 'opacity-100' : 'opacity-0'
                        )}
                    >
                        <FavoriteButton userId={profile.id}/>
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent"/>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Name and age */}
                <div className="flex items-center gap-2 mb-1">
                    <Link href={`/profile/${profile.username}`}>
                        <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                            {profile.display_name}, {age}
                        </h3>
                    </Link>
                    {profile.is_verified && (
                        <Verified className="h-4 w-4 text-blue-500 fill-blue-500"/>
                    )}
                </div>

                {/* Location and last seen */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    {location && (
                        <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5"/>
                            {location}
            </span>
                    )}
                    <span
                        className={cn(
                            'flex items-center gap-1',
                            profile.is_online ? 'text-green-500' : 'text-muted-foreground'
                        )}
                    >
            <Clock className="h-3.5 w-3.5"/>
                        {lastSeen}
          </span>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{profile.bio}</p>
                )}

                {/* Interests */}
                {profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {profile.interests.slice(0, 4).map((interest) => (
                            <span
                                key={interest}
                                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                            >
                {interest}
              </span>
                        ))}
                        {profile.interests.length > 4 && (
                            <span
                                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                +{profile.interests.length - 4}
              </span>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onLike?.(profile.id)}
                    >
                        <Heart className="mr-1.5 h-4 w-4"/>
                        Like
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onMessage?.(profile.id)}
                    >
                        <MessageCircle className="mr-1.5 h-4 w-4"/>
                        Message
                    </Button>
                </div>
            </div>
        </Card>
    );
}
