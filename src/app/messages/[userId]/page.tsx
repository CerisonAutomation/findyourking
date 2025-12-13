'''
'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MoreVertical, Paperclip, Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import type { UserProfile, Message } from '@/lib/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { createClient } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

async function fetchInitialMessages(conversationId: string): Promise<Message[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('messages')
        .select(`
            id,
            createdAt: created_at,
            content,
            senderId: sender_id,
            sender: profiles (
                id,
                username,
                avatarUrl: avatar_url
            )
        `)
        .eq('conversationId', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        toast.error('Failed to fetch messages');
        console.error(error);
        return [];
    }

    return data as unknown as Message[];
}
'''
