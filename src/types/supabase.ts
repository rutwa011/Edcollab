export interface Database {
    public: {
      Tables: {
        users: {
          Row: {
            id: string;
            email: string;
            full_name: string;
            role: 'educator' | 'student';
            created_at: string;
          };
          Insert: {
            id: string;
            email: string;
            full_name: string;
            role: 'educator' | 'student';
            created_at?: string;
          };
          Update: {
            id?: string;
            email?: string;
            full_name?: string;
            role?: 'educator' | 'student';
            created_at?: string;
          };
        };
        courses: {
          Row: {
            id: string;
            title: string;
            description: string;
            content: string;
            creator_id: string;
            published: boolean;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            title: string;
            description: string;
            content?: string;
            creator_id: string;
            published?: boolean;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            title?: string;
            description?: string;
            content?: string;
            creator_id?: string;
            published?: boolean;
            created_at?: string;
            updated_at?: string;
          };
        };
        comments: {
          Row: {
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
          };
          Insert: {
            id?: string;
            course_id: string;
            user_id: string;
            content: string;
            selection_range?: {
              start: number;
              end: number;
              text: string;
            } | null;
            parent_id?: string | null;
            created_at?: string;
          };
          Update: {
            id?: string;
            course_id?: string;
            user_id?: string;
            content?: string;
            selection_range?: {
              start: number;
              end: number;
              text: string;
            } | null;
            parent_id?: string | null;
            created_at?: string;
          };
        };
        feedback: {
          Row: {
            id: string;
            course_id: string;
            student_id: string;
            content: string;
            rating: number;
            educator_response: string | null;
            created_at: string;
          };
          Insert: {
            id?: string;
            course_id: string;
            student_id: string;
            content: string;
            rating: number;
            educator_response?: string | null;
            created_at?: string;
          };
          Update: {
            id?: string;
            course_id?: string;
            student_id?: string;
            content?: string;
            rating?: number;
            educator_response?: string | null;
            created_at?: string;
          };
        };
      };
    };
  }