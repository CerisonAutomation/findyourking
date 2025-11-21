import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/boyfriend/templates
 * Fetch all available AI boyfriend templates
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: templates, error } = await supabase
      .from('ai_boyfriend_templates')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching boyfriend templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/boyfriend/templates
 * Create a boyfriend from a template
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, customName } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('ai_boyfriend_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Deactivate existing boyfriends
    await supabase
      .from('ai_boyfriends')
      .update({ active: false })
      .eq('user_id', user.id)
      .eq('active', true);

    // Create new boyfriend from template
    const { data: boyfriend, error: createError } = await supabase
      .from('ai_boyfriends')
      .insert({
        user_id: user.id,
        name: customName || template.name,
        avatar_url: template.avatar_url,
        openness: template.openness,
        conscientiousness: template.conscientiousness,
        extraversion: template.extraversion,
        agreeableness: template.agreeableness,
        neuroticism: template.neuroticism,
        formality: template.formality,
        verbosity: template.verbosity,
        humor: template.humor,
        emotiveness: template.emotiveness,
        playfulness: template.playfulness,
        flirtiness: template.flirtiness,
        romantic_intensity: template.romantic_intensity,
        active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating boyfriend:', createError);
      return NextResponse.json(
        { error: 'Failed to create boyfriend' },
        { status: 500 }
      );
    }

    return NextResponse.json({ boyfriend }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
