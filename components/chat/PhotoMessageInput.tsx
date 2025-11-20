'use client';

/**
 * PHOTO MESSAGE INPUT - 150/100 TIER
 * Quick photo sharing in chat messages
 */

import { useState, useRef } from 'react';
import { ImagePlus, Send, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface PhotoMessageInputProps {
  matchId: string;
  toUserId: string;
  onSend?: () => void;
}

export default function PhotoMessageInput({ matchId, toUserId, onSend }: PhotoMessageInputProps) {
  const [message, setMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const clearPhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedPhoto) return;

    setSending(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let photoUrl: string | undefined;

      // Upload photo if present
      if (selectedPhoto) {
        const fileExt = selectedPhoto.name.split('.').pop();
        const fileName = `${user.id}/${matchId}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('chat-photos')
          .upload(fileName, selectedPhoto);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('chat-photos')
          .getPublicUrl(fileName);

        photoUrl = urlData.publicUrl;
      }

      // Send message
      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          from_user_id: user.id,
          to_user_id: toUserId,
          content: message.trim() || 'Sent a photo',
          attachment_type: photoUrl ? 'image' : null,
          attachment_urls: photoUrl ? [photoUrl] : null,
        });

      if (error) throw error;

      setMessage('');
      clearPhoto();
      onSend?.();
    } catch (error) {
      console.error('Send failed:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Photo Preview */}
      {photoPreview && (
        <div className="relative inline-block">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden">
            <Image
              src={photoPreview}
              alt="Preview"
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>
          <button
            onClick={clearPhoto}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            aria-label="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="p-3 text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-500 transition-colors disabled:opacity-50"
          aria-label="Attach photo"
        >
          <ImagePlus className="w-6 h-6" />
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
        />

        <button
          onClick={handleSend}
          disabled={sending || (!message.trim() && !selectedPhoto)}
          className="p-3 bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Send className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
