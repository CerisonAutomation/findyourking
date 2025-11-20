'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  uploadToPrivateAlbum,
  getPrivateAlbumSignedUrl,
  listPrivateAlbumPhotos,
  deletePrivateAlbumPhoto,
} from '@/lib/actions/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,

} from '@/components/ui/alert-dialog';

interface PrivateAlbumProps {
  userId: string;
  matchId: string;
  onPhotoAdded?: (url: string) => void;
}

interface AlbumPhoto {
  name: string;
  signedUrl: string;
}

interface DeleteState {
  isOpen: boolean;
  photoName: string | null;
}

export function PrivateAlbum({
  userId,
  matchId,
  onPhotoAdded,
}: PrivateAlbumProps) {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlbum, setShowAlbum] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState>({
    isOpen: false,
    photoName: null,
  });

  // Load photos function (defined outside useEffect so it can be called from handlers)
  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const photoNames = await listPrivateAlbumPhotos(userId, matchId);
      
      // Get signed URLs for each photo
      const photosWithUrls: AlbumPhoto[] = await Promise.all(
        photoNames.map(async (name) => ({
          name,
          signedUrl: await getPrivateAlbumSignedUrl(
            `${userId}/albums/${matchId}/${name}`
          ),
        }))
      );

      setPhotos(photosWithUrls);
      setError(null);
    } catch (err) {
      console.error('Failed to load album:', err);
      setError('Failed to load album photos');
    } finally {
      setLoading(false);
    }
  }, [userId, matchId]); // Dependencies for useCallback

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
  }, [userId, matchId, loadPhotos]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        await uploadToPrivateAlbum(userId, matchId, file);
      }

      // Reload photos
      await loadPhotos();
      onPhotoAdded?.(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!deleteState.photoName) return;

    try {
      await deletePrivateAlbumPhoto(userId, matchId, deleteState.photoName);
      await loadPhotos();
      setDeleteState({ isOpen: false, photoName: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleteState({ isOpen: false, photoName: null });
    }
  };

  const openDeleteDialog = (photoName: string) => {
    setDeleteState({ isOpen: true, photoName });
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Album Toggle Button */}
      <button
        onClick={() => setShowAlbum(!showAlbum)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-pink-500 to-rose-500 text-white hover:opacity-90 transition"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
          <path d="M5 9a2 2 0 104 0 2 2 0 00-4 0z" />
        </svg>
        Private Album ({photos.length})
      </button>

      {/* Album Content */}
      {showAlbum && (
        <div className="mt-4 space-y-4">
          {/* Upload Area */}
          <div className="relative border-2 border-dashed border-pink-300 rounded-lg p-4 hover:border-pink-500 transition">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading || loading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-center pointer-events-none">
              <svg
                className="w-8 h-8 mx-auto mb-2 text-pink-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click or drag photos to upload'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                These photos are private and only visible to you
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            </div>
          )}

          {/* Photos Grid */}
          {!loading && photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.name}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <Image
                    src={photo.signedUrl}
                    alt="Album photo"
                    fill
                    className="object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      console.error('Image load error:', e);
                    }}
                  />

                  {/* Delete Button */}
                  <button
                    onClick={() => openDeleteDialog(photo.name)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                    aria-label="Delete photo"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && photos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No photos yet</p>
              <p className="text-xs mt-1">Upload photos to your private album</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteState.isOpen}
        onOpenChange={(isOpen) => setDeleteState({ isOpen, photoName: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This photo will be permanently deleted from your private album.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhoto}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
