'use client';

import React from 'react';
import Link from 'next/link';
import {
  Crown,
  Star,
  Heart,
  RotateCcw,
  Megaphone,
  BarChart3,
  Eye,
  MessageCircle,
  Video,
  Shield,
  Settings,
  Zap,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

export default function KingDashboard(): React.ReactElement {
  const kingFeatures = [
    {
      title: 'Unlimited Likes',
      description: 'Like as many profiles as you want, every day',
      href: '/matches',
      Icon: Heart,
      color: 'from-red-500 to-pink-500',
      badge: 'Premium',
    },
    {
      title: 'Super Likes',
      description: '10 Super Likes per month - get noticed first',
      href: '/matches',
      Icon: Zap,
      color: 'from-amber-500 to-orange-500',
      badge: '10/mo',
    },
    {
      title: 'Rewind',
      description: 'Take back your last action, no regrets',
      href: '/matches',
      Icon: RotateCcw,
      color: 'from-purple-500 to-indigo-500',
      badge: 'Unlimited',
    },
    {
      title: 'Spotlight',
      description: 'Get featured to more matches (5 per month)',
      href: '/matches',
      Icon: Megaphone,
      color: 'from-yellow-500 to-amber-500',
      badge: '5/mo',
    },
    {
      title: 'Advanced Search',
      description: 'Filter by detailed preferences & interests',
      href: '/matches',
      Icon: BarChart3,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Exclusive',
    },
    {
      title: 'Who Viewed You',
      description: 'See exactly who checked out your profile',
      href: '/dashboard',
      Icon: Eye,
      color: 'from-teal-500 to-green-500',
      badge: 'New',
    },
    {
      title: 'Instant Chat Priority',
      description: 'Your messages appear at top of inbox',
      href: '/chat',
      Icon: MessageCircle,
      color: 'from-pink-500 to-rose-500',
      badge: 'Active',
    },
    {
      title: 'Video Verification',
      description: 'Get verified badge with video selfie',
      href: '/profile/edit',
      Icon: Video,
      color: 'from-green-500 to-emerald-500',
      badge: 'Trust',
    },
  ];

  const stats = [
    {
      label: 'Profile Views',
      value: '1,284',
      Icon: Eye,
      color: 'text-blue-400',
    },
    {
      label: 'Total Likes',
      value: '423',
      Icon: Heart,
      color: 'text-red-400',
    },
    {
      label: 'Match Rate',
      value: '78%',
      Icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Response Rate',
      value: '94%',
      Icon: CheckCircle,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* King Header */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-linear-to-r from-amber-500/20 to-pink-500/20 rounded-2xl blur-2xl"></div>
          <div className="relative backdrop-blur-xl bg-linear-to-r from-amber-500/10 to-pink-500/10 border border-amber-500/30 rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Crown size={40} className="text-amber-400 drop-shadow-lg animate-pulse" />
                  <Zap size={20} className="absolute -bottom-1 -right-1 text-yellow-300" />
                </div>
                <div>
                  <h1 className="text-4xl font-black bg-linear-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">
                    King Profile
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Premium Elite Membership Active
                  </p>
                </div>
              </div>
              <Link href="/profile/edit">
                <button className="px-6 py-3 bg-linear-to-r from-amber-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all transform hover:scale-105">
                  Edit Profile
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* King Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => {
            const Icon = stat.Icon;
            return (
              <div
                key={stat.label}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-6 transition-all transform hover:scale-105"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                  <Icon size={20} className={stat.color} />
                </div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Premium Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <Star size={28} className="text-amber-400" />
            <span>Premium Features</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kingFeatures.map((feature) => {
              const Icon = feature.Icon;
              return (
                <Link key={feature.title} href={feature.href}>
                  <div className="group h-full p-6 bg-linear-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-amber-500/50 rounded-xl transition-all transform hover:scale-105 cursor-pointer">
                    {/* Badge */}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-xs font-semibold text-amber-300">
                      {feature.badge}
                    </div>

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg bg-linear-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-amber-500/50 transition-all`}>
                      <Icon size={24} className="text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* King Badges Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <Shield size={28} className="text-emerald-400" />
            <span>Your Badges</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                badge: 'verified',
                title: 'Verified',
                description: 'Photo & ID verified',
                Icon: CheckCircle,
                color: 'emerald',
              },
              {
                badge: 'superstar',
                title: 'Superstar',
                description: 'Top 5% on platform',
                Icon: Star,
                color: 'amber',
              },
              {
                badge: 'video_verified',
                title: 'Video Verified',
                description: 'Live video checked',
                Icon: Video,
                color: 'blue',
              },
            ].map((b) => {
              const Icon = b.Icon;
              const colorClass = {
                emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/50',
                amber: 'from-amber-500/20 to-yellow-500/20 border-amber-500/50',
                blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/50',
              }[b.color];

              return (
                <div
                  key={b.badge}
                  className={`p-6 bg-linear-to-br ${colorClass} border rounded-lg`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Icon
                      size={24}
                      className={`text-${b.color}-400`}
                    />
                    <h3 className="text-lg font-bold text-white">
                      {b.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/profile/edit">
            <button className="w-full p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all transform hover:scale-105">
              <Settings size={24} className="mx-auto mb-2 text-blue-400" />
              <p className="font-semibold text-white">Profile Settings</p>
              <p className="text-xs text-gray-400 mt-1">
                Manage your information
              </p>
            </button>
          </Link>

          <Link href="/chat">
            <button className="w-full p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all transform hover:scale-105">
              <MessageCircle size={24} className="mx-auto mb-2 text-pink-400" />
              <p className="font-semibold text-white">Instant Chat</p>
              <p className="text-xs text-gray-400 mt-1">Priority inbox</p>
            </button>
          </Link>

          <Link href="/dashboard">
            <button className="w-full p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all transform hover:scale-105">
              <BarChart3 size={24} className="mx-auto mb-2 text-purple-400" />
              <p className="font-semibold text-white">Analytics</p>
              <p className="text-xs text-gray-400 mt-1">View insights</p>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
