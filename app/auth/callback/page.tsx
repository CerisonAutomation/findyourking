"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logError } from "@/lib/utils/error-handler";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(true);

  // Prevent double execution in React Strict Mode
  const hasExchanged = useRef(false);

  useEffect(() => {
    // Skip if already processed (React Strict Mode protection)
    if (hasExchanged.current) {
      return;
    }

    const handleCallback = async () => {
      try {
        hasExchanged.current = true;

        const supabase = createClient();
        const code = searchParams.get("code");
        const token_hash = searchParams.get("token_hash");
        const access_token = searchParams.get("access_token");
        const refresh_token = searchParams.get("refresh_token");
        const error_code = searchParams.get("error");
        const error_description = searchParams.get("error_description");

        // Check for OAuth errors first
        if (error_code) {
          const errorMsg = error_description || error_code;
          console.error('[Auth Callback] OAuth error:', errorMsg);
          throw new Error(errorMsg);
        }

        // Handle password reset recovery flow (access_token + refresh_token)
        if (access_token && refresh_token) {
          console.log('[Auth Callback] Starting password reset recovery...');

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('[Auth Callback] Password reset session setup failed:', sessionError);
            throw sessionError;
          }

          if (!data.session) {
            throw new Error('No session created after password reset');
          }

          console.log('[Auth Callback] Password reset recovery successful, redirecting to reset page...');
          router.push("/auth/reset-password");
          return;
        }

        // Handle both PKCE flow (with code) and magic link flow (with token_hash)
        if (code) {
          console.log('[Auth Callback] Starting PKCE code exchange...');

          // PKCE flow - exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[Auth Callback] PKCE exchange failed:', exchangeError);

            // Check if session already exists (code already used)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              console.log('[Auth Callback] Session already exists, proceeding...');
              router.push("/");
              return;
            }

            throw exchangeError;
          }

          // ✅ Validate session was created (Supabase best practice)
          if (!data.session) {
            throw new Error('No session created after code exchange');
          }

          console.log('[Auth Callback] PKCE exchange successful');
        } else if (token_hash) {
          console.log('[Auth Callback] Starting magic link verification...');

          // Magic link flow - verify the token hash
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token_hash,
            type: "email",
          });

          if (verifyError) {
            console.error('[Auth Callback] Magic link verification failed:', verifyError);
            throw verifyError;
          }

          console.log('[Auth Callback] Magic link verification successful');
        } else {
          throw new Error("Invalid callback - missing code or token_hash");
        }

        // Success - redirect to home
        console.log('[Auth Callback] Redirecting to home...');
        router.push("/");
        router.refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";

        // Log error for debugging
        logError(err, {
          context: 'auth-callback',
          code: searchParams.get("code")?.substring(0, 8) + '...',
          hasTokenHash: !!searchParams.get("token_hash"),
        });

        setError(errorMessage);
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-black to-slate-900">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-8 shadow-2xl">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Authentication Error
            </h1>
            <p className="text-red-200 mb-6 text-sm">
              {error}
            </p>

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-3 bg-black/30 rounded-lg text-left">
                <p className="text-xs text-gray-400 font-mono break-all">
                  Code: {searchParams.get("code")?.substring(0, 16)}...
                </p>
              </div>
            )}

            <button
              onClick={() => {
                // Clear any stale session data
                window.location.href = "/auth";
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg"
            >
              Back to Sign In
            </button>

            <p className="mt-4 text-xs text-gray-500">
              Need help? Contact support
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-black to-slate-900">
        <div className="text-center">
          {/* Spinner */}
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>

          <h2 className="mt-6 text-xl font-semibold text-white">
            Verifying Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Please wait while we securely log you in...
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 border-opacity-75"></div></div></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
