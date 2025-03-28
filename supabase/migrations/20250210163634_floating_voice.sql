/*
  # Fix Authentication Policies

  1. Security Updates
    - Update RLS policies for better auth flow
    - Enable proper access control for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read user profiles" ON users;

-- Create new policies for users table
CREATE POLICY "Enable insert for authenticated users only"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

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