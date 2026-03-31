import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:            60 * 1000,       // 1 min — prevents double-fetch on hydration
        gcTime:               5 * 60 * 1000,   // 5 min GC retention
        retry:                1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}

/** Browser singleton — one per tab */
let browserQueryClient: QueryClient | undefined;

/**
 * Returns a QueryClient for the current execution environment.
 * - Server: fresh instance per request (isolation).
 * - Browser: singleton (stable across re-renders).
 */
export function getQueryClient(): QueryClient {
  if (isServer) return buildQueryClient();
  if (!browserQueryClient) browserQueryClient = buildQueryClient();
  return browserQueryClient;
}

/** Alias for provider bootstrap: `useState(() => makeQueryClient())` */
export const makeQueryClient = buildQueryClient;
