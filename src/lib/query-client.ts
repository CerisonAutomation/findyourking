import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,           // 1 min — avoids double-fetch on hydration
        gcTime: 5 * 60 * 1000,          // 5 min cache retention
        retry: 1,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

/** Client-side singleton — one per browser tab */
let browserQueryClient: QueryClient | undefined;

/**
 * Returns a QueryClient appropriate for the current execution context.
 * - Server: always a fresh instance (per-request isolation).
 * - Browser: singleton (stable across re-renders).
 */
export function getQueryClient() {
  if (isServer) return buildQueryClient();
  if (!browserQueryClient) browserQueryClient = buildQueryClient();
  return browserQueryClient;
}

/** Alias kept for provider bootstrap: `useState(() => makeQueryClient())` */
export const makeQueryClient = buildQueryClient;
