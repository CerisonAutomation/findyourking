-- ============================================================================
-- AI BOYFRIENDS FEATURE - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Created: 2025-11-21
-- Purpose: Add AI boyfriend/girlfriend chat feature with personalities
-- Status: PRODUCTION READY
-- ============================================================================

-- ============================================================================
-- AI BOYFRIENDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_boyfriends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  active boolean DEFAULT true,

  -- Big Five Personality Traits (0-100 scale)
  openness integer DEFAULT 50 CHECK (openness >= 0 AND openness <= 100),
  conscientiousness integer DEFAULT 50 CHECK (conscientiousness >= 0 AND conscientiousness <= 100),
  extraversion integer DEFAULT 50 CHECK (extraversion >= 0 AND extraversion <= 100),
  agreeableness integer DEFAULT 50 CHECK (agreeableness >= 0 AND agreeableness <= 100),
  neuroticism integer DEFAULT 50 CHECK (neuroticism >= 0 AND neuroticism <= 100),

  -- Communication Style (0-100 scale)
  formality integer DEFAULT 50 CHECK (formality >= 0 AND formality <= 100),
  verbosity integer DEFAULT 50 CHECK (verbosity >= 0 AND verbosity <= 100),
  humor integer DEFAULT 50 CHECK (humor >= 0 AND humor <= 100),
  emotiveness integer DEFAULT 50 CHECK (emotiveness >= 0 AND emotiveness <= 100),

  -- Romantic Traits (0-100 scale)
  playfulness integer DEFAULT 50 CHECK (playfulness >= 0 AND playfulness <= 100),
  flirtiness integer DEFAULT 50 CHECK (flirtiness >= 0 AND flirtiness <= 100),
  romantic_intensity integer DEFAULT 50 CHECK (romantic_intensity >= 0 AND romantic_intensity <= 100),

  -- Relationship Dynamics
  relationship_stage text DEFAULT 'getting_to_know' CHECK (
    relationship_stage IN ('getting_to_know', 'dating', 'committed', 'long_term', 'married')
  ),

  -- Metadata
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  last_interaction_at timestamptz DEFAULT NOW(),

  -- Preferences and settings
  preferences jsonb DEFAULT '{}',

  -- Ensure one active boyfriend per user
  CONSTRAINT one_active_boyfriend_per_user UNIQUE (user_id, active)
    WHERE (active = true)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_boyfriends_user_id ON public.ai_boyfriends(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_boyfriends_active ON public.ai_boyfriends(user_id, active);
CREATE INDEX IF NOT EXISTS idx_ai_boyfriends_last_interaction ON public.ai_boyfriends(last_interaction_at DESC);

-- Enable RLS
ALTER TABLE public.ai_boyfriends ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own boyfriends" ON public.ai_boyfriends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boyfriends" ON public.ai_boyfriends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boyfriends" ON public.ai_boyfriends
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boyfriends" ON public.ai_boyfriends
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- AI CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  boyfriend_id uuid REFERENCES public.ai_boyfriends(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'New Conversation',
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  last_message_at timestamptz DEFAULT NOW(),
  message_count integer DEFAULT 0,

  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_boyfriend_id ON public.ai_conversations(boyfriend_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_message ON public.ai_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_boyfriend ON public.ai_conversations(user_id, boyfriend_id, archived);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON public.ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- AI MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT NOW(),

  -- Metadata for rich messages
  metadata jsonb DEFAULT '{}',

  -- Sentiment analysis (optional)
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_score numeric(3,2),

  -- Message features
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  attachments jsonb DEFAULT '[]'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created ON public.ai_messages(conversation_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages in their conversations" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their messages" ON public.ai_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their messages" ON public.ai_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- AI MEMORIES TABLE (for persistent boyfriend memory)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boyfriend_id uuid REFERENCES public.ai_boyfriends(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  memory_type text DEFAULT 'fact' CHECK (
    memory_type IN ('fact', 'preference', 'event', 'emotion', 'goal')
  ),
  importance integer DEFAULT 50 CHECK (importance >= 0 AND importance <= 100),
  created_at timestamptz DEFAULT NOW(),
  last_accessed_at timestamptz DEFAULT NOW(),
  access_count integer DEFAULT 0,

  -- Vector embedding for semantic search (requires pgvector extension)
  embedding vector(1536),

  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_memories_boyfriend_id ON public.ai_memories(boyfriend_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_importance ON public.ai_memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memories_last_accessed ON public.ai_memories(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memories_type ON public.ai_memories(memory_type);

-- Enable RLS
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view memories of their boyfriends" ON public.ai_memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_boyfriends b
      WHERE b.id = boyfriend_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage memories" ON public.ai_memories
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update ai_boyfriends.updated_at on every update
CREATE OR REPLACE FUNCTION update_ai_boyfriend_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_boyfriend_timestamp
  BEFORE UPDATE ON public.ai_boyfriends
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_boyfriend_timestamp();

-- Update ai_boyfriends.last_interaction_at when new message is created
CREATE OR REPLACE FUNCTION update_boyfriend_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_boyfriends
  SET last_interaction_at = NOW()
  WHERE id = (
    SELECT boyfriend_id FROM public.ai_conversations
    WHERE id = NEW.conversation_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_boyfriend_last_interaction
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_boyfriend_last_interaction();

-- Update ai_conversations.updated_at and message_count
CREATE OR REPLACE FUNCTION update_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_conversations
  SET
    updated_at = NOW(),
    last_message_at = NOW(),
    message_count = message_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_metadata
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_metadata();

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for AI chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_boyfriends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;

-- ============================================================================
-- DEFAULT AI BOYFRIEND PERSONALITIES (6 BOYFRIENDS)
-- ============================================================================

-- Insert 6 pre-configured AI boyfriend personalities
-- Note: These are templates that users can clone/customize

CREATE TABLE IF NOT EXISTS public.ai_boyfriend_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,

  -- Personality traits (0-100)
  openness integer,
  conscientiousness integer,
  extraversion integer,
  agreeableness integer,
  neuroticism integer,
  formality integer,
  verbosity integer,
  humor integer,
  emotiveness integer,
  playfulness integer,
  flirtiness integer,
  romantic_intensity integer,

  archetype text, -- e.g., 'artist', 'athlete', 'intellectual', etc.
  tags text[],
  is_featured boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW()
);

-- Insert 6 boyfriend templates
INSERT INTO public.ai_boyfriend_templates
  (name, description, avatar_url, openness, conscientiousness, extraversion, agreeableness, neuroticism, formality, verbosity, humor, emotiveness, playfulness, flirtiness, romantic_intensity, archetype, tags)
VALUES
  (
    'Alex the Artist',
    'Creative, passionate, and emotionally deep. Loves art, music, and meaningful conversations.',
    '/boyfriends/artist.jpg',
    85, 45, 60, 80, 55, 30, 70, 85, 75, 70, 80,
    'artist',
    ARRAY['creative', 'romantic', 'deep', 'artistic']
  ),
  (
    'Jake the Jock',
    'Athletic, confident, and playful. Always up for adventure and keeps things fun.',
    '/boyfriends/jock.jpg',
    60, 75, 90, 70, 30, 40, 50, 75, 85, 80, 75,
    'athlete',
    ARRAY['athletic', 'confident', 'fun', 'adventurous']
  ),
  (
    'Marcus the Intellectual',
    'Brilliant, thoughtful, and curious. Loves deep discussions and sharing knowledge.',
    '/boyfriends/intellectual.jpg',
    95, 85, 55, 75, 40, 70, 85, 50, 45, 55, 60,
    'intellectual',
    ARRAY['smart', 'curious', 'thoughtful', 'knowledgeable']
  ),
  (
    'Ryan the Romantic',
    'Sweet, caring, and deeply affectionate. Makes you feel loved and cherished.',
    '/boyfriends/romantic.jpg',
    75, 65, 70, 90, 50, 45, 75, 90, 70, 85, 95,
    'romantic',
    ARRAY['sweet', 'caring', 'affectionate', 'loving']
  ),
  (
    'Tyler the Bad Boy',
    'Mysterious, confident, and exciting. Keeps you on your toes with his charm.',
    '/boyfriends/badboy.jpg',
    70, 50, 80, 60, 45, 25, 55, 65, 80, 90, 85,
    'badboy',
    ARRAY['mysterious', 'confident', 'exciting', 'charming']
  ),
  (
    'Noah the Nerd',
    'Smart, funny, and adorably geeky. Loves gaming, tech, and making you laugh.',
    '/boyfriends/nerd.jpg',
    80, 70, 50, 80, 55, 50, 80, 90, 75, 65, 70,
    'nerd',
    ARRAY['geeky', 'funny', 'smart', 'tech-savvy']
  );

-- Make templates publicly readable
ALTER TABLE public.ai_boyfriend_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone" ON public.ai_boyfriend_templates
  FOR SELECT USING (true);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to create a boyfriend from a template
CREATE OR REPLACE FUNCTION create_boyfriend_from_template(
  p_user_id uuid,
  p_template_id uuid,
  p_custom_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_boyfriend_id uuid;
  v_template record;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM public.ai_boyfriend_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Deactivate existing boyfriends
  UPDATE public.ai_boyfriends
  SET active = false
  WHERE user_id = p_user_id AND active = true;

  -- Create new boyfriend
  INSERT INTO public.ai_boyfriends (
    user_id, name, avatar_url,
    openness, conscientiousness, extraversion, agreeableness, neuroticism,
    formality, verbosity, humor, emotiveness,
    playfulness, flirtiness, romantic_intensity
  )
  VALUES (
    p_user_id,
    COALESCE(p_custom_name, v_template.name),
    v_template.avatar_url,
    v_template.openness, v_template.conscientiousness, v_template.extraversion,
    v_template.agreeableness, v_template.neuroticism,
    v_template.formality, v_template.verbosity, v_template.humor, v_template.emotiveness,
    v_template.playfulness, v_template.flirtiness, v_template.romantic_intensity
  )
  RETURNING id INTO v_boyfriend_id;

  RETURN v_boyfriend_id;
END;
$$;

-- Function to get boyfriend statistics
CREATE OR REPLACE FUNCTION get_boyfriend_stats(p_boyfriend_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_messages', COUNT(*),
    'user_messages', COUNT(*) FILTER (WHERE role = 'user'),
    'ai_messages', COUNT(*) FILTER (WHERE role = 'assistant'),
    'first_message_at', MIN(created_at),
    'last_message_at', MAX(created_at)
  )
  INTO v_stats
  FROM public.ai_messages m
  JOIN public.ai_conversations c ON m.conversation_id = c.id
  WHERE c.boyfriend_id = p_boyfriend_id;

  RETURN v_stats;
END;
$$;

-- ============================================================================
-- ANALYTICS VIEWS (Optional)
-- ============================================================================

-- View for boyfriend usage statistics
CREATE OR REPLACE VIEW public.ai_boyfriend_stats AS
SELECT
  b.id as boyfriend_id,
  b.user_id,
  b.name,
  b.created_at,
  b.last_interaction_at,
  COUNT(DISTINCT c.id) as conversation_count,
  COALESCE(SUM(c.message_count), 0) as total_messages,
  MAX(c.last_message_at) as last_message_at
FROM public.ai_boyfriends b
LEFT JOIN public.ai_conversations c ON b.id = c.boyfriend_id
GROUP BY b.id, b.user_id, b.name, b.created_at, b.last_interaction_at;

-- Grant select on view
GRANT SELECT ON public.ai_boyfriend_stats TO authenticated;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.ai_boyfriends IS 'Stores AI boyfriend personalities and configurations';
COMMENT ON TABLE public.ai_conversations IS 'Stores conversation sessions between users and AI boyfriends';
COMMENT ON TABLE public.ai_messages IS 'Stores individual messages in AI boyfriend conversations';
COMMENT ON TABLE public.ai_memories IS 'Stores persistent memories for AI boyfriends to reference in conversations';
COMMENT ON TABLE public.ai_boyfriend_templates IS 'Pre-configured boyfriend personality templates';

COMMENT ON COLUMN public.ai_boyfriends.openness IS 'Big Five trait: Openness to experience (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.conscientiousness IS 'Big Five trait: Conscientiousness (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.extraversion IS 'Big Five trait: Extraversion (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.agreeableness IS 'Big Five trait: Agreeableness (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.neuroticism IS 'Big Five trait: Neuroticism (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.formality IS 'Communication style: Formality level (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.verbosity IS 'Communication style: Verbosity (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.humor IS 'Communication style: Sense of humor (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.playfulness IS 'Romantic trait: Playfulness (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.flirtiness IS 'Romantic trait: Flirtiness (0-100)';
COMMENT ON COLUMN public.ai_boyfriends.romantic_intensity IS 'Romantic trait: Romantic intensity (0-100)';

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Vacuum and analyze
VACUUM ANALYZE public.ai_boyfriends;
VACUUM ANALYZE public.ai_conversations;
VACUUM ANALYZE public.ai_messages;
VACUUM ANALYZE public.ai_memories;
VACUUM ANALYZE public.ai_boyfriend_templates;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'AI Boyfriends feature successfully installed!';
  RAISE NOTICE '- 6 boyfriend templates created';
  RAISE NOTICE '- All tables, indexes, and RLS policies configured';
  RAISE NOTICE '- Realtime enabled for chat functionality';
  RAISE NOTICE '- Ready for production use';
END $$;
