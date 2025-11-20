/**
 * Supabase Storage Utilities
 * Handles file uploads and downloads for the dating app
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

// =====================================================
// BUCKET NAMES
// =====================================================
export const BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  CHAT_MEDIA: 'chat-media',
  PRIVATE_ALBUMS: 'private-albums',
} as const;

// =====================================================
// FILE UPLOAD: Profile Picture
// =====================================================
/**
 * Upload a profile picture to Supabase Storage
 * @param userId - The user's UUID
 * @param file - The image file to upload
 * @param fileName - Optional custom file name (default: timestamp)
 * @returns Public URL of the uploaded image
 */
export async function uploadProfilePicture(
  userId: string,
  file: File,
  fileName?: string
): Promise<string> {
  const supabase = createBrowserClient();
  
  // Generate filename if not provided
  const filename = fileName || `${Date.now()}-${file.name}`;
  const filepath = `${userId}/avatar/${filename}`;

  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKETS.PROFILE_PICTURES)
      .upload(filepath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKETS.PROFILE_PICTURES)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Profile picture upload error:', error);
    throw error;
  }
}

// =====================================================
// FILE UPLOAD: Chat Media
// =====================================================
/**
 * Upload media to chat bucket (images, documents)
 * @param userId - The user's UUID
 * @param file - The file to upload
 * @param fileName - Optional custom file name
 * @returns Public URL of the uploaded file
 */
export async function uploadChatMedia(
  userId: string,
  file: File,
  fileName?: string
): Promise<string> {
  const supabase = createBrowserClient();
  
  // Generate filename if not provided
  const filename = fileName || `${Date.now()}-${file.name}`;
  const filepath = `${userId}/chat/${filename}`;

  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKETS.CHAT_MEDIA)
      .upload(filepath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKETS.CHAT_MEDIA)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Chat media upload error:', error);
    throw error;
  }
}

// =====================================================
// FILE DELETE: Profile Picture
// =====================================================
/**
 * Delete a profile picture from storage
 * @param userId - The user's UUID
 * @param fileName - The file name to delete
 */
export async function deleteProfilePicture(
  userId: string,
  fileName: string
): Promise<void> {
  const supabase = createBrowserClient();
  const filepath = `${userId}/avatar/${fileName}`;

  try {
    const { error } = await supabase.storage
      .from(BUCKETS.PROFILE_PICTURES)
      .remove([filepath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Profile picture delete error:', error);
    throw error;
  }
}

// =====================================================
// FILE DELETE: Chat Media
// =====================================================
/**
 * Delete media from chat bucket
 * @param userId - The user's UUID
 * @param fileName - The file name to delete
 */
export async function deleteChatMedia(
  userId: string,
  fileName: string
): Promise<void> {
  const supabase = createBrowserClient();
  const filepath = `${userId}/chat/${fileName}`;

  try {
    const { error } = await supabase.storage
      .from(BUCKETS.CHAT_MEDIA)
      .remove([filepath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Chat media delete error:', error);
    throw error;
  }
}

// =====================================================
// FILE UPLOAD: With Validation
// =====================================================
/**
 * Upload file with validation (size, type)
 * @param file - The file to validate and upload
 * @param type - 'profile' or 'chat'
 * @param userId - The user's UUID
 * @returns Public URL or error
 */
export async function uploadFileWithValidation(
  file: File,
  type: 'profile' | 'chat',
  userId: string
): Promise<{ url: string; error?: string }> {
  // Validation rules
  const MAX_FILE_SIZES = {
    profile: 5 * 1024 * 1024, // 5MB
    chat: 10 * 1024 * 1024, // 10MB
  };

  const ALLOWED_TYPES = {
    profile: ['image/jpeg', 'image/png', 'image/webp'],
    chat: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  };

  // Validate file size
  if (file.size > MAX_FILE_SIZES[type]) {
    return {
      url: '',
      error: `File size exceeds limit of ${MAX_FILE_SIZES[type] / (1024 * 1024)}MB`,
    };
  }

  // Validate file type
  if (!ALLOWED_TYPES[type].includes(file.type)) {
    return {
      url: '',
      error: `File type not allowed. Allowed types: ${ALLOWED_TYPES[type].join(', ')}`,
    };
  }

  try {
    let url: string;
    if (type === 'profile') {
      url = await uploadProfilePicture(userId, file);
    } else {
      url = await uploadChatMedia(userId, file);
    }

    return { url };
  } catch (error) {
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// SERVER-SIDE: List Files in Bucket
// =====================================================
/**
 * List all files in a user's folder (admin only, use in server actions)
 * @param userId - The user's UUID
 * @param type - 'profile' or 'chat'
 */
export async function listUserFiles(
  userId: string,
  type: 'profile' | 'chat'
): Promise<string[]> {
  const supabase = await createClient();
  
  const bucket = type === 'profile' 
    ? BUCKETS.PROFILE_PICTURES 
    : BUCKETS.CHAT_MEDIA;

  const folderPath = type === 'profile' ? `${userId}/avatar` : `${userId}/chat`;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath);

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data.map((file) => file.name);
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}

// =====================================================
// PRIVATE ALBUM: Upload Photo to Match Album
// =====================================================
/**
 * Upload a photo to a private album (specific to a match/conversation)
 * Only the uploader can view it
 * @param userId - The user's UUID
 * @param matchId - The match/conversation UUID
 * @param file - The image file to upload
 * @returns The file path (not public URL - private bucket)
 */
export async function uploadToPrivateAlbum(
  userId: string,
  matchId: string,
  file: File
): Promise<string> {
  const supabase = createBrowserClient();
  
  const filename = `${Date.now()}-${file.name}`;
  const filepath = `${userId}/albums/${matchId}/${filename}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKETS.PRIVATE_ALBUMS)
      .upload(filepath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return data.path;
  } catch (error) {
    console.error('Private album upload error:', error);
    throw error;
  }
}

// =====================================================
// PRIVATE ALBUM: Get Signed URL (for private access)
// =====================================================
/**
 * Get a signed URL for private album photo
 * Signed URLs expire after 1 hour
 * @param filepath - The file path in private-albums bucket
 */
export async function getPrivateAlbumSignedUrl(filepath: string): Promise<string> {
  const supabase = createBrowserClient();

  try {
    const { data, error } = await supabase.storage
      .from(BUCKETS.PRIVATE_ALBUMS)
      .createSignedUrl(filepath, 3600); // 1 hour expiry

    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw error;
  }
}

// =====================================================
// PRIVATE ALBUM: List Photos in Album
// =====================================================
/**
 * List all photos in a private album
 * @param userId - The user's UUID
 * @param matchId - The match/conversation UUID
 */
export async function listPrivateAlbumPhotos(
  userId: string,
  matchId: string
): Promise<string[]> {
  const supabase = createBrowserClient();
  
  const folderPath = `${userId}/albums/${matchId}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKETS.PRIVATE_ALBUMS)
      .list(folderPath);

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data.map((file: { name: string }) => file.name);
  } catch (error) {
    console.error('List private album photos error:', error);
    return [];
  }
}

// =====================================================
// PRIVATE ALBUM: Delete Photo from Album
// =====================================================
/**
 * Delete a photo from private album
 * @param userId - The user's UUID
 * @param matchId - The match/conversation UUID
 * @param fileName - The file name to delete
 */
export async function deletePrivateAlbumPhoto(
  userId: string,
  matchId: string,
  fileName: string
): Promise<void> {
  const supabase = createBrowserClient();
  const filepath = `${userId}/albums/${matchId}/${fileName}`;

  try {
    const { error } = await supabase.storage
      .from(BUCKETS.PRIVATE_ALBUMS)
      .remove([filepath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete private album photo error:', error);
    throw error;
  }
}

// =====================================================
// PUBLIC URL BUILDER
// =====================================================
/**
 * Generate public URL for a file
 * @param bucket - Bucket name
 * @param filepath - Full file path
 */
export function getPublicUrl(bucket: string, filepath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filepath}`;
}
