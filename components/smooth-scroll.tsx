"use client";

import { useEffect } from "react";

/**
 * Smooth Scroll Enhancement - Awwwards Level
 * 
 * Adds momentum scrolling and smooth behavior
 * Works with native CSS scroll-behavior
 */

export function SmoothScroll() {
  useEffect(() => {
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = "smooth";

    // Cleanup
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return null;
}

