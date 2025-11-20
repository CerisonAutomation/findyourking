'use client';

import { UserProfile } from "@/app/profile/page";
import { useState } from "react";

import { Sparkles } from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MatchNotificationProps {
  match: UserProfile;
  onClose: () => void;
  onStartChat: () => void;
}

export default function MatchNotification({
  match,
  onClose,
  onStartChat,
}: MatchNotificationProps) {
  const [open, setOpen] = useState(true);

  const handleStartChat = () => {
    onStartChat();
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <ToastProvider swipeDirection="right">
      <Toast
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) onClose();
        }}
        duration={5000}
        variant="success"
        className="border-pink-500/50 bg-linear-to-br from-pink-500/10 to-purple-500/10"
      >
        <div className="flex items-start space-x-4 w-full">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={match.avatar_url || '/default-avatar.png'}
              alt={match.full_name || 'User'}
            />
            <AvatarFallback className="text-2xl">
              {(match.full_name || 'U')[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ToastTitle className="text-lg font-bold flex items-center gap-2">
                It's a Match!
                <Sparkles className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </ToastTitle>
            </div>

            <ToastDescription className="text-sm mb-3">
              You and <span className="font-semibold">{match.full_name}</span> liked each other!
            </ToastDescription>

            <div className="flex gap-2">
              <Button
                onClick={handleStartChat}
                size="sm"
                className="flex-1 bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Start Chat
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Later
              </Button>
            </div>
          </div>

          <ToastClose />
        </div>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}
