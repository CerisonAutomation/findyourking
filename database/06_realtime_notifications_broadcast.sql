-- ================================================================
-- REALTIME NOTIFICATIONS BROADCAST SYSTEM
-- ================================================================
-- Implements Supabase best practices for scalable realtime notifications
-- Uses broadcast instead of postgres_changes for better performance
-- Per: Supabase Realtime AI Assistant Guide
-- ================================================================

-- Step 1: Create trigger function to broadcast notification changes
-- This broadcasts to dedicated user-specific topics: user:{user_id}:notifications
CREATE OR REPLACE FUNCTION notifications_broadcast_trigger()
RETURNS TRIGGER AS $$
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Broadcast to user-specific topic with pattern: user:{user_id}:notifications
  PERFORM realtime.broadcast_changes(
    'user:' || COALESCE(NEW.user_id, OLD.user_id)::text || ':notifications',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 2: Attach trigger to notifications table
DROP TRIGGER IF EXISTS notifications_broadcast_trigger ON notifications;

CREATE TRIGGER notifications_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON notifications
  FOR EACH ROW EXECUTE FUNCTION notifications_broadcast_trigger();

-- Step 3: RLS policies for realtime.messages table (private channel authorization)
-- Users can only receive broadcasts for their own notifications
CREATE POLICY "users_can_receive_notification_broadcasts" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    topic LIKE 'user:%:notifications' AND
    -- Extract user_id from topic pattern: user:{user_id}:notifications
    SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
  );

-- Users can send messages to their own notification channel
CREATE POLICY "users_can_send_notification_broadcasts" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    topic LIKE 'user:%:notifications' AND
    SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
  );

-- Step 4: Create index for RLS policy performance
-- This ensures fast lookups when checking topic patterns
CREATE INDEX IF NOT EXISTS idx_realtime_messages_topic_pattern
  ON realtime.messages(topic text_pattern_ops);

-- Step 5: Enable realtime on notifications table (optional, for reference)
-- This is not needed for broadcast pattern but included for completeness
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

COMMENT ON FUNCTION notifications_broadcast_trigger IS 
  'Broadcasts notification changes to user-specific realtime channels using scalable broadcast pattern';
COMMENT ON POLICY "users_can_receive_notification_broadcasts" ON realtime.messages IS 
  'Allows users to receive broadcasts only for their own notifications';
COMMENT ON POLICY "users_can_send_notification_broadcasts" ON realtime.messages IS 
  'Allows users to send messages to their own notification channel';

