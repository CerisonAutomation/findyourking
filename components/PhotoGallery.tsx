'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadProfilePhoto, deleteProfilePhoto, setPrimaryPhoto } from '@/lib/actions/photos';
import { getUserTierLimits, type TierLimits } from '@/lib/helpers/tier-limits';

interface Photo {
  id: string;
  photo_url: string;
  is_primary: boolean;
  order_index: number;
  is_verified: boolean;
}

interface PhotoGalleryProps {
  photos: Photo[];
  maxPhotos?: number;
  onPhotoChange?: () => void;
  editable?: boolean;
}

export function PhotoGallery({
  photos: initialPhotos,
  maxPhotos: maxPhotosOverride,
  onPhotoChange,
  editable = true,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [tierLimits, setTierLimits] = useState<TierLimits | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch tier limits on mount
  useEffect(() => {
    const fetchTierLimits = async () => {
      const limits = await getUserTierLimits();
      setTierLimits(limits);
    };
    fetchTierLimits();
  }, []);

  // Use tier-based max photos or override
  const maxPhotos = maxPhotosOverride || tierLimits?.max_profile_photos || 6;
  const maxFileSizeMB = tierLimits?.max_file_size_mb || 5;

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= maxPhotos) {
      showMessage(`Maximum ${maxPhotos} photos allowed for your tier`, true);
      return;
    }

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('Please upload an image file', true);
      return;
    }

    // Validate file size based on tier
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      showMessage(`Image must be less than ${maxFileSizeMB}MB for your tier`, true);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderIndex', String(photos.length));
      formData.append('isPrimary', String(photos.length === 0)); // First photo is primary

      const result = await uploadProfilePhoto(formData);

      if (result.success && result.photo) {
        setPhotos([...photos, result.photo]);
        showMessage('Photo uploaded successfully!');
        onPhotoChange?.();
      } else {
        showMessage(result.error || 'Upload failed', true);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('Upload failed', true);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;

    const result = await deleteProfilePhoto(photoId);

    if (result.success) {
      setPhotos(photos.filter(p => p.id !== photoId));
      showMessage('Photo deleted');
      onPhotoChange?.();
    } else {
      showMessage(result.error || 'Delete failed', true);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    const result = await setPrimaryPhoto(photoId);

    if (result.success) {
      setPhotos(photos.map(p => ({ ...p, is_primary: p.id === photoId })));
      showMessage('Primary photo updated');
      onPhotoChange?.();
    } else {
      showMessage(result.error || 'Update failed', true);
    }
  };

  return (
    <div>
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('success') || message.includes('uploaded')
            ? 'bg-green-500/20 border border-green-500/50 text-green-200'
            : 'bg-red-500/20 border border-red-500/50 text-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-slate-800 border-2 border-slate-700 group"
          >
            <Image
              src={photo.photo_url}
              alt={`Photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
            />

            {/* Primary badge */}
            {photo.is_primary && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Star className="w-3 h-3" fill="currentColor" />
                Primary
              </div>
            )}

            {/* Verified badge */}
            {photo.is_verified && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            {/* Actions overlay */}
            {editable && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {!photo.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(photo.id)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    Set Primary
                  </button>
                )}

                <button
                  onClick={() => handleDelete(photo.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Upload button */}
        {editable && photos.length < maxPhotos && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative aspect-square rounded-lg border-2 border-dashed border-slate-600 hover:border-purple-500 bg-slate-800/50 hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-purple-400"
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">Add Photo</span>
                <span className="text-xs">{photos.length}/{maxPhotos}</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {editable && photos.length < 2 && (
        <p className="mt-4 text-sm text-amber-400 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Add at least 2 photos to increase your match rate by 40%!
        </p>
      )}
    </div>
  );
}
