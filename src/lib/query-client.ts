import { QueryClient } from '@tanstack/react-query';

/** Create a configured QueryClient instance. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1_000,        // 1 min
        gcTime: 5 * 60 * 1_000,       // 5 min
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Returns the singleton QueryClient on the browser;
 * always creates a fresh one on the server (avoids shared state between requests).
 */
export function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  return (browserQueryClient ??= makeQueryClient());
}
