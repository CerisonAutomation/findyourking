import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'; // Import server client

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
    return NextResponse.json(responseData, { status: response.status });
  } catch (error: unknown) {
    console.error('Supabase API proxy error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'GET', resolvedParams);
}

export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'HEAD', resolvedParams);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'POST', resolvedParams);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'PUT', resolvedParams);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'DELETE', resolvedParams);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  return forwardToSupabaseAPI(request, 'PATCH', resolvedParams);
}
