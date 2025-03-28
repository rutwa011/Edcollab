/*
  # Update course policies for educator access

  1. Changes
    - Drop existing course policies
    - Add new policies that allow any educator to manage any course
    - Keep existing read policies for students

  2. Security
    - Enable RLS
    - Add policies for educators to manage all courses
    - Maintain student access to published courses only
*/

-- Drop existing course policies
DROP POLICY IF EXISTS "Educators can view all courses" ON courses;
DROP POLICY IF EXISTS "Students can view published courses" ON courses;
DROP POLICY IF EXISTS "Educators can create courses" ON courses;
DROP POLICY IF EXISTS "Educators can update their own courses" ON courses;
DROP POLICY IF EXISTS "Educators can delete their own courses" ON courses;

-- Create new policies
CREATE POLICY "Educators can manage all courses"
  ON courses
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'educator'
    )
  )
  WITH CHECK (
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
    published = true OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'educator'
    )
  );

-- Add performance indexes
DO $$ 
BEGIN
  -- Index for creator_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'courses' AND indexname = 'courses_creator_id_idx'
  ) THEN
    CREATE INDEX courses_creator_id_idx ON courses(creator_id);
  END IF;

  -- Index for published status
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'courses' AND indexname = 'courses_published_idx'
  ) THEN
    CREATE INDEX courses_published_idx ON courses(published);
  END IF;
END $$;