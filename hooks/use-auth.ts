'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type AxiosError } from 'axios'
import { toast } from 'sonner'

const getAuthConfig = async (projectRef: string) => {
  const response = await fetch(`/api/supabase-management?projectRef=${projectRef}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch auth config');
  }
  return response.json();
}

export const useGetAuthConfig = (projectRef: string) => {
  return useQuery({
    queryKey: ['auth-config', projectRef],
    queryFn: () => getAuthConfig(projectRef),
    enabled: !!projectRef,
    retry: false,
  })
}

// UPDATE Auth Config
const updateAuthConfig = async ({
  projectRef,
  payload,
}: {
  projectRef: string
  payload: any // Use 'any' for now, as the schema is no longer directly imported
}) => {
  const response = await fetch(`/api/supabase-management`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectRef, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update auth config');
  }
  return response.json();
}

export const useUpdateAuthConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAuthConfig,
    onSuccess: (data, variables) => {
      toast.success(`Auth config updated.`)
      queryClient.invalidateQueries({
        queryKey: ['auth-config', variables.projectRef],
      })
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.message || 'There was a problem with your request.')
    },
  })
}