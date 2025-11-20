'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Settings,
  User,
  Shield,
  Bell,
  CreditCard,
  Trash2,
  Crown,
  Search,
  Briefcase,
  LogOut,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile } from '../profile/page';

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [canChangeRole, setCanChangeRole] = useState(true);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // AI Boyfriend management functions
  const getUnmatchedBoyfriends = () => {
    if (typeof window === 'undefined') return [];
    const unmatchedIds = JSON.parse(localStorage.getItem('unmatchedBoyfriends') || '[]');
    const allBoyfriends = [
      { id: 'ethan_mindful', name: 'Ethan - The Mindful King', avatar: '/default-avatar.png' },
      { id: 'marcus_wellness', name: 'Marcus - The Gym Bestie', avatar: '/default-avatar.png' },
      { id: 'alex_creative', name: 'Alex - The Creative Genius', avatar: '/default-avatar.png' },
      { id: 'jordan_adventure', name: 'Jordan - The Adventure Buddy', avatar: '/default-avatar.png' },
      { id: 'kai_therapist', name: 'Kai - The Therapy Friend', avatar: '/default-avatar.png' },
      { id: 'noah_balance', name: 'Noah - The Balanced King', avatar: '/default-avatar.png' },
    ];
    return allBoyfriends.filter(bf => unmatchedIds.includes(bf.id));
  };

  const handleRematch = (boyfriendId: string) => {
    if (typeof window === 'undefined') return;
    const unmatchedBoyfriends = JSON.parse(localStorage.getItem('unmatchedBoyfriends') || '[]');
    const updatedList = unmatchedBoyfriends.filter((id: string) => id !== boyfriendId);
    localStorage.setItem('unmatchedBoyfriends', JSON.stringify(updatedList));

    // Show success message
    setMessage('Boyfriend rematched successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const loadUserData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*, last_role_change_at')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      setUser(profile as UserProfile);
      setCurrentRole(profile.user_role || 'seeker');

      // Check if user can change role
      if (profile.last_role_change_at) {
        const lastChange = new Date(profile.last_role_change_at);
        const now = new Date();
        const hoursSinceChange =
          (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60);

        if (hoursSinceChange < 24) {
          setCanChangeRole(false);
          setHoursRemaining(Math.ceil(24 - hoursSinceChange));
        }
      }
    }
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  async function handleRoleChange(newRole: string) {
    if (!canChangeRole) {
      setMessage(`You can change your role in ${hoursRemaining} hours`);
      return;
    }

    setLoading(true);
    setMessage('');

    if (!user) {
      setMessage('User not found');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('update_user_role', {
      p_user_id: user.id,
      p_new_role: newRole,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data && !data.success) {
      setMessage(data.error || 'Failed to update role');
      setHoursRemaining(data.hours_remaining || 0);
      setCanChangeRole(false);
      setLoading(false);
      return;
    }

    setMessage('Role updated successfully! Redirecting...');
    setCurrentRole(newRole);
    setCanChangeRole(false);
    setHoursRemaining(24);

    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

    setLoading(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
  }

  const roles = [
    {
      id: 'seeker',
      name: 'Seeker',
      icon: Search,
      description: 'Find and book amazing providers',
      color: 'from-pink-500 to-rose-500',
    },
    {
      id: 'provider',
      name: 'Provider',
      icon: Briefcase,
      description: 'Offer services and grow your business',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'admin',
      name: 'Admin',
      icon: Shield,
      description: 'Manage platform and users',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-black">Settings</h1>
          </div>
          <p className="text-gray-400">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Profile Information</h2>
          </div>

          {user && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Username</label>
                <p className="text-white font-medium">
                  {user.username || 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Current Role</label>
                <p className="text-white font-medium capitalize">
                  {currentRole}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Role Change Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold">Change Role</h2>
            </div>
            {!canChangeRole && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{hoursRemaining}h remaining</span>
              </div>
            )}
          </div>

          <p className="text-gray-400 mb-6">
            You can change your role once every 24 hours. Choose the role that
            best fits your needs.
          </p>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes('success') || message.includes('Redirecting')
                  ? 'bg-green-500/20 border border-green-500/50 text-green-200'
                  : 'bg-amber-500/20 border border-amber-500/50 text-amber-200'
              }`}
            >
              <p>{message}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = currentRole === role.id;

              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  disabled={loading || !canChangeRole || isSelected}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/20'
                      : canChangeRole
                        ? 'border-white/10 hover:border-purple-500/50 bg-white/5'
                        : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`w-12 h-12 rounded-lg bg-linear-to-br ${role.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="font-bold mb-2">{role.name}</h3>
                  <p className="text-sm text-gray-400">{role.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Other Settings */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold">Notifications</h3>
            </div>
            <p className="text-sm text-gray-400">
              Manage your notification preferences
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold">Billing</h3>
            </div>
            <p className="text-sm text-gray-400">
              View subscription and payment methods
            </p>
          </div>
        </div>

        {/* AI Boyfriend Management */}
        <div className="bg-linear-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-violet-400 flex items-center gap-2">
            <Crown className="w-6 h-6" />
            AI Boyfriends
          </h2>
          <p className="text-gray-300 mb-6">
            Manage your AI boyfriend matches. Rematch previously unmatched boyfriends.
          </p>

          <div className="space-y-4">
            <h3 className="font-semibold text-white mb-3">Unmatched Boyfriends</h3>
            {getUnmatchedBoyfriends().length === 0 ? (
              <p className="text-gray-400 text-sm">No unmatched boyfriends to rematch.</p>
            ) : (
              <div className="grid gap-3">
                {getUnmatchedBoyfriends().map((bf) => (
                  <div key={bf.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={bf.avatar}
                        alt={bf.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-white">{bf.name}</h4>
                        <p className="text-sm text-gray-400">AI Personality</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRematch(bf.id)}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Rematch
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Danger Zone</h2>
          <p className="text-gray-300 mb-6">
            These actions are permanent and cannot be undone.
          </p>

          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
