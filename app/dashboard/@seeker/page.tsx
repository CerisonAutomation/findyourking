import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import DashboardSkeleton from './DashboardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UserStats } from '@/lib/types/database';

interface DashboardData {
  user: {
    id: string;
    email: string;
    profile: any;
    created_at: string;
  };
  stats: {
    totalViews: number;
    totalLikes: number;
    totalMatches: number;
    activeConversations: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'match' | 'like' | 'message' | 'view';
    description: string;
    timestamp: string;
    relatedUser?: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  }>;
  premiumStatus: {
    isPremium: boolean;
    plan?: string;
    expiresAt?: string;
    features: string[];
  };
}

/**
 * Fetch dashboard data server-side
 */
async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get user statistics - calculate from database tables
  const [
    { count: totalViews },
    { count: totalLikes },
    { count: totalMatches },
    { count: activeConversations }
  ] = await Promise.all([
    supabase.from('user_activity').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'view'),
    supabase.from('user_activity').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'like'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  ]);

  const stats: UserStats = {
    totalViews: totalViews ?? 0,
    totalLikes: totalLikes ?? 0,
    totalMatches: totalMatches ?? 0,
    activeConversations: activeConversations ?? 0,
  };

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentActivity } = await supabase
    .from('user_activity')
    .select(`
      id,
      type,
      description,
      created_at,
      related_user_id,
      related_user:profiles!related_user_id(full_name, avatar_url)
    `)
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  // Get unread notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get premium status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  const premiumStatus = {
    isPremium: !!subscription,
    plan: subscription?.plan_name,
    expiresAt: subscription?.current_period_end,
    features: subscription?.features || [],
  };

  return {
    user: {
      id: user.id,
      email: user.email!,
      profile,
      created_at: user.created_at,
    },
    stats,
    recentActivity: (recentActivity || []).map((activity: any) => ({
      id: activity.id,
      type: activity.type as 'message' | 'like' | 'match' | 'view',
      description: activity.description,
      timestamp: activity.created_at,
      relatedUser: activity.related_user?.[0] ? {
        id: activity.related_user_id,
        name: activity.related_user[0].name,
        avatar: activity.related_user[0].avatar_url,
      } : undefined,
    })),
    notifications: notifications || [],
    premiumStatus,
  };
}

/**
 * Server component for the dashboard
 */
export default async function SeekerDashboard() {
  try {
    const dashboardData = await getDashboardData();

    return (
      <ErrorBoundary>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardClient initialData={dashboardData} />
        </Suspense>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    redirect('/auth');
  }
}