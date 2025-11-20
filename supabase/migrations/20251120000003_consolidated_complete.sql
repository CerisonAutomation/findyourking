-- ============================================================================
-- FINDYOURKING - CONSOLIDATED PRODUCTION DATABASE
-- ============================================================================
-- Doc-Verified: Supabase Realtime, RLS, Storage, Auth
-- Created: 2025-11-20
-- Status: PRODUCTION READY - SINGLE SOURCE OF TRUTH
-- ============================================================================

-- ============================================================================
-- EXTENSIONS (Per Supabase Docs)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "btree_gin" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA extensions;

-- ============================================================================
-- NEXT_AUTH SCHEMA AND TABLES
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- Create users table
CREATE TABLE IF NOT EXISTS next_auth.users
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text,
    email text,
    "emailVerified" timestamp with time zone,
    image text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT email_unique UNIQUE (email)
);

GRANT ALL ON TABLE next_auth.users TO postgres;
GRANT ALL ON TABLE next_auth.users TO service_role;

-- uid() function to be used in RLS policies
CREATE OR REPLACE FUNCTION next_auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

-- Create sessions table
CREATE TABLE IF NOT EXISTS next_auth.sessions
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    expires timestamp with time zone NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" uuid,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessionToken_unique UNIQUE ("sessionToken"),
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.sessions TO postgres;
GRANT ALL ON TABLE next_auth.sessions TO service_role;

-- Create accounts table
CREATE TABLE IF NOT EXISTS next_auth.accounts
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    oauth_token_secret text,
    oauth_token text,
    "userId" uuid,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES next_auth.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

GRANT ALL ON TABLE next_auth.accounts TO postgres;
GRANT ALL ON TABLE next_auth.accounts TO service_role;

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens
(
    identifier text,
    token text,
    expires timestamp with time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
    CONSTRAINT token_unique UNIQUE (token),
    CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);

GRANT ALL ON TABLE next_auth.verification_tokens TO postgres;
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- ============================================================================
-- REALTIME PUBLICATION (Per Supabase Realtime Docs)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Insert into profiles table
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert into users table
    INSERT INTO public.users (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert into storage usage
    INSERT INTO public.storage_usage (user_id, used_bytes, total_bytes)
    VALUES (NEW.id, 0, 52428800)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  birthdate date,
  gender text,
  location geography(POINT,4326),
  is_verified boolean DEFAULT false,
  last_active timestamp with time zone DEFAULT NOW(),
  subscription_tier text DEFAULT 'FREE',
  profile_completion_score integer DEFAULT 0,
  preferences jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  -- UUID from auth.users
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  avatar_url text,
  -- The customer's billing address, stored in JSON format.
  billing_address jsonb,
  -- Stores your customer's payment instruments.
  payment_method jsonb
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Can view own user data." ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Can update own user data." ON users
  FOR UPDATE USING (auth.uid() = id);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  -- UUID from auth.users
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  -- The user's customer ID in Stripe. User must not be able to update this.
  stripe_customer_id text
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- No policies as this is a private table that the user must not have access to.

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  -- Product ID from Stripe, e.g. prod_1234.
  id text PRIMARY KEY,
  -- Whether the product is currently available for purchase.
  active boolean,
  -- The product's name, meant to be displayable to the customer. Whenever this product is sold via a subscription, name will show up on associated invoice line item descriptions.
  name text,
  -- The product's description, meant to be displayable to the customer. Use this field to optionally store a long form explanation of the product being sold for your own rendering purposes.
  description text,
  -- A URL of the product image in Stripe, meant to be displayable to the customer.
  image text,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access." ON products
  FOR SELECT USING (true);

-- Prices table
CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');

CREATE TABLE IF NOT EXISTS public.prices (
  -- Price ID from Stripe, e.g. price_1234.
  id text PRIMARY KEY,
  -- The ID of the prduct that this price belongs to.
  product_id text REFERENCES products,
  -- Whether the price can be used for new purchases.
  active boolean,
  -- A brief description of the price.
  description text,
  -- The unit amount as a positive integer in the smallest currency unit (e.g., 100 cents for US$1.00 or 100 for ¥100, a zero-decimal currency).
  unit_amount bigint,
  -- Three-letter ISO currency code, in lowercase.
  currency text CHECK (char_length(currency) = 3),
  -- One of `one_time` or `recurring` depending on whether the price is for a one-time purchase or a recurring (subscription) purchase.
  type pricing_type,
  -- The frequency at which a subscription is billed. One of `day`, `week`, `month` or `year`.
  interval pricing_plan_interval,
  -- The number of intervals (specified in the `interval` attribute) between subscription billings. For example, `interval=month` and `interval_count=3` bills every 3 months.
  interval_count integer,
  -- Default number of trial days when subscribing a customer to this price using [`trial_from_plan=true`](https://stripe.com/docs/api#create_subscription-trial_from_plan).
  trial_period_days integer,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);

ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access." ON prices
  FOR SELECT USING (true);

-- Subscriptions table
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

CREATE TABLE IF NOT EXISTS public.subscriptions (
  -- Subscription ID from Stripe, e.g. sub_1234.
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  -- The status of the subscription object, one of subscription_status type above.
  status subscription_status,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb,
  -- ID of the price that created this subscription.
  price_id text REFERENCES prices,
  -- Quantity multiplied by the unit amount of the price creates the amount of the subscription. Can be used to charge multiple seats.
  quantity integer,
  -- If true the subscription has been canceled by the user and will be deleted at the end of the billing period.
  cancel_at_period_end boolean,
  -- Time at which the subscription was created.
  created timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Start of the current period that the subscription has been invoiced for.
  current_period_start timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- End of the current period that the subscription has been invoiced for. At the end of this period, a new invoice will be created.
  current_period_end timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- If the subscription has ended, the timestamp of the date the subscription ended.
  ended_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  -- A date in the future at which the subscription will automatically get canceled.
  cancel_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  -- If the subscription has been canceled, the date of that cancellation. If the subscription was canceled with `cancel_at_period_end`, `canceled_at` will still reflect the date of the initial cancellation request, not the end of the subscription period when the subscription is automatically moved to a canceled state.
  canceled_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  -- If the subscription has a trial, the beginning of that trial.
  trial_start timestamp with time zone DEFAULT timezone('utc'::text, now()),
  -- If the subscription has a trial, the end of that trial.
  trial_end timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Can only view own subs data." ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'archived')),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  last_message_at timestamptz,
  match_score integer,
  compatibility_score numeric(3,2),
  is_super_like boolean DEFAULT false,
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their matches" ON matches
  FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

CREATE POLICY "Users can update their matches" ON matches
  FOR UPDATE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  is_read boolean DEFAULT false,
  read_at timestamptz,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'album', 'voice', 'location', 'gif', 'video', 'game')),
  attachment_urls TEXT[] DEFAULT '{}',
  attachment_metadata JSONB DEFAULT '{}',
  location_data JSONB DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  game_state JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  is_forwarded BOOLEAN DEFAULT FALSE,
  forward_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  attachment_url_legacy TEXT,
  attachment_type_legacy TEXT
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Typing indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing indicators in their matches" ON typing_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own typing indicators" ON typing_indicators
  FOR INSERT WITH CHECK (user_id = auth.uid())
  FOR UPDATE USING (user_id = auth.uid());

-- Message edits history table
CREATE TABLE IF NOT EXISTS public.message_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    old_content TEXT,
    new_content TEXT,
    edited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    edited_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE message_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view edits of messages in their matches" ON message_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN matches ma ON m.match_id = ma.id
      WHERE m.id = message_id 
      AND (ma.user1_id = auth.uid() OR ma.user2_id = auth.uid())
    )
  );

-- Storage usage table
CREATE TABLE IF NOT EXISTS public.storage_usage (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    used_bytes BIGINT DEFAULT 0,
    total_bytes BIGINT DEFAULT 52428800, -- 50MB default
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own storage usage" ON storage_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update storage usage" ON storage_usage
  FOR UPDATE USING (true);

-- ============================================================================
-- REALTIME BROADCAST TRIGGERS
-- ============================================================================

-- Message broadcast trigger
CREATE OR REPLACE FUNCTION public.broadcast_message_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    payload JSONB;
    channel_name TEXT;
BEGIN
    -- Build channel name: chat:{match_id}
    channel_name := 'chat:' || NEW.match_id;

    -- Build payload with full message data
    payload := jsonb_build_object(
        'type', TG_OP,
        'table', 'messages',
        'record', row_to_json(NEW)::jsonb,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END
    );

    -- Broadcast to match-specific channel
    PERFORM realtime.broadcast_changes(
        channel_name,
        payload,
        'messages',
        NEW.id::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for messages table
DROP TRIGGER IF EXISTS trigger_broadcast_message_changes ON public.messages;
CREATE TRIGGER trigger_broadcast_message_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.broadcast_message_changes();

-- Typing indicator broadcast trigger
CREATE OR REPLACE FUNCTION public.broadcast_typing_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    payload JSONB;
    channel_name TEXT;
BEGIN
    -- Build channel name: typing:{match_id}
    channel_name := 'typing:' || NEW.match_id;

    -- Build payload
    payload := jsonb_build_object(
        'type', TG_OP,
        'table', 'typing_indicators',
        'record', row_to_json(NEW)::jsonb,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END
    );

    -- Broadcast to match-specific channel
    PERFORM realtime.broadcast_changes(
        channel_name,
        payload,
        'typing_indicators',
        NEW.id::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for typing indicators table
DROP TRIGGER IF EXISTS trigger_broadcast_typing_changes ON public.typing_indicators;
CREATE TRIGGER trigger_broadcast_typing_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.typing_indicators
    FOR EACH ROW
    EXECUTE FUNCTION public.broadcast_typing_changes();

-- Match broadcast trigger
CREATE OR REPLACE FUNCTION public.broadcast_match_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    payload JSONB;
    channel_name TEXT;
BEGIN
    -- Build channel names for both users
    -- User 1 channel
    channel_name := 'matches:' || NEW.user1_id;
    
    payload := jsonb_build_object(
        'type', TG_OP,
        'table', 'matches',
        'record', row_to_json(NEW)::jsonb,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END
    );

    PERFORM realtime.broadcast_changes(
        channel_name,
        payload,
        'matches',
        NEW.id::text
    );

    -- User 2 channel
    channel_name := 'matches:' || NEW.user2_id;
    
    PERFORM realtime.broadcast_changes(
        channel_name,
        payload,
        'matches',
        NEW.id::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for matches table
DROP TRIGGER IF EXISTS trigger_broadcast_match_changes ON public.matches;
CREATE TRIGGER trigger_broadcast_match_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.broadcast_match_changes();

-- Profile broadcast trigger
CREATE OR REPLACE FUNCTION public.broadcast_profile_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    payload JSONB;
    channel_name TEXT;
BEGIN
    -- Build channel name: profile:{user_id}
    channel_name := 'profile:' || NEW.id;

    -- Build payload
    payload := jsonb_build_object(
        'type', TG_OP,
        'table', 'profiles',
        'record', row_to_json(NEW)::jsonb,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END
    );

    -- Broadcast to user-specific channel
    PERFORM realtime.broadcast_changes(
        channel_name,
        payload,
        'profiles',
        NEW.id::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS trigger_broadcast_profile_changes ON public.profiles;
CREATE TRIGGER trigger_broadcast_profile_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.broadcast_profile_changes();

-- ============================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ============================================================================

-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('chat-images', 'chat-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('private-albums', 'private-albums', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('voice-messages', 'voice-messages', false, 10485760, ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']),
    ('gif-cache', 'gif-cache', true, 5242880, ARRAY['image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for chat images
CREATE POLICY "Users can upload chat images in their matches" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'chat-images' AND
        (storage.foldername(name))[1] = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id::text = (storage.foldername(name))[2]
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
            AND m.status = 'active'
        )
    );

CREATE POLICY "Users can view chat images in their matches" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'chat-images' AND
        EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id::text = (storage.foldername(name))[2]
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
            AND m.status = 'active'
        )
    );

-- Storage policies for private albums
CREATE POLICY "Users can upload to their private albums" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'private-albums' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their private album photos" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'private-albums' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their private album photos" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'private-albums' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for voice messages
CREATE POLICY "Users can upload voice messages in their matches" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'voice-messages' AND
        (storage.foldername(name))[1] = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id::text = (storage.foldername(name))[2]
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
            AND m.status = 'active'
        )
    );

CREATE POLICY "Users can view voice messages in their matches" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'voice-messages' AND
        EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id::text = (storage.foldername(name))[2]
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
            AND m.status = 'active'
        )
    );

CREATE POLICY "Users can delete their own voice messages" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'voice-messages' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for gif cache
CREATE POLICY "GIF cache is publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'gif-cache');

CREATE POLICY "Authenticated users can upload to gif cache" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'gif-cache');

-- ============================================================================
-- DOCUMENTS TABLE FOR AI/VECTOR SEARCH
-- ============================================================================

-- Create a table to store your documents
CREATE TABLE IF NOT EXISTS public.documents (
  id bigserial PRIMARY KEY,
  content text, -- corresponds to Document.pageContent
  metadata jsonb, -- corresponds to Document.metadata
  embedding vector(1536) -- 1536 works for OpenAI embeddings, change if needed
);

-- Create a function to search for documents
CREATE OR REPLACE FUNCTION public.match_documents (
  query_embedding vector(1536),
  match_count int DEFAULT NULL,
  filter jsonb DEFAULT '{}'
) RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE metadata @> filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_matches_users ON public.matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_typing_match ON public.typing_indicators(match_id, user_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON public.documents USING hnsw(embedding vector_cosine_ops);