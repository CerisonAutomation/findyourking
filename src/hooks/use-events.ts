'use client'

import {useQuery} from '@tanstack/react-query';

export interface Event {
    id: string;
    title: string;
    description: string;
    location: string;
    event_date: string;
    organizer_id: string;
    max_attendees: number;
    attendee_count: number;
    category: string;
    image_url?: string;
    created_at: string;
    host?: {
        display_name: string;
        avatar_url: string;
    };
}

export function useEvents(filter: 'upcoming' | 'past' | 'all' = 'upcoming') {
    return useQuery({
        queryKey: ['events', filter],
        queryFn: async () => {
            const response = await fetch(`/api/events?filter=${filter}`);
            if (!response.ok) throw new Error('Failed to fetch events');
            return response.json() as Promise<Event[]>;
        },
    });
}
