'use client';

/**
 * MESSAGE INPUT - COMPLETE INPUT WITH ALL FEATURES
 * Per shadcn/ui: https://ui.shadcn.com/docs/components/input
 */

import { useState, useRef, useCallback } from 'react';
import { Send, Mic, Image as ImageIcon, Smile, Paperclip, MapPin, Gift, Camera, X } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { createClient } from '@/lib/supabase/client';
import { GifPicker } from './GifPicker';
import { PhotoAlbumPicker } from './PhotoAlbumPicker';
import { LocationPicker } from './LocationPicker';
import type { GifAttachment, LocationAttachment } from '../types';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: any) => Promise<void>;
  onTyping: () => void;
  matchId: string;
  currentUserId: string;
}

export function MessageInput({
  onSendMessage,
  onTyping,
  matchId,
  currentUserId,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreview, setAttachmentPreview] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const supabase = createClient();

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending) return;

    try {
      setIsSending(true);

      let attachmentData = null;
      if (attachments.length > 0) {
        if (attachments.length === 1) {
          // Single image
          attachmentData = {
            type: 'image',
            urls: await uploadFiles(attachments),
            metadata: await getImageMetadata(attachments[0])
          };
        } else {
          // Album
          attachmentData = {
            type: 'album',
            urls: await uploadFiles(attachments),
            metadata: await Promise.all(attachments.map(getImageMetadata))
          };
        }
      }

      await onSendMessage(message || 'Photo', attachmentData);

      // Clear everything
      setMessage('');
      setAttachments([]);
      setAttachmentPreview([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];

    for (const file of files) {
      const fileName = `${currentUserId}/${matchId}/${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from('chat-photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('chat-photos')
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    }

    return urls;
  };

  const getImageMetadata = async (file: File) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          fileSize: file.size,
          mimeType: file.type
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        await uploadVoiceMessage(blob);
      }
    } else {
      await startRecording();
    }
  };

  const uploadVoiceMessage = async (blob: Blob) => {
    try {
      setIsSending(true);
      const fileName = `${currentUserId}/${matchId}/${Date.now()}.webm`;

      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, blob);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      await onSendMessage('Voice message', {
        type: 'voice',
        urls: [urlData.publicUrl],
      });
    } catch (error) {
      console.error('Failed to upload voice message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setAttachments(prev => [...prev, ...fileArray]);

    // Create previews
    const previews = fileArray.map(file => URL.createObjectURL(file));
    setAttachmentPreview(prev => [...prev, ...previews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAlbumSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setAttachments(prev => [...prev, ...fileArray]);

    // Create previews
    const previews = fileArray.map(file => URL.createObjectURL(file));
    setAttachmentPreview(prev => [...prev, ...previews]);

    setShowAlbumPicker(false);
    if (albumInputRef.current) {
      albumInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(attachmentPreview[index]);
    setAttachmentPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleGifSelect = useCallback(async (gif: GifAttachment) => {
    try {
      setIsSending(true);
      await onSendMessage(gif.title || 'GIF', {
        type: 'gif',
        urls: [gif.url],
        metadata: {
          title: gif.title,
          width: gif.width,
          height: gif.height
        }
      });
      setShowGifPicker(false);
    } catch (error) {
      console.error('Failed to send GIF:', error);
    } finally {
      setIsSending(false);
    }
  }, [onSendMessage]);

  const handleLocationSelect = useCallback(async (location: LocationAttachment) => {
    try {
      setIsSending(true);
      await onSendMessage(`📍 ${location.place_name || location.address}`, {
        type: 'location',
        locationData: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          place_name: location.place_name,
          static_map_url: location.static_map_url
        }
      });
      setShowLocationPicker(false);
    } catch (error) {
      console.error('Failed to send location:', error);
    } finally {
      setIsSending(false);
    }
  }, [onSendMessage]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      {/* Attachment Previews */}
      {attachmentPreview.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {attachmentPreview.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Attachment ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="mb-4">
          <GifPicker
            onSelect={handleGifSelect}
          />
        </div>
      )}

      {/* Location Picker */}
      {showLocationPicker && (
        <div className="mb-4">
          <LocationPicker
            onSelect={handleLocationSelect}
          />
        </div>
      )}

      {/* Album Picker */}
      {showAlbumPicker && (
        <div className="mb-4">
          <PhotoAlbumPicker
            onSelect={(files) => {
              setAttachments(files);
              setAttachmentPreview(files.map(f => URL.createObjectURL(f)));
              setShowAlbumPicker(false);
            }}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={albumInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAlbumSelect}
          className="hidden"
        />

        {/* Attachment Buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isRecording}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition-colors disabled:opacity-50"
            title="Send photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowAlbumPicker(true)}
            disabled={isSending || isRecording}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition-colors disabled:opacity-50"
            title="Create album"
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowGifPicker(true)}
            disabled={isSending || isRecording}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition-colors disabled:opacity-50"
            title="Send GIF"
          >
            <Gift className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowLocationPicker(true)}
            disabled={isSending || isRecording}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition-colors disabled:opacity-50"
            title="Share location"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Record */}
        <button
          onClick={handleVoiceRecord}
          disabled={isSending}
          className={`p-2 transition-colors disabled:opacity-50 ${
            isRecording
              ? 'text-red-500 animate-pulse'
              : 'text-gray-600 dark:text-gray-400 hover:text-pink-500'
          }`}
        >
          <Mic className="w-6 h-6" />
        </button>

        {/* Recording Duration */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 rounded-full text-sm font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </div>
        )}

        {/* Text Input */}
        {!isRecording && (
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              onTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
          />
        )}

        {/* Send Button */}
        {!isRecording && (
          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="p-3 bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
