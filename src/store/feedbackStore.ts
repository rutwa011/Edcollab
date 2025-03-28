import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Feedback } from '../types';

interface FeedbackState {
  feedback: Feedback[];
  loading: boolean;
  error: string | null;
  fetchFeedback: (courseId: string) => Promise<void>;
  addFeedback: (courseId: string, content: string, rating: number) => Promise<void>;
  respondToFeedback: (id: string, response: string) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedback: [],
  loading: false,
  error: null,

  fetchFeedback: async (courseId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          student:users!student_id(*)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ feedback: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch feedback' });
    } finally {
      set({ loading: false });
    }
  },

  addFeedback: async (courseId: string, content: string, rating: number) => {
    set({ loading: true, error: null });
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error('You must be signed in to submit feedback');
      }

      // Verify user is a student
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
      if (profile.role !== 'student') {
        throw new Error('Only students can submit feedback');
      }

      const { data: newFeedback, error } = await supabase
        .from('feedback')
        .insert([{
          course_id: courseId,
          student_id: session.user.id,
          content,
          rating
        }])
        .select(`
          *,
          student:users!student_id(*)
        `)
        .single();

      if (error) throw error;

      const { feedback } = get();
      set({ feedback: [newFeedback, ...feedback] });
    } catch (error) {
      console.error('Add feedback error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add feedback' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  respondToFeedback: async (id: string, response: string) => {
    set({ loading: true, error: null });
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error('You must be signed in to respond to feedback');
      }

      // Verify user is an educator
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
        throw new Error('Only educators can respond to feedback');
      }

      const { data: updatedFeedback, error } = await supabase
        .from('feedback')
        .update({ educator_response: response })
        .eq('id', id)
        .select(`
          *,
          student:users!student_id(*)
        `)
        .single();

      if (error) throw error;

      const { feedback } = get();
      set({
        feedback: feedback.map(f => 
          f.id === id ? updatedFeedback : f
        )
      });
    } catch (error) {
      console.error('Respond to feedback error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to respond to feedback' });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));