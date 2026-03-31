-- ═══════════════════════════════════════════════════════════════════════
-- Migration 002: message reactions, read receipts, image_url on messages,
--                album_photos table, Realtime publications
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Add image_url + edited_at + read_at to messages (idempotent)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url  TEXT,
  ADD COLUMN IF NOT EXISTS edited_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_at    TIMESTAMPTZ;

-- 2. Message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID        NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      TEXT        NOT NULL CHECK (char_length(emoji) <= 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user    ON message_reactions(user_id);

-- RLS for message_reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read reactions on accessible messages"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert own reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions"
  ON message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- 3. DB trigger: aggregate reactions into messages.reactions JSONB
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION sync_message_reactions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  agg JSONB;
BEGIN
  SELECT COALESCE(
    jsonb_object_agg(emoji, user_ids),
    '{}'::jsonb
  ) INTO agg
  FROM (
    SELECT emoji, jsonb_agg(user_id::text) AS user_ids
    FROM message_reactions
    WHERE message_id = COALESCE(NEW.message_id, OLD.message_id)
    GROUP BY emoji
  ) sub;

  UPDATE messages SET reactions = agg
  WHERE id = COALESCE(NEW.message_id, OLD.message_id);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_reactions ON message_reactions;
CREATE TRIGGER trg_sync_reactions
  AFTER INSERT OR DELETE ON message_reactions
  FOR EACH ROW EXECUTE FUNCTION sync_message_reactions();

-- 4. album_photos table
CREATE TABLE IF NOT EXISTS album_photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_album_photos_user ON album_photos(user_id, sort_order);

ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read album photos"
  ON album_photos FOR SELECT USING (true);

CREATE POLICY "Users manage own album photos"
  ON album_photos FOR ALL
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Realtime: enable for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE album_photos;

-- 6. Storage buckets (run once in Dashboard OR via this RPC approach)
-- CREATE BUCKET IF NOT EXISTS: message-images (public)
-- CREATE BUCKET IF NOT EXISTS: avatars (public)
-- CREATE BUCKET IF NOT EXISTS: albums (public)
-- Storage RLS is configured in Supabase Dashboard > Storage.

-- ═══════════════════════════════════════════════════════════════════════
-- RPC: get_user_conversations (if not already defined in migration 001)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  conversation_id       UUID,
  other_user_id         UUID,
  other_user_name       TEXT,
  other_user_avatar     TEXT,
  last_message_content  TEXT,
  last_message_created_at TIMESTAMPTZ,
  unread_count          BIGINT
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    c.id                                  AS conversation_id,
    CASE WHEN c.participant_one = p_user_id THEN c.participant_two ELSE c.participant_one END AS other_user_id,
    p.display_name                        AS other_user_name,
    p.avatar_url                          AS other_user_avatar,
    lm.content                            AS last_message_content,
    lm.created_at                         AS last_message_created_at,
    COUNT(um.id) FILTER (WHERE um.read_at IS NULL AND um.sender_id <> p_user_id) AS unread_count
  FROM conversations c
  JOIN profiles p ON p.user_id = (
    CASE WHEN c.participant_one = p_user_id THEN c.participant_two ELSE c.participant_one END
  )
  LEFT JOIN LATERAL (
    SELECT content, created_at FROM messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC LIMIT 1
  ) lm ON true
  LEFT JOIN messages um ON um.conversation_id = c.id
  WHERE c.participant_one = p_user_id OR c.participant_two = p_user_id
  GROUP BY c.id, other_user_id, p.display_name, p.avatar_url, lm.content, lm.created_at
  ORDER BY lm.created_at DESC NULLS LAST;
$$;
