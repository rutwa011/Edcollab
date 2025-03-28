/*
  # Fix Authentication Final
  
  1. Security Updates
    - Simplify RLS policies
    - Remove email management
    - Ensure proper auth.users integration
*/

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;

-- Create simplified policies
CREATE POLICY "Enable all operations for authenticated user's own records"
  ON users
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);