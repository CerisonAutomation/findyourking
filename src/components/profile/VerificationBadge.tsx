import React from 'react';
import {BadgeCheck} from 'lucide-react';
import {cn} from '@/lib/utils';

interface VerificationBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    type?: 'photo' | 'identity' | 'social';
    className?: string;
    showLabel?: boolean;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
};

const colorClasses = {
    photo: 'text-blue-500 fill-blue-500',
    identity: 'text-green-500 fill-green-500',
    social: 'text-purple-500 fill-purple-500',
};

const labelMap = {
    photo: 'Photo Verified',
    identity: 'ID Verified',
    social: 'Social Verified',
};

export function VerificationBadge({
                                      size = 'md',
                                      type = 'photo',
                                      className,
                                      showLabel = false,
                                  }: VerificationBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1',
                className
            )}
            title={labelMap[type]}
        >
      <BadgeCheck className={cn(sizeClasses[size], colorClasses[type])}/>
            {showLabel && (
                <span className={cn(
                    'text-xs font-medium',
                    type === 'photo' && 'text-blue-500',
                    type === 'identity' && 'text-green-500',
                    type === 'social' && 'text-purple-500',
                )}>
          {labelMap[type]}
        </span>
            )}
    </span>
    );
}
