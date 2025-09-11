import { VideoThumbnail } from '@/store/useStore';

// Extract video ID from YouTube URL
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Extract video ID from TikTok URL
export function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([\w]+)/,
    /tiktok\.com\/t\/([\w]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Extract video ID from Instagram URL
export function extractInstagramVideoId(url: string): string | null {
  const patterns = [
    /instagram\.com\/(reel|p)\/([\w-]+)/,
    /instagram\.com\/stories\/[\w.-]+\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[2] || match[1];
    }
  }

  return null;
}

// Determine platform from URL
export function detectPlatform(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (hostname.includes('tiktok.com')) {
      return 'tiktok';
    }
    if (hostname.includes('instagram.com')) {
      return 'instagram';
    }
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// Generate thumbnail URL based on platform
export function generateThumbnailUrl(videoId: string, platform: string): string {
  switch (platform) {
    case 'youtube':
      // YouTube thumbnail URLs - using maxresdefault for best quality, fallback to hqdefault
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    case 'tiktok':
      // TikTok doesn't provide direct thumbnail URLs, use a placeholder
      return '/api/placeholder/tiktok-thumbnail';
    
    case 'instagram':
      // Instagram doesn't provide direct thumbnail URLs, use a placeholder
      return '/api/placeholder/instagram-thumbnail';
    
    case 'twitter':
      // Twitter doesn't provide direct thumbnail URLs, use a placeholder
      return '/api/placeholder/twitter-thumbnail';
    
    default:
      return '/api/placeholder/default-thumbnail';
  }
}

// Generate thumbnail data from video URL
export function generateThumbnailFromUrl(url: string): VideoThumbnail | null {
  const platform = detectPlatform(url);
  
  if (platform === 'unknown') {
    return null;
  }

  let videoId: string | null = null;
  
  switch (platform) {
    case 'youtube':
      videoId = extractYouTubeVideoId(url);
      break;
    case 'tiktok':
      videoId = extractTikTokVideoId(url);
      break;
    case 'instagram':
      videoId = extractInstagramVideoId(url);
      break;
    case 'twitter':
      // For Twitter, we'll use the URL itself as the ID
      videoId = url;
      break;
  }

  if (!videoId) {
    return null;
  }

  return {
    url: generateThumbnailUrl(videoId, platform),
    videoId,
    platform
  };
}

// Check if thumbnail URL is valid (for YouTube)
export async function validateThumbnailUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Get fallback YouTube thumbnail if maxresdefault fails
export function getYouTubeFallbackThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}