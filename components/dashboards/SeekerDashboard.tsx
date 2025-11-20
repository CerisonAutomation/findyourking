'use client';

import Link from 'next/link';
import { Search, Calendar, MessageCircle, Heart, User, Settings, Crown } from 'lucide-react';

export default function SeekerDashboard() {
  const cards = [
    {
      title: "Discover Providers",
      description: "Browse and find amazing providers",
      href: "/matches",
      Icon: Search,
    },
    {
      title: "My Bookings",
      description: "View and manage your bookings",
      href: "/bookings",
      Icon: Calendar,
    },
    {
      title: "Messages",
      description: "Chat with your connections",
      href: "/chat",
      Icon: MessageCircle,
    },
    {
      title: "Favorites",
      description: "View your saved providers",
      href: "/favorites",
      Icon: Heart,
    },
    {
      title: "Profile",
      description: "View and edit your profile",
      href: "/profile",
      Icon: User,
    },
    {
      title: "Account Settings",
      description: "Manage your account",
      href: "/settings",
      Icon: Settings,
    },
    {
      title: "Go Premium",
      description: "Unlock unlimited features",
      href: "/pricing",
      Icon: Crown,
      premium: true,
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Discover & Connect
          </h1>
          <p className="text-gray-400">
            Find amazing providers and book your next experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <DashboardCard key={card.href} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  Icon,
  premium,
}: {
  title: string;
  description: string;
  href: string;
  Icon: React.ComponentType<{ size: number; className?: string }>;
  premium?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`p-6 rounded-lg transition-all cursor-pointer transform hover:scale-105 ${
        premium 
          ? 'bg-linear-to-br from-amber-500/20 to-pink-500/20 border-2 border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/30' 
          : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50'
      }`}>
        <Icon size={32} className={premium ? 'mb-3 text-amber-400' : 'mb-3 text-pink-400'} />
        <h3 className={`text-xl font-bold mb-2 ${premium ? 'text-amber-300' : 'text-white'}`}>
          {title}
          {premium && (
            <span className="ml-2 text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded">
              Premium
            </span>
          )}
        </h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
