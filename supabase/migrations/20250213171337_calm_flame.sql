/*
  # Add cascading deletes for course-related tables

  1. Changes
    - Add ON DELETE CASCADE to foreign key constraints for:
      - comments table (course_id)
      - feedback table (course_id)
    
  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity with proper cascading
*/

-- Drop existing foreign key constraints
ALTER TABLE comments 
  DROP CONSTRAINT IF EXISTS comments_course_id_fkey;

ALTER TABLE feedback
  DROP CONSTRAINT IF EXISTS feedback_course_id_fkey;

-- Re-add constraints with CASCADE
ALTER TABLE comments
  ADD CONSTRAINT comments_course_id_fkey
  FOREIGN KEY (course_id)
  REFERENCES courses(id)
  ON DELETE CASCADE;

ALTER TABLE feedback
  ADD CONSTRAINT feedback_course_id_fkey
  FOREIGN KEY (course_id)
  REFERENCES courses(id)
  ON DELETE CASCADE;

-- Add indexes for better performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'comments' AND indexname = 'comments_course_id_idx'
  ) THEN
    CREATE INDEX comments_course_id_idx ON comments(course_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'feedback' AND indexname = 'feedback_course_id_idx'
  ) THEN
    CREATE INDEX feedback_course_id_idx ON feedback(course_id);
  END IF;
END $$;