import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Lazy-loaded admin client - only created when actually needed
let _supabaseAdmin: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    // Only create the admin client when it's actually accessed
    if (!_supabaseAdmin) {
      logger.info('Creating supabaseAdmin client...', undefined, 'SupabaseAdmin');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(`Missing Supabase credentials: URL=${!!supabaseUrl}, ServiceKey=${!!supabaseServiceKey}`);
      }
      
      _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      logger.info('supabaseAdmin created successfully', undefined, 'SupabaseAdmin');
    }
    
    return ((_supabaseAdmin as unknown) as Record<string | symbol, unknown>)[prop];
  }
});
