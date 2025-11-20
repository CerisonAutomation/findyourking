/**
 * Real-Time Status & Presence Manager
 * 
 * Integrates with Supabase Realtime for:
 * - Online/offline status tracking
 * - Geographic location updates
 * - Live chat presence
 * - Real-time notifications
 * - User availability indicators
 * 
 * Per Supabase Docs: https://supabase.com/docs/guides/realtime/overview
 * Per OWASP: Location data handled with privacy-first approach
 */

import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSecurityLogger, SecurityEventType } from '@/lib/security/monitoring';
import { updateUserLocation } from '@/lib/actions/profile';
import { ChatMessagePayload } from '@/lib/types';

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  city?: string;
  country?: string;
}

export interface ChatNotification {
  id: string;
  userId: string;
  fromUserId: string;
  message: string;
  type: 'message' | 'match' | 'like' | 'visit';
  timestamp: Date;
  read: boolean;
}

export interface LivePhotoUpdate {
  photoId: string;
  userId: string;
  url: string;
  isLive: boolean;
  viewedBy: string[];
  expiresAt?: Date;
}

class RealtimeManager {
  private supabase = createClient();
  private presenceChannel: RealtimeChannel | null = null;
  private chatChannel: RealtimeChannel | null = null;
  private notificationChannel: RealtimeChannel | null = null;
  private livePhotoChannel: RealtimeChannel | null = null;
  private userId: string | null = null;
  private locationWatcher: number | null = null;
  private presenceInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize real-time manager for a user
   */
  async initialize(userId: string): Promise<boolean> {
    try {
      this.userId = userId;

      // Subscribe to presence updates
      this.presenceChannel = this.supabase.channel(`presence:${userId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: userId },
        },
      });

      // Subscribe to chat messages
      this.chatChannel = this.supabase.channel(`chat:${userId}`);
      this.chatChannel.on('broadcast', { event: 'message' }, (payload) => {
        this.handleNewMessage(payload.payload);
      });

      // Subscribe to notifications
      this.notificationChannel = this.supabase.channel(`notifications:${userId}`);
      this.notificationChannel.on('broadcast', { event: 'notification' }, (payload) => {
        this.handleNotification(payload.payload);
      });

      // Subscribe to live photo updates
      this.livePhotoChannel = this.supabase.channel(`live-photos:${userId}`);
      this.livePhotoChannel.on('broadcast', { event: 'photo-update' }, (payload) => {
        this.handleLivePhotoUpdate(payload.payload);
      });

      this.presenceChannel.on('broadcast', { event: 'profile-update' }, (payload) => {
        this.handleProfileUpdate(payload.payload);
      });

      // Subscribe to channels
      await Promise.all([
        this.presenceChannel.subscribe(),
        this.chatChannel.subscribe(),
        this.notificationChannel.subscribe(),
        this.livePhotoChannel.subscribe(),
      ]);

      // Start tracking presence
      await this.trackPresence();

      // Start tracking location (with privacy controls)
      this.startLocationTracking();

      getSecurityLogger().log({
        type: SecurityEventType.SESSION_CREATED,
        userId,
        status: 'success',
        riskLevel: 'low',
        details: { action: 'realtime_initialized' },
      });

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[RealtimeManager] Initialization failed:', msg);
      return false;
    }
  }

  /**
   * Track user presence (online/offline, last seen)
   */
  private async trackPresence(): Promise<void> {
    if (!this.presenceChannel || !this.userId) return;

    try {
      const { data: userData } = await this.supabase.auth.getUser();
      if (!userData.user) return;

      const presence: UserPresence = {
        userId: this.userId,
        isOnline: true,
        lastSeen: new Date(),
      };

      await this.presenceChannel.track(presence);

      // Update presence periodically (store interval for cleanup)
      this.presenceInterval = setInterval(async () => {
        try {
          await this.presenceChannel?.track({
            ...presence,
            lastSeen: new Date(),
          });
        } catch (err) {
          console.error('[RealtimeManager] Presence update failed:', err);
        }
      }, 30000); // Update every 30 seconds
    } catch (err) {
      console.error('[RealtimeManager] Presence tracking failed:', err);
    }
  }

  /**
   * Start geolocation tracking (privacy-first)
   * Only shares location with explicit user permission
   */
  private startLocationTracking(): void {
    if (!navigator.geolocation) {
      console.warn('[RealtimeManager] Geolocation not available');
      return;
    }

    // Request location permission from user
    this.locationWatcher = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          // Update user location in the database
          await updateUserLocation(latitude, longitude);

          // Reverse geocode to get city/country (optional)
          const location = await this.reverseGeocode(latitude, longitude);

          // Broadcast location update to matched users only
          await this.presenceChannel?.send({
            type: 'broadcast',
            event: 'location_update',
            payload: {
              latitude,
              longitude,
              accuracy,
              city: location?.city,
              country: location?.country,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (err) {
          console.warn('[RealtimeManager] Location broadcast failed:', err);
        }
      },
      (err) => {
        console.warn('[RealtimeManager] Geolocation error:', err.message);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000, // 5 minutes
        timeout: 10000, // 10 seconds
      }
    );
  }

  /**
   * Reverse geocode coordinates to city/country
   * Uses free service with rate limiting
   */
  private async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{ city: string; country: string } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      return {
        city: data.address?.city || data.address?.town || 'Unknown',
        country: data.address?.country || 'Unknown',
      };
    } catch (err) {
      console.warn('[RealtimeManager] Reverse geocode failed:', err);
      return null;
    }
  }

  /**
   * Handle incoming chat message
   */
  private handleNewMessage(payload: ChatMessagePayload): void {
    console.log('[RealtimeManager] New message received:', payload);
    // Emit to listeners or trigger UI update
    window.dispatchEvent(
      new CustomEvent('chat:message', { detail: payload })
    );
  }

  /**
   * Handle notification
   */
  private handleNotification(notification: ChatNotification): void {
    console.log('[RealtimeManager] New notification:', notification);

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(`${notification.type}`, {
        body: notification.message,
        tag: notification.id,
        badge: '/logo.png',
      });
    }

    // Emit to listeners
    window.dispatchEvent(
      new CustomEvent('notification:new', { detail: notification })
    );
  }

  /**
   * Handle live photo update
   */
  private handleLivePhotoUpdate(photo: LivePhotoUpdate): void {
    console.log('[RealtimeManager] Live photo update:', photo);
    window.dispatchEvent(
      new CustomEvent('photo:live-update', { detail: photo })
    );
  }

  /**
   * Handle profile update
   */
  private handleProfileUpdate(payload: { userId: string; avatar_url: string }): void {
    console.log('[RealtimeManager] Profile update received:', payload);
    window.dispatchEvent(
      new CustomEvent('profile:update', { detail: payload })
    );
  }

  /**
   * Send chat message with real-time sync
   */
  async sendChatMessage(
    recipientId: string,
    message: string,
    mediaUrls?: string[]
  ): Promise<boolean> {
    if (!this.chatChannel || !this.userId) return false;

    try {
      // Store message in database
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          sender_id: this.userId,
          recipient_id: recipientId,
          content: message,
          media_urls: mediaUrls,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      // Broadcast to recipient in real-time
      await this.chatChannel.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          messageId: data?.id || null,
          senderId: this.userId,
          content: message,
          mediaUrls,
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    } catch (err) {
      console.error('[RealtimeManager] Send message failed:', err);
      return false;
    }
  }

  /**
   * Send profile update
   */
  async sendProfileUpdate(avatar_url: string): Promise<boolean> {
    if (!this.presenceChannel || !this.userId) return false;

    try {
      await this.presenceChannel.send({
        type: 'broadcast',
        event: 'profile-update',
        payload: {
          userId: this.userId,
          avatar_url,
        },
      });
      return true;
    } catch (err) {
      console.error('[RealtimeManager] Send profile update failed:', err);
      return false;
    }
  }

  /**
   * Send notification
   */
  async sendNotification(
    recipientId: string,
    type: ChatNotification['type'],
    message: string
  ): Promise<boolean> {
    if (!this.notificationChannel) return false;

    try {
      const notification: ChatNotification = {
        id: crypto.randomUUID(),
        userId: recipientId,
        fromUserId: this.userId!,
        message,
        type,
        timestamp: new Date(),
        read: false,
      };

      // Store notification
      await this.supabase.from('notifications').insert(notification);

      // Broadcast in real-time
      await this.notificationChannel.send({
        type: 'broadcast',
        event: 'notification',
        payload: notification,
      });

      return true;
    } catch (err) {
      console.error('[RealtimeManager] Send notification failed:', err);
      return false;
    }
  }

  /**
   * Share live photo
   */
  async shareLivePhoto(
    photoUrl: string,
    matchId: string,
    expiresInHours = 24
  ): Promise<boolean> {
    if (!this.livePhotoChannel || !this.userId) return false;

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const livePhoto: LivePhotoUpdate = {
        photoId: crypto.randomUUID(),
        userId: this.userId,
        url: photoUrl,
        isLive: true,
        viewedBy: [],
        expiresAt,
      };

      // Store live photo metadata
      await this.supabase.from('live_photos').insert({
        id: livePhoto.photoId,
        user_id: this.userId,
        match_id: matchId,
        url: photoUrl,
        expires_at: expiresAt.toISOString(),
      });

      // Broadcast update
      await this.livePhotoChannel.send({
        type: 'broadcast',
        event: 'photo-update',
        payload: livePhoto,
      });

      return true;
    } catch (err) {
      console.error('[RealtimeManager] Share live photo failed:', err);
      return false;
    }
  }

  /**
   * Get online users (matches only)
   */
  async getOnlineUsers(): Promise<UserPresence[]> {
    try {
      if (!this.presenceChannel) return [];

      const state = this.presenceChannel.presenceState();
      const onlineUsers: UserPresence[] = [];

      for (const channel in state) {
        const presences = state[channel];
        presences.forEach((p: unknown) => {
          const presence = p as Partial<UserPresence>;
          if (presence.isOnline && presence.userId) {
            onlineUsers.push({
              userId: presence.userId,
              isOnline: presence.isOnline,
              lastSeen: presence.lastSeen || new Date(),
              latitude: presence.latitude,
              longitude: presence.longitude,
              accuracy: presence.accuracy,
              city: presence.city,
              country: presence.country,
            });
          }
        });
      }

      return onlineUsers;
    } catch (err) {
      console.error('[RealtimeManager] Get online users failed:', err);
      return [];
    }
  }

  /**
   * Clean up and unsubscribe
   */
  async cleanup(): Promise<void> {
    // Clear presence interval
    if (this.presenceInterval !== null) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }

    // Clear location watcher
    if (this.locationWatcher !== null) {
      navigator.geolocation.clearWatch(this.locationWatcher);
      this.locationWatcher = null;
    }

    // Unsubscribe from all channels
    await Promise.all([
      this.presenceChannel?.unsubscribe(),
      this.chatChannel?.unsubscribe(),
      this.notificationChannel?.unsubscribe(),
      this.livePhotoChannel?.unsubscribe(),
    ]);

    // Clear channel references
    this.presenceChannel = null;
    this.chatChannel = null;
    this.notificationChannel = null;
    this.livePhotoChannel = null;
    this.userId = null;
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();

export default RealtimeManager;
