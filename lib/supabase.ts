

import { createClient, PostgrestError } from '@supabase/supabase-js';

/**
 * Supabase configuration using Vite environment variables.
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in your .env file.
 */
// Fix: Use type assertion on import.meta to resolve "Property 'env' does not exist on type 'ImportMeta'"
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase credentials missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment."
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'moon-night-auth-session',
  },
  global: {
    headers: { 'x-application-name': 'moon-night-shop' },
  },
});

/**
 * Type definition for the result of a safeQuery execution.
 */
export interface SafeQueryResult<T> {
  data: T | null;
  error: string | 'aborted' | null;
}

/**
 * Safely executes a Supabase query with robust error handling.
 * Categorizes AbortErrors (common in React) separately from true database errors.
 * 
 * @param queryPromise - A Supabase query builder or Promise-like object.
 * @returns A standardized SafeQueryResult object.
 */
export const safeQuery = async <T>(
  queryPromise: PromiseLike<{ data: T | null; error: PostgrestError | null }>
): Promise<SafeQueryResult<T>> => {
  try {
    const { data, error } = await queryPromise;
    if (error) throw error;
    return { data, error: null };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return { data: null, error: 'aborted' };
      }
      return { data: null, error: err.message || 'An unexpected database error occurred.' };
    }
    return { data: null, error: 'An unknown error occurred during the database operation.' };
  }
};

/**
 * Checks the health of the Supabase connection.
 * Useful for diagnostics and pre-flight application checks.
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { error, status } = await supabase.from('products').select('id').limit(1);
    
    if (error) {
      if (status === 401 || status === 403) {
        return { 
          success: false, 
          message: 'Authentication Restricted: Check your Supabase API keys and RLS policies.' 
        };
      }
      return { success: false, message: `Database Sync Failed: ${error.message}` };
    }
    
    return { success: true, message: 'Supabase connection established and stable.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown network failure.';
    return { success: false, message: `System Error: ${message}` };
  }
};
