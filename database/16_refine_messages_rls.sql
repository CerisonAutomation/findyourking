-- Refine RLS policies for the messages table as per .gemini guidelines

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view messages in chats they are part of." ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages." ON messages;
DROP POLICY IF EXISTS "Users can update their own messages." ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages." ON messages;

-- Policy: Users can view messages in chats they are part of.
CREATE POLICY "Users can view messages in chats they are part of." ON messages
  FOR SELECT TO authenticated USING (
    (select auth.uid()) = user_id OR (select auth.uid()) = king_id
  );

-- Policy: Users can insert their own messages.
CREATE POLICY "Users can insert their own messages." ON messages
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can update their own messages.
CREATE POLICY "Users can update their own messages." ON messages
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can delete their own messages.
CREATE POLICY "Users can delete their own messages." ON messages
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
