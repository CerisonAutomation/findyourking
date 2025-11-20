'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Eye,
  Crown,
  Bell,
  Settings,
  User,
  TrendingUp,
  Calendar,
  Star,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  BarChart3,
  Sparkles,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

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

interface DashboardClientProps {
  initialData: DashboardData;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time subscriptions for live updates
  useRealtimeSubscription(
    'user_activity',
    `user_id=eq.${data.user.id}`,
    {
      onInsert: (payload: any) => {
        setData(prev => ({
          ...prev,
          recentActivity: [payload.new as any, ...prev.recentActivity.slice(0, 9)],
        }));
      }
    }
  );

  useRealtimeSubscription(
    'notifications',
    `user_id=eq.${data.user.id}`,
    {
      onInsert: (payload: any) => {
        setData(prev => ({
          ...prev,
          notifications: [payload.new as any, ...prev.notifications.slice(0, 4)],
        }));
      }
    }
  );

  // Polling for real-time stats updates
  useEffect(() => {
    const pollStats = async () => {
      try {
        const response = await fetch('/api/user/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const updatedStats = await response.json();
          setData(prev => ({
            ...prev,
            stats: updatedStats,
          }));
        }
      } catch (error) {
        console.error('Failed to poll stats:', error);
      }
    };

    // Poll every 30 seconds
    const interval = setInterval(pollStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Revalidate the dashboard data
      await fetch('/api/revalidate?path=/dashboard', { method: 'POST' });
      // Reload the page to get fresh data
      router.refresh();
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'match': return <Heart className="w-4 h-4 text-pink-400" />;
      case 'like': return <Heart className="w-4 h-4 text-red-400" />;
      case 'message': return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'view': return <Eye className="w-4 h-4 text-green-400" />;
      default: return <Zap className="w-4 h-4 text-purple-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'match': return 'border-pink-500/50 bg-pink-500/10';
      case 'like': return 'border-red-500/50 bg-red-500/10';
      case 'message': return 'border-blue-500/50 bg-blue-500/10';
      case 'view': return 'border-green-500/50 bg-green-500/10';
      default: return 'border-purple-500/50 bg-purple-500/10';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const profileCompletion = data.user.profile ? (
    (data.user.profile.bio ? 25 : 0) +
    (data.user.profile.photos?.length > 0 ? 25 : 0) +
    (data.user.profile.interests?.length > 0 ? 25 : 0) +
    (data.user.profile.location ? 25 : 0)
  ) : 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
        <div className="container mx-auto px-6 py-16 max-w-7xl">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-linear-to-r from-white to-purple-200">
                  Welcome back, {data.user.profile?.name || 'User'}! 👋
                </h1>
                <p className="text-gray-400 text-lg">
                  Here's what's happening with your account today
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>

                {data.premiumStatus.isPremium && (
                  <Badge className="bg-linear-to-r from-amber-500 to-orange-500 text-white border-0">
                    <Crown className="w-4 h-4 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completion Alert */}
          {profileCompletion < 100 && (
            <Alert className="mb-8 border-blue-500/50 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Complete your profile</strong> to get more matches!
                    <div className="mt-2">
                      <Progress value={profileCompletion} className="w-48" />
                      <span className="text-sm text-blue-300 mt-1 block">
                        {profileCompletion}% complete
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/profile">
                      Complete Profile
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-purple-500/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{data.stats.totalViews.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Profile Views</p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-400" />
                </div>
                <div className="mt-2 flex items-center text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% this week
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-pink-500/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{data.stats.totalLikes.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Likes Given</p>
                  </div>
                  <Heart className="w-8 h-8 text-pink-400" />
                </div>
                <div className="mt-2 flex items-center text-pink-400 text-sm">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Keep liking!
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-green-500/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{data.stats.totalMatches.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Matches</p>
                  </div>
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <div className="mt-2 flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Great progress!
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-blue-500/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{data.stats.activeConversations.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Active Chats</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-blue-400" />
                </div>
                <div className="mt-2 flex items-center text-blue-400 text-sm">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {data.stats.activeConversations > 0 ? 'Reply now!' : 'Start chatting!'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Actions */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Jump into the most important features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button asChild className="h-auto p-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Link href="/matches" className="flex items-center gap-3">
                        <Heart className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-semibold">Find Matches</div>
                          <div className="text-sm opacity-90">Discover new connections</div>
                        </div>
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto p-4 border-white/20 hover:bg-white/10">
                      <Link href="/chat" className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-semibold">View Messages</div>
                          <div className="text-sm opacity-90">
                            {data.stats.activeConversations} active chats
                          </div>
                        </div>
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto p-4 border-white/20 hover:bg-white/10">
                      <Link href="/profile" className="flex items-center gap-3">
                        <User className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-semibold">Edit Profile</div>
                          <div className="text-sm opacity-90">
                            {profileCompletion}% complete
                          </div>
                        </div>
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto p-4 border-white/20 hover:bg-white/10">
                      <Link href="/settings" className="flex items-center gap-3">
                        <Settings className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-semibold">Settings</div>
                          <div className="text-sm opacity-90">Manage preferences</div>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest interactions and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {data.recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border ${getActivityColor(activity.type)}`}
                        >
                          <div className="shrink-0">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                          {activity.relatedUser && (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={activity.relatedUser.avatar} />
                                <AvatarFallback>
                                  {activity.relatedUser.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-300">
                                {activity.relatedUser.name}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No recent activity yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Start exploring to see your activity here!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Notifications */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-400" />
                    Notifications
                    {data.notifications.length > 0 && (
                      <Badge className="bg-orange-500 text-white">
                        {data.notifications.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.notifications.length > 0 ? (
                    <div className="space-y-3">
                      {data.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <p className="text-sm font-medium text-white">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      ))}
                      <Button asChild variant="ghost" size="sm" className="w-full">
                        <Link href="/notifications">
                          View All Notifications
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No new notifications</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Premium Status */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    Premium Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.premiumStatus.isPremium ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {data.premiumStatus.plan} Plan
                          </p>
                          <p className="text-sm text-gray-400">
                            Active until {data.premiumStatus.expiresAt ?
                              new Date(data.premiumStatus.expiresAt).toLocaleDateString() :
                              'N/A'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Premium Features:</h4>
                        {data.premiumStatus.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-linear-to-r from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto">
                        <Crown className="w-8 h-8 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-2">Upgrade to Premium</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Unlock unlimited matches, advanced filters, and premium features
                        </p>
                        <Button asChild className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                          <Link href="/pricing">
                            Go Premium
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Profile Completion */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-green-400" />
                    Profile Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Overall Progress</span>
                        <span className="text-white font-medium">{profileCompletion}%</span>
                      </div>
                      <Progress value={profileCompletion} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      {[
                        { label: 'Add profile photo', completed: data.user.profile?.photos?.length > 0 },
                        { label: 'Write bio', completed: !!data.user.profile?.bio },
                        { label: 'Add interests', completed: data.user.profile?.interests?.length > 0 },
                        { label: 'Set location', completed: !!data.user.profile?.location },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {item.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-600" />
                          )}
                          <span className={item.completed ? 'text-gray-300' : 'text-gray-500'}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {profileCompletion < 100 && (
                      <Button asChild size="sm" className="w-full">
                        <Link href="/profile">Complete Profile</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}