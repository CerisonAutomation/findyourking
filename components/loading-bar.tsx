"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Loading Bar Component - Awwwards Level
 * 
 * Displays at top of page during route transitions
 * Inspired by: YouTube, GitHub, Linear
 */

export function LoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gradient-to-r from-primary via-accent to-primary"
          initial={{ scaleX: 0, transformOrigin: "0%" }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 1, transformOrigin: "100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  );
}

