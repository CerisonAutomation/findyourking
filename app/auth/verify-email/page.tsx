"use client";

import { resendVerificationEmail } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function VerifyEmail() {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const result = await resendVerificationEmail(formData);
    if (result.error) {
      setMessage(result.error);
      setIsError(true);
    } else {
      setMessage(result.message || "Verification email re-sent. Check your inbox.");
      setIsError(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
      <p className="text-gray-600 text-center mb-6">
        A verification link has been sent to your email address. Please check your inbox and click the link to verify your email.
      </p>
      <div className="w-full max-w-md">
        <form action={handleSubmit} className="flex flex-col gap-4">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="your@example.com"
            required
          />
          <Button type="submit" className="w-full">
            Resend Verification Email
          </Button>
        </form>
        {message && (
          <p className={`mt-4 text-center text-sm ${isError ? "text-red-500" : "text-green-500"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
