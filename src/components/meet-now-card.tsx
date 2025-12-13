'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/componentsui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Sparkles } from 'lucide-react';
import type { MeetNowCard as MeetNowCardType } from '@/lib/types';
import { formatDistanceToNowStrict } from 'date-fns';

interface MeetNowCardProps {
  card: MeetNowCardType;
}

export function MeetNowCard({ card }: MeetNowCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={card.userAvatar ?? undefined} />
            <AvatarFallback>{card.userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{card.userName}</p>
            <p className="text-xs text-muted-foreground">
                Posted {formatDistanceToNowStrict(new Date(card.createdAt!))} ago
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <p className="font-semibold text-lg">{card.activity}</p>
        </div>
         <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-5" />
            <p>{card.location}</p>
        </div>
         <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-5" />
            <p>Around {card.time}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">I'm In</Button>
      </CardFooter>
    </Card>
  );
}
