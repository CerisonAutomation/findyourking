import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, sourceLang, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For now, return mock translation
    // In production, integrate with Google Translate or LibreTranslate
    return NextResponse.json({
      translated: text, // Replace with actual translation
      confidence: 0.85,
      sourceLang: sourceLang || 'en',
      targetLang,
    });
  } catch {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
