export default function ProviderDashboard() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Provider Dashboard
          </h1>
          <p className="text-gray-400">
            Manage your services and connect with seekers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
            <p className="text-gray-400">View your performance metrics</p>
          </div>

          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">📅</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Bookings</h3>
            <p className="text-gray-400">Manage your appointments</p>
          </div>

          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Messages</h3>
            <p className="text-gray-400">Communicate with clients</p>
          </div>

          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">⚙️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Services</h3>
            <p className="text-gray-400">Manage your offerings</p>
          </div>

          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">👤</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Profile</h3>
            <p className="text-gray-400">Update your provider profile</p>
          </div>

          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Earnings</h3>
            <p className="text-gray-400">Track your income</p>
          </div>
        </div>
      </div>
    </div>
  );
}