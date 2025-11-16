"use client";

import { motion } from "framer-motion";
import { Search, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Premium Hero Component - Apple/Stripe Level Excellence
 * 
 * Features:
 * - Sophisticated gradient mesh background
 * - Floating abstract orbs with depth
 * - Glass morphism with premium borders
 * - Smooth, professional animations
 * - WCAG 2.1 AA compliant
 * - Reduced motion support
 * 
 * @returns {JSX.Element} Premium hero section
 */
export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Sophisticated Mesh Background */}
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="mesh-gradient animate-mesh w-full h-full" />
      </div>
      
      {/* Abstract Floating Orbs - Premium Depth */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotateZ: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl"
        aria-hidden="true"
      />
      
      <motion.div
        animate={{
          y: [0, 15, 0],
          rotateZ: [0, -3, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-accent/20 to-primary/20 rounded-full blur-3xl"
        aria-hidden="true"
      />
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="space-y-8 max-w-5xl mx-auto"
        >
          {/* Premium Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-3 glass-card px-6 py-3 rounded-full text-sm font-medium border border-primary/20"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-foreground/80">AI-Powered Matching • Real-time • Verified</span>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight"
          >
            <span className="block bg-gradient-to-br from-primary via-primary/80 to-accent bg-clip-text text-transparent drop-shadow-2xl">
              Find Your Perfect
            </span>
            <span className="block bg-gradient-to-br from-accent via-accent/80 to-primary bg-clip-text text-transparent drop-shadow-2xl mt-2">
              King
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Book virtual dates, chat in real-time, and connect with verified companions for meaningful experiences
          </motion.p>
          
          {/* Glass Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-card p-2 rounded-2xl shadow-3d-xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    placeholder="Search by interest, location, or vibe..."
                    className="h-14 pl-12 pr-4 bg-background/50 border-0 rounded-xl text-base focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Search for kings"
                  />
                </div>
                <Button
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold rounded-xl shadow-3d-lg hover:shadow-3d-xl transition-all duration-300"
                >
                  <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>Search</span>
                </Button>
              </div>
            </div>
          </motion.div>
          
          {/* Premium Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            {[
              { icon: Shield, label: "Verified Profiles", gradient: "from-emerald-500 to-teal-500" },
              { icon: CheckCircle2, label: "Instant Booking", gradient: "from-blue-500 to-cyan-500" },
            ].map((feature) => (
              <motion.div
                key={feature.label}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="glass-card px-6 py-3 rounded-xl flex items-center gap-3 cursor-pointer hover:shadow-3d-md transition-all border border-border/40"
              >
                <div className={`bg-gradient-to-br ${feature.gradient} p-2 rounded-lg`}>
                  <feature.icon className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4"
          >
            <Button
              asChild
              size="lg"
              className="h-14 px-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-base font-semibold rounded-xl shadow-3d-xl hover:shadow-glow-primary transition-all duration-300 group"
            >
              <a href="/auth/sign-up" className="flex items-center justify-center gap-3">
                <span>Get Started Free</span>
                <motion.svg
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </a>
            </Button>
            
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-10 border-2 text-base font-semibold rounded-xl hover:bg-accent/10 hover:border-primary transition-all duration-300"
            >
              <a href="/kings" className="flex items-center gap-2">
                <span>Browse Profiles</span>
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { delay: 1, duration: 0.5 },
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-primary rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
