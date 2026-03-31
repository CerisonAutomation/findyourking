/**
 * Supabase Storage helpers — message images, profile photos, album photos.
 * All buckets must be created in Supabase Dashboard with appropriate RLS.
 */
import { createClient } from '@/lib/supabase/client';

/** Maximum file size constants */
export const MAX_IMAGE_BYTES  = 10 * 1024 * 1024;  // 10 MB
export const MAX_AVATAR_BYTES = 3  * 1024 * 1024;  // 3 MB

/**
 * Uploads a message image and returns its public URL.
 * Bucket: `message-images` (public read, authenticated write).
 */
export async function uploadMessageImage(file: File, userId: string): Promise<string> {
  const supabase  = createClient();
  const ext       = file.name.split('.').pop() ?? 'jpg';
  const path      = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('message-images')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('message-images').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads a profile avatar and returns its public URL.
 * Bucket: `avatars` (public read, authenticated write).
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabase  = createClient();
  const ext       = file.name.split('.').pop() ?? 'jpg';
  const path      = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`; // cache-bust
}

/**
 * Uploads an album photo and returns its public URL.
 * Bucket: `albums` (public read, authenticated write per user folder).
 */
export async function uploadAlbumPhoto(file: File, userId: string): Promise<string> {
  const supabase  = createClient();
  const ext       = file.name.split('.').pop() ?? 'jpg';
  const path      = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('albums')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('albums').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Deletes a file from a bucket by its full storage path.
 */
export async function deleteStorageFile(bucket: string, path: string): Promise<void> {
  const supabase  = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}
