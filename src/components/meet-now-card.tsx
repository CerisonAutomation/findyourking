'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'; // ✅ fixed broken import
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Sparkles } from 'lucide-react';
import type { MeetNowCard as MeetNowCardType } from '@/lib/types';
import { formatDistanceToNowStrict } from 'date-fns';

interface MeetNowCardProps {
  card: MeetNowCardType;
}

/**
 * Formats a datetime-local string (e.g. "2026-03-24T19:00") for human display.
 * Falls back to raw string if parsing fails.
 */
function formatCardTime(time: string): string {
  try {
    return new Date(time).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return time;
  }
}

export function MeetNowCard({ card }: MeetNowCardProps) {
  const postedAgo = card.createdAt
    ? formatDistanceToNowStrict(new Date(card.createdAt), { addSuffix: true })
    : null;

  return (
    <Card className="w-full" aria-label={`Meet Now card: ${card.activity} in ${card.location}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={card.userAvatar ?? undefined}
              alt={card.userName ?? 'User'}
            />
            <AvatarFallback>
              {(card.userName ?? 'K').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-bold truncate">{card.userName}</p>
            {postedAgo && (
              <p className="text-xs text-muted-foreground">{postedAgo}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <Sparkles className="size-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="font-semibold text-lg leading-tight">{card.activity}</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <p className="truncate">{card.location}</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          <p>{formatCardTime(card.time)}</p>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/profile/${card.userId}`} aria-label={`View ${card.userName}'s profile to join`}>
            I&apos;m In
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
