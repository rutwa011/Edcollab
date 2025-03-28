-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow profile management" ON users;
DROP POLICY IF EXISTS "Allow profile reading" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create separate policies for each operation type
CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_select_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add performance indexes
DO $$ 
BEGIN
  -- Index for role-based queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'users_role_idx'
  ) THEN
    CREATE INDEX users_role_idx ON users(role);
  END IF;

  -- Index for created_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'users_created_at_idx'
  ) THEN
    CREATE INDEX users_created_at_idx ON users(created_at);
  END IF;
END $$;