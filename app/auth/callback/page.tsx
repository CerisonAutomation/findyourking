"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();
        const code = searchParams.get("code");
        const token_hash = searchParams.get("token_hash");

        // Handle both PKCE flow (with code) and magic link flow (with token_hash)
        if (code) {
          // PKCE flow - exchange code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        } else if (token_hash) {
          // Magic link flow - verify the token hash
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token_hash,
            type: "email",
          });

          if (verifyError) {
            throw verifyError;
          }
        } else {
          throw new Error("Invalid callback - missing code or token_hash");
        }

        // Success - redirect to home
        router.push("/");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8">
            <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
            <p className="text-red-200 mb-6">{error}</p>
            <button
              onClick={() => {
                window.location.href = "/auth";
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 border-opacity-75 mb-4"></div>
        <p className="text-gray-400">Verifying your authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 border-opacity-75"></div></div></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
