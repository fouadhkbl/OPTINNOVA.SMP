
import { createClient } from '@supabase/supabase-js';

// Using provided credentials
const supabaseUrl = 'https://hktlxghjronjommqkwum.supabase.co';
const supabaseKey = 'sb_publishable_XoWmh7zOIP-Edh7_kRcgpg_AkmkvxBB';

export const supabase = createClient(supabaseUrl, supabaseKey);
