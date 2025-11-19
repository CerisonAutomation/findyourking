"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// =====================================================
// BLOCK USER
// =====================================================
export async function blockUser(blockedUserId: string) {
  if (!blockedUserId) {
    return { success: false, error: "User ID required" };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: "Not authenticated" };
  }

  if (user.id === blockedUserId) {
    return { success: false, error: "Cannot block yourself" };
  }

  try {
    const { error } = await supabase
      .from("blocks")
      .insert({
        blocker_id: user.id,
        blocked_user_id: blockedUserId,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Also delete any existing match
    await supabase
      .from("matches")
      .delete()
      .or(
        `and(user_id_a.eq.${user.id},user_id_b.eq.${blockedUserId}),and(user_id_a.eq.${blockedUserId},user_id_b.eq.${user.id})`
      );

    revalidatePath("/matches");
    return { success: true, message: "User blocked successfully" };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to block user";
    return { success: false, error: errorMessage };
  }
}

// =====================================================
// UNBLOCK USER
// =====================================================
export async function unblockUser(blockedUserId: string) {
  if (!blockedUserId) {
    return { success: false, error: "User ID required" };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_user_id", blockedUserId);

    if (error) throw error;

    revalidatePath("/matches");
    return { success: true, message: "User unblocked" };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to unblock user";
    return { success: false, error: errorMessage };
  }
}

// =====================================================
// CHECK IF USER IS BLOCKED
// =====================================================
export async function isUserBlocked(potentialUserId: string): Promise<boolean> {
  if (!potentialUserId) return false;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) return false;

  try {
    const { data, error } = await supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", user.id)
      .eq("blocked_user_id", potentialUserId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return !!data;
  } catch (err) {
    console.error("Error checking block status:", err);
    return false;
  }
}

// =====================================================
// REPORT USER
// =====================================================
export async function reportUser(
  reportedUserId: string,
  reason: "inappropriate" | "spam" | "fraud" | "abuse" | "other",
  description?: string
) {
  if (!reportedUserId || !reason) {
    return { success: false, error: "User ID and reason required" };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: "Not authenticated" };
  }

  if (user.id === reportedUserId) {
    return { success: false, error: "Cannot report yourself" };
  }

  try {
    const { error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason,
        description: description?.trim() || null,
        status: "pending",
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    return { success: true, message: "Report submitted. Thank you for helping keep our community safe." };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to submit report";
    return { success: false, error: errorMessage };
  }
}

// =====================================================
// GET USER'S BLOCKED LIST
// =====================================================
export async function getBlockedUsers(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) return [];

  try {
    const { data, error } = await supabase
      .from("blocks")
      .select("blocked_user_id")
      .eq("blocker_id", user.id);

    if (error) throw error;
    return data?.map((b: { blocked_user_id: string }) => b.blocked_user_id) ?? [];
  } catch (err) {
    console.error("Error fetching blocked users:", err);
    return [];
  }
}

// =====================================================
// UNMATCH USER (Delete match relationship)
// =====================================================
export async function unmatchUser(matchedUserId: string) {
  if (!matchedUserId) {
    return { success: false, error: "User ID required" };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("matches")
      .delete()
      .or(
        `and(user_id_a.eq.${user.id},user_id_b.eq.${matchedUserId}),and(user_id_a.eq.${matchedUserId},user_id_b.eq.${user.id})`
      );

    if (error) throw error;

    revalidatePath("/chat");
    revalidatePath("/matches/list");
    return { success: true, message: "Unmatched successfully" };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to unmatch";
    return { success: false, error: errorMessage };
  }
}
