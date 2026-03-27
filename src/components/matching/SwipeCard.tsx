'use client';

import React, {useCallback, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Briefcase, GraduationCap, Heart, Info, MapPin, RotateCcw, Star, Verified, X,} from 'lucide-react';
import {cn} from '@/lib/utils';

interface SwipeCardProps {
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
        occupation: string | null;
        education: string | null;
    };
    onSwipe: (direction: 'left' | 'right' | 'up', profileId: string) => void;
    onUndo?: () => void;
    className?: string;
    isTop?: boolean;
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

export function SwipeCard({
                              profile,
                              onSwipe,
                              onUndo,
                              className,
                              isTop = false,
                          }: SwipeCardProps) {
    const [dragOffset, setDragOffset] = useState({x: 0, y: 0});
    const [isDragging, setIsDragging] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({x: 0, y: 0});

    const age = calculateAge(profile.birth_date);
    const location = [profile.location_city, profile.location_state].filter(Boolean).join(', ');

    const getRotation = useCallback(() => {
        return dragOffset.x * 0.1;
    }, [dragOffset.x]);

    const getOverlayOpacity = useCallback(() => {
        const threshold = 100;
        if (dragOffset.x > 0) {
            return Math.min(dragOffset.x / threshold, 1);
        }
        if (dragOffset.x < 0) {
            return Math.min(Math.abs(dragOffset.x) / threshold, 1);
        }
        if (dragOffset.y < 0) {
            return Math.min(Math.abs(dragOffset.y) / threshold, 1);
        }
        return 0;
    }, [dragOffset]);

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (!isTop) return;
            setIsDragging(true);
            startPos.current = {x: e.clientX, y: e.clientY};
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        },
        [isTop]
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            setDragOffset({x: dx, y: dy});

            if (dx > 80) setSwipeDirection('right');
            else if (dx < -80) setSwipeDirection('left');
            else if (dy < -80) setSwipeDirection('up');
            else setSwipeDirection(null);
        },
        [isDragging]
    );

    const handlePointerUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 100;
        if (dragOffset.x > threshold) {
            onSwipe('right', profile.id);
        } else if (dragOffset.x < -threshold) {
            onSwipe('left', profile.id);
        } else if (dragOffset.y < -threshold) {
            onSwipe('up', profile.id);
        } else {
            setDragOffset({x: 0, y: 0});
            setSwipeDirection(null);
        }
    }, [isDragging, dragOffset, onSwipe, profile.id]);

    const handleAction = (direction: 'left' | 'right' | 'up') => {
        setSwipeDirection(direction);
        setTimeout(() => {
            onSwipe(direction, profile.id);
        }, 200);
    };

    return (
        <div
            ref={cardRef}
            className={cn(
                'relative w-full max-w-sm select-none touch-none',
                isTop && 'cursor-grab active:cursor-grabbing',
                className
            )}
            style={{
                transform: isTop
                    ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg)`
                    : undefined,
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                zIndex: isTop ? 10 : 0,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <div
                className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-purple-600/20 shadow-xl">
                {/* Profile image */}
                {profile.avatar_url ? (
                    <img
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-purple-600/30">
            <span className="text-7xl font-bold text-white/30">
              {profile.display_name.charAt(0).toUpperCase()}
            </span>
                    </div>
                )}

                {/* Swipe overlays */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{opacity: swipeDirection === 'right' ? getOverlayOpacity() : 0}}
                >
                    <div className="rounded-xl border-4 border-green-500 bg-green-500/10 px-6 py-3 -rotate-12">
                        <span className="text-3xl font-bold text-green-500">LIKE</span>
                    </div>
                </div>
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{opacity: swipeDirection === 'left' ? getOverlayOpacity() : 0}}
                >
                    <div className="rounded-xl border-4 border-red-500 bg-red-500/10 px-6 py-3 rotate-12">
                        <span className="text-3xl font-bold text-red-500">NOPE</span>
                    </div>
                </div>
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{opacity: swipeDirection === 'up' ? getOverlayOpacity() : 0}}
                >
                    <div className="rounded-xl border-4 border-blue-500 bg-blue-500/10 px-6 py-3">
                        <span className="text-3xl font-bold text-blue-500">SUPER LIKE</span>
                    </div>
                </div>

                {/* Gradient overlay at bottom */}
                <div
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent"/>

                {/* Profile info overlay */}
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold">
                            {profile.display_name}, {age}
                        </h2>
                        {profile.is_verified && (
                            <Verified className="h-5 w-5 text-blue-400 fill-blue-400"/>
                        )}
                    </div>

                    {location && (
                        <div className="flex items-center gap-1 text-sm text-white/80 mb-2">
                            <MapPin className="h-3.5 w-3.5"/>
                            <span>{location}</span>
                        </div>
                    )}

                    {profile.occupation && (
                        <div className="flex items-center gap-1 text-sm text-white/80 mb-1">
                            <Briefcase className="h-3.5 w-3.5"/>
                            <span>{profile.occupation}</span>
                        </div>
                    )}

                    {profile.education && (
                        <div className="flex items-center gap-1 text-sm text-white/80 mb-1">
                            <GraduationCap className="h-3.5 w-3.5"/>
                            <span>{profile.education}</span>
                        </div>
                    )}

                    {/* Interests */}
                    {profile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {profile.interests.slice(0, 5).map((interest) => (
                                <span
                                    key={interest}
                                    className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs"
                                >
                  {interest}
                </span>
                            ))}
                        </div>
                    )}

                    {/* Bio / Details toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDetails(!showDetails);
                        }}
                        className="mt-3 flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
                    >
                        <Info className="h-3.5 w-3.5"/>
                        {showDetails ? 'Hide details' : 'Show details'}
                    </button>

                    {showDetails && profile.bio && (
                        <p className="mt-2 text-sm text-white/90 leading-relaxed">{profile.bio}</p>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4 mt-4">
                {onUndo && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                        onClick={onUndo}
                    >
                        <RotateCcw className="h-5 w-5"/>
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleAction('left')}
                >
                    <X className="h-7 w-7"/>
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500/10"
                    onClick={() => handleAction('up')}
                >
                    <Star className="h-5 w-5"/>
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-500/10"
                    onClick={() => handleAction('right')}
                >
                    <Heart className="h-7 w-7"/>
                </Button>
            </div>
        </div>
    );
}
