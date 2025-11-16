'use client'

import { useQuery } from '@tanstack/react-query'

// GET Suggestions
const getSuggestions = async (projectRef: string) => {
  const queryParams = new URLSearchParams({
    projectRef,
    type: 'suggestions', // Indicate that we want suggestions
  });

  const response = await fetch(`/api/supabase-management?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch suggestions');
  }
  return response.json();
}

export const useGetSuggestions = (projectRef: string) => {
  return useQuery({
    queryKey: ['suggestions', projectRef],
    queryFn: () => getSuggestions(projectRef),
    enabled: !!projectRef,
    retry: false,
  })
}