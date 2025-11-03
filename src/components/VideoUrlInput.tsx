'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { generateThumbnailFromUrl } from '@/utils/videoUtils';
import { trackEvent } from '@/utils/mixpanel';
import { TurnstileWidget } from './TurnstileWidget';
import { getApiHeaders } from '@/utils/auth';

// Add interface for window object with refreshUsageData
interface WindowWithRefresh extends Window {
  refreshUsageData?: () => void;
}

interface UsageInfo {
  remainingRequests: number;
  isAuthenticated: boolean;
  requiresAuth: boolean;
  message: string;
  totalRequests?: number;
  dailyLimit?: number;
}

interface VideoUrlInputProps {
  usageInfo?: UsageInfo | null;
}

const SUPPORTED_PLATFORMS = {
  youtube: /^(https?:\/\/)?(www\.)?(youtube\.com\/shorts\/|youtu\.be\/)/,
  tiktok: /^(https?:\/\/)?(www\.)?(tiktok\.com\/@[\w.-]+\/video\/|vm\.tiktok\.com\/|vt\.tiktok\.com\/)/,
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

export function VideoUrlInput({ usageInfo }: VideoUrlInputProps = {}) {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState('');
  const [validationError, setValidationError] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  
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
      trackEvent('Video URL Validation Failed', {
        url: inputUrl,
        error: validation.error
      });
      return;
    }
    
    setValidationError('');
    setVideoUrl(inputUrl);
    clearData();
    setIsLoading(true);
    setError(null);
    
    // Track video URL submission
    trackEvent('Video URL Submitted', {
      url: inputUrl,
      platform: validation.platform
    });
    
    // Generate and store thumbnail data
    const thumbnailData = generateThumbnailFromUrl(inputUrl);
    if (thumbnailData) {
      setThumbnail(thumbnailData);
    }
    
    // Check if verification is required but not completed
    if (showVerification && !verificationToken) {
      // setValidationError('Please complete the verification to continue.');
      setIsLoading(false);
      return;
    }

    try {
      // Call the transcript API
      const headers = await getApiHeaders();
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          url: inputUrl,
          captchaToken: verificationToken 
        }),
      });
      
      const data = await response.json();  
      
      // Handle verification requirement
      if (response.status === 429) {
        if (data.requiresVerification) {
          setShowVerification(true);
          setVerificationToken(null);
          setValidationError('');
          // setError('Please complete verification to continue.');
          setIsLoading(false);
          
          trackEvent('Verification Required', {
            url: inputUrl,
            platform: validation.platform
          });
          return;
        }
      }
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract transcript');
      }
      
      // Transform API response to match store format
      const transcriptLines = data.transcript.map((item: { text: string; offset?: number }) => ({
        text: item.text,
        timestamp: item.offset ? `${Math.floor(item.offset / 1000)}s` : undefined
      }));
      
      // Calculate total duration from transcript data
      const totalDuration = data.transcript.reduce((max: number, item: { offset?: number; duration?: number }) => {
        const endTime = (item.offset || 0) + (item.duration || 0);
        return Math.max(max, endTime);
      }, 0);
      
      const durationInSeconds = Math.floor(totalDuration / 1000);
      const MAX_DURATION_SECONDS = 180; // 3 minutes
      
      // Validate duration on client side as well
      if (durationInSeconds > MAX_DURATION_SECONDS) {
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        throw new Error(`Video duration (${minutes}:${String(seconds).padStart(2, '0')}) exceeds the 3-minute limit. Please use a shorter video.`);
      }
      
      // Update thumbnail with duration information
      if (thumbnailData && totalDuration > 0) {
        const updatedThumbnail = {
          ...thumbnailData,
          duration: durationInSeconds
        };
        setThumbnail(updatedThumbnail);
      }
      
      setTranscript(transcriptLines);
      
      // Track successful transcript extraction
      trackEvent('Transcript Extracted Successfully', {
        url: inputUrl,
        platform: validation.platform,
        transcriptLength: transcriptLines.length,
        duration: Math.floor(totalDuration / 1000)
      });
      
      // Hide verification widget after successful submission
      setShowVerification(false);
      setVerificationToken(null);
      
      // Refresh usage data after successful request
      if (typeof window !== 'undefined') {
        const windowWithRefresh = window as WindowWithRefresh;
        if (windowWithRefresh.refreshUsageData) {
          try {
            windowWithRefresh.refreshUsageData();
          } catch (error) {
            console.warn('Failed to refresh usage data:', error);
          }
        }
      }
      
      // Redirect to transcript page with the video URL
      router.push(`/transcript?url=${encodeURIComponent(inputUrl)}`);
    } catch (error: unknown) {
      console.error('Transcript extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract transcript. Please try again.';
      setError(errorMessage);
      
      // Track transcript extraction error
      trackEvent('Transcript Extraction Failed', {
        url: inputUrl,
        platform: validation.platform,
        error: errorMessage
      });
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

  const handleVerificationComplete = (token: string) => {
    setVerificationToken(token);
    setValidationError('');
    setError(null); // Clear global error state
    
    trackEvent('Verification Completed', {
      url: inputUrl
    });
  };

  const handleVerificationError = () => {
    setVerificationToken(null);
    setValidationError('Verification failed. Please try again.');
    
    trackEvent('Verification Failed', {
      url: inputUrl
    });
  };

  const handleVerificationExpire = () => {
    setVerificationToken(null);
    setValidationError('Verification expired. Please verify again.');
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
        
        {/* Verification Widget */}
        {showVerification && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Verification Required
              </h3>
              <p className="text-sm text-blue-700">
                Please complete the verification below to continue.
              </p>
            </div>
            <TurnstileWidget 
              onVerify={handleVerificationComplete}
              onError={handleVerificationError}
              onExpire={handleVerificationExpire}
              className=""
            />
          </div>
        )}
        
        {/* Usage limit warning */}
        {usageInfo && usageInfo.remainingRequests === 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Request Limit Reached
                </h3>
                <p className="text-sm text-red-700">
                  {usageInfo.isAuthenticated 
                    ? "You've reached your daily limit. Please try again tomorrow."
                    : "You've used all 10 free requests. Sign in with Google to get 20 requests per day!"
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !inputUrl.trim() || (usageInfo?.remainingRequests === 0)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Processing...</span>
            </div>
          ) : usageInfo?.remainingRequests === 0 ? (
            "Limit Reached"
          ) : (
            "Extract Transcript"
          )}
        </button>
      </form>
      
      <div className="mt-4 text-xs text-slate-600 text-center">
        Supported platforms: <span className="text-blue-600 font-medium">YouTube Shorts</span>, <span className="text-blue-600 font-medium">TikTok</span>, <span className="text-blue-600 font-medium">Instagram Reels</span>
        <br />
        <span className="text-amber-600 font-medium">⏱ Videos must be 3 minutes or less</span>
      </div>
    </div>
  );
}