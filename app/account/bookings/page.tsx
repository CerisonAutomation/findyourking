import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserBookingsClient } from "./client";

export default async function UserBookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*, kings(profiles(username, full_name))")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching bookings:", error);
  }

  return <UserBookingsClient initialBookings={bookings || []} user={user} />;
}
