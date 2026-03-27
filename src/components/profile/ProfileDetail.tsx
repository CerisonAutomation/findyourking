'use client';

import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {
    ArrowLeft,
    Baby,
    Block,
    Briefcase,
    Calendar,
    Cigarette,
    Flag,
    Globe,
    GraduationCap,
    Heart,
    MapPin,
    MessageCircle,
    PawPrint,
    Ruler,
    Share2,
    Sparkles,
    Wine,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {VerificationBadge} from './VerificationBadge';
import {FavoriteButton} from '@/components/matching/FavoriteButton';
import {PhotoGallery} from './PhotoGallery';
import type {Profile} from '@/types/database';

interface ProfileDetailProps {
    profile: Profile;
    photos: { id: string; url: string; is_primary: boolean }[];
    currentUserId?: string;
    onLike?: () => void;
    onMessage?: () => void;
    onBack?: () => void;
    className?: string;
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

const lifestyleLabels: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
    smoking: {icon: Cigarette, label: 'Smoking'},
    drinking: {icon: Wine, label: 'Drinking'},
    children: {icon: Baby, label: 'Children'},
    pets: {icon: PawPrint, label: 'Pets'},
};

export function ProfileDetail({
                                  profile,
                                  photos,
                                  currentUserId,
                                  onLike,
                                  onMessage,
                                  onBack,
                                  className,
                              }: ProfileDetailProps) {
    const [showAllInterests, setShowAllInterests] = useState(false);
    const age = calculateAge(profile.birth_date);
    const isOwnProfile = currentUserId === profile.user_id;
    const location = [profile.location_city, profile.location_state, profile.location_country]
        .filter(Boolean)
        .join(', ');

    return (
        <div className={cn('max-w-2xl mx-auto', className)}>
            {/* Header actions */}
            <div className="flex items-center justify-between mb-4">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5"/>
                    </Button>
                )}
                <div className="flex items-center gap-2">
                    {!isOwnProfile && (
                        <>
                            <FavoriteButton userId={profile.user_id} size="md"/>
                            <Button variant="ghost" size="icon">
                                <Share2 className="h-5 w-5"/>
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Flag className="h-5 w-5"/>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Photo gallery */}
            <PhotoGallery photos={photos} displayName={profile.display_name}/>

            {/* Profile info */}
            <div className="mt-6 space-y-6">
                {/* Name and basics */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold">
                            {profile.display_name}, {age}
                        </h1>
                        {profile.is_verified && <VerificationBadge size="md"/>}
                        {profile.is_premium && (
                            <span
                                className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-xs font-medium text-white">
                <Sparkles className="h-3 w-3"/>
                Premium
              </span>
                        )}
                    </div>
                    {profile.pronouns && (
                        <p className="text-sm text-muted-foreground">{profile.pronouns}</p>
                    )}
                    {location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4"/>
                            <span>{location}</span>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                {!isOwnProfile && (
                    <div className="flex gap-3">
                        <Button className="flex-1" onClick={onLike}>
                            <Heart className="mr-2 h-4 w-4"/>
                            Like
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={onMessage}>
                            <MessageCircle className="mr-2 h-4 w-4"/>
                            Message
                        </Button>
                    </div>
                )}

                {/* Bio */}
                {profile.bio && (
                    <div>
                        <h2 className="font-semibold mb-2">About</h2>
                        <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                    </div>
                )}

                {/* Basic info */}
                <div>
                    <h2 className="font-semibold mb-3">Basics</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {profile.occupation && (
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                                <Briefcase className="h-4 w-4 text-muted-foreground"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Occupation</p>
                                    <p className="text-sm font-medium">{profile.occupation}</p>
                                </div>
                            </div>
                        )}
                        {profile.education && (
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                                <GraduationCap className="h-4 w-4 text-muted-foreground"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Education</p>
                                    <p className="text-sm font-medium">{profile.education}</p>
                                </div>
                            </div>
                        )}
                        {profile.height_cm && (
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                                <Ruler className="h-4 w-4 text-muted-foreground"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Height</p>
                                    <p className="text-sm font-medium">{profile.height_cm} cm</p>
                                </div>
                            </div>
                        )}
                        {profile.zodiac_sign && (
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                                <Calendar className="h-4 w-4 text-muted-foreground"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Zodiac</p>
                                    <p className="text-sm font-medium capitalize">{profile.zodiac_sign}</p>
                                </div>
                            </div>
                        )}
                        {profile.languages.length > 0 && (
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                                <Globe className="h-4 w-4 text-muted-foreground"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Languages</p>
                                    <p className="text-sm font-medium">{profile.languages.join(', ')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lifestyle */}
                {(profile.smoking || profile.drinking || profile.children || profile.pets) && (
                    <div>
                        <h2 className="font-semibold mb-3">Lifestyle</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(lifestyleLabels).map(([key, {icon: Icon, label}]) => {
                                const value = profile[key as keyof Profile] as string | null;
                                if (!value) return null;
                                return (
                                    <div key={key} className="flex items-center gap-2 rounded-lg bg-muted p-3">
                                        <Icon className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-medium capitalize">{value}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Interests */}
                {profile.interests.length > 0 && (
                    <div>
                        <h2 className="font-semibold mb-3">Interests</h2>
                        <div className="flex flex-wrap gap-2">
                            {(showAllInterests ? profile.interests : profile.interests.slice(0, 8)).map(
                                (interest) => (
                                    <span
                                        key={interest}
                                        className="rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium"
                                    >
                    {interest}
                  </span>
                                )
                            )}
                            {profile.interests.length > 8 && !showAllInterests && (
                                <button
                                    onClick={() => setShowAllInterests(true)}
                                    className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent"
                                >
                                    +{profile.interests.length - 8} more
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Relationship goals */}
                {profile.relationship_goals.length > 0 && (
                    <div>
                        <h2 className="font-semibold mb-3">Looking for</h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.relationship_goals.map((goal) => (
                                <span
                                    key={goal}
                                    className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium capitalize"
                                >
                  {goal}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Safety footer */}
                <div className="border-t border-border pt-4 pb-8">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Profile ID: {profile.id.slice(0, 8)}...
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                <Flag className="h-3 w-3"/>
                                Report
                            </button>
                            <button
                                className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80">
                                <Block className="h-3 w-3"/>
                                Block
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
