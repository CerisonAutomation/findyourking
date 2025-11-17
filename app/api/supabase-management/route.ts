import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import type { components } from '@/lib/management-api-schema';
import createOpenApiClient from 'openapi-fetch';
import { getSecurityHeaders } from '@/lib/api-security';

const client = createOpenApiClient<components>({
  baseUrl: 'https://api.supabase.com',
  headers: {
    Authorization: `Bearer ${process.env['SUPABASE_MANAGEMENT_API_TOKEN']}`,
  },
});

// Helper to add security headers to response
function withSecurityHeaders(options?: any) {
  return {
    ...options,
    headers: { ...getSecurityHeaders(), ...(options?.headers || {}) },
  };
}

/**
 * GET /api/supabase-management
 * Retrieves Supabase project management data based on query parameters
 *
 * Query Parameters:
 * @param projectRef {string} - Project reference ID (required)
 * @param type {string} - Data type: 'logs', 'secrets', 'storage', 'auth', 'suggestions', 'lints', 'advisors'
 * @param iso_timestamp_start {string} - Start timestamp for logs query (ISO format, optional)
 * @param iso_timestamp_end {string} - End timestamp for logs query (ISO format, optional)
 * @param sql {string} - SQL filter for logs query (optional)
 *
 * @returns {Promise<Response>} JSON response with requested data or error
 *
 * Examples:
 * - GET ?projectRef=abc123&type=logs - Fetch API logs
 * - GET ?projectRef=abc123&type=secrets - Fetch environment secrets
 * - GET ?projectRef=abc123&type=storage - Fetch storage bucket info
 * - GET ?projectRef=abc123&type=advisors - Fetch performance/security advisors
 *
 * @throws 401 if not authenticated
 * @throws 400 if projectRef is missing
 * @throws 500 if Supabase API returns error
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      withSecurityHeaders({ status: 401 }),
    );
  }

  const { searchParams } = new URL(request.url);
  const projectRef = searchParams.get('projectRef');
  const iso_timestamp_start = searchParams.get('iso_timestamp_start');
  const iso_timestamp_end = searchParams.get('iso_timestamp_end');
  const sql = searchParams.get('sql');
  const type = searchParams.get('type'); // Added to differentiate between auth config, logs, secrets, storage, and suggestions

  if (!projectRef) {
    return NextResponse.json(
      { message: 'projectRef is required.' },
      { status: 400 },
    );
  }

  try {
    if (type === 'logs') {
      const { data, error } = await client.GET(
        '/v1/projects/{ref}/analytics/endpoints/logs.all',
        {
          params: {
            path: { ref: projectRef },
            query: {
              iso_timestamp_start: iso_timestamp_start || undefined,
              iso_timestamp_end: iso_timestamp_end || undefined,
              sql: sql || undefined,
            },
          },
        },
      );

      if (error) {
        console.error(
          'Error fetching logs from Supabase Management API:',
          error,
        );
        return NextResponse.json(
          { message: 'Failed to fetch logs.' },
          { status: error.status || 500 },
        );
      }
      return NextResponse.json(data);
    } else if (type === 'secrets') {
      const { data, error } = await client.GET('/v1/projects/{ref}/secrets', {
        params: {
          path: { ref: projectRef },
        },
      });

      if (error) {
        console.error(
          'Error fetching secrets from Supabase Management API:',
          error,
        );
        return NextResponse.json(
          { message: 'Failed to fetch secrets.' },
          { status: error.status || 500 },
        );
      }
      return NextResponse.json(data);
    } else if (type === 'storage-buckets') {
      const { data, error } = await client.GET(
        '/v1/projects/{ref}/storage/buckets',
        {
          params: {
            path: { ref: projectRef },
          },
        },
      );

      if (error) {
        console.error(
          'Error fetching storage buckets from Supabase Management API:',
          error,
        );
        return NextResponse.json(
          { message: 'Failed to fetch storage buckets.' },
          { status: error.status || 500 },
        );
      }
      return NextResponse.json(data);
    } else if (type === 'storage-objects') {
      const bucketId = searchParams.get('bucketId');
      if (!bucketId) {
        return NextResponse.json(
          { message: 'bucketId is required for storage-objects type.' },
          { status: 400 },
        );
      }
      const { data, error } = await client.POST(
        // @ts-expect-error this endpoint is not yet implemented
        '/v1/projects/{ref}/storage/buckets/{bucketId}/objects/list',
        {
          params: {
            path: {
              ref: projectRef,
              bucketId,
            },
          },
          body: {
            path: '',
            options: { limit: 100, offset: 0 },
          },
        },
      );

      if (error) {
        console.error(
          'Error listing storage objects from Supabase Management API:',
          error,
        );
        return NextResponse.json(
          { message: 'Failed to list storage objects.' },
          { status: error.status || 500 },
        );
      }
      return NextResponse.json(data);
    } else if (type === 'suggestions') {
      const [
        { data: performanceData, error: performanceError },
        { data: securityData, error: securityError },
      ] = await Promise.all([
        client.GET('/v1/projects/{ref}/advisors/performance', {
          params: {
            path: { ref: projectRef },
          },
        }),
        client.GET('/v1/projects/{ref}/advisors/security', {
          params: {
            path: { ref: projectRef },
          },
        }),
      ]);

      if (performanceError) {
        console.error(
          'Error fetching performance suggestions from Supabase Management API:',
          performanceError,
        );
        return NextResponse.json(
          { message: 'Failed to fetch performance suggestions.' },
          { status: performanceError.status || 500 },
        );
      }
      if (securityError) {
        console.error(
          'Error fetching security suggestions from Supabase Management API:',
          securityError,
        );
        return NextResponse.json(
          { message: 'Failed to fetch security suggestions.' },
          { status: securityError.status || 500 },
        );
      }

      const performanceLints = (performanceData?.lints || []).map((lint) => ({
        ...lint,
        type: 'performance' as const,
      }));
      const securityLints = (securityData?.lints || []).map((lint) => ({
        ...lint,
        type: 'security' as const,
      }));
      return NextResponse.json([...performanceLints, ...securityLints]);
    } else {
      // Default to auth config if type is not specified or unknown
      const { data, error } = await client.GET(
        '/v1/projects/{ref}/config/auth',
        {
          params: {
            path: { ref: projectRef },
          },
        },
      );

      if (error) {
        console.error(
          'Error fetching auth config from Supabase Management API:',
          error,
        );
        return NextResponse.json(
          { message: 'Failed to fetch auth config.' },
          { status: error.status || 500 },
        );
      }

      return NextResponse.json(data);
    }
  } catch (error: unknown) {
    console.error('Supabase Management API proxy GET error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/supabase-management
 * Executes management operations on Supabase projects
 * Operations include: running SQL queries, creating secrets, updating auth config
 *
 * Request Body:
 * @param projectRef {string} - Project reference ID (required)
 * @param type {string} - Operation type: 'run-query', 'create-secrets', or default (auth config update)
 * @param query {string} - SQL query string (required for 'run-query' type)
 * @param readOnly {boolean} - Whether query is read-only (optional, for 'run-query')
 * @param secrets {object} - Secrets object (required for 'create-secrets' type)
 * @param payload {object} - Auth config payload (required for default auth config update)
 *
 * @returns {Promise<Response>} JSON response with operation result or error
 *
 * Operation Examples:
 * - type: 'run-query' - Execute SQL on project database
 * - type: 'create-secrets' - Create new environment secrets
 * - default - Update project auth configuration
 *
 * @throws 401 if not authenticated
 * @throws 400 if required fields missing or invalid type
 * @throws 403 for unauthorized operations (admin-only features)
 * @throws 500 if Supabase API returns error
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      withSecurityHeaders({ status: 401 }),
    );
  }

  const { projectRef, query, readOnly, type, secrets } = await request.json();

  if (!projectRef || !type) {
    return NextResponse.json(
      { message: 'projectRef and type are required.' },
      { status: 400 },
    );
  }

  try {
    if (type === 'run-query') {
      // IMPORTANT: Implement strict authorization here.
      // Only highly privileged users should be able to run arbitrary SQL queries.
      // For now, we only check for authentication.
      // A more robust solution would involve checking user roles or specific permissions.
      if (!query) {
        return NextResponse.json(
          { message: 'query is required for run-query type.' },
          { status: 400 },
        );
      }

      const { data, error } = await client.POST(
        '/v1/projects/{ref}/database/query',
        {
          params: {
            path: {
              ref: projectRef,
            },
          },
          body: {
            query,
            read_only: readOnly,
          },
        },
      );

      if (error) {
        console.error(
          'Error running SQL query via Supabase Management API:',
          error,
        );
        return NextResponse.json(
          { message: 'Failed to run SQL query.' },
          { status: error.status || 500 },
        );
      }

      return NextResponse.json(data);
    } else if (type === 'create-secrets') {
      // IMPORTANT: Implement strict authorization here.
      // Only highly privileged users should be able to create secrets.
      if (!secrets) {
        return NextResponse.json(
          { message: 'secrets are required for create-secrets type.' },
          { status: 400 },
        );
      }

      const { data, error } = await client.POST('/v1/projects/{ref}/secrets', {
        params: {
          path: {
            ref: projectRef,
          },
        },
        body: secrets,
      });

      if (error) {
        console.error(
          'Error creating secrets via Supabase Management API:',
          error,
        );
        return NextResponse.json(
          { message: 'Failed to create secrets.' },
          { status: error.status || 500 },
        );
      }

      return NextResponse.json(data);
    } else {
      // Default to PATCH for auth config if type is not specified or unknown
      const { payload } = await request.json(); // Re-parse for payload if not run-query

      if (!payload) {
        return NextResponse.json(
          { message: 'payload is required.' },
          { status: 400 },
        );
      }

      const { data, error } = await client.PATCH(
        '/v1/projects/{ref}/config/auth',
        {
          params: {
            path: { ref: projectRef },
          },
          body: payload,
        },
      );

      if (error) {
        console.error(
          'Error updating auth config from Supabase Management API:',
          error,
        );
        return NextResponse.json(
          { message: 'Failed to update auth config.' },
          { status: error.status || 500 },
        );
      }

      return NextResponse.json(data);
    }
  } catch (error: unknown) {
    console.error('Supabase Management API proxy POST error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/supabase-management
 * Deletes resources from Supabase projects
 * Primarily used for deleting environment secrets
 *
 * Request Body:
 * @param projectRef {string} - Project reference ID (required)
 * @param type {string} - Operation type: 'delete-secrets' (required)
 * @param secretNames {string[]} - Array of secret names to delete (required for 'delete-secrets')
 *
 * @returns {Promise<Response>} JSON response with deletion result or error
 *
 * Examples:
 * - type: 'delete-secrets' - Delete specified environment secrets from project
 *
 * @throws 401 if not authenticated
 * @throws 400 if required fields missing or invalid type
 * @throws 403 for unauthorized deletion attempts
 * @throws 500 if Supabase API returns error
 */
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      withSecurityHeaders({ status: 401 }),
    );
  }

  const { projectRef, secretNames, type } = await request.json();

  if (!projectRef || !type) {
    return NextResponse.json(
      { message: 'projectRef and type are required.' },
      { status: 400 },
    );
  }

  try {
    if (type === 'delete-secrets') {
      if (!secretNames) {
        return NextResponse.json(
          { message: 'secretNames are required for delete-secrets type.' },
          { status: 400 },
        );
      }
      const { data, error } = await client.DELETE(
        '/v1/projects/{ref}/secrets',
        {
          params: {
            path: {
              ref: projectRef,
            },
          },
          body: secretNames,
        },
      );

      if (error) {
        console.error(
          'Error deleting secrets via Supabase Management API:',
          error,
        );
        return NextResponse.json(
          { message: 'Failed to delete secrets.' },
          { status: error.status || 500 },
        );
      }

      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { message: 'Invalid DELETE operation type.' },
        { status: 400 },
      );
    }
  } catch (error: unknown) {
    console.error('Supabase Management API proxy DELETE error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
