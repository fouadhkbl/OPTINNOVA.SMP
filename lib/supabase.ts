import { createClient, PostgrestError } from '@supabase/supabase-js';

// Safe environment variable access
const getEnv = (key: string) => {
  try {
    return (import.meta as any).env?.[key] || (process as any).env?.[key] || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder';

// If credentials are truly missing, createClient would throw without these placeholders.
// Now it will initialize but queries will fail gracefully.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'moon-night-auth-session',
  },
});

export interface SafeQueryResult<T> {
  data: T | null;
  error: string | 'aborted' | null;
}

export const safeQuery = async <T>(
  queryPromise: PromiseLike<{ data: T | null; error: PostgrestError | null }>
): Promise<SafeQueryResult<T>> => {
  try {
    if (supabaseUrl.includes('placeholder')) throw new Error("Supabase URL is not configured");
    const { data, error } = await queryPromise;
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    if (err.name === 'AbortError') return { data: null, error: 'aborted' };
    return { data: null, error: err.message || 'Database error' };
  }
};

export const testSupabaseConnection = async () => {
  try {
    if (supabaseUrl.includes('placeholder')) return { success: false, message: 'URL Missing' };
    const { error } = await supabase.from('products').select('id').limit(1);
    return { success: !error, message: error ? error.message : 'Stable' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};