'use client'

import {useEffect, useState} from 'react'
import {cn} from '@/lib/utils'

interface ResponsiveGridProps {
    children: React.ReactNode
    className?: string
    cols?: {
        sm?: number
        md?: number
        lg?: number
        xl?: number
        '2xl'?: number
    }
    gap?: {
        sm?: number
        md?: number
        lg?: number
        xl?: number
        '2xl'?: number
    }
    autoFit?: boolean
    minItemWidth?: number
    maxItemWidth?: number
}

export function ResponsiveGrid({
                                   children,
                                   className,
                                   cols = {sm: 1, md: 2, lg: 3, xl: 4, '2xl': 5},
                                   gap = {sm: 4, md: 6, lg: 8, xl: 10, '2xl': 12},
                                   autoFit = false,
                                   minItemWidth = 250,
                                   maxItemWidth = 400
                               }: ResponsiveGridProps) {
    const [gridStyle, setGridStyle] = useState<React.CSSProperties>({})

    useEffect(() => {
        if (autoFit) {
            const updateGridStyle = () => {
                setGridStyle({
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}px, 100%), ${maxItemWidth}px))`,
                    gap: `${gap.sm || 4}px`,
                })
            }

            updateGridStyle()
            window.addEventListener('resize', updateGridStyle)
            return () => window.removeEventListener('resize', updateGridStyle)
        }
    }, [autoFit, minItemWidth, maxItemWidth, gap.sm])

    const gridClasses = cn(
        // Base grid
        'grid',

        // Responsive columns
        cols.sm && `grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`,
        cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,

        // Responsive gaps
        gap.sm && `gap-${gap.sm}`,
        gap.md && `md:gap-${gap.md}`,
        gap.lg && `lg:gap-${gap.lg}`,
        gap.xl && `xl:gap-${gap.xl}`,
        gap['2xl'] && `2xl:gap-${gap['2xl']}`,

        className
    )

    if (autoFit) {
        return (
            <div className={cn('grid', className)} style={gridStyle}>
                {children}
            </div>
        )
    }

    return <div className={gridClasses}>{children}</div>
}

// Enhanced grid components for specific use cases
export function ProfileGrid({children, className}: { children: React.ReactNode; className?: string }) {
    return (
        <ResponsiveGrid
            cols={{sm: 1, md: 2, lg: 3, xl: 4}}
            gap={{sm: 4, md: 6, lg: 8}}
            className={className}
        >
            {children}
        </ResponsiveGrid>
    )
}

export function EventGrid({children, className}: { children: React.ReactNode; className?: string }) {
    return (
        <ResponsiveGrid
            cols={{sm: 1, md: 1, lg: 2, xl: 2}}
            gap={{sm: 4, md: 6, lg: 8}}
            className={className}
        >
            {children}
        </ResponsiveGrid>
    )
}

export function MessageGrid({children, className}: { children: React.ReactNode; className?: string }) {
    return (
        <ResponsiveGrid
            cols={{sm: 1, md: 1, lg: 2, xl: 3}}
            gap={{sm: 4, md: 6, lg: 8}}
            className={className}
        >
            {children}
        </ResponsiveGrid>
    )
}

export function FeatureGrid({children, className}: { children: React.ReactNode; className?: string }) {
    return (
        <ResponsiveGrid
            cols={{sm: 1, md: 2, lg: 3, xl: 3}}
            gap={{sm: 6, md: 8, lg: 10}}
            className={className}
        >
            {children}
        </ResponsiveGrid>
    )
}

// Masonry-like grid for varied content heights
export function MasonryGrid({children, className}: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            'columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5',
            'space-y-4 sm:space-y-6 md:space-y-8',
            className
        )}>
            {children}
        </div>
    )
}

// Flex grid for equal height cards
export function FlexGrid({children, className}: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            'flex flex-wrap gap-4 sm:gap-6 md:gap-8',
            className
        )}>
            {children}
        </div>
    )
}
