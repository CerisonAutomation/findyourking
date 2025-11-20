"use client";

import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";

interface AuthSettings {
  auth_method_default: 'magic_link' | 'email_password';
  social_login_providers: {
    google: boolean;
    facebook: boolean;
    twitter: boolean;
    email_password: boolean;
    magic_link: boolean;
  };
}

export default function AdminDashboard() {
  const [settings, setSettings] = useState<AuthSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load settings' });
      }
    } catch (error) {
      // Error state set
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateProvider = (provider: keyof AuthSettings['social_login_providers'], enabled: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      social_login_providers: {
        ...settings.social_login_providers,
        [provider]: enabled,
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading admin settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Platform management and oversight
          </p>
        </div>

        {/* Auth Settings Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Authentication Settings</h2>
              <p className="text-gray-400">Control login methods and social providers</p>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          {/* Default Auth Method */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Default Authentication Method</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="auth_method"
                  value="magic_link"
                  checked={settings?.auth_method_default === 'magic_link'}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    auth_method_default: e.target.value as 'magic_link'
                  } : null)}
                  className="mr-3 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-white">Magic Link (Email)</span>
                <span className="text-gray-400 text-sm ml-2">Users receive a login link via email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="auth_method"
                  value="email_password"
                  checked={settings?.auth_method_default === 'email_password'}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    auth_method_default: e.target.value as 'email_password'
                  } : null)}
                  className="mr-3 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-white">Email & Password</span>
                <span className="text-gray-400 text-sm ml-2">Traditional email/password login</span>
              </label>
            </div>
          </div>

          {/* Social Login Providers */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Social Login Providers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📧</span>
                  <div>
                    <span className="text-white font-medium">Email/Password</span>
                    <p className="text-gray-400 text-sm">Traditional authentication</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.social_login_providers.email_password}
                  onChange={(e) => updateProvider('email_password', e.target.checked)}
                  className="w-5 h-5 text-pink-500 focus:ring-pink-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✨</span>
                  <div>
                    <span className="text-white font-medium">Magic Link</span>
                    <p className="text-gray-400 text-sm">Passwordless email login</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.social_login_providers.magic_link}
                  onChange={(e) => updateProvider('magic_link', e.target.checked)}
                  className="w-5 h-5 text-pink-500 focus:ring-pink-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🔍</span>
                  <div>
                    <span className="text-white font-medium">Google</span>
                    <p className="text-gray-400 text-sm">Google OAuth login</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.social_login_providers.google}
                  onChange={(e) => updateProvider('google', e.target.checked)}
                  className="w-5 h-5 text-pink-500 focus:ring-pink-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📘</span>
                  <div>
                    <span className="text-white font-medium">Facebook</span>
                    <p className="text-gray-400 text-sm">Facebook OAuth login</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.social_login_providers.facebook}
                  onChange={(e) => updateProvider('facebook', e.target.checked)}
                  className="w-5 h-5 text-pink-500 focus:ring-pink-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg md:col-span-2">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🐦</span>
                  <div>
                    <span className="text-white font-medium">Twitter</span>
                    <p className="text-gray-400 text-sm">Twitter OAuth login</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.social_login_providers.twitter}
                  onChange={(e) => updateProvider('twitter', e.target.checked)}
                  className="w-5 h-5 text-pink-500 focus:ring-pink-500 rounded"
                />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-pink-500 to-red-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Other Admin Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">User Management</h3>
            <p className="text-gray-400">Manage platform users</p>
          </div>

          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
            <p className="text-gray-400">Platform metrics and insights</p>
          </div>

          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">🚫</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Moderation</h3>
            <p className="text-gray-400">Content moderation tools</p>
          </div>

          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Financial</h3>
            <p className="text-gray-400">Revenue and payment management</p>
          </div>

          <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-500/50 transition-all cursor-pointer transform hover:scale-105">
            <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3">
              <span className="text-pink-400 text-xl">🔧</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Maintenance</h3>
            <p className="text-gray-400">System maintenance tools</p>
          </div>
        </div>
      </div>
    </div>
  );
}