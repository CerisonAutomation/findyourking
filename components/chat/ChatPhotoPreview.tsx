'use client';

/**
 * CHAT PHOTO PREVIEW - 150/100 TIER
 * Per Supabase Storage: https://supabase.com/docs/guides/storage/uploads
 * Features: Album preview, lightbox, lazy loading
 */

import Image from 'next/image';
import { useState } from 'react';
import { Images, X } from 'lucide-react';

interface ChatPhotoPreviewProps {
  urls: string[];
  type: 'single' | 'album';
  thumbnail?: string;
}

export default function ChatPhotoPreview({ urls, type, thumbnail }: ChatPhotoPreviewProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayUrl = thumbnail || urls[0];
  const count = urls.length;

  if (type === 'album' && count > 1) {
    return (
      <>
        <div 
          onClick={() => setShowLightbox(true)}
          className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer group"
        >
          <Image
            src={displayUrl}
            alt="Album preview"
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="64px"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-white text-center">
              <Images className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs font-bold">{count}</span>
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {showLightbox && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setShowLightbox(false)}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center p-4">
              <Image
                src={urls[currentIndex]}
                alt={`Photo ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>

            {/* Navigation */}
            {count > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {urls.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex 
                        ? 'bg-white w-8' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`View photo ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div 
      onClick={() => setShowLightbox(true)}
      className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer"
    >
      <Image
        src={displayUrl}
        alt="Photo"
        fill
        className="object-cover hover:scale-105 transition-transform"
        sizes="64px"
      />
      
      {showLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="relative max-w-4xl max-h-[80vh] w-full h-full">
            <Image
              src={displayUrl}
              alt="Full size photo"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
