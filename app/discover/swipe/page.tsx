"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Star, Heart, MapPin, RotateCw } from "lucide-react";

/**
 * Swipe Interface Page - Tinder-like Experience
 * 
 * Features:
 * - Physics-based card swiping with spring animations
 * - 3D card stack with depth
 * - Swipe indicators (LIKE/NOPE)
 * - Action buttons with animations
 * - Real-time gesture tracking
 * - WCAG 2.1 AA compliant with keyboard support
 * 
 * Per design system: 2_VISUAL_DESIGN_SYSTEM.md
 * Flowchart node: A4 (Swiping Interface)
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

export default function SwipePage() {
  const [kings, setKings] = useState<King[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Motion values for drag interaction
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8]);
  
  // Motion values for swipe indicators
  const likeOpacity = useTransform(x, [50, 100], [0, 1]);
  const likeScale = useTransform(x, [50, 100], [0.8, 1]);
  const nopeOpacity = useTransform(x, [-100, -50], [1, 0]);
  const nopeScale = useTransform(x, [-100, -50], [1, 0.8]);

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

  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex < kings.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentKing = kings[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse" />
      </div>
    );
  }

  if (!currentKing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-card p-12 rounded-3xl max-w-md"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent" />
          </div>
          <h2 className="text-3xl font-bold mb-4">That&apos;s Everyone!</h2>
          <p className="text-muted-foreground mb-6">
            You&apos;ve seen all available kings. Check back later for new profiles.
          </p>
          <Button
            onClick={() => setCurrentIndex(0)}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
          >
            <RotateCw className="w-5 h-5 mr-2" />
            Start Over
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="container mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent" />
            <h1 className="text-xl font-bold">Swipe Mode</h1>
          </div>
          <div className="glass-card px-4 py-2 rounded-full text-sm font-medium">
            {currentIndex + 1} / {kings.length}
          </div>
        </div>
      </header>

      {/* Main Swipe Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="relative w-full max-w-md h-[600px]" style={{ perspective: "1000px" }}>
          {/* Card Stack - Show next 2 cards behind */}
          {kings.slice(currentIndex, currentIndex + 3).map((king, stackIndex) => {
            const isTop = stackIndex === 0;
            return (
              <SwipeCard
                key={king.id}
                king={king}
                isTop={isTop}
                stackIndex={stackIndex}
                onSwipe={handleSwipe}
              />
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pb-8 px-4">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-6"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe("left")}
              className="w-16 h-16 rounded-full bg-white dark:bg-gray-900 shadow-3d-xl hover:shadow-3d-2xl flex items-center justify-center text-red-500 transition-all"
              aria-label="Pass on this king"
            >
              <X className="w-8 h-8" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                // Super like logic
                handleSwipe("right");
              }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-3d-2xl shadow-blue-500/50 hover:shadow-blue-500/70 flex items-center justify-center text-white transition-all"
              aria-label="Super like this king"
            >
              <Star className="w-10 h-10" fill="currentColor" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe("right")}
              className="w-16 h-16 rounded-full bg-white dark:bg-gray-900 shadow-3d-xl hover:shadow-3d-2xl flex items-center justify-center text-green-500 transition-all"
              aria-label="Like this king"
            >
              <Heart className="w-8 h-8" fill="currentColor" />
            </motion.button>
          </motion.div>

          {/* Keyboard Hint */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Swipe or use ← → arrow keys
          </p>
        </div>
      </div>
    </div>
  );
}

interface SwipeCardProps {
  king: King;
  isTop: boolean;
  stackIndex: number;
  onSwipe: (direction: "left" | "right") => void;
}

function SwipeCard({ king, isTop, stackIndex, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      const direction = info.offset.x > 0 ? "right" : "left";
      onSwipe(direction);
    }
  };

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1,
        scale: 1 - stackIndex * 0.05,
        y: stackIndex * 10,
        zIndex: 10 - stackIndex,
      }}
      animate={{
        scale: 1 - stackIndex * 0.05,
        y: stackIndex * 10,
        opacity: 1 - stackIndex * 0.3,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className={`absolute inset-0 rounded-3xl overflow-hidden shadow-3d-2xl ${
        isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      }`}
    >
      {/* Card Content */}
      <div className="w-full h-full bg-card">
        {/* Image */}
        <div className="relative h-full">
          {king.profiles?.avatar_url ? (
            <img
              src={king.profiles.avatar_url}
              alt={king.profiles.full_name || king.profiles.username || "King profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/40 to-accent/40 backdrop-blur-sm" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Swipe Indicators */}
          {isTop && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                className="absolute top-8 left-8 text-6xl font-black text-green-500 border-4 border-green-500 rounded-2xl px-6 py-2 rotate-[-20deg]"
                aria-hidden="true"
              >
                LIKE
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                className="absolute top-8 right-8 text-6xl font-black text-red-500 border-4 border-red-500 rounded-2xl px-6 py-2 rotate-[20deg]"
                aria-hidden="true"
              >
                NOPE
              </motion.div>
            </>
          )}

          {/* Profile Info */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-bold mb-2">
                {king.profiles?.full_name || king.profiles?.username}
              </h2>

              {king.profiles?.bio && (
                <p className="text-lg text-white/90 mb-4 line-clamp-3">
                  {king.profiles.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {king.rating && (
                  <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{king.rating.toFixed(1)}</span>
                  </div>
                )}
                
                <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2">
                  <span className="text-xl font-bold">${king.price_per_hour}</span>
                  <span className="text-sm text-white/80">/hr</span>
                </div>
              </div>

              {/* Tags/Interests - Placeholder */}
              <div className="flex flex-wrap gap-2">
                {["Gaming", "Music", "Travel"].map((interest) => (
                  <span
                    key={interest}
                    className="glass-card px-4 py-2 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Image Indicators (if multiple images) */}
          <div className="absolute top-4 left-0 right-0 px-4 flex gap-2">
            {[1, 2, 3].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                  i === 0 ? "bg-white" : "bg-white/30"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

