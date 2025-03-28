/*
  # Final Authentication Policies Update
  
  1. Changes
    - Simplify and consolidate user table policies
    - Add better support for upsert operations
    - Ensure proper handling of profile creation
    - Add missing indexes for performance
  
  2. Security
    - Enable RLS
    - Restrict operations to authenticated users
    - Allow users to manage their own profiles
    - Allow reading of all profiles for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable upsert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create consolidated policies
CREATE POLICY "Allow profile management"
  ON users
  TO authenticated
  USING (
    -- Allow access to own profile
    auth.uid() = id OR
    -- Allow creation of new profile if none exists
    (
      NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    -- Ensure users can only modify their own profile
    auth.uid() = id
  );

CREATE POLICY "Allow profile reading"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Add performance indexes
DO $$ 
BEGIN
  -- Index for role-based queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'users_role_idx'
  ) THEN
    CREATE INDEX users_role_idx ON users(role);
  END IF;

  -- Index for created_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'users_created_at_idx'
  ) THEN
    CREATE INDEX users_created_at_idx ON users(created_at);
  END IF;
END $$;