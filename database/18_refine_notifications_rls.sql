-- Refine RLS policies for the notifications table as per .gemini guidelines

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Policy: Users can view their own notifications.
CREATE POLICY "Users can view their own notifications." ON notifications
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- Policy: Users can insert their own notifications.
CREATE POLICY "Users can insert their own notifications." ON notifications
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can update their own notifications.
CREATE POLICY "Users can update their own notifications." ON notifications
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can delete their own notifications.
CREATE POLICY "Users can delete their own notifications." ON notifications
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
