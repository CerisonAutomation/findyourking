'use client';

import Link from 'next/link';
import { Users, CheckCircle, BarChart3, Calendar, AlertCircle, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const cards = [
    {
      title: "User Management",
      description: "View and manage all users",
      href: "/admin/users",
      Icon: Users,
    },
    {
      title: "Provider Verification",
      description: "Verify and manage providers",
      href: "/admin/verification",
      Icon: CheckCircle,
    },
    {
      title: "Analytics",
      description: "View platform analytics",
      href: "/admin/analytics",
      Icon: BarChart3,
    },
    {
      title: "Bookings",
      description: "Monitor booking activity",
      href: "/admin/bookings",
      Icon: Calendar,
    },
    {
      title: "Reports",
      description: "View user reports",
      href: "/admin/reports",
      Icon: AlertCircle,
    },
    {
      title: "Settings",
      description: "Manage platform settings",
      href: "/admin/settings",
      Icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Manage users, verify providers, and monitor platform health
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
}: {
  title: string;
  description: string;
  href: string;
  Icon: React.ComponentType<{ size: number; className?: string }>;
}) {
  return (
    <Link href={href}>
      <div className="p-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-blue-500/50 rounded-lg transition-all cursor-pointer transform hover:scale-105">
        <Icon size={32} className="mb-3 text-blue-400" />
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
