
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hktlxghjronjommqkwum.supabase.co';
// Using the provided key format. 
const supabaseKey = 'sb_publishable_XoWmh7zOIP-Edh7_kRcgpg_AkmkvxBB';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'moon-night-auth-session'
  },
  global: {
    // Add a small fetch timeout/retry logic internally via headers if needed, 
    // but primarily ensuring requests aren't pre-emptively aborted.
    headers: { 'x-application-name': 'moon-night-shop' }
  }
});

/**
 * Safely executes a Supabase query with error handling for AbortErrors
 * and common connectivity issues.
 */
// Fix: changed queryPromise type from Promise to any to support Supabase query builders which are "thenable"
export const safeQuery = async <T>(queryPromise: any) => {
  try {
    const result = await queryPromise;
    if (result.error) throw result.error;
    return { data: result.data as T | null, error: null };
  } catch (err: any) {
    // Silently handle AbortError as it's usually just a component unmounting
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      console.warn("Query was aborted safely.");
      return { data: null, error: 'aborted' };
    }
    return { data: null, error: err.message || "Unknown database error" };
  }
};

export const testSupabaseConnection = async () => {
  try {
    const { error, status } = await supabase.from('products').select('id').limit(1);
    if (error) {
      if (status === 401 || status === 403) {
        return { success: false, message: "Authentication Error: API Key might be invalid or restricted." };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: "Connection stable." };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
