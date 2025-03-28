/*
  # Fix authentication policies
  
  1. Changes
    - Remove any existing policies
    - Create simplified policies for user management
    - Ensure proper access control for authenticated users
*/

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable all operations for authenticated user's own records" ON users;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON users;

-- Create final policies
CREATE POLICY "Users can manage their own profile"
  ON users
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);