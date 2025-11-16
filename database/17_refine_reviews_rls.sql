-- Refine RLS policies for the reviews table as per .gemini guidelines

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- Policy: Users can view reviews.
CREATE POLICY "Users can view reviews." ON reviews
  FOR SELECT TO authenticated, anon USING (TRUE);

-- Policy: Users can insert their own reviews.
CREATE POLICY "Users can insert their own reviews." ON reviews
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can update their own reviews.
CREATE POLICY "Users can update their own reviews." ON reviews
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can delete their own reviews.
CREATE POLICY "Users can delete their own reviews." ON reviews
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
