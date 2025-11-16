import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Suspense } from "react"; // Import Suspense

export default function Page() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email to receive reset instructions
          </p>
        </div>
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <a
            href="/auth/login"
            className="font-semibold text-primary hover:underline underline-offset-4"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
