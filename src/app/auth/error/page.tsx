import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const msg = searchParams.error ?? 'An authentication error occurred.';

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Authentication Failed</h1>
        <p className="text-sm text-muted-foreground max-w-sm">{decodeURIComponent(msg)}</p>
      </div>
      <Button asChild>
        <Link href="/login">Back to Login</Link>
      </Button>
    </div>
  );
}
