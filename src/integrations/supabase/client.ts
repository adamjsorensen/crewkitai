
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cicnpivviiqycyudgxxg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpY25waXZ2aWlxeWN5dWRneHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4Mzg2NzQsImV4cCI6MjA1NzQxNDY3NH0.-Tspt15a-bhqyqg92uDH8KeES0wDMHZBQCxdhAWxW1U";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
