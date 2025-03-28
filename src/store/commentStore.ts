import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Comment } from '../types';

interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  fetchComments: (courseId: string) => Promise<void>;
  addComment: (
    courseId: string,
    content: string,
    selectionRange?: { start: number; end: number; text: string },
    parentId?: string
  ) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  updateComment: (id: string, content: string) => Promise<void>;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  loading: false,
  error: null,

  fetchComments: async (courseId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into threads
      const comments = (data || []).reduce((acc: Comment[], comment: Comment) => {
        if (!comment.parent_id) {
          comment.replies = data.filter(
            (reply: Comment) => reply.parent_id === comment.id
          );
          acc.push(comment);
        }
        return acc;
      }, []);

      set({ comments });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch comments' });
    } finally {
      set({ loading: false });
    }
  },

  addComment: async (courseId, content, selectionRange, parentId) => {
    set({ loading: true, error: null });
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error('You must be signed in to comment');
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert([{
          course_id: courseId,
          user_id: session.user.id, // Add the user_id
          content,
          selection_range: selectionRange || null,
          parent_id: parentId || null,
        }])
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;

      const { comments } = get();
      if (parentId) {
        // Add reply to existing thread
        const updatedComments = comments.map(c => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), comment],
            };
          }
          return c;
        });
        set({ comments: updatedComments });
      } else {
        // Add new thread
        comment.replies = [];
        set({ comments: [...comments, comment] });
      }
    } catch (error) {
      console.error('Add comment error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add comment' });
      throw error; // Re-throw to handle in the UI
    } finally {
      set({ loading: false });
    }
  },

  deleteComment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error('You must be signed in to delete comments');
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id); // Ensure user can only delete their own comments

      if (error) throw error;

      const { comments } = get();
      const updatedComments = comments.reduce((acc: Comment[], comment) => {
        if (comment.id === id) return acc;
        if (comment.replies) {
          comment.replies = comment.replies.filter(reply => reply.id !== id);
        }
        acc.push(comment);
        return acc;
      }, []);

      set({ comments: updatedComments });
    } catch (error) {
      console.error('Delete comment error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete comment' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateComment: async (id: string, content: string) => {
    set({ loading: true, error: null });
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error('You must be signed in to update comments');
      }

      const { data: updatedComment, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .eq('user_id', session.user.id) // Ensure user can only update their own comments
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;

      const { comments } = get();
      const updatedComments = comments.map(comment => {
        if (comment.id === id) {
          return { ...comment, content };
        }
        if (comment.replies) {
          comment.replies = comment.replies.map(reply =>
            reply.id === id ? { ...reply, content } : reply
          );
        }
        return comment;
      });

      set({ comments: updatedComments });
    } catch (error) {
      console.error('Update comment error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update comment' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));