import {createClient} from '@/lib/supabase/client'
import type {Database} from '@/types/supabase'

type Report = Database['public']['Tables']['reports']['Row']
type ReportInsert = Database['public']['Tables']['reports']['Insert']

export type ReportReason =
    | 'inappropriate_content'
    | 'fake_profile'
    | 'harassment'
    | 'spam'
    | 'other'

export interface CreateReportInput {
    reportedId: string
    reason: ReportReason
    description?: string
}

export class ReportsService {
    private supabase = createClient()

    async create(input: CreateReportInput, reporterId: string): Promise<Report> {
        // Check if user already reported this person
        const {data: existing} = await this.supabase
            .from('reports')
            .select('id')
            .eq('reporter_id', reporterId)
            .eq('reported_id', input.reportedId)
            .single()

        if (existing) {
            throw new Error('You have already reported this user')
        }

        const {data, error} = await this.supabase
            .from('reports')
            .insert({
                reporter_id: reporterId,
                reported_id: input.reportedId,
                reason: input.reason,
                description: input.description || null,
                status: 'pending',
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    async getById(id: string): Promise<Report | null> {
        const {data, error} = await this.supabase
            .from('reports')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    async getByReporter(reporterId: string): Promise<Report[]> {
        const {data, error} = await this.supabase
            .from('reports')
            .select('*')
            .eq('reporter_id', reporterId)
            .order('created_at', {ascending: false})

        if (error) throw error
        return data || []
    }

    async getByReported(reportedId: string): Promise<Report[]> {
        const {data, error} = await this.supabase
            .from('reports')
            .select('*')
            .eq('reported_id', reportedId)
            .order('created_at', {ascending: false})

        if (error) throw error
        return data || []
    }

    async updateStatus(
        id: string,
        status: 'pending' | 'reviewed' | 'resolved'
    ): Promise<Report> {
        const {data, error} = await this.supabase
            .from('reports')
            .update({status})
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }

    async blockAndReport(
        reporterId: string,
        reportedId: string,
        reason: ReportReason,
        description?: string
    ): Promise<void> {
        // Create report
        await this.create({reportedId, reason, description}, reporterId)

        // Block user
        const {error: blockError} = await this.supabase
            .from('blocks')
            .insert({
                blocker_id: reporterId,
                blocked_id: reportedId,
            })

        if (blockError && !blockError.message.includes('duplicate')) {
            throw blockError
        }
    }

    async hasReported(reporterId: string, reportedId: string): Promise<boolean> {
        const {data, error} = await this.supabase
            .from('reports')
            .select('id')
            .eq('reporter_id', reporterId)
            .eq('reported_id', reportedId)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return !!data
    }

    async hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
        const {data, error} = await this.supabase
            .from('blocks')
            .select('id')
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return !!data
    }

    async unblock(blockerId: string, blockedId: string): Promise<void> {
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

export const reportsService = new ReportsService()
