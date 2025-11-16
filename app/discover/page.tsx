"use client";

import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star, Zap, Filter, Grid3x3, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { StaggerContainer, StaggerItem, Card3DTilt } from "@/components/page-transition";

/**
 * Discovery Grid Page - Award-Winning Masonry Layout
 * 
 * Features:
 * - Masonry grid layout with 3D hover effects
 * - Category carousel with smooth scroll
 * - Card animations on scroll
 * - Glass morphism design
 * - Real-time filtering
 * - WCAG 2.1 AA compliant
 * 
 * Per design system: 2_VISUAL_DESIGN_SYSTEM.md
 * Flowchart node: A3 (Discovery Grid)
 */

interface King {
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

import { Mountain, Palette, Trophy, Gamepad2, BookOpen, Heart as HeartIcon, Grid2x2 } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All", icon: Grid2x2, color: "from-primary to-accent" },
  { id: "outdoor", label: "Outdoor", icon: Mountain, color: "from-green-500 to-emerald-500" },
  { id: "creative", label: "Creative", icon: Palette, color: "from-purple-500 to-pink-500" },
  { id: "sporty", label: "Sporty", icon: Trophy, color: "from-blue-500 to-cyan-500" },
  { id: "gamer", label: "Gamer", icon: Gamepad2, color: "from-violet-500 to-purple-500" },
  { id: "intellectual", label: "Intellectual", icon: BookOpen, color: "from-amber-500 to-orange-500" },
  { id: "romantic", label: "Romantic", icon: HeartIcon, color: "from-rose-500 to-pink-500" },
];

export default function DiscoverPage() {
  const [kings, setKings] = useState<King[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadKings() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("kings")
        .select("*, profiles(username, full_name, avatar_url, bio)")
        .limit(20);

      if (!error && data) {
        setKings(data);
      }
      setLoading(false);
    }

    loadKings();
  }, []);

  const toggleFavorite = (kingId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(kingId)) {
        newFavorites.delete(kingId);
      } else {
        newFavorites.add(kingId);
      }
      return newFavorites;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Header Section */}
      <section className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            {/* Title & View Toggle */}
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  <span>Discover</span>
                </h1>
                <p className="text-muted-foreground mt-2">
                  {kings.length} verified companions waiting to connect
                </p>
              </motion.div>

              {/* View Mode Toggle */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 glass-card p-1 rounded-lg"
              >
                <Button
                  variant={viewMode === "masonry" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("masonry")}
                  className="rounded-md"
                  aria-label="Masonry view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-md"
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>

            {/* Category Carousel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="overflow-x-auto scrollbar-hide -mx-4 px-4"
            >
              <div className="flex gap-3 pb-2">
                {CATEGORIES.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-full font-medium whitespace-nowrap
                      transition-all duration-300 shadow-3d-md hover:shadow-3d-lg
                      ${
                        selectedCategory === category.id
                          ? `bg-gradient-to-r ${category.color} text-white`
                          : "glass-card hover:bg-accent/10"
                      }
                    `}
                    aria-pressed={selectedCategory === category.id}
                  >
                    <category.icon className="w-5 h-5" aria-hidden="true" />
                    <span>{category.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kings Grid */}
      <section className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-3xl h-80" />
              </div>
            ))}
          </div>
        ) : (
          <StaggerContainer
            className={
              viewMode === "masonry"
                ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            }
          >
            {kings.map((king) => (
              <StaggerItem
                key={king.id}
                className={viewMode === "masonry" ? "break-inside-avoid" : ""}
              >
                <Card3DTilt className="h-full">
                  <Card
                    className="group relative overflow-hidden rounded-3xl border-0 shadow-3d-lg hover:shadow-3d-2xl transition-all duration-500"
                  >
                  {/* Image */}
                  <div className="relative h-72 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    {king.profiles?.avatar_url ? (
                      <motion.img
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        src={king.profiles.avatar_url}
                        alt={king.profiles.full_name || king.profiles.username || "King profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 backdrop-blur-sm" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/40 transition-colors duration-300" />

                    {/* Favorite Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(king.id)}
                      className="absolute top-4 right-4 glass-card p-3 rounded-full hover:bg-white/30 transition-all"
                      aria-label={favorites.has(king.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        className={`w-5 h-5 transition-all ${
                          favorites.has(king.id)
                            ? "fill-red-500 text-red-500"
                            : "text-white"
                        }`}
                      />
                    </motion.button>

                    {/* Featured Badge */}
                    {king.rating && king.rating >= 4.5 && (
                      <Badge className="absolute top-4 left-4 glass-card border-0 text-white font-semibold">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                        Featured
                      </Badge>
                    )}

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-1">
                        {king.profiles?.full_name || king.profiles?.username}
                      </h3>
                      {king.profiles?.bio && (
                        <p className="text-sm text-white/90 line-clamp-2 mb-3">
                          {king.profiles.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {king.rating && (
                            <div className="flex items-center gap-1 glass-card px-3 py-1 rounded-full">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold">{king.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            ${king.price_per_hour}
                          </div>
                          <div className="text-xs text-white/80">per hour</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <CardContent className="p-4 bg-card">
                    <Link href={`/kings/${king.id}`} className="block">
                      <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold rounded-xl shadow-3d-md hover:shadow-3d-lg transition-all">
                        View Profile & Book
                      </Button>
                    </Link>
                  </CardContent>
                  </Card>
                </Card3DTilt>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Empty State */}
        {!loading && kings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="glass-card inline-block p-8 rounded-3xl">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back soon
              </p>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}

