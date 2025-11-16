"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import { AuthUser } from "@/types/database";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BellIcon } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Notifications Component - Supabase Realtime Best Practices
 * 
 * ✅ Uses broadcast (scalable) instead of postgres_changes
 * ✅ Private channel with RLS authorization
 * ✅ Dedicated topic pattern: user:{userId}:notifications
 * ✅ Proper channel state checking
 * ✅ Cleanup logic with useRef
 * ✅ Authentication before subscribe
 * 
 * Per: Supabase Realtime AI Assistant Guide
 */
export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  // Fetch initial notifications and set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const fetchAndSubscribeNotifications = async () => {
      // Fetch initial notifications
      const { data: initialNotifications, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching initial notifications:", error);
      } else {
        setNotifications(initialNotifications || []);
      }

      // Check if already subscribed to prevent multiple subscriptions
      if (channelRef.current && channelRef.current.state === 'joined') {
        return;
      }

      // Create channel with proper naming: user:{userId}:notifications
      const channel = supabase.channel(`user:${user.id}:notifications`, {
        config: {
          broadcast: { self: true, ack: true },
          private: true, // Required for RLS authorization
        },
      });

      channelRef.current = channel;

      // Set auth before subscribing (required for private channels)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      // Subscribe to broadcast events (NOT postgres_changes)
      channel
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          const newNotification = payload['payload']['record'] as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          const updatedNotification = payload['payload']['record'] as Notification;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          const deletedNotification = payload['payload']['old_record'] as Notification;
          setNotifications((prev) =>
            prev.filter((n) => n.id !== deletedNotification.id)
          );
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Notifications realtime connected');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Notifications channel error:', err);
          } else if (status === 'CLOSED') {
            console.log('🔌 Notifications channel closed');
          }
        });
    };

    fetchAndSubscribeNotifications();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, supabase]); // Re-run effect if user or supabase client changes

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
    } else {
      // Realtime subscription will handle updating the state,
      // but we can optimistically update it here for faster UI response
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <BellIcon className="h-4 w-4" />
          {notifications.filter((n) => !n.is_read).length > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              You have {notifications.filter((n) => !n.is_read).length} unread
              messages.
            </p>
          </div>
          <div className="grid gap-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                >
                  <span
                    className={`flex h-2 w-2 translate-y-1 rounded-full ${
                      notification.is_read ? "bg-gray-400" : "bg-sky-500"
                    }`}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.message}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                    {!notification.is_read && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
