-- Refine RLS policies for the bookings table as per .gemini guidelines

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bookings." ON bookings;
DROP POLICY IF EXISTS "Users can create bookings." ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings." ON bookings;
DROP POLICY IF EXISTS "Kings can update bookings they are part of." ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings." ON bookings;
DROP POLICY IF EXISTS "Users can cancel their own pending bookings." ON bookings;
DROP POLICY IF EXISTS "Kings can update status of their bookings." ON bookings;

-- Policy: Users can view their own bookings or bookings they are the king of.
-- Optimized to avoid subquery in USING clause for performance.
CREATE POLICY "Users can view their own bookings." ON bookings
  FOR SELECT TO authenticated USING (
    (select auth.uid()) = user_id OR (select auth.uid()) = king_id
  );

-- Policy: Users can create bookings.
CREATE POLICY "Users can create bookings." ON bookings
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can cancel their own pending bookings.
CREATE POLICY "Users can cancel their own pending bookings." ON bookings
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id AND old.status = 'pending')
  WITH CHECK (NEW.status = 'cancelled');

-- Policy: Kings can update status of their bookings.
CREATE POLICY "Kings can update status of their bookings." ON bookings
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = king_id)
  WITH CHECK (NEW.status IN ('confirmed', 'cancelled', 'completed'));

-- Policy: Users can delete their own bookings.
CREATE POLICY "Users can delete their own bookings." ON bookings
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
