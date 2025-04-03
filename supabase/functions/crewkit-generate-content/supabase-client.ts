
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

export function supabaseClient(jwt: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  // Create a Supabase client with the JWT for the authenticated user
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
  });
}
