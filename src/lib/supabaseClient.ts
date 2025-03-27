
import { createClient } from '@supabase/supabase-js';
import { supabase as projectSupabase } from '@/integrations/supabase/client';

// This file is being deprecated in favor of using the client from src/integrations/supabase/client.ts
// Export the existing supabase client to maintain compatibility with existing code
export const supabase = projectSupabase;

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
