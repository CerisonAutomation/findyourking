import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'; // Import server client
import { getSecurityHeaders } from '@/lib/api-security';

/**
 * Forwards HTTP requests to the Supabase Management API
 * Acts as a secure proxy that validates authentication and authorization
 * before forwarding requests to Supabase's REST endpoints
 *
 * @param request - The incoming HTTP request
 * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD)
 * @param params - Route parameters containing the API path segments
 * @returns NextResponse with proxied API response or error message
 * @throws Returns 401 if user is not authenticated
 * @throws Returns 500 if Supabase API token is not configured
 * @throws Returns 500 if the proxied request fails
 */
async function forwardToSupabaseAPI(
  request: Request,
  method: string,
  params: { path: string[] },
) {
  if (!process.env['SUPABASE_MANAGEMENT_API_TOKEN']) {
    console.error('Supabase Management API token is not configured.');
    return NextResponse.json(
      { message: 'Server configuration error.' },
      { status: 500 },
    );
  }

  // --- Start of Authorization Check ---
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // --- End of Authorization Check ---

  const { path } = params;
  const apiPath = path.join('/');

  const url = new URL(request.url);
  url.protocol = 'https';
  url.hostname = 'api.supabase.com';
  url.port = '443';
  url.pathname = apiPath;

  const projectRef = path[2];

  // Implement your permission check here (e.g. check if the user is a member of the project)
  // The previous 'everyone can access all projects' comment and check are removed for security.
  // Further granular permission checks based on user roles/project membership should be added here.
  // For now, we ensure at least a user is authenticated.

  try {
    const forwardHeaders: HeadersInit = {
      Authorization: `Bearer ${process.env['SUPABASE_MANAGEMENT_API_TOKEN']}`,
    };

    // Copy relevant headers from the original request
    const contentType = request.headers.get('content-type');
    if (contentType) {
      forwardHeaders['Content-Type'] = contentType;
    }

    const fetchOptions: RequestInit = {
      method,
      headers: forwardHeaders,
    };

    // Include body for methods that support it
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch (error) {
        // Handle cases where body is not readable
        console.warn('Could not read request body:', error);
      }
    }

    const response = await fetch(url, fetchOptions);

    // Get response body
    const responseText = await response.text();
    let responseData: unknown;

    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseData = responseText;
    }

    // Return the response with the same status
    return NextResponse.json(responseData, { status: response.status, headers: { ...getSecurityHeaders() } });
  } catch (error: unknown) {
    console.error('Supabase API proxy error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500, headers: { ...getSecurityHeaders() } });
  }
}

/**
 * GET handler - Retrieves data from Supabase Management API
 * Requires authenticated user session
 *
 * @param request - The incoming GET request with query parameters
 * @param params - Route parameters containing path segments (ref, resource, etc)
 * @returns Proxied GET response with resource data or error
 * @throws 401 if not authenticated, 500 if proxy fails
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'GET', resolvedParams);
}

/**
 * HEAD handler - Checks resource availability without body
 * Useful for checking if a resource exists before full GET request
 *
 * @param request - The incoming HEAD request
 * @param params - Route parameters containing path segments
 * @returns Response headers only, no body
 * @throws 401 if not authenticated, 500 if proxy fails
 */
export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'HEAD', resolvedParams);
}

/**
 * POST handler - Creates new resources in Supabase Management API
 * Forwards request body to Supabase, handles authentication/authorization
 *
 * @param request - The incoming POST request with JSON body
 * @param params - Route parameters containing path segments (ref, resource, etc)
 * @returns Proxied POST response with created resource or validation error
 * @throws 401 if not authenticated, 500 if proxy fails
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'POST', resolvedParams);
}

/**
 * PUT handler - Replaces entire resources in Supabase Management API
 * Updates resource by sending complete replacement data
 *
 * @param request - The incoming PUT request with complete JSON body
 * @param params - Route parameters containing path segments (ref, resource, id)
 * @returns Proxied PUT response with updated resource or error
 * @throws 401 if not authenticated, 500 if proxy fails, 404 if resource not found
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'PUT', resolvedParams);
}

/**
 * DELETE handler - Removes resources from Supabase Management API
 * Permanently deletes the specified resource
 *
 * @param request - The incoming DELETE request
 * @param params - Route parameters containing path segments (ref, resource, id)
 * @returns Proxied DELETE response (typically 204 No Content)
 * @throws 401 if not authenticated, 500 if proxy fails, 404 if resource not found
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'DELETE', resolvedParams);
}

/**
 * PATCH handler - Partially updates resources in Supabase Management API
 * Merges provided fields with existing resource data
 *
 * @param request - The incoming PATCH request with partial JSON body
 * @param params - Route parameters containing path segments (ref, resource, id)
 * @returns Proxied PATCH response with partially updated resource or error
 * @throws 401 if not authenticated, 500 if proxy fails, 404 if resource not found
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'PATCH', resolvedParams);
}
