/*
  # Fix Course RLS Policies

  1. Changes
    - Drop existing course policies
    - Add new policies for better access control:
      - Allow educators to view all courses
      - Allow students to view published courses
      - Allow educators to manage their own courses
  
  2. Security
    - Enable RLS on courses table (if not already enabled)
    - Add granular policies for different user roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Educators can create courses" ON courses;
DROP POLICY IF EXISTS "Educators can update their own courses" ON courses;

-- Create new policies
CREATE POLICY "Educators can view all courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'educator'
    )
  );

CREATE POLICY "Students can view published courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    (published = true) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'educator'
    )
  );

CREATE POLICY "Educators can create courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'educator'
    )
  );

CREATE POLICY "Educators can update their own courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'educator'
    )
  );

CREATE POLICY "Educators can delete their own courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (
    creator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'educator'
    )
  );