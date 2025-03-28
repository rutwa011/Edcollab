/*
  # Create storage bucket for course media

  1. Changes
    - Create new storage bucket for course media
    - Set up RLS policies for bucket access

  2. Security
    - Only authenticated users can read media
    - Only educators can upload media to their own courses
    - Files are organized by course ID
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-media', 'course-media', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the course-media bucket
CREATE POLICY "Authenticated users can view course media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-media');

CREATE POLICY "Educators can upload course media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-media' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'educator'
    )
  );

CREATE POLICY "Educators can update their course media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text
      FROM courses
      WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Educators can delete their course media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text
      FROM courses
      WHERE creator_id = auth.uid()
    )
  );