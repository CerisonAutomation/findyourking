'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type AxiosError } from 'axios'
import { toast } from 'sonner'

// GET Secrets
const getSecrets = async (projectRef: string) => {
  const queryParams = new URLSearchParams({
    projectRef,
    type: 'secrets', // Indicate that we want secrets
  });

  const response = await fetch(`/api/supabase-management?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch secrets');
  }
  return response.json();
}

export const useGetSecrets = (projectRef: string) => {
  return useQuery({
    queryKey: ['secrets', projectRef],
    queryFn: () => getSecrets(projectRef),
    enabled: !!projectRef,
    retry: false,
  })
}

// CREATE Secrets
const createSecrets = async ({
  projectRef,
  secrets,
}: {
  projectRef: string
  secrets: any // Use 'any' for now, as the schema is no longer directly imported
}) => {
  const response = await fetch(`/api/supabase-management`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectRef, secrets, type: 'create-secrets' }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create secrets');
  }
  return response.json();
}

export const useCreateSecrets = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSecrets,
    onSuccess: (data, variables) => {
      toast.success(`Secrets created successfully.`)
      queryClient.refetchQueries({
        queryKey: ['secrets', variables.projectRef],
      })
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.message || 'There was a problem with your request.')
    },
  })
}

// DELETE Secrets
const deleteSecrets = async ({
  projectRef,
  secretNames,
}: {
  projectRef: string
  secretNames: string[]
}) => {
  const response = await fetch(`/api/supabase-management`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectRef, secretNames, type: 'delete-secrets' }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete secrets');
  }
  return response.json();
}

export const useDeleteSecrets = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSecrets,
    onSuccess: (data, variables) => {
      toast.success(`Secrets deleted successfully.`)
      queryClient.invalidateQueries({
        queryKey: ['secrets', variables.projectRef],
      })
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.message || 'There was a problem with your request.')
    },
  })
}