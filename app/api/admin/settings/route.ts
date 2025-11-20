import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  social_login_providers: z.object({
    google: z.boolean(),
    facebook: z.boolean(),
    twitter: z.boolean(),
    email_password: z.boolean(),
    magic_link: z.boolean(),
  }).optional(),
  auth_method_default: z.enum(['magic_link', 'email_password']).optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (userData?.user_role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all settings
    const { data: settings, error } = await supabase
      .from('admin_settings')
      .select('*');

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Convert to key-value object
    const settingsObj: Record<string, unknown> = {};
    settings?.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (userData?.user_role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse and validate request
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = updateSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.issues
      }, { status: 400 });
    }

    const updates = validation.data;

    // Update settings
    const updatePromises = [];

    if (updates.social_login_providers) {
      updatePromises.push(
        supabase
          .from('admin_settings')
          .update({
            setting_value: updates.social_login_providers,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'social_login_providers')
      );
    }

    if (updates.auth_method_default) {
      updatePromises.push(
        supabase
          .from('admin_settings')
          .update({
            setting_value: updates.auth_method_default,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'auth_method_default')
      );
    }

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating settings:', errors);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}