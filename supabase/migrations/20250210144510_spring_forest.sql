/*
  # Add selection range to comments

  1. Changes
    - Add `selection_range` column to `comments` table to store the text selection information
    - Add `parent_id` column for comment threading support
    - Add index on `parent_id` for better query performance

  2. Security
    - Maintain existing RLS policies
*/

DO $$ BEGIN
  -- Add selection_range column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'selection_range'
  ) THEN
    ALTER TABLE comments 
    ADD COLUMN selection_range JSONB;
  END IF;

  -- Add parent_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE comments 
    ADD COLUMN parent_id UUID REFERENCES comments(id);
  END IF;

  -- Add index on parent_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'comments' AND indexname = 'comments_parent_id_idx'
  ) THEN
    CREATE INDEX comments_parent_id_idx ON comments(parent_id);
  END IF;
END $$;