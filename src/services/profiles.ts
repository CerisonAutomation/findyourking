import {createClient} from '@/lib/supabase/client'
import type {Database} from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export interface ProfileWithDistance extends Profile {
    distance?: number
}

export class ProfilesService {
    private supabase = createClient()

    async getById(id: string): Promise<Profile | null> {
        const {data, error} = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    async getByUsername(username: string): Promise<Profile | null> {
        const {data, error} = await this.supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single()

        if (error) throw error
        return data
    }

    async create(profile: ProfileInsert): Promise<Profile> {
        const {data, error} = await this.supabase
            .from('profiles')
            .insert(profile)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async update(id: string, updates: ProfileUpdate): Promise<Profile> {
        const {data, error} = await this.supabase
            .from('profiles')
            .update({...updates, updated_at: new Date().toISOString()})
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async delete(id: string): Promise<void> {
        const {error} = await this.supabase
            .from('profiles')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    async search(query: string, limit = 20): Promise<Profile[]> {
        const {data, error} = await this.supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(limit)

        if (error) throw error
        return data || []
    }

    async list(filters?: {
        minAge?: number
        maxAge?: number
        interests?: string[]
        verified?: boolean
        limit?: number
        offset?: number
    }): Promise<Profile[]> {
        let query = this.supabase.from('profiles').select('*')

        if (filters?.verified !== undefined) {
            query = query.eq('is_verified', filters.verified)
        }

        if (filters?.interests && filters.interests.length > 0) {
            query = query.contains('interests', filters.interests)
        }

        if (filters?.limit) {
            query = query.limit(filters.limit)
        }

        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
        }

        query = query.order('created_at', {ascending: false})

        const {data, error} = await query

        if (error) throw error
        return data || []
    }

    async uploadAvatar(userId: string, file: File): Promise<string> {
        const fileExt = file.name.split('.').pop()
        const filePath = `${userId}/avatar.${fileExt}`

        const {error: uploadError} = await this.supabase.storage
            .from('avatars')
            .upload(filePath, file, {upsert: true})

        if (uploadError) throw uploadError

        const {data} = this.supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        await this.update(userId, {avatar_url: data.publicUrl})

        return data.publicUrl
    }

    async deleteAvatar(userId: string, avatarUrl: string): Promise<void> {
        const path = avatarUrl.split('/').slice(-2).join('/')

        const {error} = await this.supabase.storage
            .from('avatars')
            .remove([path])

        if (error) throw error

        await this.update(userId, {avatar_url: null})
    }

    async blockUser(blockerId: string, blockedId: string): Promise<void> {
        const {error} = await this.supabase
            .from('blocks')
            .insert({blocker_id: blockerId, blocked_id: blockedId})

        if (error) throw error
    }

    async unblockUser(blockerId: string, blockedId: string): Promise<void> {
        const {error} = await this.supabase
            .from('blocks')
            .delete()
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId)

        if (error) throw error
    }

    async getBlockedUsers(userId: string): Promise<string[]> {
        const {data, error} = await this.supabase
            .from('blocks')
            .select('blocked_id')
            .eq('blocker_id', userId)

        if (error) throw error
        return data?.map((b) => b.blocked_id) || []
    }
}

export const profilesService = new ProfilesService()
