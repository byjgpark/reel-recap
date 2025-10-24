import { supabaseAdmin } from './supabase';

export interface UsageCheckResult {
  allowed: boolean;
  remainingRequests: number;
  isAuthenticated: boolean;
  requiresAuth: boolean;
  message: string;
}

export interface UsageTrackingOptions {
  userId?: string;
  ipAddress: string;
  action: 'transcript' | 'summary';
  videoUrl: string;
}

// Constants
const ANONYMOUS_LIMIT = 10;
const AUTHENTICATED_DAILY_LIMIT = 50; // Generous limit for authenticated users
const RESET_INTERVAL_HOURS = 24;

// Check if user can make a request
export async function checkUsageLimit(
  userId: string | null,
  ipAddress: string
): Promise<UsageCheckResult> {
  try {
    if (userId) {
      // Check authenticated user usage
      return await checkAuthenticatedUserUsage(userId);
    } else {
      // Check anonymous user usage
      return await checkAnonymousUsage(ipAddress);
    }
  } catch (error) {
    console.error('Error checking usage limit:', error);
    // In case of error, allow the request but log it
    return {
      allowed: true,
      remainingRequests: 1,
      isAuthenticated: !!userId,
      requiresAuth: false,
      message: 'Usage check temporarily unavailable'
    };
  }
}

// Track usage after a successful request
export async function trackUsage(options: UsageTrackingOptions): Promise<void> {
  try {
    const { userId, ipAddress, action, videoUrl } = options;

    // Log the usage
    await supabaseAdmin
      .from('usage_logs')
      .insert({
        user_id: userId || null,
        ip_address: ipAddress,
        action,
        video_url: videoUrl
      });

    if (userId) {
      // Update authenticated user usage count
      await updateAuthenticatedUserUsage(userId, action);
    } else {
      // Update anonymous usage count
      await updateAnonymousUsage(ipAddress);
    }
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't throw error to avoid breaking the main functionality
  }
}

// Check anonymous user usage
async function checkAnonymousUsage(ipAddress: string): Promise<UsageCheckResult> {
  const { data: usage } = await supabaseAdmin
    .from('anonymous_usage')
    .select('*')
    .eq('ip_address', ipAddress)
    .single();

  if (!usage) {
    // First time user
    return {
      allowed: true,
      remainingRequests: ANONYMOUS_LIMIT - 1,
      isAuthenticated: false,
      requiresAuth: false,
      message: `${ANONYMOUS_LIMIT - 1} free requests remaining`
    };
  }

  // Check if we need to reset (24 hours passed)
  const lastRequest = new Date(usage.last_request);
  const now = new Date();
  const hoursSinceLastRequest = (now.getTime() - lastRequest.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastRequest >= RESET_INTERVAL_HOURS) {
    // Reset the counter
    await supabaseAdmin
      .from('anonymous_usage')
      .update({
        request_count: 0,
        last_request: now.toISOString()
      })
      .eq('ip_address', ipAddress);

    return {
      allowed: true,
      remainingRequests: ANONYMOUS_LIMIT - 1,
      isAuthenticated: false,
      requiresAuth: false,
      message: `Daily limit reset! ${ANONYMOUS_LIMIT - 1} requests remaining`
    };
  }

  const remainingRequests = ANONYMOUS_LIMIT - usage.request_count;

  if (remainingRequests <= 0) {
    return {
      allowed: false,
      remainingRequests: 0,
      isAuthenticated: false,
      requiresAuth: true,
      // message: 'Free limit reached. Sign in with Google for more requests!'
      message: 'Free limit reached!'
    };
  }

  return {
    allowed: true,
    remainingRequests: remainingRequests - 1,
    isAuthenticated: false,
    requiresAuth: false,
    message: `${remainingRequests - 1} free requests remaining`
  };
}

// Check authenticated user usage
async function checkAuthenticatedUserUsage(userId: string): Promise<UsageCheckResult> {
  const { data: usage } = await supabaseAdmin
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    // New user, create usage record
    await supabaseAdmin
      .from('user_usage')
      .insert({
        user_id: userId,
        transcript_count: 0,
        summary_count: 0
      });

    return {
      allowed: true,
      remainingRequests: AUTHENTICATED_DAILY_LIMIT - 1,
      isAuthenticated: true,
      requiresAuth: false,
      message: `Welcome! ${AUTHENTICATED_DAILY_LIMIT - 1} requests remaining today`
    };
  }

  // Check if we need to reset (24 hours passed)
  const lastReset = new Date(usage.last_reset);
  const now = new Date();
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

  if (hoursSinceReset >= RESET_INTERVAL_HOURS) {
    // Reset the counters
    await supabaseAdmin
      .from('user_usage')
      .update({
        transcript_count: 0,
        summary_count: 0,
        last_reset: now.toISOString()
      })
      .eq('user_id', userId);

    return {
      allowed: true,
      remainingRequests: AUTHENTICATED_DAILY_LIMIT - 1,
      isAuthenticated: true,
      requiresAuth: false,
      message: `Daily limit reset! ${AUTHENTICATED_DAILY_LIMIT - 1} requests remaining`
    };
  }

  const totalUsage = usage.transcript_count + usage.summary_count;
  const remainingRequests = AUTHENTICATED_DAILY_LIMIT - totalUsage;

  if (remainingRequests <= 0) {
    return {
      allowed: false,
      remainingRequests: 0,
      isAuthenticated: true,
      requiresAuth: false,
      message: 'Daily limit reached. Please try again tomorrow!'
    };
  }

  return {
    allowed: true,
    remainingRequests: remainingRequests - 1,
    isAuthenticated: true,
    requiresAuth: false,
    message: `${remainingRequests - 1} requests remaining today`
  };
}

// Update anonymous usage
async function updateAnonymousUsage(ipAddress: string): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('anonymous_usage')
    .select('*')
    .eq('ip_address', ipAddress)
    .single();

  if (existing) {
    await supabaseAdmin
      .from('anonymous_usage')
      .update({
        request_count: existing.request_count + 1,
        last_request: new Date().toISOString()
      })
      .eq('ip_address', ipAddress);
  } else {
    await supabaseAdmin
      .from('anonymous_usage')
      .insert({
        ip_address: ipAddress,
        request_count: 1,
        last_request: new Date().toISOString()
      });
  }
}

// Update authenticated user usage
async function updateAuthenticatedUserUsage(userId: string, action: 'transcript' | 'summary'): Promise<void> {
  const field = action === 'transcript' ? 'transcript_count' : 'summary_count';
  
  const { data: existing } = await supabaseAdmin
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabaseAdmin
      .from('user_usage')
      .update({
        [field]: existing[field] + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }
}

// Get usage stats for display purposes (doesn't subtract 1 for upcoming request)
export async function getUsageStatsForDisplay(
  userId: string | null,
  ipAddress: string
): Promise<UsageCheckResult> {
  if (userId) {
    return await getAuthenticatedUserStatsForDisplay(userId);
  } else {
    return await getAnonymousUserStatsForDisplay(ipAddress);
  }
}

// Get anonymous user stats for display
async function getAnonymousUserStatsForDisplay(ipAddress: string): Promise<UsageCheckResult> {
  const { data: usage } = await supabaseAdmin
    .from('anonymous_usage')
    .select('*')
    .eq('ip_address', ipAddress)
    .single();

  if (!usage) {
    // First time user
    return {
      allowed: true,
      remainingRequests: ANONYMOUS_LIMIT,
      isAuthenticated: false,
      requiresAuth: false,
      message: `${ANONYMOUS_LIMIT} free requests remaining`
    };
  }

  // Check if we need to reset (24 hours passed)
  const lastRequest = new Date(usage.last_request);
  const now = new Date();
  const hoursSinceLastRequest = (now.getTime() - lastRequest.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastRequest >= RESET_INTERVAL_HOURS) {
    return {
      allowed: true,
      remainingRequests: ANONYMOUS_LIMIT,
      isAuthenticated: false,
      requiresAuth: false,
      message: `Daily limit reset! ${ANONYMOUS_LIMIT} requests remaining`
    };
  }

  const remainingRequests = ANONYMOUS_LIMIT - usage.request_count;

  if (remainingRequests <= 0) {
    return {
      allowed: false,
      remainingRequests: 0,
      isAuthenticated: false,
      requiresAuth: true,
      // message: 'Free limit reached. Sign in with Google for more requests!'
      message: 'Free limit reached!'
    };
  }

  return {
    allowed: true,
    remainingRequests: remainingRequests,
    isAuthenticated: false,
    requiresAuth: false,
    message: `${remainingRequests} free requests remaining`
  };
}

// Get authenticated user stats for display
async function getAuthenticatedUserStatsForDisplay(userId: string): Promise<UsageCheckResult> {
  const { data: usage } = await supabaseAdmin
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    return {
      allowed: true,
      remainingRequests: AUTHENTICATED_DAILY_LIMIT,
      isAuthenticated: true,
      requiresAuth: false,
      message: `${AUTHENTICATED_DAILY_LIMIT} requests remaining today`
    };
  }

  // Check if we need to reset (24 hours passed)
  const lastRequest = new Date(usage.last_request);
  const now = new Date();
  const hoursSinceLastRequest = (now.getTime() - lastRequest.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastRequest >= RESET_INTERVAL_HOURS) {
    return {
      allowed: true,
      remainingRequests: AUTHENTICATED_DAILY_LIMIT,
      isAuthenticated: true,
      requiresAuth: false,
      message: `Daily limit reset! ${AUTHENTICATED_DAILY_LIMIT} requests remaining`
    };
  }

  const remainingRequests = AUTHENTICATED_DAILY_LIMIT - usage.request_count;

  if (remainingRequests <= 0) {
    return {
      allowed: false,
      remainingRequests: 0,
      isAuthenticated: true,
      requiresAuth: false,
      message: 'Daily limit reached. Try again tomorrow!'
    };
  }

  return {
    allowed: true,
    remainingRequests: remainingRequests,
    isAuthenticated: true,
    requiresAuth: false,
    message: `${remainingRequests} requests remaining today`
  };
}

// Get user usage stats (for display)
export async function getUserUsageStats(userId: string) {
  const { data: usage } = await supabaseAdmin
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    return {
      transcriptCount: 0,
      summaryCount: 0,
      totalUsage: 0,
      remainingRequests: AUTHENTICATED_DAILY_LIMIT,
      lastReset: new Date().toISOString()
    };
  }

  const totalUsage = usage.transcript_count + usage.summary_count;
  const remainingRequests = Math.max(0, AUTHENTICATED_DAILY_LIMIT - totalUsage);

  return {
    transcriptCount: usage.transcript_count,
    summaryCount: usage.summary_count,
    totalUsage,
    remainingRequests,
    lastReset: usage.last_reset
  };
}

// ATOMIC REQUEST PROCESSING FUNCTIONS
// These functions check and increment usage in a single atomic operation

export interface AtomicRequestResult {
  success: boolean;
  remainingRequests: number;
  isAuthenticated: boolean;
  message: string;
  error?: string;
}

// Atomic request processing for authenticated users
export async function processAtomicAuthenticatedRequest(
  userId: string,
  action: 'transcript' | 'summary',
  videoUrl: string,
  ipAddress: string
): Promise<AtomicRequestResult> {
  try {
    // Use a database transaction to atomically check and increment
    const { data, error } = await supabaseAdmin.rpc('process_authenticated_request', {
      p_user_id: userId,
      p_action: action,
      p_video_url: videoUrl,
      p_ip_address: ipAddress,
      p_daily_limit: AUTHENTICATED_DAILY_LIMIT,
      p_reset_interval_hours: RESET_INTERVAL_HOURS
    });

    if (error) {
      console.error('Atomic request processing error:', error);
      return {
        success: false,
        remainingRequests: 0,
        isAuthenticated: true,
        message: 'Request processing failed',
        error: error.message
      };
    }

    const result = data[0];
    return {
      success: result.success,
      remainingRequests: result.remaining_requests,
      isAuthenticated: true,
      message: result.message
    };
  } catch (error) {
    console.error('Atomic request processing error:', error);
    return {
      success: false,
      remainingRequests: 0,
      isAuthenticated: true,
      message: 'Request processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Atomic request processing for anonymous users
export async function processAtomicAnonymousRequest(
  ipAddress: string,
  action: 'transcript' | 'summary',
  videoUrl: string
): Promise<AtomicRequestResult> {
  try {
    // Use a database transaction to atomically check and increment
    const { data, error } = await supabaseAdmin.rpc('process_anonymous_request', {
      p_ip_address: ipAddress,
      p_action: action,
      p_video_url: videoUrl,
      p_anonymous_limit: ANONYMOUS_LIMIT,
      p_reset_interval_hours: RESET_INTERVAL_HOURS
    });

    if (error) {
      console.error('Atomic anonymous request processing error:', error);
      return {
        success: false,
        remainingRequests: 0,
        isAuthenticated: false,
        message: 'Request processing failed',
        error: error.message
      };
    }

    const result = data[0];
    return {
      success: result.success,
      remainingRequests: result.remaining_requests,
      isAuthenticated: false,
      message: result.message
    };
  } catch (error) {
    console.error('Atomic anonymous request processing error:', error);
    return {
      success: false,
      remainingRequests: 0,
      isAuthenticated: false,
      message: 'Request processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Process CAPTCHA-verified anonymous request (bypasses normal limit)
export async function processCaptchaVerifiedRequest(
  ipAddress: string,
  action: 'transcript' | 'summary',
  videoUrl: string
): Promise<AtomicRequestResult> {
  try {
    // Use a database transaction to process CAPTCHA-verified request
    const { data, error } = await supabaseAdmin.rpc('process_captcha_verified_request', {
      p_ip_address: ipAddress,
      p_action: action,
      p_video_url: videoUrl,
      p_reset_interval_hours: RESET_INTERVAL_HOURS
    });

    if (error) { 
      console.error('CAPTCHA-verified request processing error:', error);
      return {
        success: false,
        remainingRequests: 0,
        isAuthenticated: false,
        message: 'Request processing failed',
        error: error.message
      };
    }

    const result = data[0];
    return {
      success: result.success,
      remainingRequests: result.remaining_requests,
      isAuthenticated: false,
      message: result.message
    };
  } catch (error) {
    console.error('CAPTCHA-verified request processing error:', error);
    return {
      success: false,
      remainingRequests: 0,
      isAuthenticated: false,
      message: 'Request processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check usage limits without incrementing count
export async function checkUsageLimitOnly(
  userId: string | null,
  ipAddress: string
): Promise<AtomicRequestResult> {
  try {
    if (userId) {
      // Check authenticated user limits
      const { data, error } = await supabaseAdmin.rpc('check_authenticated_usage_limit', {
        p_user_id: userId,
        p_daily_limit: AUTHENTICATED_DAILY_LIMIT,
        p_reset_interval_hours: RESET_INTERVAL_HOURS
      });

      if (error) {
        console.error('Authenticated usage limit check error:', error);
        return {
          success: false,
          remainingRequests: 0,
          isAuthenticated: true,
          message: 'Usage check failed',
          error: error.message
        };
      }

      const result = data[0];
      return {
        success: result.allowed,
        remainingRequests: result.remaining_requests,
        isAuthenticated: true,
        message: result.message
      };
    } else {
      // Check anonymous user limits
      const { data, error } = await supabaseAdmin.rpc('check_anonymous_usage_limit', {
        p_ip_address: ipAddress,
        p_anonymous_limit: ANONYMOUS_LIMIT,
        p_reset_interval_hours: RESET_INTERVAL_HOURS
      });

      if (error) {
        console.error('Anonymous usage limit check error:', error);
        return {
          success: false,
          remainingRequests: 0,
          isAuthenticated: false,
          message: 'Usage check failed',
          error: error.message
        };
      }

      const result = data[0];
      return {
        success: result.allowed,
        remainingRequests: result.remaining_requests,
        isAuthenticated: false,
        message: result.message
      };
    }
  } catch (error) {
    console.error('Usage limit check error:', error);
    return {
      success: false,
      remainingRequests: 0,
      isAuthenticated: !!userId,
      message: 'Usage check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Increment usage count after successful API call
export async function incrementUsageAfterSuccess(
  userId: string | null,
  ipAddress: string,
  action: 'transcript' | 'summary',
  videoUrl: string
): Promise<AtomicRequestResult> {
  try {
    if (userId) {
      // Increment authenticated user usage
      const { data, error } = await supabaseAdmin.rpc('increment_authenticated_usage', {
        p_user_id: userId,
        p_action: action,
        p_video_url: videoUrl,
        p_ip_address: ipAddress,
        p_daily_limit: AUTHENTICATED_DAILY_LIMIT,
        p_reset_interval_hours: RESET_INTERVAL_HOURS
      });

      if (error) {
        console.error('Authenticated usage increment error:', error);
        return {
          success: false,
          remainingRequests: 0,
          isAuthenticated: true,
          message: 'Usage increment failed',
          error: error.message
        };
      }

      const result = data[0];
      return {
        success: result.success,
        remainingRequests: result.remaining_requests,
        isAuthenticated: true,
        message: result.message
      };
    } else {
      // Increment anonymous user usage
      const { data, error } = await supabaseAdmin.rpc('increment_anonymous_usage', {
        p_ip_address: ipAddress,
        p_action: action,
        p_video_url: videoUrl,
        p_anonymous_limit: ANONYMOUS_LIMIT,
        p_reset_interval_hours: RESET_INTERVAL_HOURS
      });

      if (error) {
        console.error('Anonymous usage increment error:', error);
        return {
          success: false,
          remainingRequests: 0,
          isAuthenticated: false,
          message: 'Usage increment failed',
          error: error.message
        };
      }

      const result = data[0];
      return {
        success: result.success,
        remainingRequests: result.remaining_requests,
        isAuthenticated: false,
        message: result.message
      };
    }
  } catch (error) {
    console.error('Usage increment error:', error);
    return {
      success: false,
      remainingRequests: 0,
      isAuthenticated: !!userId,
      message: 'Usage increment failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}