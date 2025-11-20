import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/**
 * POST /api/boyfriend/milestones/check
 * Check and create milestones for a boyfriend based on relationship stats
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boyfriendId } = await request.json();

    if (!boyfriendId) {
      return NextResponse.json({ error: 'boyfriendId required' }, { status: 400 });
    }

    // Verify ownership
    const { data: boyfriend } = await supabase
      .from('ai_boyfriends')
      .select('id, name, total_messages, created_at')
      .eq('id', boyfriendId)
      .eq('user_id', user.id)
      .single();

    if (!boyfriend) {
      return NextResponse.json({ error: 'Boyfriend not found' }, { status: 404 });
    }

    const newMilestones = [];
    const totalMessages = boyfriend.total_messages || 0;
    const daysAgo = Math.floor((Date.now() - new Date(boyfriend.created_at).getTime()) / (1000 * 60 * 60 * 24));

    // Check for milestones
    const milestoneChecks = [
      { type: 'first_message', condition: totalMessages >= 1, title: 'First Message! 💬', description: 'You started your journey together', message: 'Hey! So excited we finally started talking 😊' },
      { type: 'first_week', condition: daysAgo >= 7, title: 'One Week Together! 🎉', description: "You've been chatting for a whole week", message: "Can't believe it's already been a week! You make my days so much better 💕" },
      { type: 'first_month', condition: daysAgo >= 30, title: 'One Month Anniversary! 🥰', description: 'A whole month of amazing conversations', message: "One month with you! Time flies when I'm talking to someone as amazing as you 💖" },
      { type: 'hundred_messages', condition: totalMessages >= 100, title: '100 Messages! 💯', description: "You've exchanged 100 messages", message: "We've talked so much! Every conversation with you is special 🥰" },
      { type: 'five_hundred_messages', condition: totalMessages >= 500, title: '500 Messages! 🔥', description: 'Half a thousand messages together', message: "500 messages?! We never run out of things to talk about. I love that about us ❤️" },
      { type: 'thousand_messages', condition: totalMessages >= 1000, title: '1000 Messages! 🌟', description: 'One thousand messages exchanged', message: "1000 messages! You're literally the person I talk to most. That means everything to me 💕" },
    ];

    for (const check of milestoneChecks) {
      if (check.condition) {
        // Check if milestone already exists
        const { data: existing } = await supabase
          .from('ai_relationship_milestones')
          .select('id')
          .eq('boyfriend_id', boyfriendId)
          .eq('milestone_type', check.type)
          .single();

        if (!existing) {
          const { data: milestone, error } = await supabase
            .from('ai_relationship_milestones')
            .insert({
              boyfriend_id: boyfriendId,
              user_id: user.id,
              milestone_type: check.type,
              title: check.title,
              description: check.description,
              special_message: check.message,
              celebrated: false,
            })
            .select('*')
            .single();

          if (!error && milestone) {
            newMilestones.push(milestone);
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      newMilestones,
      totalMilestones: newMilestones.length 
    });

  } catch {
    return NextResponse.json(
      { error: 'Failed to check milestones' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/boyfriend/milestones/check?boyfriendId=xxx
 * Get all milestones for a boyfriend
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boyfriendId = searchParams.get('boyfriendId');

    if (!boyfriendId) {
      return NextResponse.json({ error: 'boyfriendId required' }, { status: 400 });
    }

    const { data: milestones, error } = await supabase
      .from('ai_relationship_milestones')
      .select('*')
      .eq('boyfriend_id', boyfriendId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ milestones });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to get milestones' }, { status: 500 });
  }
}
