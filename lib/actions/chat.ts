"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// =====================================================
// SEND MESSAGE
// =====================================================
export async function sendMessage(matchId: string, content: string) {
  if (!matchId || !content?.trim()) {
    return { success: false, error: "Match ID and message content required" };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Verify user is part of this match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id")
      .eq("id", matchId)
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .single();

    if (matchError || !match) {
      return { success: false, error: "Match not found or access denied" };
    }

    // Insert message
    const { data, error } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/chat/${matchId}`);
    return { success: true, message: data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send message";
    return { success: false, error: errorMessage };
  }
}

// =====================================================
// GET MESSAGES FOR A MATCH
// =====================================================
export async function getMessages(matchId: string, limit: number = 50) {
  if (!matchId) {
    return { success: false, messages: [], error: "Match ID required" };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, messages: [], error: "Not authenticated" };
  }

  try {
    // Verify user is part of this match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, user_id_a, user_id_b")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return { success: false, messages: [], error: "Match not found" };
    }

    if (match.user_id_a !== user.id && match.user_id_b !== user.id) {
      return { success: false, messages: [], error: "Access denied" };
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    return { success: true, messages: messages ?? [] };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch messages";
    return { success: false, messages: [], error: errorMessage };
  }
}

// =====================================================
// MARK MESSAGES AS READ
// =====================================================
export async function markMessagesAsRead(matchId: string) {
  if (!matchId) {
    return { success: false, error: "Match ID required" };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Verify user is part of this match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, user_id_a, user_id_b")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return { success: false, error: "Match not found" };
    }

    if (match.user_id_a !== user.id && match.user_id_b !== user.id) {
      return { success: false, error: "Access denied" };
    }

    // Mark all unread messages from the other user as read
    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("match_id", matchId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) throw error;

    revalidatePath(`/chat/${matchId}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to mark messages as read";
    return { success: false, error: errorMessage };
  }
}

// =====================================================
// GET UNREAD MESSAGE COUNT FOR USER
// =====================================================
export async function getUnreadCount(matchId?: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) return 0;

  try {
    let query = supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (matchId) {
      query = query.eq("match_id", matchId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("Error fetching unread count:", err);
    return 0;
  }
}

// =====================================================
// GET MESSAGE THREADS WITH OTHER USERS
// =====================================================
export async function getMessageThreads() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, threads: [], error: "Not authenticated" };
  }

  try {
    // Get all matches for user
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select(
        `
        id,
        user_id_a,
        user_id_b,
        messages (
          id,
          content,
          created_at,
          read_at,
          sender_id
        ),
        users!matches_user_id_a_fkey (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .order("created_at", { foreignTable: "messages", ascending: false });

    if (matchError) throw matchError;

    // Format threads
    interface ThreadData {
      id: string;
      user_id_a: string;
      user_id_b: string;
      created_at: string;
      messages?: Array<{ id: string; content: string; created_at: string; read_at: string | null; sender_id: string }>;
    }

    const threads = ((matches as unknown as ThreadData[] | null) ?? []).map((match) => {
      const otherUserId = match.user_id_a === user.id ? match.user_id_b : match.user_id_a;
      const lastMessage = match.messages?.[0];
      const unreadCount = match.messages?.filter(
        (m) => m.sender_id !== user.id && !m.read_at
      ).length ?? 0;

      return {
        matchId: match.id,
        lastMessage: lastMessage?.content || "No messages yet",
        lastMessageTime: lastMessage?.created_at || match.created_at,
        lastMessageSenderId: lastMessage?.sender_id,
        unreadCount,
        otherUserId,
      };
    });

    return { success: true, threads };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch threads";
    return { success: false, threads: [], error: errorMessage };
  }
}

// =====================================================
// DELETE MESSAGE (from current user's view only)
// =====================================================
export async function deleteMessage(messageId: string) {
  if (!messageId) {
    return { success: false, error: "Message ID required" };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Verify user is the sender
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("id, sender_id, match_id")
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      return { success: false, error: "Message not found" };
    }

    if (message.sender_id !== user.id) {
      return { success: false, error: "Can only delete your own messages" };
    }

    // Soft delete - set content to empty
    const { error } = await supabase
      .from("messages")
      .update({ content: "[deleted]" })
      .eq("id", messageId);

    if (error) throw error;

    revalidatePath(`/chat/${message.match_id}`);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to delete message";
    return { success: false, error: errorMessage };
  }
}
