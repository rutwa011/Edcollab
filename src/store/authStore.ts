import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'educator' | 'student') => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email, password) => {
    try {
      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) throw signInError;
      if (!authUser) throw new Error('No user returned after sign in');

      // Fetch the user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        // If no profile exists but we have auth metadata, create it
        const metadata = authUser.user_metadata;
        if (metadata?.full_name && metadata?.role) {
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .upsert({
              id: authUser.id,
              full_name: metadata.full_name,
              role: metadata.role,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) throw createError;
          if (newProfile) {
            set({ user: newProfile });
            return;
          }
        }
        throw new Error('User profile not found');
      }

      set({ user: profile });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }
      throw new Error('Failed to sign in');
    }
  },
  signUp: async (email, password, fullName, role) => {
    try {
      // Create auth user
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authUser) throw new Error('Failed to create account');

      // Create user profile using upsert to handle potential duplicates
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          full_name: fullName,
          role,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        // If profile creation fails, attempt cleanup
        await supabase.auth.admin.deleteUser(authUser.id);
        throw new Error('Failed to create user profile');
      }

      // Sign out the user after signup to prevent auto-login
      await supabase.auth.signOut();

      // Do not set the user state, as they should log in explicitly
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create account');
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }
        
        if (!profile) {
          // If no profile exists but we have auth metadata, create it
          const metadata = session.user.user_metadata;
          if (metadata?.full_name && metadata?.role) {
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .upsert({
                id: session.user.id,
                full_name: metadata.full_name,
                role: metadata.role,
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (createError) throw createError;
            if (newProfile) {
              set({ user: newProfile });
            }
          }
        } else {
          set({ user: profile });
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await supabase.auth.signOut();
      set({ user: null });
    } finally {
      set({ loading: false });
    }

    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            throw profileError;
          }
          
          if (!profile) {
            // If no profile exists but we have auth metadata, create it
            const metadata = session.user.user_metadata;
            if (metadata?.full_name && metadata?.role) {
              const { data: newProfile, error: createError } = await supabase
                .from('users')
                .upsert({
                  id: session.user.id,
                  full_name: metadata.full_name,
                  role: metadata.role,
                  created_at: new Date().toISOString()
                })
                .select()
                .single();

              if (createError) throw createError;
              if (newProfile) {
                set({ user: newProfile });
                return;
              }
            }
            throw new Error('No profile found');
          }
          
          set({ user: profile });
        } catch (error) {
          console.error('Auth state change error:', error);
          await supabase.auth.signOut();
          set({ user: null });
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null });
      }
    });
  }
}));