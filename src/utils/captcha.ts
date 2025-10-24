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
 * Verification threshold for cyclical verification pattern
 */
export const VERIFICATION_THRESHOLD = 5; // Trigger verification every 6th request (after 5 free requests)

/**
 * Check if verification is required based on cyclical pattern
 * @param requestCount - Current request count for the IP
 * @param isVerified - Whether the user has completed verification in current cycle
 * @returns boolean - True if verification is required
 */
export function isVerificationRequired(
  requestCount: number,
  isVerified: boolean
): boolean {
  return requestCount >= VERIFICATION_THRESHOLD && !isVerified;
}