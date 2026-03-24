import type { DefaultOptions } from '@tanstack/react-query';

export const defaultQueryClientOptions: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  },
};
