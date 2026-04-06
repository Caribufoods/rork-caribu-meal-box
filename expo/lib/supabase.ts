import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Using placeholder client.');
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();

export async function initSupabaseTables(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code === '42P01') {
      console.log('[Supabase] Tables not yet created — run the SQL migration in the Supabase Dashboard');
      return false;
    }
    if (error) {
      console.log('[Supabase] Connection check error:', error.message);
      return false;
    }
    console.log('[Supabase] Connected and tables exist');
    return true;
  } catch (e) {
    console.log('[Supabase] Connection failed:', e);
    return false;
  }
}
