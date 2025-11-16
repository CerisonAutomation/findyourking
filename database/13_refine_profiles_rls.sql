-- Refine RLS policies for the profiles table as per .gemini guidelines

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON profiles;

-- Policy: Public profiles are viewable by everyone.
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT TO authenticated, anon USING (TRUE);

-- Policy: Users can insert their own profile.
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);

-- Policy: Users can update their own profile.
CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- Policy: Users can delete their own profile.
CREATE POLICY "Users can delete their own profile." ON profiles
  FOR DELETE TO authenticated USING ((select auth.uid()) = id);
