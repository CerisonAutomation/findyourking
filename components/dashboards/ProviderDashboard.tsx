'use client';

import Link from 'next/link';

export default function ProviderDashboard() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Manage Your Business
          </h1>
          <p className="text-gray-400">
            Grow your services and manage your schedule
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Booking Requests"
            description="Accept or decline new bookings"
            href="/provider/bookings"
            icon="📬"
          />
          <DashboardCard
            title="My Availability"
            description="Set your available time slots"
            href="/provider/calendar"
            icon="📆"
          />
          <DashboardCard
            title="Rates & Services"
            description="Manage your hourly rates"
            href="/provider/rates"
            icon="💰"
          />
          <DashboardCard
            title="Earnings"
            description="Track your income"
            href="/provider/earnings"
            icon="📊"
          />
          <DashboardCard
            title="Messages"
            description="Respond to inquiries"
            href="/chat"
            icon="💬"
          />
          <DashboardCard
            title="Profile"
            description="Edit your provider profile"
            href="/profile"
            icon="👤"
          />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link href={href}>
      <div className="p-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-purple-500/50 rounded-lg transition-all cursor-pointer transform hover:scale-105">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
