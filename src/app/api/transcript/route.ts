import { NextRequest, NextResponse } from 'next/server';
import { verifyCaptchaToken } from '@/utils/captcha';
import { supabase } from '@/lib/supabase';
import { checkUsageLimit, processAtomicAuthenticatedRequest, processAtomicAnonymousRequest, processCaptchaVerifiedRequest } from '@/lib/usageTracking';

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

interface TranscriptResponse {
  success: boolean;
  transcript?: TranscriptItem[];
  error?: string;
  requiresVerification?: boolean;
  usageInfo?: {
    remainingRequests: number;
    isAuthenticated: boolean;
    requiresAuth: boolean;
    message: string;
  };
}

interface SupadataTranscriptItem {
  text: string;
  offset: number;
  duration: number;
  lang: string;
}

// Helper function to get user from session
async function getCurrentUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

// Validate if URL is a supported platform
function validateVideoUrl(url: string): { isValid: boolean; platform: string; error?: string } {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube validation
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return { isValid: true, platform: 'youtube' };
    }

    // TikTok validation
    if (hostname.includes('tiktok.com')) {
      return { isValid: true, platform: 'tiktok' };
    }

    // Instagram validation
    if (hostname.includes('instagram.com')) {
      return { isValid: true, platform: 'instagram' };
    }

    // Twitter/X validation
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return { isValid: true, platform: 'twitter' };
    }

    return { isValid: false, platform: 'unknown', error: 'Unsupported platform. Supported platforms: YouTube, TikTok, Instagram, Twitter/X' };
  } catch {
    return { isValid: false, platform: 'unknown', error: 'Invalid URL format' };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<TranscriptResponse>> {
  try {
    // Parse request body first
    const { url, captchaToken } = await request.json();
    
    // Extract client IP for usage tracking
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown';
    
    // Get current user from session
    const user = await getCurrentUser(request);
    const userId = user?.id || null;
    
    // Process request atomically based on user authentication
    let atomicResult;
    
    if (userId) {
      // Authenticated user - use atomic processing
      atomicResult = await processAtomicAuthenticatedRequest(
        userId,
        'transcript',
        url,
        clientIP
      );
    } else {
      // Anonymous user - check if verification is needed first
      const usageCheck = await checkUsageLimit(userId, clientIP);
      
      if (!usageCheck.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: usageCheck.message,
            requiresVerification: usageCheck.requiresAuth,
            usageInfo: {
              remainingRequests: usageCheck.remainingRequests,
              isAuthenticated: usageCheck.isAuthenticated,
              requiresAuth: usageCheck.requiresAuth,
              message: usageCheck.message
            }
          },
          { status: 429 }
        );
      }
      
      // Check if verification is required for anonymous users near limit
      const needsVerification = usageCheck.remainingRequests <= 1;
      
      if (needsVerification) {
        if (!captchaToken) {
          console.log(`[${new Date().toISOString()}] VERIFICATION REQUIRED - IP: ${clientIP}`);
          return NextResponse.json(
            { 
              success: false, 
              error: `Please complete verification to continue.`,
              requiresVerification: true,
              usageInfo: {
                remainingRequests: usageCheck.remainingRequests,
                isAuthenticated: usageCheck.isAuthenticated,
                requiresAuth: usageCheck.requiresAuth,
                message: usageCheck.message
              }
            },
            { status: 429 }
          );
        }
        
        // Verify CAPTCHA token
        const captchaResult = await verifyCaptchaToken(captchaToken, clientIP);
        if (!captchaResult.success) {
          console.log(`[${new Date().toISOString()}] VERIFICATION FAILED - IP: ${clientIP}`);
          return NextResponse.json(
            { 
              success: false, 
              error: captchaResult.error || 'Verification failed' 
            },
            { status: 400 }
          );
        }
        
        console.log(`[${new Date().toISOString()}] VERIFICATION SUCCESSFUL - IP: ${clientIP}`);
        
        // Use CAPTCHA-verified processing for verified requests
        atomicResult = await processCaptchaVerifiedRequest(
          clientIP,
          'transcript',
          url
        );
      } else {
        // Process normal anonymous request atomically
        atomicResult = await processAtomicAnonymousRequest(
          clientIP,
          'transcript',
          url
        );
      }
    }
    
    // Check if atomic processing failed
    if (!atomicResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: atomicResult.message,
          requiresVerification: !userId,
          usageInfo: {
            remainingRequests: atomicResult.remainingRequests,
            isAuthenticated: !!userId,
            requiresAuth: !userId,
            message: atomicResult.message
          }
        },
        { status: 429 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Validate the URL
    const validation = validateVideoUrl(url);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid video URL' },
        { status: 400 }
      );
    }

    try {
        // Fetch transcript using Supadata API
        const supadataApiKey = process.env.SUPADATA_API_KEY;

        if (!supadataApiKey) {
          return NextResponse.json(
            { success: false, error: 'Supadata API key not configured' },
            { status: 500 }
          );
        }

        const response = await fetch(`https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          headers: {
            'x-api-key': supadataApiKey
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log(`[${new Date().toISOString()}] API CALL FAILED - IP: ${clientIP}, URL: ${url}, Status: ${response.status}`);
          return NextResponse.json(
            { success: false, error: errorData.message || `Failed to fetch transcript (Status: ${response.status})` },
            { status: response.status }
          );
        }

        const data = await response.json();
        
        if (!data.content || data.content.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No transcript available for this video' },
            { status: 404 }
          );
        }

        // Calculate total video duration and validate 3-minute limit
        const totalDuration = data.content.reduce((max: number, item: SupadataTranscriptItem) => {
          const endTime = (item.offset || 0) + (item.duration || 0);
          return Math.max(max, endTime);
        }, 0);

        const durationInSeconds = Math.floor(totalDuration / 1000);
        const MAX_DURATION_SECONDS = 180; // 3 minutes

        if (durationInSeconds > MAX_DURATION_SECONDS) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Video duration (${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, '0')}) exceeds the 3-minute limit. Please use a shorter video.` 
            },
            { status: 400 }
          );
        }

        console.log(`[${new Date().toISOString()}] TRANSCRIPT SUCCESS - IP: ${clientIP}, URL: ${url}, Duration: ${Math.floor(durationInSeconds / 60)}:${String(durationInSeconds % 60).padStart(2, '0')}`);
        
        return NextResponse.json({
          success: true,
          transcript: data.content.map((item: SupadataTranscriptItem) => ({
            text: item.text,
            duration: item.duration,
            offset: item.offset
          })),
          usageInfo: {
            remainingRequests: atomicResult.remainingRequests,
            isAuthenticated: atomicResult.isAuthenticated,
            requiresAuth: false,
            message: atomicResult.isAuthenticated 
              ? `${atomicResult.remainingRequests} requests remaining today`
              : `${atomicResult.remainingRequests} free requests remaining`
          }
        });
    } catch (transcriptError: unknown) {
      console.error('Transcript extraction error:', transcriptError);
      
      return NextResponse.json(
        { success: false, error: 'Failed to extract transcript. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { message: 'Transcript API endpoint. Use POST method with video URL.' },
    { status: 200 }
  );
}