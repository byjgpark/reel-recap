'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, AlertCircle, Layers, Video, Sparkles, X } from 'lucide-react';
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
  instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|p)\/[\w-]+/,
  facebook: /^(https?:\/\/)?(www\.)?(facebook\.com\/(reel|watch|share)\/|fb\.watch\/)/
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
    error: 'Please enter a valid YouTube Shorts, TikTok, Instagram Reel, or Facebook URL'
  };
}

export function VideoUrlInput({ usageInfo }: VideoUrlInputProps = {}) {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState('');
  const [validationError, setValidationError] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [extractionMode, setExtractionMode] = useState<'single' | 'bulk'>('single');
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  const { 
    setVideoUrl, 
    setError, 
    clearData, 
    isLoading,
    setIsLoading,
    setTranscript,
    setThumbnail,
    setUsageLogId
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
      // Store usageLogId for feedback linkage
      if ('usageLogId' in data) {
        setUsageLogId(data.usageLogId || null);
      } else {
        setUsageLogId(null);
      }
      
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

  const handleModeChange = (mode: 'single' | 'bulk') => {
    if (mode === 'bulk') {
      // Track the click immediately
      try {
        fetch('/api/track-feature-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature: 'bulk_extractor_tab' }),
        }).catch(err => console.error('Failed to track click:', err));
      } catch (error) {
        console.error('Failed to track click:', error);
      }
      
      // Show coming soon modal
      setShowBulkModal(true);
      return;
    }
    setExtractionMode(mode);
  };

  return (
    <div className="bright-card p-6 relative">
      {/* Bulk Extractor Coming Soon Modal */}
      {showBulkModal && (
        <div 
          className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setShowBulkModal(false)}
        >
          <div 
            className="bg-white border border-purple-100 shadow-xl rounded-xl p-6 max-w-sm w-full text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowBulkModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-purple-600" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Bulk Extraction Coming Soon! 🚀
            </h3>
            
            <p className="text-slate-600 mb-6">
              Process multiple videos at once to save time. We're working hard to bring this feature to you.
            </p>
            
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 mb-4">
              <p className="text-sm text-purple-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Thanks for your interest!
              </p>
            </div>
            
            <button
              onClick={() => setShowBulkModal(false)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-6">
        {/* Mode Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-lg w-full">
          <button
            type="button"
            onClick={() => handleModeChange('single')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
              extractionMode === 'single'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Single Video</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('bulk')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
              extractionMode === 'bulk'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Bulk Extraction</span>
            <span className="ml-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">New</span>
          </button>
        </div>

        <h2 className="text-2xl font-semibold text-center text-slate-800">
          Enter Video URL
        </h2>
      </div>

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
              placeholder="Paste YouTube Shorts, TikTok, Instagram Reel, or Facebook URL here..."
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
                    : "You've reached your daily limit. Please try again tomorrow."
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
        Supported platforms: <span className="text-blue-600 font-medium">YouTube Shorts</span>, <span className="text-blue-600 font-medium">TikTok</span>, <span className="text-blue-600 font-medium">Instagram Reels</span>, <span className="text-blue-600 font-medium">Facebook (Reels/Watch/Share)</span>
        <br />
        <span className="text-amber-600 font-medium">⏱ Videos must be 3 minutes or less</span>
      </div>
    </div>
  );
}