import { NextRequest, NextResponse } from 'next/server';

// Simple SVG placeholder generator for different platforms
function generatePlaceholderSVG(platform: string): string {
  const platformConfig = {
    'tiktok-thumbnail': {
      color: '#000000',
      name: 'TikTok',
      icon: '♪'
    },
    'instagram-thumbnail': {
      color: '#E4405F',
      name: 'Instagram',
      icon: '📷'
    },
    'twitter-thumbnail': {
      color: '#1DA1F2',
      name: 'Twitter/X',
      icon: '🐦'
    },
    'default-thumbnail': {
      color: '#6B7280',
      name: 'Video',
      icon: '🎬'
    }
  };

  const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig['default-thumbnail'];

  return `
    <svg width="320" height="180" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${config.color};stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:${config.color};stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#bg)" />
      <rect x="10" y="10" width="300" height="160" fill="none" stroke="${config.color}" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" rx="8" />
      <circle cx="160" cy="90" r="30" fill="${config.color}" opacity="0.8" />
      <text x="160" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white">${config.icon}</text>
      <text x="160" y="130" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${config.color}">${config.name}</text>
      <text x="160" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${config.color}" opacity="0.8">Video Thumbnail</text>
    </svg>
  `;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
): Promise<NextResponse> {
  const { platform } = params;
  
  const svg = generatePlaceholderSVG(platform);
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}