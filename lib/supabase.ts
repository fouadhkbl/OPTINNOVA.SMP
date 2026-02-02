
import { createClient } from '@supabase/supabase-js';

// Using provided credentials
const supabaseUrl = 'https://hktlxghjronjommqkwum.supabase.co';

/** 
 * NOTE: In a production environment, you should never expose a service_role/secret key in the frontend.
 * However, per user request for "full access" and to resolve RLS recursion/access issues 
 * that are causing the admin panel to hang, we are utilizing the provided secret key.
 */
const supabaseKey = 'ELwJDeeeM6ncM59eii_LWwVEZcTxesokRTci0Dw9zi9TVg_6qCooG-kqCKtkZDZXUeEtSbdUNI9wKQyD';

export const supabase = createClient(supabaseUrl, supabaseKey);
