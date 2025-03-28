export interface User {
  id: string;
  email: string;
  role: 'educator' | 'student';
  full_name: string;
  created_at: string;
}

export interface Course {
  imageUrl: string;
  id: string;
  title: string;
  description: string;
  creator_id: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  course_id: string;
  user_id: string;
  content: string;
  selection_range: {
    start: number;
    end: number;
    text: string;
  } | null;
  parent_id: string | null;
  created_at: string;
  user?: User;
  replies?: Comment[];
}

export interface Feedback {
  id: string;
  course_id: string;
  student_id: string;
  content: string;
  rating: number;
  created_at: string;
  educator_response?: string;
}