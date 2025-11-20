'use client';

/**
 * ALBUM SHARE BUTTON - 150/100 TIER
 * Per Supabase Storage: https://supabase.com/docs/guides/storage/uploads/resumable-uploads
 * Features: Multi-file upload, progress, private albums
 */

import { useState, useRef } from 'react';
import { Image as ImageIcon, Loader2, X, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AlbumShareButtonProps {
  matchId: string;
  onShareComplete?: (urls: string[]) => void;
}

export default function AlbumShareButton({ matchId, onShareComplete }: AlbumShareButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPrivate, setIsPrivate] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...imageFiles].slice(0, 10)); // Max 10 photos
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAlbum = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const uploadedUrls: string[] = [];
      const bucketName = isPrivate ? 'private-albums' : 'public-albums';

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${matchId}/${Date.now()}-${i}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      // Save album to database
      const { error: dbError } = await supabase
        .from('shared_albums')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          photo_urls: uploadedUrls,
          is_private: isPrivate,
        });

      if (dbError) throw dbError;

      onShareComplete?.(uploadedUrls);
      setSelectedFiles([]);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload album. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Lock className={`w-4 h-4 ${isPrivate ? 'text-pink-500' : 'text-gray-400'}`} />
              {isPrivate ? 'Private' : 'Public'}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative aspect-square">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Selected ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={uploadAlbum}
            disabled={uploading}
            className="w-full py-3 bg-linear-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                Share Album
              </>
            )}
          </button>
        </div>
      )}

      {/* Add Photos Button */}
      {selectedFiles.length === 0 && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-pink-500 hover:text-pink-500 transition-colors flex items-center justify-center gap-2"
        >
          <ImageIcon className="w-5 h-5" />
          Select Photos (Max 10)
        </button>
      )}
    </div>
  );
}
