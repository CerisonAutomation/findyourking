'use client'

import { useQuery } from '@tanstack/react-query'

// GET Buckets
const getBuckets = async (projectRef: string) => {
  const queryParams = new URLSearchParams({
    projectRef,
    type: 'storage-buckets', // Indicate that we want storage buckets
  });

  const response = await fetch(`/api/supabase-management?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch storage buckets');
  }
  return response.json();
}

export const useGetBuckets = (projectRef: string) => {
  return useQuery({
    queryKey: ['buckets', projectRef],
    queryFn: () => getBuckets(projectRef),
    enabled: !!projectRef,
    retry: false,
  })
}

// LIST Objects
const listObjects = async ({ projectRef, bucketId }: { projectRef: string; bucketId: string }) => {
  const queryParams = new URLSearchParams({
    projectRef,
    bucketId,
    type: 'storage-objects', // Indicate that we want storage objects
  });

  const response = await fetch(`/api/supabase-management?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to list storage objects');
  }
  return response.json();
}

export const useListObjects = (projectRef: string, bucketId: string) => {
  return useQuery({
    queryKey: ['objects', projectRef, bucketId],
    queryFn: () => listObjects({ projectRef, bucketId }),
    enabled: !!projectRef && !!bucketId,
  })
}
