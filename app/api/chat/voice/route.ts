/**
 * VOICE MESSAGES API - AUDIO RECORDING & TRANSCRIPTION
 * Per Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
 * Per Speech Recognition: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Upload voice message
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

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const matchId = formData.get('matchId') as string;
    const waveform = formData.get('waveform') as string;

    if (!audioFile || !matchId) {
      return NextResponse.json(
        {
          error: 'Audio file and matchId are required',
        },
        { status: 400 },
      );
    }

    // Verify user has access to this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id')
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found or access denied' },
        { status: 403 },
      );
    }

    // Upload audio file to Supabase Storage
    const fileName = `voice-${Date.now()}-${user.id}.webm`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, audioFile, {
        contentType: audioFile.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload audio file' },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('voice-messages').getPublicUrl(fileName);

    // Parse waveform data
    let waveformData: number[] = [];
    try {
      waveformData = waveform ? JSON.parse(waveform) : [];
    } catch {
      waveformData = [];
    }

    // Calculate duration from file size (rough estimate)
    const durationSeconds = Math.max(1, Math.floor(audioFile.size / 16000)); // ~16KB per second for WebM

    // Create message with voice attachment
    const voiceMessage = {
      match_id: matchId,
      from_user_id: user.id,
      to_user_id: match.user1_id === user.id ? match.user2_id : match.user1_id,
      content: '🎤 Voice message',
      message_type: 'voice',
      attachment_urls: [publicUrl],
      attachment_metadata: {
        duration: durationSeconds,
        waveform: waveformData.slice(0, 100), // Limit to 100 data points
        fileSize: audioFile.size,
        mimeType: audioFile.type,
      },
    };

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(voiceMessage)
      .select()
      .single();

    if (messageError) {
      // Clean up uploaded file if message creation fails
      await supabase.storage.from('voice-messages').remove([fileName]);
      return NextResponse.json(
        { error: messageError.message },
        { status: 500 },
      );
    }

    // Create voice message metadata record
    const { error: voiceError } = await supabase.from('voice_messages').insert({
      message_id: message.id,
      duration_seconds: durationSeconds,
      waveform_data: waveformData,
      language_code: 'en',
    });

    if (voiceError) {
      console.error('Failed to create voice metadata:', voiceError);
      // Don't fail the whole request
    }

    return NextResponse.json({
      message,
      voiceUrl: publicUrl,
      duration: durationSeconds,
    });
  } catch (error) {
    console.error('Voice message upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload voice message' },
      { status: 500 },
    );
  }
}

// PUT - Update voice message with transcription
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      messageId,
      transcription,
      languageCode = 'en',
    } = await request.json();

    if (!messageId || !transcription) {
      return NextResponse.json(
        {
          error: 'messageId and transcription are required',
        },
        { status: 400 },
      );
    }

    // Verify ownership of the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, from_user_id, message_type')
      .eq('id', messageId)
      .eq('from_user_id', user.id)
      .eq('message_type', 'voice')
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Voice message not found or access denied' },
        { status: 403 },
      );
    }

    // Update transcription in voice_messages table
    const { error: updateError } = await supabase
      .from('voice_messages')
      .update({
        transcription,
        language_code: languageCode,
      })
      .eq('message_id', messageId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update message content with transcription
    const { error: messageUpdateError } = await supabase
      .from('messages')
      .update({
        content: `🎤 ${transcription}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (messageUpdateError) {
      console.error('Failed to update message content:', messageUpdateError);
    }

    return NextResponse.json({ success: true, transcription });
  } catch (error) {
    console.error('Voice transcription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update transcription' },
      { status: 500 },
    );
  }
}
