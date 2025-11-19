"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  signUpWithPassword,
  signInWithPassword,
  signInWithMagicLink,
  requestPasswordReset,
} from "@/lib/actions/auth";

type AuthMode = "signin" | "signup" | "forgot" | "magic-link";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let result;

      if (mode === "signup") {
        result = await signUpWithPassword(email, password);
        if (result.requiresConfirmation) {
          setSuccess(result.message || "Check your email for confirmation");
          setEmail("");
          setPassword("");
          return;
        }
      } else if (mode === "signin") {
        result = await signInWithPassword(email, password);
      } else if (mode === "forgot") {
        result = await requestPasswordReset(email);
        if (result.success) {
          setSuccess(result.message || "Check your email for reset instructions");
          setEmail("");
          setTimeout(() => setMode("signin"), 3000);
          return;
        }
      } else if (mode === "magic-link") {
        result = await signInWithMagicLink(email);
        if (result.success) {
          setSuccess(result.message || "Check your email for the magic link");
          setEmail("");
          return;
        }
      }

      if (!result?.success) {
        setError(result?.error || "An error occurred");
        return;
      }

      setSuccess(result.message || "Success!");
      setEmail("");
      setPassword("");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "signup":
        return "Join the gay elite";
      case "forgot":
        return "Recover your account";
      case "magic-link":
        return "Sign in with magic link";
      default:
        return "Welcome back to luxury";
    }
  };

  const getButtonText = () => {
    if (loading) return "Processing...";
    switch (mode) {
      case "signup":
        return "Create Account";
      case "forgot":
        return "Send Reset Link";
      case "magic-link":
        return "Send Magic Link";
      default:
        return "Sign In";
    }
  };

  const showPasswordField = mode !== "forgot" && mode !== "magic-link";

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-black to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-linear-to-br from-purple-700/20 to-yellow-600/20 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-linear-to-br from-yellow-600/20 to-purple-700/20 rounded-full blur-3xl opacity-40"></div>
      </div>

      {/* Auth Card */}
      <div className="max-w-md w-full mx-4 relative">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black mb-3">
              <span className="bg-linear-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                Find Your
              </span>
              <br />
              <span className="bg-linear-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent">
                King
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-4">{getTitle()}</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleAuth}>
            {/* Email Input */}
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/10 text-white placeholder-gray-500 transition-all duration-300 hover:border-white/20"
              />
            </div>

            {/* Password Input */}
            {showPasswordField && (
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required={showPasswordField}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/10 text-white placeholder-gray-500 transition-all duration-300 hover:border-white/20"
                />
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-green-200 text-sm">{success}</p>
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
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                getButtonText()
              )}
            </button>
          </form>

          {/* Auth Mode Links */}
          <div className="mt-8 space-y-3">
            {mode === "signin" && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="flex-1 py-2 px-3 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("magic-link")}
                    className="flex-1 py-2 px-3 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                  >
                    Magic Link
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="w-full py-2 px-3 text-sm text-pink-400 hover:text-pink-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </>
            )}

            {mode === "signup" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full py-2 px-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full py-2 px-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Back to sign in
              </button>
            )}

            {mode === "magic-link" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full py-2 px-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-600/10 rounded-full blur-2xl opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-2xl opacity-20 pointer-events-none"></div>
      </div>
    </div>
  );
}
