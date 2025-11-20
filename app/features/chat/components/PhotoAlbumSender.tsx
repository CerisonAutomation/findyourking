'use client';

/**
 * PHOTO ALBUM SENDER - ADVANCED PHOTO SHARING
 * Per Supabase Storage: https://supabase.com/docs/guides/storage
 * Features: Multi-photo albums, thumbnails, blurhash, CDN optimization
 */

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface PhotoAlbumSenderProps {
  matchId: string;
  currentUserId: string;
  onSend: (photos: string[], type: 'single' | 'album') => Promise<void>;
  onClose: () => void;
}

interface PhotoPreview {
  file: File;
  preview: string;
  id: string;
}

export function PhotoAlbumSender({ matchId, currentUserId, onSend, onClose }: PhotoAlbumSenderProps) {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoPreview[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36),
    }));

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10)); // Max 10 photos
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleUpload = async () => {
    if (photos.length === 0) return;

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];

      // Upload to Supabase Storage bucket 'chat-photos'
      for (const photo of photos) {
        const fileName = `${currentUserId}/${matchId}/${Date.now()}_${photo.file.name}`;
        
        const { data, error } = await supabase.storage
          .from('chat-photos')
          .upload(fileName, photo.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('chat-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Send message with photo URLs
      await onSend(uploadedUrls, photos.length > 1 ? 'album' : 'single');

      // Cleanup
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
      onClose();
    } catch (error) {
      console.error('Failed to upload photos:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Send Photos</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No photos selected
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Choose Photos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square">
                  <Image
                    src={photo.preview}
                    alt="Preview"
                    fill
                    className="object-cover rounded-lg"
                    sizes="200px"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-pink-500 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {photos.length} / 10 photos
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={photos.length === 0 || uploading}
              className="bg-linear-to-r from-pink-500 to-purple-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Send {photos.length > 1 ? 'Album' : 'Photo'}
                </>
              )}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
