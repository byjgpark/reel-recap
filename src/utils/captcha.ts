/**
 * Cloudflare Turnstile CAPTCHA verification utility
 */

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Verify Turnstile CAPTCHA token with Cloudflare
 * @param token - The CAPTCHA token from the client
 * @param remoteip - Optional client IP address
 * @returns Promise<boolean> - True if verification successful
 */
export async function verifyCaptchaToken(
  token: string,
  remoteip?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured');
    return { success: false, error: 'CAPTCHA verification not configured' };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Turnstile API request failed:', response.status);
      return { success: false, error: 'CAPTCHA verification service unavailable' };
    }

    const result: TurnstileVerifyResponse = await response.json();
    
    if (!result.success) {
      console.warn('CAPTCHA verification failed:', result['error-codes']);
      return { 
        success: false, 
        error: 'CAPTCHA verification failed. Please try again.' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return { 
      success: false, 
      error: 'CAPTCHA verification failed. Please try again.' 
    };
  }
}

/**
 * Check if CAPTCHA is required based on rate limiting
 * @param clientIP - Client IP address
 * @param currentCount - Current request count for the IP
 * @param rateLimit - Rate limit threshold
 * @returns boolean - True if CAPTCHA is required
 */
export function isCaptchaRequired(
  clientIP: string,
  currentCount: number,
  rateLimit: number
): boolean {
  // Require CAPTCHA after exceeding rate limit
  return currentCount >= rateLimit;
}

/**
 * Progressive CAPTCHA enforcement levels
 */
export const CAPTCHA_THRESHOLDS = {
  SOFT_LIMIT: 3,    // Show warning, optional CAPTCHA
  HARD_LIMIT: 5,    // Require CAPTCHA
  BLOCK_LIMIT: 10   // Block requests even with CAPTCHA
} as const;

/**
 * Determine CAPTCHA requirement level
 * @param requestCount - Current request count
 * @returns 'none' | 'optional' | 'required' | 'blocked'
 */
export function getCaptchaRequirement(
  requestCount: number
): 'none' | 'optional' | 'required' | 'blocked' {
  if (requestCount >= CAPTCHA_THRESHOLDS.BLOCK_LIMIT) {
    return 'blocked';
  }
  if (requestCount >= CAPTCHA_THRESHOLDS.HARD_LIMIT) {
    return 'required';
  }
  if (requestCount >= CAPTCHA_THRESHOLDS.SOFT_LIMIT) {
    return 'optional';
  }
  return 'none';
}