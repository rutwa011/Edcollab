/*
  # Course permissions setup

  1. Security
    - Enable RLS on courses table
    - Add policies for:
      - Educators can perform all operations
      - Students can only read published courses
      - Public can't access any courses

  2. Changes
    - Add RLS policies to courses table
    - Ensure proper access control for different user roles
*/

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policy for educators (full access)
CREATE POLICY "Educators have full access to courses"
ON courses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'educator'
  )
);

-- Policy for students (read-only access to published courses)
CREATE POLICY "Students can read published courses"
ON courses
FOR SELECT
TO authenticated
USING (
  published = true
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'student'
  )
);

-- Ensure course media storage is properly secured
CREATE POLICY "Public read access for course media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'course-media');

CREATE POLICY "Educators can manage course media"
ON storage.objects
FOR ALL 
TO authenticated
USING (
  bucket_id = 'course-media'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'educator'
  )
);