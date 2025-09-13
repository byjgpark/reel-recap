'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Play, Image as ImageIcon } from 'lucide-react';
import { VideoThumbnail as VideoThumbnailType } from '@/store/useStore';
import { getYouTubeFallbackThumbnail } from '@/utils/videoUtils';

interface VideoThumbnailProps {
  thumbnail: VideoThumbnailType;
  videoUrl: string;
  className?: string;
  wordCount?: number;
}

export function VideoThumbnail({ thumbnail, videoUrl, className = '', wordCount }: VideoThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    
    // For YouTube, try fallback thumbnail
    if (thumbnail.platform === 'youtube' && !thumbnail.url.includes('hqdefault')) {
      const fallbackUrl = getYouTubeFallbackThumbnail(thumbnail.videoId);
      // Update the thumbnail URL to fallback
      thumbnail.url = fallbackUrl;
      setImageError(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleThumbnailClick = () => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  const getPlatformName = (platform: string): string => {
    switch (platform) {
      case 'youtube': return 'YouTube';
      case 'tiktok': return 'TikTok';
      case 'instagram': return 'Instagram';
      case 'twitter': return 'Twitter/X';
      default: return 'Video';
    }
  };

  const getPlatformColor = (platform: string): string => {
    switch (platform) {
      case 'youtube': return 'bg-red-500';
      case 'tiktok': return 'bg-black';
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'twitter': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={handleThumbnailClick}>
      <div className="relative overflow-hidden rounded-lg border-2 border-slate-200 hover:border-blue-400 transition-all duration-300 shadow-md hover:shadow-lg">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
        )}
        
        {/* Thumbnail Image */}
        {!imageError ? (
          <Image
            src={thumbnail.url}
            alt={`${getPlatformName(thumbnail.platform)} video thumbnail`}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            width={400}
            height={192}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          /* Fallback for non-YouTube or failed thumbnails */
          <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">{getPlatformName(thumbnail.platform)} Video</p>
            </div>
          </div>
        )}
        
        {/* Central Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-full p-4 shadow-lg">
            <Play className="h-8 w-8 text-gray-800 fill-current" />
          </div>
        </div>
        
        {/* Platform Badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getPlatformColor(thumbnail.platform)}`}>
            {getPlatformName(thumbnail.platform)}
          </span>
        </div>
        
        {/* Duration and Word Count Overlays */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-2">
          {/* Duration */}
          {thumbnail.duration && (
            <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-medium flex items-center">
              <span>⏱</span>
              <span className="ml-1">{formatDuration(thumbnail.duration)}</span>
            </div>
          )}
          
          {/* Word Count */}
          {wordCount && (
            <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-medium flex items-center">
              <span>📄</span>
              <span className="ml-1">{wordCount} words</span>
            </div>
          )}
        </div>
        
        {/* External Link Icon */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white bg-opacity-90 rounded-full p-1">
            <ExternalLink className="h-4 w-4 text-slate-600" />
          </div>
        </div>
      </div>
      
      {/* Click to view hint */}
      <div className="mt-2 text-center">
        <p className="text-xs text-slate-500 group-hover:text-blue-600 transition-colors duration-200">
          Click to view original video
        </p>
      </div>
    </div>
  );
}