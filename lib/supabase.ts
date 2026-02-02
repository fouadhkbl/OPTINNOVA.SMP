
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hktlxghjronjommqkwum.supabase.co';

/** 
 * IMPORTANT: Supabase 'anon' keys are long JWT strings (starting with 'eyJ').
 * If your key looks like 'sb_publishable_...', it might be a Management Key
 * which will NOT work for client-side data fetching.
 */
const supabaseKey = 'sb_publishable_XoWmh7zOIP-Edh7_kRcgpg_AkmkvxBB';

// Basic validation check
if (!supabaseKey.startsWith('eyJ')) {
  console.error("CRITICAL: The Supabase Key provided does not appear to be a valid 'anon' public key. Client-side requests will likely fail with 401 Unauthorized.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const testSupabaseConnection = async () => {
  try {
    // Attempt to fetch a single row from products to verify connection and RLS
    const { data, error, status } = await supabase.from('products').select('id').limit(1);
    
    if (error) {
      if (status === 401 || status === 403) {
        return { success: false, message: "Authentication Error (401/403): Your Supabase API Key is likely invalid or RLS is blocking public access." };
      }
      return { success: false, message: error.message };
    }
    
    return { success: true, message: "Connection stable. Database is reachable." };
  } catch (err: any) {
    return { success: false, message: "Connection Failed: " + err.message };
  }
};
