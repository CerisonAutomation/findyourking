'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { uploadAlbumPhoto, deleteStorageFile, MAX_IMAGE_BYTES } from '@/lib/storage';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, ImageOff, GripVertical } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';

export const metadata = {
  title: 'Photo Album',
  description: 'Manage your profile photos.',
};

interface AlbumPhoto {
  id:         string;
  userId:     string;
  url:        string;
  sortOrder:  number;
  createdAt:  string;
}

async function fetchAlbum(userId: string): Promise<AlbumPhoto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('album_photos')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id:        r.id,
    userId:    r.user_id,
    url:       r.url,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  }));
}

export default function PhotoCurationPage() {
  const { user }       = useUser();
  const qc             = useQueryClient();
  const fileRef        = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overIdx, setOverIdx]   = useState<number | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['album', user?.id],
    queryFn:  () => fetchAlbum(user!.id),
    enabled:  !!user,
  });

  // Upload
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      if (!user) throw new Error('Not authenticated');
      const supabase = createClient();
      for (const file of Array.from(files)) {
        if (file.size > MAX_IMAGE_BYTES) { toast.error(`${file.name} exceeds 10 MB`); continue; }
        const url       = await uploadAlbumPhoto(file, user.id);
        const sortOrder = photos.length + 1;
        const { error } = await supabase
          .from('album_photos')
          .insert({ user_id: user.id, url, sort_order: sortOrder });
        if (error) toast.error(error.message);
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['album', user?.id] }),
    onError:   (e: Error) => toast.error(e.message),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (photo: AlbumPhoto) => {
      const supabase = createClient();
      // Extract storage path from URL
      const pathParts = photo.url.split('/albums/');
      if (pathParts[1]) await deleteStorageFile('albums', pathParts[1]);
      const { error } = await supabase.from('album_photos').delete().eq('id', photo.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['album', user?.id] }),
    onError:   (e: Error) => toast.error(e.message),
  });

  // Reorder (drag-and-drop)
  const reorderMutation = useMutation({
    mutationFn: async (ordered: AlbumPhoto[]) => {
      const supabase = createClient();
      await Promise.all(
        ordered.map((p, i) =>
          supabase.from('album_photos').update({ sort_order: i + 1 }).eq('id', p.id),
        ),
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['album', user?.id] }),
  });

  const handleDrop = (dropIdx: number) => {
    if (dragging === null) return;
    const dragIdx = photos.findIndex((p) => p.id === dragging);
    if (dragIdx === dropIdx) return;
    const reordered = [...photos];
    const [moved]   = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    reorderMutation.mutate(reordered);
    setDragging(null);
    setOverIdx(null);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">My Photos</h1>
            <p className="text-xs text-muted-foreground">{photos.length} / 12 photos · drag to reorder</p>
          </div>
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending || photos.length >= 12}
            aria-label="Upload photos"
          >
            {uploadMutation.isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <><Plus className="size-4 mr-1" /> Add</>}
          </Button>
        </header>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadMutation.mutate(e.target.files);
            e.target.value = '';
          }}
        />

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground text-center">
            <ImageOff className="size-12 opacity-30" />
            <p className="font-medium">No photos yet</p>
            <p className="text-sm">Add up to 12 photos to your profile album.</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-3 gap-2">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => setDragging(photo.id)}
                onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDragging(null); setOverIdx(null); }}
                className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  overIdx === idx && dragging !== photo.id
                    ? 'border-primary scale-105'
                    : 'border-transparent'
                }`}
                aria-label={`Photo ${idx + 1}`}
              >
                <img
                  src={photo.url}
                  alt={`Album photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Sort badge */}
                <div className="absolute top-1.5 left-1.5 size-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </div>
                {/* Drag handle */}
                <div className="absolute top-1.5 right-7 opacity-0 group-hover:opacity-100 bg-black/50 rounded p-0.5 cursor-grab">
                  <GripVertical className="size-3 text-white" />
                </div>
                {/* Delete */}
                <button
                  onClick={() => deleteMutation.mutate(photo)}
                  disabled={deleteMutation.isPending}
                  className="absolute top-1.5 right-1.5 size-6 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete photo"
                >
                  {deleteMutation.isPending
                    ? <Loader2 className="size-3 animate-spin" />
                    : <Trash2 className="size-3" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
