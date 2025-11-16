import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function KingDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // TODO: Implement logic to check if the user is a king

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">King Dashboard</h1>
      <p>Welcome, {user.email}</p>
      {/* TODO: Add links to king-specific pages for managing profile, availability, and bookings */}
    </div>
  );
}
