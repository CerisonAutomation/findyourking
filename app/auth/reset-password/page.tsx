"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updatePassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // User must be authenticated to reset password
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(newPassword);

      if (!result.success) {
        setError(result.error || "Failed to update password");
        return;
      }

      setSuccess(result.message || "Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 border-opacity-75"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-black to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-linear-to-br from-purple-700/20 to-yellow-600/20 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-linear-to-br from-yellow-600/20 to-purple-700/20 rounded-full blur-3xl opacity-40"></div>
      </div>

      {/* Reset Card */}
      <div className="max-w-md w-full mx-4 relative">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-2">Reset Password</h1>
            <p className="text-gray-400 text-sm">Create a new password for your account</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleResetPassword}>
            {/* New Password Input */}
            <div>
              <label htmlFor="new-password" className="block text-sm font-semibold text-gray-200 mb-2">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/10 text-white placeholder-gray-500 transition-all duration-300 hover:border-white/20"
              />
              <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-200 mb-2">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/10 text-white placeholder-gray-500 transition-all duration-300 hover:border-white/20"
              />
            </div>

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-green-200 text-sm">{success}</p>
                <p className="text-green-200/70 text-xs mt-1">Redirecting...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-linear-to-r from-purple-600 to-yellow-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-yellow-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-600/10 rounded-full blur-2xl opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-2xl opacity-20 pointer-events-none"></div>
      </div>
    </div>
  );
}
