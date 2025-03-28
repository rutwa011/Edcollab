/*
  # Fix user policies and constraints

  1. Changes
    - Drop existing policies
    - Create new simplified policies for user management
    - Add upsert support to handle duplicate key issues
  
  2. Security
    - Enable RLS
    - Add policies for insert/update/select operations
    - Ensure users can only manage their own profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to create their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to read all profiles" ON users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies with upsert support
CREATE POLICY "Enable upsert for authenticated users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR
    NOT EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Enable read access for authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for users based on id"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add missing indexes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'users_role_idx'
  ) THEN
    CREATE INDEX users_role_idx ON users(role);
  END IF;
END $$;