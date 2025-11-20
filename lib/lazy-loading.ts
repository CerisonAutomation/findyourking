/**
 * Advanced Lazy Loading Utilities (Apex-Level)
 * Comprehensive code splitting, dynamic imports, and loading strategies
 * Per Next.js docs: https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
 */

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * Loading component for suspense fallback (use function returning JSX)
 */
export function LoadingSpinner() {
  return null; // Will be overridden in client components
}

export function LoadingCard() {
  return null; // Will be overridden in client components
}

/**
 * Loading states for different component types
 */
export const LoadingStates = {
  spinner: LoadingSpinner,
  card: LoadingCard,
};

/**
 * Lazy load component with custom loading state
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    ssr?: boolean;
  }
) {
  return dynamic(importFunc, {
    ssr: options?.ssr ?? true,
  });
}

/**
 * Preload component for faster navigation
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): void {
  // Trigger import without rendering
  importFunc();
}

/**
 * Lazy-loaded components (Heavy components)
 */

// Chat components
export const StreamChatInterface = lazyLoad(
  () => import('@/components/StreamChatInterface'),
  { ssr: false }
);

export const ChatHeader = lazyLoad(
  () => import('@/components/ChatHeader'),
  { ssr: true }
);

// Video components (very heavy)
export const VideoCall = lazyLoad(
  () => import('@/components/VideoCall'),
  { ssr: false }
);

// Dashboard components
export const AdminDashboard = lazyLoad(
  () => import('@/components/dashboards/AdminDashboard'),
  { ssr: true }
);

export const ProviderDashboard = lazyLoad(
  () => import('@/components/dashboards/ProviderDashboard'),
  { ssr: true }
);

export const SeekerDashboard = lazyLoad(
  () => import('@/components/dashboards/SeekerDashboard'),
  { ssr: true }
);

// Match components
export const MatchCard = lazyLoad(
  () => import('@/components/MatchCard'),
  { ssr: true }
);

export const MatchNotification = lazyLoad(
  () => import('@/components/MatchNotification'),
  { ssr: false }
);

// Profile components (Removed - component doesn't exist)

/**
 * Route-based code splitting
 */
export const LazyRoutes = {
  // Note: Don't lazy load pages - Next.js handles this automatically via app router
  // Instead, lazy load heavy components within pages
};

/**
 * Intersection Observer based lazy loading
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null;

  constructor(
    private options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01,
    }
  ) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        this.options
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;
        const loadFunc = target.dataset.load;

        if (loadFunc) {
          // Execute load function
          const func = new Function(`return ${loadFunc}`)();
          func();

          // Stop observing this element
          this.observer?.unobserve(target);
        }
      }
    });
  }

  public observe(element: HTMLElement): void {
    this.observer?.observe(element);
  }

  public unobserve(element: HTMLElement): void {
    this.observer?.unobserve(element);
  }

  public disconnect(): void {
    this.observer?.disconnect();
  }
}

/**
 * Prefetch strategy for critical routes
 */
export const prefetchRoutes = {
  /**
   * Prefetch on hover (for navigation links)
   */
  onHover: (path: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      document.head.appendChild(link);
    }
  },

  /**
   * Prefetch on viewport (for critical routes)
   */
  onViewport: (paths: string[]) => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        paths.forEach((path) => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = path;
          document.head.appendChild(link);
        });
      });
    }
  },

  /**
   * Prefetch on interaction (for likely next routes)
   */
  onInteraction: (paths: string[], events: string[] = ['mousedown', 'touchstart']) => {
    if (typeof window === 'undefined') return;

    const handler = () => {
      paths.forEach((path) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = path;
        document.head.appendChild(link);
      });

      // Remove listeners after first interaction
      events.forEach((event) => {
        document.removeEventListener(event, handler);
      });
    };

    events.forEach((event) => {
      document.addEventListener(event, handler, { once: true, passive: true });
    });
  },
};

/**
 * Bundle splitting by feature
 */
export const featureBundles = {
  chat: () => Promise.all([
    import('@/components/StreamChatInterface'),
    import('@/components/ChatHeader'),
    import('@/lib/actions/chat'),
  ]),

  boyfriend: () => Promise.all([
    import('@/lib/ai/gemini-boyfriend'),
  ]),

  matches: () => Promise.all([
    import('@/components/MatchCard'),
    import('@/lib/actions/matches'),
  ]),

  dashboard: () => Promise.all([
    import('@/components/dashboards/AdminDashboard'),
    import('@/components/dashboards/ProviderDashboard'),
    import('@/components/dashboards/SeekerDashboard'),
  ]),
};

/**
 * Preload critical features on route change
 */
export function preloadFeature(feature: keyof typeof featureBundles): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      featureBundles[feature]();
    });
  }
}

/**
 * Smart preloading based on user behavior
 */
export class SmartPreloader {
  private loadedFeatures = new Set<string>();
  private idleCallback: number | null = null;

  public preloadOnIdle(features: string[]): void {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) return;

    this.idleCallback = window.requestIdleCallback(() => {
      features.forEach((feature) => {
        if (!this.loadedFeatures.has(feature)) {
          this.loadFeature(feature);
        }
      });
    });
  }

  private loadFeature(feature: string): void {
    if (feature in featureBundles) {
      featureBundles[feature as keyof typeof featureBundles]();
      this.loadedFeatures.add(feature);
    }
  }

  public cancel(): void {
    if (this.idleCallback) {
      window.cancelIdleCallback(this.idleCallback);
      this.idleCallback = null;
    }
  }
}
