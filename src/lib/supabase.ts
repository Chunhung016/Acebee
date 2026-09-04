import { createClient } from '@supabase/supabase-js';

// Default to user's provided Supabase credentials or environment variables
const env = (import.meta as any).env || {};
export const SUPABASE_URL =
  env.VITE_SUPABASE_URL || 'https://xwhcokxpzyqsfnixtuqa.supabase.co';
export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_s3-U_Zq-MkfvzWM1ZITw1Q_h1mZrASl';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.includes('supabase.co'));
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
