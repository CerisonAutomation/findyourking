/**
 * Advanced Routing Utilities (Apex-Level)
 * Comprehensive routing helpers for parallel routes, intercepting routes, and dynamic navigation
 * Per Next.js 15 docs: https://nextjs.org/docs/app/building-your-application/routing
 */

import { redirect } from 'next/navigation';
import { ReadonlyURLSearchParams } from 'next/navigation';

/**
 * Route configuration type
 */
export interface RouteConfig {
  path: string;
  auth?: boolean;
  roles?: string[];
  subscription?: ('FREE' | 'PREMIUM' | 'ELITE')[];
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
}

/**
 * App routes configuration
 */
export const APP_ROUTES = {
  // Public routes
  HOME: '/',
  ABOUT: '/about',
  PRICING: '/pricing',
  CONTACT: '/contact',
  HELP: '/help',
  PRIVACY: '/privacy',
  TERMS: '/terms',

  // Auth routes
  AUTH: '/auth',
  LOGIN: '/auth/login',
  SIGNUP: '/auth',
  RESET_PASSWORD: '/auth/reset-password',
  AUTH_CALLBACK: '/auth/callback',
  AUTH_ERROR: '/auth/error',
  AUTH_CONFIRM: '/auth/confirm',

  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  SETTINGS: '/settings',
  SETTINGS_SUBSCRIPTION: '/settings/subscription',
  ROLE_SELECT: '/role-select',

  // Match/Dating routes
  MATCHES: '/matches',
  MATCHES_LIST: '/matches/list',
  CHAT: '/chat',
  CHAT_USER: (userId: string) => `/chat/${userId}`,

  // AI Boyfriend routes
  BOYFRIEND: '/boyfriend',
  BOYFRIEND_PERSONALITY: '/boyfriend/personality',
  BOYFRIEND_EDIT: '/boyfriend/edit-personality',
  TEST_AI: '/test-ai',

  // API routes
  API: {
    MATCHES: '/api/matches',
    MESSAGES: '/api/messages',
    PROFILE: '/api/profile',
    BOYFRIEND: '/api/boyfriend',
    BOYFRIEND_CHAT: '/api/boyfriend/chat',
    TRANSLATE: '/api/translate',
    CHECKOUT: '/api/checkout/create-session',
  },
} as const;

/**
 * Protected route configuration
 */
export const PROTECTED_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    auth: true,
    rateLimit: { requests: 100, window: 60 },
  },
  {
    path: '/matches',
    auth: true,
    rateLimit: { requests: 50, window: 60 },
  },
  {
    path: '/chat',
    auth: true,
    rateLimit: { requests: 200, window: 60 },
  },
  {
    path: '/boyfriend',
    auth: true,
    subscription: ['FREE', 'PREMIUM', 'ELITE'],
  },
  {
    path: '/profile/edit',
    auth: true,
    rateLimit: { requests: 10, window: 60 },
  },
];

/**
 * Build URL with query parameters
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!params) return path;

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/**
 * Parse search params to object
 */
export function parseSearchParams(
  searchParams: ReadonlyURLSearchParams | URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Navigate with state preservation
 */
export function navigateWithState(
  path: string,
  state?: Record<string, unknown>
): void {
  if (typeof window !== 'undefined') {
    const url = new URL(path, window.location.origin);

    if (state) {
      Object.entries(state).forEach(([key, value]) => {
        url.searchParams.append(key, JSON.stringify(value));
      });
    }

    window.history.pushState(state, '', url);
  }
}

/**
 * Get previous path for back navigation
 */
export function getPreviousPath(): string | null {
  if (typeof window !== 'undefined') {
    return document.referrer || null;
  }
  return null;
}

/**
 * Safe redirect with error handling
 */
export function safeRedirect(path: string, condition: boolean = true): void {
  if (condition) {
    redirect(path);
  }
}

/**
 * Redirect to auth with return URL
 */
export function redirectToAuth(returnUrl?: string): void {
  const returnPath = returnUrl || (typeof window !== 'undefined' ? window.location.pathname : '/');
  redirect(buildUrl(APP_ROUTES.AUTH, { returnUrl: returnPath }));
}

/**
 * Redirect to dashboard based on user role
 */
export function redirectToDashboard(role?: string): void {
  // Role-specific dashboard logic can be added here
  redirect(APP_ROUTES.DASHBOARD);
}

/**
 * Check if route is protected
 */
export function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some((route) =>
    path.startsWith(route.path)
  );
}

/**
 * Check if user can access route
 */
export function canAccessRoute(
  path: string,
  user: {
    id: string;
    role?: string;
    subscription?: string;
  } | null
): boolean {
  const routeConfig = PROTECTED_ROUTES.find((route) =>
    path.startsWith(route.path)
  );

  if (!routeConfig) return true; // Public route

  // Check authentication
  if (routeConfig.auth && !user) return false;

  // Check roles
  if (routeConfig.roles && user?.role) {
    if (!routeConfig.roles.includes(user.role)) return false;
  }

  // Check subscription
  if (routeConfig.subscription && user?.subscription) {
    if (!routeConfig.subscription.includes(user.subscription as any)) return false;
  }

  return true;
}

/**
 * Generate breadcrumbs from path
 */
export function generateBreadcrumbs(path: string): { label: string; href: string }[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
  ];

  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: currentPath,
    });
  });

  return breadcrumbs;
}

/**
 * Parallel route helpers
 */
export const ParallelRoutes = {
  /**
   * Get parallel slot path
   */
  getSlotPath: (slot: string, path: string): string => {
    return `/@${slot}${path}`;
  },

  /**
   * Check if path is a parallel slot
   */
  isSlotPath: (path: string): boolean => {
    return path.includes('/@');
  },

  /**
   * Extract slot name from path
   */
  getSlotName: (path: string): string | null => {
    const match = path.match(/\/@([^/]+)/);
    return match ? match[1] : null;
  },
};

/**
 * Intercepting route helpers
 */
export const InterceptingRoutes = {
  /**
   * Build intercepting route path
   */
  getInterceptPath: (path: string, level: '.' | '..' | '...' | '(...)'): string => {
    return `${level}${path}`;
  },

  /**
   * Check if path is an intercepting route
   */
  isInterceptPath: (path: string): boolean => {
    return /\(\.+\)/.test(path);
  },
};

/**
 * Dynamic route helpers
 */
export const DynamicRoutes = {
  /**
   * Build dynamic route path
   */
  build: (template: string, params: Record<string, string>): string => {
    let path = template;
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`[${key}]`, value);
    });
    return path;
  },

  /**
   * Extract params from path
   */
  extractParams: (template: string, path: string): Record<string, string> | null => {
    const templateParts = template.split('/');
    const pathParts = path.split('/');

    if (templateParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};

    for (let i = 0; i < templateParts.length; i++) {
      const templatePart = templateParts[i];
      const pathPart = pathParts[i];

      if (templatePart.startsWith('[') && templatePart.endsWith(']')) {
        const key = templatePart.slice(1, -1);
        params[key] = pathPart;
      } else if (templatePart !== pathPart) {
        return null;
      }
    }

    return params;
  },
};

/**
 * Route group helpers
 */
export const RouteGroups = {
  /**
   * Check if path is in a route group
   */
  isInGroup: (path: string): boolean => {
    return /\([^)]+\)/.test(path);
  },

  /**
   * Extract group name from path
   */
  getGroupName: (path: string): string | null => {
    const match = path.match(/\(([^)]+)\)/);
    return match ? match[1] : null;
  },
};
