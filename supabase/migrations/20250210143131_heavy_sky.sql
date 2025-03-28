/*
  # Initial Schema Setup for EduCollab

  1. New Tables
    - users (extends auth.users)
      - role: educator/student
      - full_name: user's full name
    - courses
      - Basic course information and content
      - Version control through updated_at timestamp
    - comments
      - Inline comments for course content
      - Position tracks location in content
    - feedback
      - Student feedback on courses
      - Optional educator response

  2. Security
    - RLS enabled on all tables
    - Policies for appropriate access control
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('educator', 'student');

-- Create users table that extends auth.users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id) NOT NULL,
  content TEXT DEFAULT '',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) NOT NULL,
  student_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  educator_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can view published courses"
  ON courses
  FOR SELECT
  USING (published = true);

CREATE POLICY "Educators can create courses"
  ON courses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'educator'
    )
  );

CREATE POLICY "Educators can update their own courses"
  ON courses
  FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'educator'
    )
  );

-- Comments policies
CREATE POLICY "Users can read comments on accessible courses"
  ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_id 
      AND (published = true OR creator_id = auth.uid())
    )
  );

CREATE POLICY "Users can create comments"
  ON comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_id 
      AND (published = true OR creator_id = auth.uid())
    )
  );

-- Feedback policies
CREATE POLICY "Students can create feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'student'
    )
  );

CREATE POLICY "Course creators can view feedback"
  ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = course_id 
      AND creator_id = auth.uid()
    )
  );