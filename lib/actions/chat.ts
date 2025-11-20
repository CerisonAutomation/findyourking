import { createClient } from '@/lib/supabase/client';

// =====================================================
// EDIT MESSAGE
// =====================================================
export async function editMessage(messageId: string, newContent: string) {
  if (!messageId || !newContent?.trim()) {
    return { success: false, error: "Message ID and new content are required" };
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
      return { success: false, error: "Can only edit your own messages" };
    }

    // Update message content and updated_at timestamp
    const { error } = await supabase
      .from("messages")
      .update({
        content: newContent.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to edit message";
    return { success: false, error: errorMessage };
  }
}