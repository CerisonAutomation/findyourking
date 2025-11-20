'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { canUserUploadPhoto, updateStorageUsage, trackUpload } from '@/lib/helpers/tier-limits';

interface Photo {
  id: string;
  user_id: string;
  photo_url: string;
  storage_path: string;
  is_primary: boolean;
  order_index: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Upload a profile photo to Supabase Storage
 * Enforces tier-based limits for file size, photo count, storage usage, and rate limiting
 */
export async function uploadProfilePhoto(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const file = formData.get('file') as File;
    const orderIndex = parseInt(formData.get('orderIndex') as string || '0');
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Invalid file type' };
    }

    // Check tier-based limits (file size, photo count, storage, rate limiting)
    const validation = await canUserUploadPhoto(file.size);
    
    if (!validation.allowed) {
      return { 
        success: false, 
        error: validation.reason,
        details: {
          current_photos: validation.current_photos,
          max_photos: validation.max_photos,
          current_storage_mb: validation.current_storage_mb,
          max_storage_mb: validation.max_storage_mb,
        }
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: 'Upload failed' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    // Insert photo record
    const { data: photo, error: dbError } = await supabase
      .from('profile_photos')
      .insert({
        user_id: user.id,
        photo_url: publicUrl,
        storage_path: fileName,
        is_primary: isPrimary,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('profile-photos').remove([fileName]);
      return { success: false, error: 'Failed to save photo' };
    }

    // If this is the primary photo, update profile avatar
    if (isPrimary) {
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
    }

    // Update storage usage tracking
    await updateStorageUsage('profile-photos', file.size);
    
    // Track upload for rate limiting
    await trackUpload(file.size, 'profile-photos');

    revalidatePath('/profile');
    revalidatePath('/profile/edit');

    return { success: true, photo: photo as Photo };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Delete a profile photo
 * Updates storage usage tracking when photo is deleted
 */
export async function deleteProfilePhoto(photoId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get photo details
    const { data: photo, error: fetchError } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('id', photoId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !photo) {
      return { success: false, error: 'Photo not found' };
    }

    // Don't allow deleting the only primary photo without replacement
    if (photo.is_primary) {
      const { count } = await supabase
        .from('profile_photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count && count <= 1) {
        return { success: false, error: 'Cannot delete your only photo' };
      }
    }

    // Get file size before deleting from storage
    const { data: fileData } = await supabase.storage
      .from('profile-photos')
      .list(photo.storage_path.substring(0, photo.storage_path.lastIndexOf('/')), {
        search: photo.storage_path.substring(photo.storage_path.lastIndexOf('/') + 1)
      });
    
    const fileSize = fileData?.[0]?.metadata?.size || 0;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('profile-photos')
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('profile_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', user.id);

    if (deleteError) {
      return { success: false, error: 'Failed to delete photo' };
    }

    // Update storage usage (subtract file size)
    if (fileSize > 0) {
      await updateStorageUsage('profile-photos', -fileSize);
    }

    // If this was the primary photo, set another photo as primary
    if (photo.is_primary) {
      const { data: nextPhoto } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

      if (nextPhoto) {
        await setPrimaryPhoto(nextPhoto.id);
      }
    }

    revalidatePath('/profile');
    revalidatePath('/profile/edit');

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Set a photo as primary
 */
export async function setPrimaryPhoto(photoId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Call the database function
    const { error } = await supabase.rpc('set_primary_photo', {
      photo_id: photoId,
    });

    if (error) {
      console.error('Set primary error:', error);
      return { success: false, error: 'Failed to set primary photo' };
    }

    revalidatePath('/profile');
    revalidatePath('/profile/edit');

    return { success: true };
  } catch (error) {
    console.error('Set primary error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get all photos for a user
 */
export async function getUserPhotos(userId?: string) {
  try {
    const supabase = await createClient();

    // If no userId provided, use current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Unauthorized', photos: [] };
      }
      userId = user.id;
    }

    const { data: photos, error } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Fetch photos error:', error);
      return { success: false, error: 'Failed to fetch photos', photos: [] };
    }

    return { success: true, photos: photos as Photo[] };
  } catch (error) {
    console.error('Get photos error:', error);
    return { success: false, error: 'Internal server error', photos: [] };
  }
}
