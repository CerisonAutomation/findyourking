/**
 * CHAT TYPES - 150/100 ZENITH LEGENDARY TIER
 * Per TypeScript strict mode: https://www.typescriptlang.org/tsconfig#strict
 * Features: Photos, Albums, Voice, Geo, GIFs, Disappearing Messages, Reactions, Games
 */

export type MessageType =
  | 'text'
  | 'image'
  | 'album'
  | 'voice'
  | 'location'
  | 'gif'
  | 'video'
  | 'game';
export type AttachmentType = 'image' | 'album' | 'voice' | 'video' | 'gif';

export interface ChatUser {
  id: string;
  name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen?: string;
  distance?: number; // Distance in km (geolocation)
}

export interface ChatMessage {
  id: string;
  match_id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  message_type: MessageType;
  // Attachments
  attachment_type?: AttachmentType;
  attachment_urls?: string[]; // Multiple URLs for albums
  attachment_metadata?: {
    width?: number;
    height?: number;
    duration?: number; // For voice/video
    thumbnail_url?: string;
    blurhash?: string;
    waveform?: number[]; // Voice waveform
  };
  // Geolocation
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    place_name?: string;
    static_map_url?: string;
  };
  // Privacy & Status
  is_read: boolean;
  read_at?: string;
  expires_at?: string; // Disappearing messages
  is_forwarded?: boolean;
  forward_count?: number;
  is_deleted?: boolean;
  deleted_at?: string;
  is_edited?: boolean;
  // Social
  reactions?: Record<string, string[]>; // emoji -> user_ids[]
  // Game state
  game_state?: GameState;
  // Timestamps
  created_at: string;
  updated_at?: string;
}

export interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface MessageDraft {
  matchId: string;
  content: string;
  attachments?: File[];
  messageType?: MessageType;
  expiresIn?: number;
}

export interface ChatRoom {
  id: string;
  match_id: string;
  participants: ChatUser[];
  last_message?: ChatMessage;
  unread_count: number;
  created_at: string;
}

export interface VoiceRecording {
  blob: Blob;
  duration: number;
  url: string;
  waveform?: number[];
}

export interface PhotoAttachment {
  file: File;
  preview: string;
  isExpiring?: boolean;
  expiresIn?: number; // seconds
  blurhash?: string;
  width?: number;
  height?: number;
}

export interface AlbumAttachment {
  id: string;
  url: string;
  thumbnail_url: string;
  blurhash?: string;
  width: number;
  height: number;
  caption?: string;
}

export interface LocationAttachment {
  latitude: number;
  longitude: number;
  address: string;
  place_name?: string;
  static_map_url?: string;
}

export interface GameState {
  type: 'tictactoe' | 'rps' | 'trivia'; // Rock-paper-scissors, trivia
  board?: (string | null)[]; // For TicTacToe
  currentPlayer?: string;
  winner?: string | null;
  players: string[];
  moves?: any[]; // Game-specific moves
  status: 'waiting' | 'active' | 'finished';
}

export interface GifAttachment {
  id: string;
  url: string;
  preview_url: string;
  width: number;
  height: number;
  title?: string;
}

// Pagination
export interface PaginatedMessages {
  messages: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}
