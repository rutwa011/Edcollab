import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Course } from '../types';

interface CourseState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  createCourse: (title: string, description: string) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  getCourse: (id: string) => Promise<Course | null>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  loading: false,
  error: null,
  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      // Get current user's role
      const { data: { session } } = await supabase.auth.getSession();
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session?.user?.id)
        .single();

      const query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      // If user is a student, only fetch published courses
      if (userData?.role === 'student') {
        query.eq('published', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ courses: data || [] });
    } catch (error) {
      console.error('Fetch courses error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch courses' });
    } finally {
      set({ loading: false });
    }
  },
  getCourse: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get course error:', error);
      return null;
    }
  },
  createCourse: async (title: string, description: string) => {
    if (!title?.trim()) {
      throw new Error('Title is required');
    }
    if (!description?.trim()) {
      throw new Error('Description is required');
    }

    set({ loading: true, error: null });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Authentication error: Please sign in again');
      }
      if (!session?.user) {
        throw new Error('You must be signed in to create a course');
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to verify user permissions');
      }
      if (!profile) {
        throw new Error('User profile not found');
      }
      if (profile.role !== 'educator') {
        throw new Error('Only educators can create courses');
      }

      const { data: course, error: createError } = await supabase
        .from('courses')
        .insert({
          title: title.trim(),
          description: description.trim(),
          creator_id: session.user.id,
          content: '',
          published: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          throw new Error('A course with this title already exists');
        }
        throw new Error('Failed to create course: ' + createError.message);
      }

      if (!course) {
        throw new Error('Failed to create course: No data returned');
      }

      const { courses } = get();
      set({ courses: [course, ...courses] });
    } catch (error) {
      console.error('Course creation error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred while creating the course');
    } finally {
      set({ loading: false });
    }
  },
  updateCourse: async (id: string, updates: Partial<Course>) => {
    set({ loading: true, error: null });
    try {
      // Verify user is an educator
      const { data: { session } } = await supabase.auth.getSession();
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session?.user?.id)
        .single();

      if (userData?.role !== 'educator') {
        throw new Error('Only educators can update courses');
      }

      const { data, error } = await supabase
        .from('courses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update course: ' + error.message);
      }

      if (data) {
        const { courses } = get();
        set({ courses: courses.map(course => course.id === id ? data : course) });
      }
    } catch (error) {
      console.error('Update course error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred while updating the course');
    } finally {
      set({ loading: false });
    }
  },
  deleteCourse: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Verify user is an educator
      const { data: { session } } = await supabase.auth.getSession();
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session?.user?.id)
        .single();

      if (userData?.role !== 'educator') {
        throw new Error('Only educators can delete courses');
      }

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Failed to delete course: ' + error.message);
      }

      const { courses } = get();
      set({ courses: courses.filter(course => course.id !== id) });
    } catch (error) {
      console.error('Delete course error:', error);
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred while deleting the course');
    } finally {
      set({ loading: false });
    }
  },
}));



















// import { create } from 'zustand';
// import { supabase } from '../lib/supabase';
// import type { Course } from '../types';

// interface CourseState {
//   courses: Course[];
//   loading: boolean;
//   error: string | null;
//   fetchCourses: () => Promise<void>;
//   createCourse: (title: string, description: string) => Promise<void>;
//   updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
//   deleteCourse: (id: string) => Promise<void>;
// }

// export const useCourseStore = create<CourseState>((set, get) => ({
//   courses: [],
//   loading: false,
//   error: null,
//   fetchCourses: async () => {
//     set({ loading: true, error: null });
//     try {
//       const { data, error } = await supabase
//         .from('courses')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       set({ courses: data || [] });
//     } catch (error) {
//       console.error('Fetch courses error:', error);
//       set({ error: error instanceof Error ? error.message : 'Failed to fetch courses' });
//     } finally {
//       set({ loading: false });
//     }
//   },
//   createCourse: async (title: string, description: string) => {
//     // Input validation
//     if (!title?.trim()) {
//       throw new Error('Title is required');
//     }
//     if (!description?.trim()) {
//       throw new Error('Description is required');
//     }

//     set({ loading: true, error: null });
//     try {
//       // Get current user session
//       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
//       if (sessionError) {
//         throw new Error('Authentication error: Please sign in again');
//       }
//       if (!session?.user) {
//         throw new Error('You must be signed in to create a course');
//       }

//       // Verify user is an educator
//       const { data: profile, error: profileError } = await supabase
//         .from('users')
//         .select('role')
//         .eq('id', session.user.id)
//         .single();

//       if (profileError) {
//         throw new Error('Failed to verify user permissions');
//       }
//       if (!profile) {
//         throw new Error('User profile not found');
//       }
//       if (profile.role !== 'educator') {
//         throw new Error('Only educators can create courses');
//       }

//       // Create the course
//       const { data: course, error: createError } = await supabase
//         .from('courses')
//         .insert({
//           title: title.trim(),
//           description: description.trim(),
//           creator_id: session.user.id,
//           content: '',
//           published: false,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString()
//         })
//         .select()
//         .single();

//       if (createError) {
//         if (createError.code === '23505') { // Unique violation
//           throw new Error('A course with this title already exists');
//         }
//         throw new Error('Failed to create course: ' + createError.message);
//       }

//       if (!course) {
//         throw new Error('Failed to create course: No data returned');
//       }

//       // Update local state
//       const { courses } = get();
//       set({ courses: [course, ...courses] });
//     } catch (error) {
//       console.error('Course creation error:', error);
//       throw error instanceof Error 
//         ? error 
//         : new Error('An unexpected error occurred while creating the course');
//     } finally {
//       set({ loading: false });
//     }
//   },
//   updateCourse: async (id: string, updates: Partial<Course>) => {
//     set({ loading: true, error: null });
//     try {
//       const { data, error } = await supabase
//         .from('courses')
//         .update({
//           ...updates,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', id)
//         .select()
//         .single();

//       if (error) {
//         throw new Error('Failed to update course: ' + error.message);
//       }

//       if (data) {
//         const { courses } = get();
//         set({ courses: courses.map(course => course.id === id ? data : course) });
//       }
//     } catch (error) {
//       console.error('Update course error:', error);
//       throw error instanceof Error 
//         ? error 
//         : new Error('An unexpected error occurred while updating the course');
//     } finally {
//       set({ loading: false });
//     }
//   },
//   deleteCourse: async (id: string) => {
//     set({ loading: true, error: null });
//     try {
//       const { error } = await supabase
//         .from('courses')
//         .delete()
//         .eq('id', id);

//       if (error) {
//         throw new Error('Failed to delete course: ' + error.message);
//       }

//       const { courses } = get();
//       set({ courses: courses.filter(course => course.id !== id) });
//     } catch (error) {
//       console.error('Delete course error:', error);
//       throw error instanceof Error 
//         ? error 
//         : new Error('An unexpected error occurred while deleting the course');
//     } finally {
//       set({ loading: false });
//     }
//   },
// }));