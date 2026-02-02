
import { createClient } from '@supabase/supabase-js';

// Project URL from your Supabase dashboard
const supabaseUrl = 'https://hktlxghjronjommqkwum.supabase.co';

/** 
 * SECURITY WARNING: 
 * To fix "Database Sync Error" or "Invalid API key" errors:
 * 1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
 * 2. Go to Project Settings -> API.
 * 3. Copy the 'anon' (public) key for general use OR 'service_role' (secret) key for full Admin access.
 * 4. Paste it into the supabaseKey constant below.
 * 
 * Note: A valid key is a LONG string (JWT) starting with 'eyJ...'.
 */
const supabaseKey = 'ELwJDeeeM6ncM59eii_LWwVEZcTxesokRTci0Dw9zi9TVg_6qCooG-kqCKtkZDZXUeEtSbdUNI9wKQyD';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
