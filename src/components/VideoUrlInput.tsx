'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { generateThumbnailFromUrl } from '@/utils/videoUtils';

const SUPPORTED_PLATFORMS = {
  youtube: /^(https?:\/\/)?(www\.)?(youtube\.com\/shorts\/|youtu\.be\/)/,
  tiktok: /^(https?:\/\/)?(www\.)?(tiktok\.com\/@[\w.-]+\/video\/|vm\.tiktok\.com\/)/,
  instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|p)\/[\w-]+/
};

function validateVideoUrl(url: string): { isValid: boolean; platform?: string; error?: string } {
  if (!url.trim()) {
    return { isValid: false, error: 'Please enter a video URL' };
  }

  for (const [platform, regex] of Object.entries(SUPPORTED_PLATFORMS)) {
    if (regex.test(url)) {
      return { isValid: true, platform };
    }
  }

  return {
    isValid: false,
    error: 'Please enter a valid YouTube Shorts, TikTok, or Instagram Reel URL'
  };
}

export function VideoUrlInput() {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState('');
  const [validationError, setValidationError] = useState('');
  
  const { 
    setVideoUrl, 
    setError, 
    clearData, 
    isLoading,
    setIsLoading,
    setTranscript,
    setThumbnail
  } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateVideoUrl(inputUrl);
    
    if (!validation.isValid) {
      setValidationError(validation.error || '');
      return;
    }
    
    setValidationError('');
    setVideoUrl(inputUrl);
    clearData();
    setIsLoading(true);
    setError(null);
    
    // Generate and store thumbnail data
    const thumbnailData = generateThumbnailFromUrl(inputUrl);
    if (thumbnailData) {
      setThumbnail(thumbnailData);
    }
    
    try {
      // Call the transcript API
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputUrl }),
      });
      
      const data = await response.json();

      console.log("check data", data);
      console.log("check response", response);
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract transcript');
      }
      
      // Transform API response to match store format
      const transcriptLines = data.transcript.map((item: any) => ({
        text: item.text,
        timestamp: item.offset ? `${Math.floor(item.offset / 1000)}s` : undefined
      }));
      
      // Calculate total duration from transcript data
      const totalDuration = data.transcript.reduce((max: number, item: any) => {
        const endTime = (item.offset || 0) + (item.duration || 0);
        return Math.max(max, endTime);
      }, 0);
      
      // Update thumbnail with duration information
      if (thumbnailData && totalDuration > 0) {
        const updatedThumbnail = {
          ...thumbnailData,
          duration: Math.floor(totalDuration / 1000) // Convert to seconds
        };
        setThumbnail(updatedThumbnail);
      }
      
      setTranscript(transcriptLines);
      
      // Redirect to transcript page with the video URL
      router.push(`/transcript?url=${encodeURIComponent(inputUrl)}`);
    } catch (error: any) {
      console.error('Transcript extraction error:', error);
      setError(error.message || 'Failed to extract transcript. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputUrl(value);
    
    if (validationError && value.trim()) {
      setValidationError('');
    }
  };

  return (
    <div className="bright-card p-6">
      <h2 className="text-2xl font-semibold mb-6 text-center text-slate-800">
        Enter Video URL
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="video-url" className="block text-sm font-medium text-slate-700 mb-2">
            Video URL
          </label>
          <div className="relative group">
            <input
              id="video-url"
              type="url"
              value={inputUrl}
              onChange={handleInputChange}
              placeholder="Paste YouTube Shorts, TikTok, or Instagram Reel URL here..."
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              disabled={isLoading}
            />
            <Play className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-slate-400 transition-all duration-300 group-hover:scale-110" />
          </div>
          {validationError && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {validationError}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !inputUrl.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Processing...</span>
            </div>
          ) : (
            "Extract Transcript"
          )}
        </button>
      </form>
      
      <div className="mt-4 text-xs text-slate-600 text-center">
        Supported platforms: <span className="text-blue-600 font-medium">YouTube Shorts</span>, <span className="text-blue-600 font-medium">TikTok</span>, <span className="text-blue-600 font-medium">Instagram Reels</span>
      </div>
    </div>
  );
}