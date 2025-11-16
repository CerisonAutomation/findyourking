'use client'

import { useMutation } from '@tanstack/react-query'
import { type AxiosError } from 'axios'
import { toast } from 'sonner'

// RUN SQL Query
export const runQuery = async ({
  projectRef,
  query,
  readOnly,
}: {
  projectRef: string
  query: string
  readOnly?: boolean
}) => {
  const response = await fetch(`/api/supabase-management`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectRef, query, readOnly, type: 'run-query' }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to run SQL query');
  }
  return response.json();
}

export const useRunQuery = () => {
  return useMutation({
    mutationFn: runQuery,
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.message || 'There was a problem with your query.')
    },
  })
}