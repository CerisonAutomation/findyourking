import {createClient} from '@/lib/supabase/client'
import type {Database} from '@/types/supabase'

type Match = Database['public']['Tables']['matches']['Row']
type MatchInsert = Database['public']['Tables']['matches']['Insert']
type MatchUpdate = Database['public']['Tables']['matches']['Update']

export interface MatchFilters {
    matchType: 'all' | 'mutual' | 'pending' | 'expired'
    ageRange?: [number, number]
    distance?: number
    interests?: string[]
    verified?: boolean
}

export class MatchService {
    private supabase = createClient()

    async getMatches(filters: MatchFilters = {matchType: 'all'}): Promise<Match[]> {
        let query = this.supabase
            .from('matches')
            .select(`
        *,
        user_profile:profiles!matches_user_id_fkey(
          id,
          username,
          avatar_url,
          bio,
          interests,
          age,
          location,
          verified
        ),
        matched_profile:profiles!matches_matched_user_id_fkey(
          id,
          username,
          avatar_url,
          bio,
          interests,
          age,
          location,
          verified
        )
      `)

        // Apply filters
        if (filters.matchType !== 'all') {
            switch (filters.matchType) {
                case 'mutual':
                    query = query.eq('status', 'matched')
                    break
                case 'pending':
                    query = query.eq('status', 'pending')
                    break
                case 'expired':
                    query = query.eq('status', 'expired')
                    break
            }
        }

        const {data, error} = await query.orderBy('created_at', {ascending: false})

        if (error) throw error
        return data || []
    }

    async createMatch(match: MatchInsert): Promise<Match> {
        const {data, error} = await this.supabase
            .from('matches')
            .insert(match)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async updateMatch(id: string, updates: MatchUpdate): Promise<Match> {
        const {data, error} = await this.supabase
            .from('matches')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async deleteMatch(id: string): Promise<void> {
        const {error} = await this.supabase
            .from('matches')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    async swipe(userId: string, action: 'like' | 'pass'): Promise<void> {
        const {data: {user}} = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const {error} = await this.supabase
            .from('swipes')
            .insert({
                swiper_id: user.id,
                swiped_id: userId,
                action,
                created_at: new Date().toISOString()
            })

        if (error) throw error
    }

    async getCompatibilityScore(userId1: string, userId2: string): Promise<number> {
        // Mock implementation - in production this would use the AI matching engine
        return Math.floor(Math.random() * 30) + 70 // 70-100 score
    }
}

export const matchService = new MatchService()