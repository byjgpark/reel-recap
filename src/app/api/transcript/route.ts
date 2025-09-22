import { NextRequest, NextResponse } from 'next/server';
import { verifyCaptchaToken } from '@/utils/captcha';

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

interface TranscriptResponse {
  success: boolean;
  transcript?: TranscriptItem[];
  error?: string;
}

interface SupadataTranscriptItem {
  text: string;
  offset: number;
  duration: number;
  lang: string;
}

// Cyclical verification tracking
interface VerificationData {
  requestCount: number;
  isVerified: boolean;
}

const verificationMap = new Map<string, VerificationData>();
const VERIFICATION_THRESHOLD = 5; // Trigger verification every 6th request (after 5 free requests)

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
    
    // Extract client IP for verification tracking
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown';
    
    // Cyclical verification check
    const userVerification = verificationMap.get(clientIP) || { requestCount: 0, isVerified: false };
    
    // Check if verification is required (every 6th request)
    const needsVerification = userVerification.requestCount >= VERIFICATION_THRESHOLD && !userVerification.isVerified;
    
    if (needsVerification) {
      if (!captchaToken) {
        console.log(`[${new Date().toISOString()}] VERIFICATION REQUIRED - IP: ${clientIP}, Request: ${userVerification.requestCount + 1}`);
        return NextResponse.json(
          { 
            success: false, 
            error: `Please complete verification to continue.`,
            requiresVerification: true
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
      
      // Mark as verified and reset counter for next cycle
      userVerification.isVerified = true;
      userVerification.requestCount = 0;
      console.log(`[${new Date().toISOString()}] VERIFICATION SUCCESSFUL - IP: ${clientIP}`);
    }
    
    // Increment request count
    userVerification.requestCount++;
    
    // Reset verification status if we've completed a cycle
    if (userVerification.requestCount > VERIFICATION_THRESHOLD) {
      userVerification.isVerified = false;
      userVerification.requestCount = 1; // Reset to 1 for the current request
    }
    
    verificationMap.set(clientIP, userVerification);

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
    
    // Log verification info for monitoring
    console.log(`[${new Date().toISOString()}] Verification check - IP: ${clientIP}, Count: ${userVerification.requestCount}, Verified: ${userVerification.isVerified}`);

    // All platforms are now supported via Supadata API
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

        console.log("check data", data)
        
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
          }))
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