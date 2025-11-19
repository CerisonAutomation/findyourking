-- =====================================================
-- ENHANCED DATING APP SCHEMA - PRODUCTION READY
-- =====================================================
-- Additional migrations to production standards
-- Run AFTER: 20251119_init_database.sql

-- =====================================================
-- BLOCKS TABLE - Safety feature
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_user_id),
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_user_id ON public.blocks(blocked_user_id);

-- =====================================================
-- REPORTS TABLE - Safety & moderation
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'fraud', 'abuse', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT no_self_report CHECK (reporter_id != reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- =====================================================
-- PROFILE ENHANCEMENTS
-- =====================================================
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS premium_status TEXT DEFAULT 'free' CHECK (premium_status IN ('free', 'premium', 'premium_plus'));
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 4.5;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =====================================================
-- USERS ENHANCEMENTS
-- =====================================================
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at);

-- =====================================================
-- MATCHES ENHANCEMENTS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_matches_composite ON public.matches(LEAST(user_id_a, user_id_b), GREATEST(user_id_a, user_id_b));

-- =====================================================
-- RLS POLICIES FOR BLOCKS TABLE
-- =====================================================
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blocks they created"
    ON public.blocks FOR SELECT
    USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block other users"
    ON public.blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
    ON public.blocks FOR DELETE
    USING (auth.uid() = blocker_id);

-- =====================================================
-- RLS POLICIES FOR REPORTS TABLE
-- =====================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Service role can manage all reports"
    ON public.reports
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- IMPROVED USERS RLS (Privacy)
-- =====================================================
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

-- Create more restrictive policy
CREATE POLICY "Users can view non-deleted users"
    ON public.users FOR SELECT
    USING (deleted_at IS NULL);

-- =====================================================
-- PROFILES SOFT DELETE FILTER
-- =====================================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view non-deleted profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = profiles.user_id
            AND deleted_at IS NULL
        )
    );

-- =====================================================
-- TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_timestamp ON public.users;
CREATE TRIGGER users_timestamp BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS profiles_timestamp ON public.profiles;
CREATE TRIGGER profiles_timestamp BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS matches_timestamp ON public.matches;
CREATE TRIGGER matches_timestamp BEFORE UPDATE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- MATERIALIZED VIEW FOR PERFORMANCE
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.match_stats AS
SELECT
    user_id,
    COUNT(DISTINCT CASE WHEN status = 'accepted' THEN match_id END)::INT as match_count,
    COUNT(DISTINCT message_count.match_id)::INT as message_count,
    MAX(last_message_time) as last_active
FROM (
    SELECT user_id_a as user_id, id as match_id, status FROM public.matches
    UNION ALL
    SELECT user_id_b as user_id, id as match_id, status FROM public.matches
) m
LEFT JOIN (
    SELECT DISTINCT match_id, MAX(created_at) as last_message_time
    FROM public.messages
    GROUP BY match_id
) message_count ON m.match_id = message_count.match_id
GROUP BY user_id;

-- =====================================================
-- CREATE INDEXES FOR MATERIALIZED VIEW
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_match_stats_user_id ON public.match_stats(user_id);

-- =====================================================
-- FUNCTION FOR REFRESHING STATS
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_match_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.match_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUDIT LOGGING TABLE (GDPR COMPLIANCE)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =====================================================
-- FUNCTION FOR AUDIT LOGGING
-- =====================================================
CREATE OR REPLACE FUNCTION audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RATE LIMITING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    count INT DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_rate_limit UNIQUE (user_id, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id_action ON public.rate_limits(user_id, action);

-- =====================================================
-- EXTENDED PROFILE DATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profile_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    headline TEXT,
    occupation TEXT,
    education TEXT,
    verified_photos TEXT[],
    social_links JSONB,
    video_call_verified BOOLEAN DEFAULT FALSE,
    last_video_verification TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTION/PREMIUM TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'premium_plus')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================
ALTER TABLE public.profile_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profile details policies
CREATE POLICY "Users can view own profile details"
    ON public.profile_details FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own profile details"
    ON public.profile_details FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile details"
    ON public.profile_details FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role manages subscriptions"
    ON public.subscriptions
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- REALTIME ENABLE
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocks;

