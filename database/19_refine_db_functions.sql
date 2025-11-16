-- Refine database functions as per .gemini guidelines

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
SECURITY INVOKER -- Default to SECURITY INVOKER
SET search_path = ''
BEGIN
  NEW.updated_at = now(); -- now() is a standard function, no schema needed
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
