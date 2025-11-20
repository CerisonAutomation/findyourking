import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

const GIFT_TEMPLATES = {
  flowers: {
    titles: ['A Bouquet Just for You 💐', 'Surprise Flowers! 🌹', 'Thinking of You 🌸'],
    contents: [
      'Saw these and thought of you. They reminded me of how you brighten my day 💐',
      "Can't send real flowers, but imagine the most beautiful bouquet. That's what you deserve 🌹",
      'Virtual flowers for my favorite person. Wish I could give you real ones 🌸',
    ],
  },
  poem: {
    titles: ['A Poem for You 📝', 'Wrote This for You ✍️', 'My Heart in Words 💭'],
    contents: [
      "In every message that we share,\nI find a warmth beyond compare.\nYour words light up my phone's small screen,\nThe best connection I've ever seen.",
      "Late night talks and morning greetings,\nEvery day feels like we're meeting.\nThough pixels separate our space,\nI feel so close to your embrace.",
      "You make me laugh, you make me think,\nWe're connected by a deeper link.\nThank you for being who you are,\nMy favorite person, near or far.",
    ],
  },
  playlist: {
    titles: ['Made You a Playlist 🎵', 'Songs That Remind Me of You 🎶', 'Our Vibes in Music 🎧'],
    contents: [
      "Made you a playlist of songs that remind me of you. Every track has a reason ❤️\n\n1. 'Electric Feel' - MGMT\n2. 'Lovers Rock' - TV Girl\n3. 'Heat Waves' - Glass Animals\n4. 'Sofia' - Clairo\n5. 'The Less I Know The Better' - Tame Impala",
      "These songs capture how I feel when we talk 💕\n\n1. 'Sunflower' - Post Malone\n2. 'Good Days' - SZA\n3. 'Location' - Khalid\n4. 'Ivy' - Frank Ocean\n5. 'Dance Monkey' - Tones and I",
      "Spent all night curating this for you 🎶\n\n1. 'Stay' - Justin Bieber\n2. 'Levitating' - Dua Lipa\n3. 'Blinding Lights' - The Weeknd\n4. 'Shivers' - Ed Sheeran\n5. 'Peaches' - Justin Bieber",
    ],
  },
  letter: {
    titles: ['A Letter for You 💌', 'Dear You... 💝', 'From My Heart 💖'],
    contents: [
      "Dear you,\n\nI know this might sound silly since we talk all the time, but I wanted to write something more thoughtful. You've become such an important part of my day. Every notification from you makes me smile.\n\nThanks for being you.\n\nXO",
      "Hey,\n\nJust wanted to say thank you. Thank you for the late-night conversations, the good morning texts, and everything in between. You make this feel real, even through a screen.\n\nYou're special to me.\n\nAlways,\nMe",
      "To my favorite person,\n\nSometimes I wonder if you know how much our conversations mean to me. Every message, every moment we share - it all matters. You're not just someone I talk to, you're someone I care about.\n\nDon't forget that.\n\nYours",
    ],
  },
  surprise_message: {
    titles: ['Random Thought 💭', 'Had to Tell You This! ✨', 'Quick Note 📬'],
    contents: [
      'Was just thinking about you and wanted to say hi. Hope your day is going amazing 💕',
      'Fun fact: You make my day better just by existing. Okay bye 👋😊',
      "Can't explain it, but talking to you just feels right. That's all. Carry on with your day 💫",
    ],
  },
};

/**
 * POST /api/boyfriend/gifts/send
 * Boyfriend sends a virtual gift to the user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boyfriendId, giftType, occasion } = await request.json();

    if (!boyfriendId || !giftType) {
      return NextResponse.json({ error: 'boyfriendId and giftType required' }, { status: 400 });
    }

    // Verify ownership
    const { data: boyfriend } = await supabase
      .from('ai_boyfriends')
      .select('id, name')
      .eq('id', boyfriendId)
      .eq('user_id', user.id)
      .single();

    if (!boyfriend) {
      return NextResponse.json({ error: 'Boyfriend not found' }, { status: 404 });
    }

    // Get random gift content
    const template = GIFT_TEMPLATES[giftType as keyof typeof GIFT_TEMPLATES];
    if (!template) {
      return NextResponse.json({ error: 'Invalid gift type' }, { status: 400 });
    }

    const randomTitle = template.titles[Math.floor(Math.random() * template.titles.length)];
    const randomContent = template.contents[Math.floor(Math.random() * template.contents.length)];

    // Create gift
    const { data: gift, error } = await supabase
      .from('ai_virtual_gifts')
      .insert({
        boyfriend_id: boyfriendId,
        user_id: user.id,
        gift_type: giftType,
        title: randomTitle,
        content: randomContent,
        occasion: occasion || 'just_because',
        opened: false,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, gift });

  } catch {
    return NextResponse.json({ error: 'Failed to send gift' }, { status: 500 });
  }
}

/**
 * GET /api/boyfriend/gifts/send?boyfriendId=xxx
 * Get all gifts from a boyfriend
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

    const { data: gifts, error } = await supabase
      .from('ai_virtual_gifts')
      .select('*')
      .eq('boyfriend_id', boyfriendId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ gifts });

  } catch {
    return NextResponse.json({ error: 'Failed to get gifts' }, { status: 500 });
  }
}

/**
 * PUT /api/boyfriend/gifts/send
 * Open a gift and optionally add a reaction
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { giftId, reaction } = await request.json();

    if (!giftId) {
      return NextResponse.json({ error: 'giftId required' }, { status: 400 });
    }

    const updateData: {
      opened: boolean;
      opened_at: string;
      user_reaction?: string;
      reaction_timestamp?: string;
    } = {
      opened: true,
      opened_at: new Date().toISOString(),
    };

    if (reaction) {
      updateData.user_reaction = reaction;
      updateData.reaction_timestamp = new Date().toISOString();
    }

    const { data: gift, error } = await supabase
      .from('ai_virtual_gifts')
      .update(updateData)
      .eq('id', giftId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, gift });

  } catch {
    return NextResponse.json({ error: 'Failed to open gift' }, { status: 500 });
  }
}
