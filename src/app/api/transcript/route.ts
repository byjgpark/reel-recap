import { NextRequest, NextResponse } from 'next/server';
import { verifyCaptchaToken } from '@/utils/captcha';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateThumbnailFromUrl } from '@/utils/videoUtils';
import { checkUsageLimit, processAtomicAuthenticatedRequest, processAtomicAnonymousRequest, processCaptchaVerifiedRequest } from '@/lib/usageTracking';
import { logger } from '@/utils/logger';

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
  usageLogId?: string | null;
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

    // Facebook validation 
    if (hostname.includes('facebook.com')) {
      return { isValid: true, platform: 'facebook' };
    }

    return { isValid: false, platform: 'unknown', error: 'Unsupported platform. Supported platforms: YouTube, TikTok, Instagram, Twitter/X, Facebook' };
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
    
    logger.info('Transcript request received', { ip: clientIP, url, userType: userId ? 'authenticated' : 'anonymous' }, 'TranscriptAPI');

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

    // 1. Check Cache for Authenticated Users FIRST
    if (userId) {
      const { data: cachedHistory } = await supabaseAdmin
        .from('user_history')
        .select('transcript, title')
        .eq('user_id', userId)
        .eq('video_url', url)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cachedHistory?.transcript) {
        try {
          const transcriptData = typeof cachedHistory.transcript === 'string' 
            ? JSON.parse(cachedHistory.transcript) 
            : cachedHistory.transcript;

          logger.info('Serving cached transcript', { userId, url }, 'TranscriptAPI');
          
          return NextResponse.json({
            success: true,
            transcript: transcriptData,
            usageInfo: {
              remainingRequests: -1, // undefined for cache hits
              isAuthenticated: true,
              requiresAuth: false,
              message: 'Loaded from history'
            }
          });
        } catch (e) {
          logger.error('Failed to parse cached transcript', e, 'TranscriptAPI');
          // Fall through to fresh fetch if cache is corrupted
        }
      }
    }

    // 2. Reserve Usage Slot (Atomic Increment) BEFORE External Call
    // This prevents parallel request attacks and ensures strict limits
    let atomicResult;
    
    if (userId) {
      atomicResult = await processAtomicAuthenticatedRequest(
        userId,
        'transcript',
        url,
        clientIP
      );
    } else {
      // Anonymous flow
      if (captchaToken) {
        atomicResult = await processCaptchaVerifiedRequest(clientIP, 'transcript', url);
      } else {
        atomicResult = await processAtomicAnonymousRequest(clientIP, 'transcript', url);
      }
    }

    // If reservation failed (limit reached), block immediately
    if (!atomicResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: atomicResult.message,
          requiresVerification: !userId, // Trigger captcha flow if anon
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

    // 3. Proceed to External API Call (Supadata)
    try {
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
          logger.warn('Supadata API call failed', { ip: clientIP, url, status: response.status }, 'TranscriptAPI');
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

        // ONLY increment usage count AFTER successful transcript extraction
        // Note: We already reserved the slot above.
        // If we implemented a "refund" mechanism, we would call it here on failure.
        // For now, we accept that failed API calls might still consume a daily quota slot
        // to prevent abuse (repeatedly calling with bad videos).
        
        /* 
           Refactored: Usage is already incremented/reserved at the start.
           The block below is removed to prevent double-counting.
        */

        logger.info('Transcript success', { ip: clientIP, url, durationSeconds: durationInSeconds }, 'TranscriptAPI');
        
        // Save to history if authenticated
        if (userId) {
          try {
            
            // Store full content as JSON string to preserve timestamps
            const fullTranscript = JSON.stringify(data.content);
            const title = data.title || null;
          
            let thumbnail = null;

              // If Supadata didn't return a thumbnail, try to generate one locally
              const generatedThumb = generateThumbnailFromUrl(url);
              if (generatedThumb) {
                thumbnail = generatedThumb.url;
              }
            
            
            // Always create a new history entry for each run
            await supabaseAdmin
              .from('user_history')
              .insert({
                user_id: userId,
                video_url: url,
                title: title,
                thumbnail_url: thumbnail,
                transcript: fullTranscript
              });
          } catch (historyError) {
            logger.error('Failed to save history', historyError, 'TranscriptAPI');
            // Don't fail the request if history save fails
          }
        }

        return NextResponse.json({
          success: true,
          transcript: data.content.map((item: SupadataTranscriptItem) => ({
            text: item.text,
            duration: item.duration,
            offset: item.offset
          })),
          usageLogId: atomicResult.usageLogId ?? null,
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
      logger.error('Transcript extraction error', transcriptError, 'TranscriptAPI');
      
      return NextResponse.json(
        { success: false, error: 'Failed to extract transcript. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logger.error('API error', error, 'TranscriptAPI');
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