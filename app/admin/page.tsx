import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <div className="mt-4">
        <h2 className="text-xl font-bold">Manage</h2>
        <ul className="list-disc list-inside">
          <li>
            <a href="/admin/users" className="text-indigo-600 hover:text-indigo-900">
              Users
            </a>
          </li>
          <li>
            <a href="/admin/kings" className="text-indigo-600 hover:text-indigo-900">
              Kings
            </a>
          </li>
          <li>
            <a href="/admin/bookings" className="text-indigo-600 hover:text-indigo-900">
              Bookings
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
