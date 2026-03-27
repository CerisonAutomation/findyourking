'use client';

import React, {useCallback, useState} from 'react';
import {Button} from '@/components/ui/button';
import {ChevronLeft, ChevronRight, Download, Grid3X3, Share2, Trash2, X, ZoomIn, ZoomOut,} from 'lucide-react';
import {cn} from '@/lib/utils';

interface Photo {
    id: string;
    url: string;
    is_primary: boolean;
}

interface PhotoGalleryProps {
    photos: Photo[];
    displayName: string;
    editable?: boolean;
    onDelete?: (photoId: string) => void;
    onSetPrimary?: (photoId: string) => void;
    className?: string;
}

export function PhotoGallery({
                                 photos,
                                 displayName,
                                 editable = false,
                                 onDelete,
                                 onSetPrimary,
                                 className,
                             }: PhotoGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showGrid, setShowGrid] = useState(false);

    const sortedPhotos = [...photos].sort((a, b) => {
        if (a.is_primary) return -1;
        if (b.is_primary) return 1;
        return 0;
    });

    const openLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setZoomLevel(1);
    }, []);

    const closeLightbox = useCallback(() => {
        setLightboxIndex(null);
        setZoomLevel(1);
    }, []);

    const goToNext = useCallback(() => {
        if (lightboxIndex === null) return;
        setLightboxIndex((prev) => (prev! + 1) % sortedPhotos.length);
        setZoomLevel(1);
    }, [lightboxIndex, sortedPhotos.length]);

    const goToPrev = useCallback(() => {
        if (lightboxIndex === null) return;
        setLightboxIndex((prev) => (prev! - 1 + sortedPhotos.length) % sortedPhotos.length);
        setZoomLevel(1);
    }, [lightboxIndex, sortedPhotos.length]);

    // Keyboard navigation
    React.useEffect(() => {
        if (lightboxIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowLeft':
                    goToPrev();
                    break;
                case 'ArrowRight':
                    goToNext();
                    break;
                case 'Escape':
                    closeLightbox();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, goToNext, goToPrev, closeLightbox]);

    if (sortedPhotos.length === 0) {
        return (
            <div
                className={cn(
                    'aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center',
                    className
                )}
            >
        <span className="text-6xl font-bold text-primary/30">
          {displayName.charAt(0).toUpperCase()}
        </span>
            </div>
        );
    }

    if (sortedPhotos.length === 1) {
        return (
            <>
                <div
                    className={cn('relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer', className)}
                    onClick={() => openLightbox(0)}
                >
                    <img
                        src={sortedPhotos[0].url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                    />
                    <div
                        className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <ZoomIn className="h-8 w-8 text-white drop-shadow-lg"/>
                    </div>
                </div>
                {lightboxIndex !== null && (
                    <Lightbox
                        photos={sortedPhotos}
                        currentIndex={lightboxIndex}
                        zoomLevel={zoomLevel}
                        displayName={displayName}
                        editable={editable}
                        onClose={closeLightbox}
                        onNext={goToNext}
                        onPrev={goToPrev}
                        onZoomIn={() => setZoomLevel((z) => Math.min(z + 0.5, 3))}
                        onZoomOut={() => setZoomLevel((z) => Math.max(z - 0.5, 0.5))}
                        onDelete={onDelete}
                        onSetPrimary={onSetPrimary}
                    />
                )}
            </>
        );
    }

    return (
        <>
            {/* Main photo + grid layout */}
            <div className={cn('space-y-2', className)}>
                {/* Main photo */}
                <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => openLightbox(0)}
                >
                    <img
                        src={sortedPhotos[0].url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                    />
                    <div
                        className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <ZoomIn className="h-8 w-8 text-white drop-shadow-lg"/>
                    </div>
                    {sortedPhotos.length > 1 && (
                        <div
                            className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs text-white">
                            <Grid3X3 className="h-3 w-3"/>
                            1 / {sortedPhotos.length}
                        </div>
                    )}
                </div>

                {/* Thumbnail grid */}
                {sortedPhotos.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                        {sortedPhotos.slice(1, 5).map((photo, index) => (
                            <div
                                key={photo.id}
                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                                onClick={() => openLightbox(index + 1)}
                            >
                                <img
                                    src={photo.url}
                                    alt={`${displayName} photo ${index + 2}`}
                                    className="w-full h-full object-cover"
                                />
                                {index === 3 && sortedPhotos.length > 5 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white font-semibold">+{sortedPhotos.length - 5}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <Lightbox
                    photos={sortedPhotos}
                    currentIndex={lightboxIndex}
                    zoomLevel={zoomLevel}
                    displayName={displayName}
                    editable={editable}
                    onClose={closeLightbox}
                    onNext={goToNext}
                    onPrev={goToPrev}
                    onZoomIn={() => setZoomLevel((z) => Math.min(z + 0.5, 3))}
                    onZoomOut={() => setZoomLevel((z) => Math.max(z - 0.5, 0.5))}
                    onDelete={onDelete}
                    onSetPrimary={onSetPrimary}
                />
            )}
        </>
    );
}

// Lightbox component
interface LightboxProps {
    photos: Photo[];
    currentIndex: number;
    zoomLevel: number;
    displayName: string;
    editable: boolean;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onDelete?: (photoId: string) => void;
    onSetPrimary?: (photoId: string) => void;
}

function Lightbox({
                      photos,
                      currentIndex,
                      zoomLevel,
                      displayName,
                      editable,
                      onClose,
                      onNext,
                      onPrev,
                      onZoomIn,
                      onZoomOut,
                      onDelete,
                      onSetPrimary,
                  }: LightboxProps) {
    const currentPhoto = photos[currentIndex];

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
            {/* Close button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
                onClick={onClose}
            >
                <X className="h-6 w-6"/>
            </Button>

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white text-sm z-10">
                {currentIndex + 1} / {photos.length}
            </div>

            {/* Navigation */}
            {photos.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
                        onClick={onPrev}
                    >
                        <ChevronLeft className="h-8 w-8"/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
                        onClick={onNext}
                    >
                        <ChevronRight className="h-8 w-8"/>
                    </Button>
                </>
            )}

            {/* Image */}
            <div
                className="flex items-center justify-center w-full h-full p-16 overflow-hidden"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <img
                    src={currentPhoto.url}
                    alt={`${displayName} photo ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{transform: `scale(${zoomLevel})`}}
                />
            </div>

            {/* Bottom toolbar */}
            <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9"
                        onClick={onZoomOut}>
                    <ZoomOut className="h-4 w-4"/>
                </Button>
                <span className="text-white text-xs w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9" onClick={onZoomIn}>
                    <ZoomIn className="h-4 w-4"/>
                </Button>
                <div className="w-px h-5 bg-white/20 mx-1"/>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9">
                    <Download className="h-4 w-4"/>
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9">
                    <Share2 className="h-4 w-4"/>
                </Button>
                {editable && (
                    <>
                        <div className="w-px h-5 bg-white/20 mx-1"/>
                        {!currentPhoto.is_primary && onSetPrimary && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/10 text-xs"
                                onClick={() => onSetPrimary(currentPhoto.id)}
                            >
                                Set as primary
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:bg-red-500/10 h-9 w-9"
                                onClick={() => onDelete(currentPhoto.id)}
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
