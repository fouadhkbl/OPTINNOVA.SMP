
import { createClient } from '@supabase/supabase-js';

// Project URL from your Supabase dashboard
const supabaseUrl = 'https://hktlxghjronjommqkwum.supabase.co';

/** 
 * UPDATED AUTH KEYS:
 * Using the publishable key provided by the user.
 * Note: Standard Supabase cloud keys are usually long JWTs starting with 'eyJ'.
 * If login fails with 'invalid key', double check this key in the Supabase Dashboard.
 */
const supabaseKey = 'sb_publishable_XoWmh7zOIP-Edh7_kRcgpg_AkmkvxBB';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Diagnostic helper to verify connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { success: true, message: "Connected successfully to Moon Night Database." };
  } catch (err: any) {
    console.error("Supabase Connection Test Failed:", err);
    return { success: false, message: err.message };
  }
};
