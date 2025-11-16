-- Create the messages table
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  content text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  king_id uuid REFERENCES kings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS) for messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in chats they are part of." ON messages
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = king_id);

CREATE POLICY "Users can insert their own messages." ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages." ON messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages." ON messages
  FOR DELETE USING (auth.uid() = user_id);
