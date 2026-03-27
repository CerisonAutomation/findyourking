'use client'

import {useQuery} from '@tanstack/react-query';

export interface Party {
    id: string;
    title: string;
    description: string;
    start_time: string;
    location: string;
    lat?: number;
    lng?: number;
    host_id: string;
    party_type: 'private' | 'public';
    max_guests?: number;
    rsvp_count: number;
    host?: {
        display_name: string;
        avatar_url: string;
    };
}

export function useParties() {
    return useQuery({
        queryKey: ['parties'],
        queryFn: async () => {
            const response = await fetch('/api/parties');
            if (!response.ok) throw new Error('Failed to fetch parties');
            return response.json() as Promise<Party[]>;
        },
    });
}
