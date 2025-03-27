import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project-ref.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Check if a user is authenticated
 * @returns Boolean indicating if a user is authenticated
 */
export const isAuthenticated = async () => {
  const user = await getCurrentUser();
  return !!user;
};
