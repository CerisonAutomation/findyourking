-- Create booking_status enum type
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Alter bookings table to use the new enum type
ALTER TABLE bookings
ALTER COLUMN status TYPE booking_status
USING status::booking_status;

-- Set default value for status to 'pending'
ALTER TABLE bookings
ALTER COLUMN status SET DEFAULT 'pending';
