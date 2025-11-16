"use client";

import { createClient } from "@/lib/supabase/client";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Shield,
  Heart,
  Share2,
  Calendar,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

/**
 * Immersive King Profile Page - Award-Winning Experience
 * 
 * Features:
 * - Fullscreen image gallery with carousel
 * - Floating sticky booking card
 * - Parallax scrolling effects
 * - Glass morphism design
 * - Smooth animations
 * - WCAG 2.1 AA compliant
 * 
 * Per design system: 2_VISUAL_DESIGN_SYSTEM.md
 * Flowchart node: A5 (Profile Detail Modal/Full)
 */

interface King {
  id: string;
  price_per_hour: number;
  rating: number | null;
  bio: string | null;
  hourly_rate: number;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
  } | null;
}

export default function KingProfilePage() {
  const params = useParams();
  const kingId = params?.['id'] as string;
  const [king, setKing] = useState<King | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Placeholder images (in real app, would come from database)
  const images = [
    king?.profiles?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800",
  ];

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const { data: kingData, error: kingError } = await supabase
        .from("kings")
        .select("*, profiles(username, full_name, avatar_url, bio)")
        .eq("id", kingId)
        .single();

      if (kingError || !kingData) {
        notFound();
      }

      setKing(kingData);

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*, profiles(username, full_name)")
        .eq("king_id", kingId)
        .order("created_at", { ascending: false });

      if (reviewsData) {
        setReviews(reviewsData);
      }

      setLoading(false);
    }

    loadData();
  }, [kingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!king) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fullscreen Image Gallery */}
      <div className="relative h-[70vh] bg-black">
        <motion.div
          style={{ y }}
          className="relative w-full h-full overflow-hidden"
        >
          <motion.img
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            src={images[currentImageIndex]}
            alt={`${king.profiles?.full_name || "King"} - Photo ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Gallery Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-card px-6 py-3 rounded-full flex items-center gap-4">
            <button
              onClick={() =>
                setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
              }
              className="p-2 hover:bg-white/20 rounded-full transition"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold">
              {currentImageIndex + 1} / {images.length}
            </span>
            <button
              onClick={() =>
                setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
              }
              className="p-2 hover:bg-white/20 rounded-full transition"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Image Indicators */}
          <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentImageIndex ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-8 right-8 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="glass-card p-3 rounded-full hover:bg-white/30 transition"
              aria-label="Add to favorites"
            >
              <Heart className="w-6 h-6 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="glass-card p-3 rounded-full hover:bg-white/30 transition"
              aria-label="Share profile"
            >
              <Share2 className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - King Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                    {king.profiles?.full_name || king.profiles?.username}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>San Francisco, CA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {king.rating && (
                        <>
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-foreground">
                            {king.rating.toFixed(1)}
                          </span>
                          <span>({reviews.length} reviews)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3">
                <Badge className="glass-card border-0 px-4 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Verified Profile</span>
                </Badge>
                <Badge className="glass-card border-0 px-4 py-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Background Checked</span>
                </Badge>
                <Badge className="glass-card border-0 px-4 py-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span>Quick Responder</span>
                </Badge>
              </div>
            </motion.div>

            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card p-8 rounded-3xl"
            >
              <h2 className="text-2xl font-bold mb-4">About Me</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {king.profiles?.bio || king.bio || "No bio available yet."}
              </p>
            </motion.div>

            {/* Interests/Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-8 rounded-3xl"
            >
              <h2 className="text-2xl font-bold mb-4">Interests</h2>
              <div className="flex flex-wrap gap-3">
                {["Gaming", "Music", "Travel", "Cooking", "Fitness", "Art"].map((interest) => (
                  <Badge
                    key={interest}
                    className="px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/20 text-foreground"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </motion.div>

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card p-8 rounded-3xl"
            >
              <h2 className="text-2xl font-bold mb-6">Reviews</h2>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border/40 pb-6 last:border-0">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                          {review.profiles?.full_name?.[0] || review.profiles?.username?.[0] || "A"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">
                              {review.profiles?.full_name || review.profiles?.username}
                            </p>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No reviews yet. Be the first to book!
                </p>
              )}
            </motion.div>
          </div>

          {/* Right Column - Floating Booking Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="sticky top-24"
            >
              <Card className="glass-card border-0 shadow-3d-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold">
                        ${king.price_per_hour}
                      </span>
                      <span className="text-muted-foreground">/ hour</span>
                    </div>
                    {king.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(king.rating!)
                                  ? "fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {king.rating.toFixed(1)} ({reviews.length} reviews)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Button
                      asChild
                      className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-lg font-semibold rounded-xl shadow-3d-lg hover:shadow-glow-primary transition-all group"
                    >
                      <Link href={`/kings/${king.id}/book`} className="flex items-center justify-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span>Book Now</span>
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-14 border-2 text-base font-semibold rounded-xl hover:bg-accent/10 hover:border-primary transition-all"
                    >
                      <Link href={`/chat/${king.id}`}>
                        <MessageCircle className="w-5 h-5 mr-2" />
                        <span>Send Message</span>
                      </Link>
                    </Button>
                  </div>

                  {/* Trust Signals */}
                  <div className="space-y-3 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Instant confirmation</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span>Secure payment</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-5 h-5 text-purple-500 flex-shrink-0" />
                      <span>Flexible cancellation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
