"use client";

import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Star, X, MessageCircle, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * Favorites Page - Saved Kings
 * 
 * Features:
 * - Animated grid layout
 * - Quick actions (message, book, remove)
 * - Empty state design
 * - Smooth remove animations
 * - WCAG 2.1 AA compliant
 * 
 * Per design system: 2_VISUAL_DESIGN_SYSTEM.md
 * Flowchart node: A6 (Favorites)
 */

interface FavoriteKing {
  id: string;
  price_per_hour: number;
  rating: number | null;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteKing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      const supabase = createClient();
      
      // In real app, would query favorites from a favorites table
      // For now, showing all kings as demo
      const { data, error } = await supabase
        .from("kings")
        .select("*, profiles(username, full_name, avatar_url, bio)")
        .limit(6);

      if (!error && data) {
        setFavorites(data);
      }
      setLoading(false);
    }

    loadFavorites();
  }, []);

  const removeFavorite = (kingId: string) => {
    setFavorites((prev) => prev.filter((k) => k.id !== kingId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight flex items-center gap-3">
                <Heart className="w-10 h-10 text-primary fill-primary" aria-hidden="true" />
                <span>My Favorites</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                {favorites.length} {favorites.length === 1 ? "king" : "kings"} saved
              </p>
            </div>
            
            <Button
              asChild
              variant="outline"
              className="border-2 hover:bg-accent/10 hover:border-primary"
            >
              <Link href="/discover">
                <Sparkles className="w-5 h-5 mr-2" />
                <span>Discover More</span>
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Favorites Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-3xl h-96" />
              </div>
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((king, index) => (
              <motion.div
                key={king.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-3d-lg hover:shadow-3d-2xl transition-all duration-500">
                  {/* Image */}
                  <div className="relative h-80 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    {king.profiles?.avatar_url ? (
                      <motion.img
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.6 }}
                        src={king.profiles.avatar_url}
                        alt={king.profiles.full_name || king.profiles.username || "King profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                        <Sparkles className="w-20 h-20 text-primary/50" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Remove Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFavorite(king.id)}
                      className="absolute top-4 right-4 glass-card p-3 rounded-full hover:bg-red-500/20 transition-all group/remove"
                      aria-label="Remove from favorites"
                    >
                      <X className="w-5 h-5 text-white group-hover/remove:text-red-500 transition-colors" />
                    </motion.button>

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2">
                        {king.profiles?.full_name || king.profiles?.username}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-4">
                        {king.rating && (
                          <div className="flex items-center gap-2 glass-card px-3 py-1 rounded-full">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">{king.rating.toFixed(1)}</span>
                          </div>
                        )}
                        
                        <div className="text-right">
                          <div className="text-xl font-bold">
                            ${king.price_per_hour}
                          </div>
                          <div className="text-xs text-white/80">per hour</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <CardContent className="p-4 bg-card space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-2 hover:bg-accent/10 hover:border-primary"
                      >
                        <Link href={`/chat/${king.id}`}>
                          <MessageCircle className="w-4 h-4 mr-1" />
                          <span>Message</span>
                        </Link>
                      </Button>
                      
                      <Button
                        asChild
                        size="sm"
                        className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                      >
                        <Link href={`/kings/${king.id}/book`}>
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Book</span>
                        </Link>
                      </Button>
                    </div>
                    
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full hover:bg-accent/10"
                    >
                      <Link href={`/kings/${king.id}`}>
                        View Full Profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="glass-card inline-block p-12 rounded-3xl max-w-md">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex items-center justify-center mb-6"
                aria-hidden="true"
              >
                <Heart className="w-20 h-20 text-muted-foreground" />
              </motion.div>
              <h3 className="text-3xl font-bold mb-4">No Favorites Yet</h3>
              <p className="text-muted-foreground mb-8">
                Start exploring and save kings you like to see them here
              </p>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
              >
                <Link href="/discover">
                  <Sparkles className="w-5 h-5 mr-2" />
                  <span>Discover Kings</span>
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

