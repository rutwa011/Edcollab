/*
  # Fix Users RLS Policies

  1. Changes
    - Drop existing RLS policy for users table
    - Add new policies for:
      - Profile creation
      - Profile reading
      - Profile updating
    
  2. Security
    - Allow authenticated users to read all user profiles
    - Allow users to update their own profiles
    - Allow new users to create their profile during signup
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can read their own data" ON users;

-- Allow authenticated users to read any user profile
CREATE POLICY "Authenticated users can read user profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow new users to create their profile
CREATE POLICY "Users can create their profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);