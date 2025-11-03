import { createClient } from '@supabase/supabase-js';
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/frontend use - using the new SSR-compatible client
export const supabase = createBrowserClient();

// Lazy-loaded admin client - only created when actually needed
let _supabaseAdmin: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    // Only create the admin client when it's actually accessed
    if (!_supabaseAdmin) {
      logger.info('Creating supabaseAdmin client...', undefined, 'Supabase');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(`Missing Supabase credentials: URL=${!!supabaseUrl}, ServiceKey=${!!supabaseServiceKey}`);
      }
      
      _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      logger.info('supabaseAdmin created successfully', undefined, 'Supabase');
    }
    
    return ((_supabaseAdmin as unknown) as Record<string | symbol, unknown>)[prop];
  }
});

// Database types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id?: string;
  ip_address?: string;
  action: 'transcript' | 'summary';
  video_url: string;
  created_at: string;
}

export interface UserUsage {
  user_id: string;
  transcript_count: number;
  summary_count: number;
  last_reset: string;
  created_at: string;
  updated_at: string;
}

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signInWithGoogle = async () => {
  logger.debug('Starting Google OAuth', undefined, 'Supabase');
  logger.debug('Current URL', window.location.href, 'Supabase');
  logger.debug('Origin', window.location.origin, 'Supabase');
  
  const callbackUrl = `${window.location.origin}/auth/v1/callback`;
  logger.debug('Final redirect URL will be', callbackUrl, 'Supabase');
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    logger.debug('OAuth response data', data, 'Supabase');
    logger.debug('OAuth response error', error, 'Supabase');
    
    if (data?.url) {
      logger.debug('OAuth redirect URL', data.url, 'Supabase');
      // Redirect to Google OAuth
      window.location.href = data.url;
    }
    
    if (error) {
      logger.error('OAuth Error Details', {
        message: error.message,
        status: error.status,
        details: error
      }, 'Supabase');
    }
    
    return { data, error };
  } catch (err) {
    logger.error('Unexpected error during OAuth', err, 'Supabase');
    return { data: null, error: err };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};