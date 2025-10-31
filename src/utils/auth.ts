import { supabase } from '@/lib/supabase';

/**
 * Get authentication headers for API calls
 * Returns headers object with Authorization Bearer token if user is authenticated
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {};
  }
}

/**
 * Get headers for API calls including Content-Type and optional Authorization
 */
export async function getApiHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (includeAuth) {
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
  }
  
  return headers;
}