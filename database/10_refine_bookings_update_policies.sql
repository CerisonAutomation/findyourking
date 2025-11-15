-- Drop existing UPDATE policies for bookings table
DROP POLICY IF EXISTS "Users can update their own bookings." ON bookings;
DROP POLICY IF EXISTS "Kings can update bookings they are part of." ON bookings;

-- Refine policy: Users can only cancel their own pending bookings
CREATE POLICY "Users can cancel their own pending bookings." ON bookings
  FOR UPDATE USING (auth.uid() = user_id AND old.status = 'pending')
  WITH CHECK (NEW.status = 'cancelled');

-- Refine policy: Kings can update the status of bookings they are part of
CREATE POLICY "Kings can update status of their bookings." ON bookings
  FOR UPDATE USING (auth.uid() = (SELECT id FROM kings WHERE id = king_id))
  WITH CHECK (NEW.status IN ('confirmed', 'cancelled', 'completed'));
