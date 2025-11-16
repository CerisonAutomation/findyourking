-- Refine RLS policies for the kings table as per .gemini guidelines

-- Drop existing policies
DROP POLICY IF EXISTS "King profiles are viewable by everyone." ON kings;
DROP POLICY IF EXISTS "Kings can insert their own details." ON kings;
DROP POLICY IF EXISTS "Kings can update their own details." ON kings;
DROP POLICY IF EXISTS "Kings can delete their own details." ON kings;

-- Policy: King profiles are viewable by everyone.
CREATE POLICY "King profiles are viewable by everyone." ON kings
  FOR SELECT TO authenticated, anon USING (TRUE);

-- Policy: Kings can insert their own details.
CREATE POLICY "Kings can insert their own details." ON kings
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);

-- Policy: Kings can update their own details.
CREATE POLICY "Kings can update their own details." ON kings
  FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- Policy: Kings can delete their own details.
CREATE POLICY "Kings can delete their own details." ON kings
  FOR DELETE TO authenticated USING ((select auth.uid()) = id);
