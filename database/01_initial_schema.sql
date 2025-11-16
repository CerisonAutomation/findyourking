-- Create the profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  avatar_url text,
  full_name text,
  bio text,
  is_boyfriend boolean DEFAULT FALSE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS) for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile." ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Create the kings table
CREATE TABLE kings (
  id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  price_per_hour numeric NOT NULL,
  availability jsonb,
  description text,
  rating numeric,
  total_bookings integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS) for kings table
ALTER TABLE kings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "King profiles are viewable by everyone." ON kings
  FOR SELECT USING (TRUE);

CREATE POLICY "Kings can insert their own details." ON kings
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Kings can update their own details." ON kings
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Kings can delete their own details." ON kings
  FOR DELETE USING (auth.uid() = id);

-- Create the bookings table
CREATE TABLE bookings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  king_id uuid REFERENCES kings(id) ON DELETE CASCADE NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  status text DEFAULT 'pending' NOT NULL, -- ENUM: 'pending', 'confirmed', 'cancelled', 'completed'
  total_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS) for bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings." ON bookings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = (SELECT id FROM kings WHERE id = king_id));

CREATE POLICY "Users can create bookings." ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings." ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Kings can update bookings they are part of." ON bookings
  FOR UPDATE USING (auth.uid() = (SELECT id FROM kings WHERE id = king_id));

CREATE POLICY "Users can delete their own bookings." ON bookings
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to create a profile for new users
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email); -- Using email as initial username, can be changed later
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
