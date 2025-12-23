import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createSubscriberSupabaseClient(
  supabaseUrl: string,
  anonKey: string
): SupabaseClient {
  return createClient(supabaseUrl, anonKey);
}
