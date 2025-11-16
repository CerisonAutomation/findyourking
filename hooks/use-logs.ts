'use client'

import { useQuery } from '@tanstack/react-query'

// GET Logs
const getLogs = async ({
  projectRef,
  iso_timestamp_start,
  iso_timestamp_end,
  sql,
}: {
  projectRef: string
  iso_timestamp_start?: string
  iso_timestamp_end?: string
  sql?: string
}) => {
  const queryParams = new URLSearchParams({
    projectRef,
    type: 'logs', // Indicate that we want logs
  });

  if (iso_timestamp_start) queryParams.append('iso_timestamp_start', iso_timestamp_start);
  if (iso_timestamp_end) queryParams.append('iso_timestamp_end', iso_timestamp_end);
  if (sql) queryParams.append('sql', sql);

  const response = await fetch(`/api/supabase-management?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch logs');
  }
  return response.json();
}

export const useGetLogs = (
  projectRef: string,
  params: {
    iso_timestamp_start?: string
    iso_timestamp_end?: string
    sql?: string
  } = {}
) => {
  const queryKey = ['logs', projectRef, params.sql]

  return useQuery({
    queryKey: queryKey,
    queryFn: () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const queryParams = {
        sql: params.sql,
        iso_timestamp_start: params.iso_timestamp_start ?? oneHourAgo.toISOString(),
        iso_timestamp_end: params.iso_timestamp_end ?? now.toISOString(),
      }
      return getLogs({ projectRef, ...queryParams })
    },
    enabled: !!projectRef,
    retry: false,
  })
}