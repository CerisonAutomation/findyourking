-- =====================================================
-- Dating App Database Schema
-- =====================================================
-- This migration creates the core tables and Row Level Security (RLS) policies
-- for the dating app, following official Supabase best practices
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE - Extended profile data
-- =====================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    age INTEGER,
    gender TEXT,
    location TEXT,
    interested_in TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add useful indexes for query performance
CREATE INDEX idx_users_gender ON public.users(gender);
CREATE INDEX idx_users_interested_in ON public.users(interested_in);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- =====================================================
-- PROFILES TABLE - Additional user preferences
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    looking_for TEXT,
    body_type TEXT,
    height DECIMAL,
    relationship_status TEXT,
    interests TEXT[], -- Array of interests/tags
    photos TEXT[], -- Array of photo URLs
    preferences JSONB DEFAULT '{}', -- Store flexible preference data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- =====================================================
-- MATCHES TABLE - Match relationships
-- =====================================================
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_id_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, blocked
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_match CHECK (user_id_a != user_id_b),
    CONSTRAINT unique_match UNIQUE (LEAST(user_id_a, user_id_b), GREATEST(user_id_a, user_id_b))
);

CREATE INDEX idx_matches_user_id_a ON public.matches(user_id_a);
CREATE INDEX idx_matches_user_id_b ON public.matches(user_id_b);
CREATE INDEX idx_matches_status ON public.matches(status);

-- =====================================================
-- MESSAGES TABLE - Direct messaging between matches
-- =====================================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_match_id ON public.messages(match_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- =====================================================
-- LIKES TABLE - Track user preferences
-- =====================================================
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_like CHECK (from_user_id != to_user_id),
    CONSTRAINT unique_like UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX idx_likes_from_user_id ON public.likes(from_user_id);
CREATE INDEX idx_likes_to_user_id ON public.likes(to_user_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE - RLS Policies
-- =====================================================
-- Users can view all other users (for discovery)
CREATE POLICY "Users can view all users"
    ON public.users FOR SELECT
    USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Service role can perform all operations
CREATE POLICY "Service role can manage all users"
    ON public.users
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- PROFILES TABLE - RLS Policies
-- =====================================================
-- Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile preferences"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- MATCHES TABLE - RLS Policies
-- =====================================================
-- Users can view matches they're part of
CREATE POLICY "Users can view their matches"
    ON public.matches FOR SELECT
    USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- Users can insert matches
CREATE POLICY "Users can create matches"
    ON public.matches FOR INSERT
    WITH CHECK (auth.uid() = user_id_a);

-- Users can update their matches
CREATE POLICY "Users can update their matches"
    ON public.matches FOR UPDATE
    USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- =====================================================
-- MESSAGES TABLE - RLS Policies
-- =====================================================
-- Users can view messages from their matches
CREATE POLICY "Users can view messages from their matches"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE id = match_id
            AND (user_id_a = auth.uid() OR user_id_b = auth.uid())
        )
    );

-- Users can insert messages to their matches
CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE id = match_id
            AND (user_id_a = auth.uid() OR user_id_b = auth.uid())
        )
    );

-- Users can update their own messages (mark as read)
CREATE POLICY "Users can update message read status"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE id = match_id
            AND (user_id_a = auth.uid() OR user_id_b = auth.uid())
        )
    );

-- =====================================================
-- LIKES TABLE - RLS Policies
-- =====================================================
-- Users can view all likes (aggregate data for matching)
CREATE POLICY "Users can view likes"
    ON public.likes FOR SELECT
    USING (true);

-- Users can only create likes themselves
CREATE POLICY "Users can create likes"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================
-- Automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.profiles (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
-- Enable realtime for messages to support live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Created:
-- - users table (profiles + auth)
-- - profiles table (preferences)
-- - matches table (match relationships)
-- - messages table (direct messaging)
-- - likes table (user preferences)
-- - Row Level Security policies
-- - Trigger functions for data consistency
-- - Realtime subscriptions for live features
