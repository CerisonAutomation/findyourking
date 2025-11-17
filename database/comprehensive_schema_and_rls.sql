-- Comprehensive SQL Script for FindYourKing-Reborn
-- This script combines all schema definitions, RLS policies, and function refinements
-- based on .gemini rules and Vercel documentation principles.
-- It is designed to be idempotent where possible.

-- ================================================================
-- 01_initial_schema.sql - Base Tables and RLS (Refined)
-- ================================================================

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  avatar_url text,
  full_name text,
  bio text,
  is_king boolean DEFAULT FALSE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'User profiles for the application, linked to authentication.';

-- Set up Row Level Security (RLS) for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for profiles to ensure clean re-creation
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

-- Policy: Users can delete their own profile." ON profiles
  FOR DELETE TO authenticated USING ((select auth.uid()) = id);


-- Create the kings table
CREATE TABLE IF NOT EXISTS kings (
  id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  price_per_hour numeric NOT NULL,
  availability jsonb,
  description text,
  rating numeric,
  total_bookings integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.kings IS 'Details for "King" users, including pricing and availability.';

-- Set up Row Level Security (RLS) for kings table
ALTER TABLE kings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for kings to ensure clean re-creation
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

-- Policy: Kings can delete their own details." ON kings
  FOR DELETE TO authenticated USING ((select auth.uid()) = id);


-- Create the bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  king_id uuid REFERENCES kings(id) ON DELETE CASCADE NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  status text DEFAULT 'pending' NOT NULL, -- This will be updated to enum later
  total_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.bookings IS 'Booking details between users and Kings.';

-- Set up Row Level Security (RLS) for bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for bookings to ensure clean re-creation
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


-- Create a function to create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
SECURITY DEFINER
SET search_path = ''
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email); -- Using email as initial username, can be changed later
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger the function every time a user is created
-- Drop existing trigger to ensure clean re-creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ================================================================
-- 02_add_messages_table.sql - Messages Table and RLS (Refined)
-- ================================================================

-- Create the messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  content text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  king_id uuid REFERENCES kings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.messages IS 'Chat messages exchanged between users and Kings.';

-- Set up Row Level Security (RLS) for messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for messages to ensure clean re-creation
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

-- Policy: Users can update their own messages." ON messages
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can delete their own messages." ON messages
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);


-- ================================================================
-- 03_add_stripe_to_bookings.sql - Add Stripe Payment Intent ID
-- ================================================================

-- Add stripe_payment_intent_id column to bookings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'stripe_payment_intent_id') THEN
        ALTER TABLE bookings
        ADD COLUMN stripe_payment_intent_id text;
    END IF;
END
$$;


-- ================================================================
-- 04_add_reviews_table.sql - Reviews Table and RLS (Refined)
-- ================================================================

-- Create the reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  king_id uuid REFERENCES kings(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Reviews and ratings given by users for Kings.';

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for reviews to ensure clean re-creation
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

-- Policy: Users can delete their own reviews." ON reviews
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);


-- ================================================================
-- 05_add_notifications_table.sql - Notifications Table and RLS (Refined)
-- ================================================================

-- Create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.notifications IS 'User-specific notifications.';

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for notifications to ensure clean re-creation
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Policy: Users can view their own notifications.
CREATE POLICY "Users can view their own notifications." ON notifications
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- Policy: Users can insert their own notifications." ON notifications
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can update their own notifications." ON notifications
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can delete their own notifications." ON notifications
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);


-- ================================================================
-- 06_create_booking_status_enum.sql - Create Booking Status Enum
-- ================================================================

-- Create booking_status enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
    END IF;
END
$$;

-- Alter bookings table to use the new enum type if not already
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'status' AND data_type = 'text') THEN
        ALTER TABLE bookings
        ALTER COLUMN status TYPE booking_status
        USING status::booking_status;
    END IF;
END
$$;

-- Set default value for status to 'pending'
ALTER TABLE bookings
ALTER COLUMN status SET DEFAULT 'pending';


-- ================================================================
-- 06_realtime_notifications_broadcast.sql - Realtime Notifications Broadcast (Refined)
-- ================================================================

-- Step 1: Create trigger function to broadcast notification changes
CREATE OR REPLACE FUNCTION public.notifications_broadcast_trigger()
RETURNS TRIGGER AS $$
SECURITY DEFINER
SET search_path = ''
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
  FOR EACH ROW EXECUTE FUNCTION public.notifications_broadcast_trigger();

-- Step 3: RLS policies for realtime.messages table (private channel authorization)
-- Drop existing policies for realtime.messages to ensure clean re-creation
DROP POLICY IF EXISTS "users_can_receive_notification_broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "users_can_send_notification_broadcasts" ON realtime.messages;

-- Users can only receive broadcasts for their own notifications
CREATE POLICY "users_can_receive_notification_broadcasts" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    topic LIKE 'user:%:notifications' AND
    -- Extract user_id from topic pattern: user:{user_id}:notifications
    SPLIT_PART(topic, ':', 2)::uuid = (select auth.uid())
  );

-- Users can send messages to their own notification channel
CREATE POLICY "users_can_send_notification_broadcasts" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    topic LIKE 'user:%:notifications' AND
    SPLIT_PART(topic, ':', 2)::uuid = (select auth.uid())
  );

-- Step 4: Create index for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_realtime_messages_topic_pattern
  ON realtime.messages(topic text_pattern_ops);

COMMENT ON FUNCTION public.notifications_broadcast_trigger IS
  'Broadcasts notification changes to user-specific realtime channels using scalable broadcast pattern';
COMMENT ON POLICY "users_can_receive_notification_broadcasts" ON realtime.messages IS
  'Allows users to receive broadcasts only for their own notifications';
COMMENT ON POLICY "users_can_send_notification_broadcasts" ON realtime.messages IS
  'Allows users to send messages to their own notification channel';


-- ================================================================
-- 07_add_updated_at_triggers.sql - Add Updated At Triggers (Refined)
-- ================================================================

-- Function to set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
SECURITY INVOKER
SET search_path = ''
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger for kings table
DROP TRIGGER IF EXISTS kings_set_updated_at ON kings;
CREATE TRIGGER kings_set_updated_at
BEFORE UPDATE ON kings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger for bookings table
DROP TRIGGER IF EXISTS bookings_set_updated_at ON bookings;
CREATE TRIGGER bookings_set_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ================================================================
-- 08_add_unique_constraint_and_index_to_stripe_payment_intent_id.sql
-- ================================================================

-- Add a unique constraint to stripe_payment_intent_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_stripe_payment_intent_id') THEN
        ALTER TABLE bookings
        ADD CONSTRAINT unique_stripe_payment_intent_id UNIQUE (stripe_payment_intent_id);
    END IF;
END
$$;

-- Add an index to stripe_payment_intent_id for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_stripe_payment_intent_id ON bookings (stripe_payment_intent_id);


-- ================================================================
-- 09_add_unique_constraint_to_reviews.sql
-- ================================================================

-- Add a unique constraint to ensure only one review per user per booking if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_review_per_booking_user') THEN
        ALTER TABLE reviews
        ADD CONSTRAINT unique_review_per_booking_user UNIQUE (booking_id, user_id);
    END IF;
END
$$;


-- ================================================================
-- 10_refine_bookings_update_policies.sql - Refine Bookings Update Policies
-- (These policies are already included in the main bookings RLS section,
-- but are re-added here for completeness and idempotency)
-- ================================================================

-- Drop existing UPDATE policies for bookings table (already handled above, but for idempotency)
DROP POLICY IF EXISTS "Users can update their own bookings." ON bookings;
DROP POLICY IF EXISTS "Kings can update bookings they are part of." ON bookings;
DROP POLICY IF EXISTS "Users can cancel their own pending bookings." ON bookings;
DROP POLICY IF EXISTS "Kings can update status of their bookings." ON bookings;

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


-- ================================================================
-- 11_add_role_to_profiles.sql - Add Role Column to Profiles
-- ================================================================

-- Add role column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles
        ADD COLUMN role text DEFAULT 'user' NOT NULL;
    END IF;
END
$$;

-- Create an index on the role column for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);


-- ================================================================
-- 12_add_table_comments.sql - Add Table Comments
-- (Comments are already included in CREATE TABLE statements for idempotency)
-- ================================================================

COMMENT ON TABLE public.profiles IS 'User profiles for the application, linked to authentication.';
COMMENT ON TABLE public.kings IS 'Details for "King" users, including pricing and availability.';
COMMENT ON TABLE public.bookings IS 'Booking details between users and Kings.';
COMMENT ON TABLE public.messages IS 'Chat messages exchanged between users and Kings.';
COMMENT ON TABLE public.reviews IS 'Reviews and ratings given by users for Kings.';
COMMENT ON TABLE public.notifications IS 'User-specific notifications.';


-- ================================================================
-- 13_refine_profiles_rls.sql - Refine Profiles RLS
-- (Policies are already included in the main profiles RLS section,
-- but are re-added here for completeness and idempotency)
-- ================================================================

-- Drop existing policies for profiles to ensure clean re-creation (already handled above)
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


-- ================================================================
-- 14_refine_kings_rls.sql - Refine Kings RLS
-- (Policies are already included in the main kings RLS section,
-- but are re-added here for completeness and idempotency)
-- ================================================================

-- Drop existing policies for kings to ensure clean re-creation (already handled above)
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


-- ================================================================
-- 15_refine_bookings_rls.sql - Refine Bookings RLS
-- (Policies are already included in the main bookings RLS section,
-- but are re-added here for completeness and idempotency)
-- ================================================================

-- Drop existing policies for bookings to ensure clean re-creation (already handled above)
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


-- ================================================================
-- 16_refine_messages_rls.sql - Refine Messages RLS
-- (Policies are already included in the main messages RLS section,
-- but are re-added here for completeness and idempotency)
-- ================================================================

-- Drop existing policies for messages to ensure clean re-creation (already handled above)
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


-- ================================================================
-- 17_refine_reviews_rls.sql - Refine Reviews RLS
-- (Policies are already included in the main reviews RLS section,
-- but are re-added here for completeness and idempotency)
-- ================================================================

-- Drop existing policies for reviews to ensure clean re-creation (already handled above)
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


-- ================================================================
-- 18_refine_notifications_rls.sql - Refine Notifications RLS
-- (Policies are already included in the main notifications RLS section,
-- but are re-added here for completeness and idempotency)
-- ================================================================

-- Drop existing policies for notifications to ensure clean re-creation (already handled above)
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


-- ================================================================
-- 19_refine_db_functions.sql - Refine Database Functions
-- (Functions are already included in the main functions section,
-- but are re-added here for completeness and idempotency)
-- ================================================================

-- Function to create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
SECURITY DEFINER
SET search_path = ''
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email); -- Using email as initial username, can be changed later
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
SECURITY INVOKER
SET search_path = ''
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to broadcast notification changes
CREATE OR REPLACE FUNCTION public.notifications_broadcast_trigger()
RETURNS TRIGGER AS $$
SECURITY DEFINER
SET search_path = ''
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
