import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR

  useEffect(() => {
    // Ensure this code runs only in the browser
    if (typeof window === 'undefined') {
        return;
    }

    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Initial check on mount
    checkDevice();

    window.addEventListener("resize", checkDevice)
    
    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  return isMobile
}
