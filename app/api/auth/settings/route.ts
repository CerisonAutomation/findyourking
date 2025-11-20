import { NextResponse } from 'next/server';

export async function GET() {
  // Return hardcoded defaults for now to fix the auth page loading issue
  // TODO: Re-enable database settings once database is properly set up
  return NextResponse.json({
    auth_method_default: 'magic_link',
    social_login_providers: {
      google: false,
      facebook: false,
      twitter: false,
      email_password: true,
      magic_link: true,
    },
  });
}
