'use client';

import React, {useState} from 'react';
import {Heart} from 'lucide-react';
import {cn} from '@/lib/utils';

interface FavoriteButtonProps {
    userId: string;
    isFavorited?: boolean;
    onToggle?: (userId: string, isFavorited: boolean) => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({
                                   userId,
                                   isFavorited = false,
                                   onToggle,
                                   className,
                                   size = 'md',
                               }: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(isFavorited);
    const [isAnimating, setIsAnimating] = useState(false);

    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
    };

    const iconSizes = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsAnimating(true);
        const newState = !isFavorite;
        setIsFavorite(newState);
        onToggle?.(userId, newState);

        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                'flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200',
                sizeClasses[size],
                isFavorite
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                    : 'bg-black/30 text-white hover:bg-black/50',
                isAnimating && 'scale-125',
                className
            )}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart
                className={cn(
                    iconSizes[size],
                    'transition-transform duration-200',
                    isFavorite && 'fill-red-500'
                )}
            />
        </button>
    );
}
