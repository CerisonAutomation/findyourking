import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default async function KingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: kings, error } = await supabase
    .from("kings")
    .select("*, profiles(username, full_name, avatar_url, bio)");

  if (error) {
    console.error("Error fetching kings:", error);
    return <p>Error loading kings.</p>;
  }

  return (
    <div className="w-full">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 space-y-3">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Available Kings
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse and connect with our verified virtual companions
          </p>
        </div>

        {/* Kings Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kings?.map((king) => (
            <Card 
              key={king.id}
              className="group overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <CardHeader className="space-y-3 pb-4">
                {/* Avatar */}
                {king.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={king.profiles.avatar_url}
                    alt={king.profiles.full_name || king.profiles.username || "King avatar"}
                    className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-border transition-all group-hover:ring-4 group-hover:ring-primary/50"
                  />
                ) : (
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 ring-2 ring-border">
                    <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                )}

                {/* Name & Title */}
                <div className="space-y-1 text-center">
                  <CardTitle className="text-xl">
                    {king.profiles?.full_name || king.profiles?.username}
                  </CardTitle>
                  {king.profiles?.bio && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {king.profiles.bio}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Price</p>
                    <p className="text-lg font-bold">
                      ${king.price_per_hour}
                      <span className="text-sm font-normal text-muted-foreground">/hr</span>
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs font-medium text-muted-foreground">Rating</p>
                    <p className="text-lg font-bold">
                      {king.rating ? (
                        <>
                          {king.rating}
                          <span className="text-sm font-normal text-muted-foreground">/5</span>
                        </>
                      ) : (
                        <span className="text-sm font-normal text-muted-foreground">New</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <Link href={`/kings/${king.id}`} className="block">
                  <Button className="w-full font-semibold shadow-md transition-all hover:shadow-lg">
                    View Profile & Book
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {kings && kings.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="mb-4 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No Kings Available</h3>
            <p className="text-muted-foreground">
              Check back soon for new virtual companions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
