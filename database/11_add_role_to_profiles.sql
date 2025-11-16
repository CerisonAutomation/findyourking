-- Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN role text DEFAULT 'user' NOT NULL;

-- Optional: Create an index on the role column for faster lookups if roles are frequently queried
CREATE INDEX idx_profiles_role ON profiles (role);
