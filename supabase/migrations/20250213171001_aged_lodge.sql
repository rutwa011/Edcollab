/*
  # Fix feedback table RLS policies

  1. Changes
    - Drop existing feedback policies
    - Add new policies for:
      - Students to create feedback
      - Students to view their own feedback
      - Educators to view feedback for their courses
      - Educators to respond to feedback
  
  2. Security
    - Enable RLS on feedback table
    - Add policies for proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Students can create feedback" ON feedback;
DROP POLICY IF EXISTS "Course creators can view feedback" ON feedback;

-- Ensure RLS is enabled
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow students to create feedback
CREATE POLICY "students_insert_feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'student'
    )
  );

-- Allow students to view their own feedback
CREATE POLICY "students_view_own_feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    -- Students can only see their own feedback
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'student'
      )
      AND student_id = auth.uid()
    )
    OR
    -- Educators can see feedback for their courses
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = feedback.course_id
      AND courses.creator_id = auth.uid()
    )
  );

-- Allow educators to update feedback (for responses)
CREATE POLICY "educators_update_feedback"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = feedback.course_id
      AND courses.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = feedback.course_id
      AND courses.creator_id = auth.uid()
    )
  );

-- Add performance indexes
DO $$ 
BEGIN
  -- Index for course_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'feedback' AND indexname = 'feedback_course_id_idx'
  ) THEN
    CREATE INDEX feedback_course_id_idx ON feedback(course_id);
  END IF;

  -- Index for student_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'feedback' AND indexname = 'feedback_student_id_idx'
  ) THEN
    CREATE INDEX feedback_student_id_idx ON feedback(student_id);
  END IF;
END $$;