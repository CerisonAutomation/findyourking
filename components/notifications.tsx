"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BellIcon } from "lucide-react";

interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  // Fetch initial user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch initial notifications and set up real-time subscription
  useEffect(() => {
    if (user) {
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

        // Set up real-time subscription
        const channel = supabase
          .channel(`notifications_for_user_${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*", // Listen to INSERT, UPDATE, DELETE
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                setNotifications((prev) => [payload.new as Notification, ...prev]);
              } else if (payload.eventType === "UPDATE") {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === (payload.new as Notification).id
                      ? (payload.new as Notification)
                      : n
                  )
                );
              } else if (payload.eventType === "DELETE") {
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== (payload.old as Notification).id)
                );
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      };

      fetchAndSubscribeNotifications();
    }
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
