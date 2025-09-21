import { NextRequest, NextResponse } from 'next/server';

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

// Rate limiting configuration
interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitData>();
const RATE_LIMIT = 5; // requests per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

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
    // Extract client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown';
    
    // Rate limiting check
    const now = Date.now();
    const userLimit = rateLimitMap.get(clientIP) || { count: 0, resetTime: now + WINDOW_MS };
    
    // Reset counter if window has expired
    if (now > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + WINDOW_MS;
    }
    
    // Check if rate limit exceeded
    if (userLimit.count >= RATE_LIMIT) {
      console.log(`[${new Date().toISOString()}] RATE LIMIT EXCEEDED - IP: ${clientIP}, Attempts: ${userLimit.count}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Rate limit exceeded. You can make ${RATE_LIMIT} requests per hour. Please try again later.` 
        },
        { status: 429 }
      );
    }
    
    // Increment request count
    userLimit.count++;
    rateLimitMap.set(clientIP, userLimit);
    
    // Log rate limit info for monitoring
    console.log(`[${new Date().toISOString()}] Rate limit check - IP: ${clientIP}, Count: ${userLimit.count}/${RATE_LIMIT}`);
    
    const { url } = await request.json();

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