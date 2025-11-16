'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * The main dashboard page for the application.
 * Provides quick access to various user-centric features like bookings, chat, and profile settings.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen p-8 bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-8">Welcome to Your Dashboard!</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Your Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">View and manage your upcoming and past bookings.</p>
            <Button asChild>
              <Link href="/account/bookings">
                <span>Go to Bookings</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat with Kings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Connect with your favorite Kings in real-time.</p>
            <Button asChild>
              <Link href="/kings">
                <span>Find a King to Chat</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Update your personal information and preferences.</p>
            <Button asChild>
              <Link href="/account/profile">
                <span>Edit Profile</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Explore Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Discover interactive features like games and collaborative tools.</p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/chat/some-king-id">
                  <span>Try Chat Features</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
