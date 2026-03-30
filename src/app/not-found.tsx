import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-svh flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-5">
        <Crown className="size-16 mx-auto text-muted-foreground/30" aria-hidden="true" />
        <h1 className="text-5xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground">This page has left the building. The throne is empty.</p>
        <Button asChild><Link href="/discover">Return to the Throne Room</Link></Button>
      </div>
    </main>
  );
}
