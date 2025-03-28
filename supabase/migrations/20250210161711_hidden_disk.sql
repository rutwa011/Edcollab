/*
  # Fix comments table schema

  1. Changes
    - Remove position column requirement
    - Add position column default value
    - Add missing indexes for performance

  2. Security
    - No changes to RLS policies
*/

DO $$ BEGIN
  -- Remove not-null constraint from position column
  ALTER TABLE comments 
  ALTER COLUMN position DROP NOT NULL;

  -- Add default value for position
  ALTER TABLE comments 
  ALTER COLUMN position SET DEFAULT 0;

  -- Add indexes for common queries if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'comments' AND indexname = 'comments_course_id_idx'
  ) THEN
    CREATE INDEX comments_course_id_idx ON comments(course_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'comments' AND indexname = 'comments_user_id_idx'
  ) THEN
    CREATE INDEX comments_user_id_idx ON comments(user_id);
  END IF;
END $$;