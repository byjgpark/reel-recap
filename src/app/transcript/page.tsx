'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Copy, AlertCircle, Sparkles, Globe, History, Save, ArrowLeft } from 'lucide-react';
import { HistoryButton } from '@/components/HistoryButton';
import { VideoThumbnail } from '@/components/VideoThumbnail';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { getApiHeaders } from '@/utils/auth';
import { logger } from '@/utils/logger';
import { generateThumbnailFromUrl } from '@/utils/videoUtils';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

// Helper function to get language name from code
const getLanguageName = (code: string): string => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language ? language.name : 'English';
};

function TranscriptContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const videoUrl = searchParams.get('url');
  const historyId = searchParams.get('id');
  const {
    transcript,
    isLoading,
    setIsLoading,
    error,
    showTimestamps,
    setShowTimestamps,
    thumbnail,
    videoUrl: storeVideoUrl,
    summary,
    selectedLanguage,
    isGeneratingSummary,
    setSelectedLanguage,
    setSummary,
    setIsGeneratingSummary,
    setError,
    setTranscript,
    setVideoUrl,
    setThumbnail,
    // usageLogId,
    feedbackPromptOpen,
    setFeedbackPromptOpen,
    feedbackPromptShown,
    setFeedbackPromptShown
  } = useStore();
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Use videoUrl from store if available, otherwise use from search params
  const currentVideoUrl = storeVideoUrl || videoUrl || '';

  useEffect(() => {
    // Load history item if ID provided
    if (historyId) {
      // Clear existing data to show loading state and prevent stale content
      setTranscript([]);
      setVideoUrl('');
      setThumbnail(null);
      setSummary('');
      setError(null);

      const fetchHistory = async () => { 
        try {
          setIsLoading(true);
          const response = await fetch(`/api/history?id=${historyId}`);
          if (!response.ok) throw new Error('Failed to load history');
          const data = await response.json();
          
          if (data.success && data.history) {
            const h = data.history;
            setVideoUrl(h.video_url);
            
            try {
              const parsedTranscript = JSON.parse(h.transcript);
              
              // Transform transcript if it lacks timestamp strings (e.g. from raw Supadata response)
              const formattedTranscript = parsedTranscript.map((item: any) => ({
                ...item,
                timestamp: item.timestamp || (item.offset !== undefined ? `${Math.floor(item.offset / 1000)}s` : undefined)
              }));
              
              setTranscript(formattedTranscript);
            } catch {
              // Fallback for plain text transcript (legacy/migration)
              setTranscript([{ text: h.transcript, timestamp: undefined }]);
            }
            
            if (h.summary) setSummary(h.summary);
            
            if (h.thumbnail_url) {
              const detectedPlatform = generateThumbnailFromUrl(h.video_url)?.platform || 'unknown';
              setThumbnail({
                url: h.thumbnail_url,
                videoId: 'unknown', 
                platform: detectedPlatform
              });
            } else {
              // Try to generate thumbnail from URL if not saved
              const generatedThumb = generateThumbnailFromUrl(h.video_url);
              if (generatedThumb) {
                setThumbnail(generatedThumb);
              }
            }
          }
        } catch (err) {
          setError('Failed to load history item');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [historyId, setTranscript, setSummary, setVideoUrl, setThumbnail, setError, setIsLoading]);

  useEffect(() => {
    // Only redirect if we have a URL but no transcript and NOT loading history
    if (videoUrl && transcript.length === 0 && !isLoading && !error && !historyId) {
      // Optional: You could implement direct API call here instead of redirecting
      logger.debug('No transcript data found, user should extract transcript first', undefined, 'TranscriptPage');
    }
  }, [videoUrl, transcript, isLoading, error, historyId]);

  // Delayed feedback prompt after successful transcript load
  useEffect(() => {
    if (transcript.length > 0 && !isLoading && !error && !feedbackPromptOpen && !feedbackPromptShown) {
      const timer = setTimeout(() => {
        setFeedbackPromptOpen(true);
        setFeedbackPromptShown(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [transcript, isLoading, error, feedbackPromptOpen, feedbackPromptShown, setFeedbackPromptOpen, setFeedbackPromptShown]);

  const copyTranscript = async () => {
    const transcriptText = showTimestamps
      ? transcript.map(line => `${line.timestamp ? line.timestamp + ' ' : ''}${line.text}`).join('\n')
      : transcript.map(line => line.text).join(' ');
    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy transcript', err, 'TranscriptPage');
    }
  };

  const generateSummary = async () => {
    if (transcript.length === 0) {
      setError('No transcript available to summarize');
      return;
    }

    setIsGeneratingSummary(true);
    setError(null);

    try {
      // Extract text content without timestamps from transcript
      const transcriptText = transcript.map(line => line.text).join(' ');

      const headers = await getApiHeaders();
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transcript: transcriptText,
          language: getLanguageName(selectedLanguage),
          videoUrl: currentVideoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      // Schedule feedback modal 5s after successful summary generation (always schedule)
      setTimeout(() => {
        // Avoid re-opening if already open
        if (!feedbackPromptOpen) {
          setFeedbackPromptOpen(true);
          setFeedbackPromptShown(true);
        }
      }, 5000);

      // Do not refresh usage data for summary; summary requests are free
    } catch (err) {
      logger.error('Error generating summary', err, 'TranscriptPage');
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleFeedbackSuccess = () => {
    // Close modal and show success toast for 3 seconds
    setFeedbackPromptOpen(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSaveToHistory = async () => {
    try {
      const historyItem = {
        video_url: currentVideoUrl,
        transcript: JSON.stringify(transcript),
        summary: summary || undefined,
        thumbnail_url: typeof thumbnail === 'string' ? thumbnail : undefined,
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('pending_history', JSON.stringify(historyItem));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/v1/callback?next=/history`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
    } catch (err) {
      logger.error('Failed to initiate save to history login', err, 'TranscriptPage');
      setError('Failed to initiate login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RR</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Reel Recap
                  </h1>
                  <p className="text-xs text-slate-600">
                    Video Transcript Extractor
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              {user && searchParams.get('from') === 'history' ? (
                <Link
                  href="/history"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 hidden sm:inline">Back to History</span>
                </Link>
              ) : (
                <HistoryButton />
              )}
            </div>
            {/* <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-slate-600 hover:text-slate-800 transition-colors text-sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <ThemeToggle />
            </div> */}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Transcript Section */}
          <div className="space-y-6 order-1 lg:order-1">
            <div className="bright-card p-4 sm:p-6 min-h-[400px] max-h-[80vh] lg:h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Transcript</h2>
                <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors" onClick={copyTranscript}>
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              {/* Video Thumbnail */}
              {currentVideoUrl ? (
                <div className="mb-4">
                  <VideoThumbnail
                    thumbnail={thumbnail || generateThumbnailFromUrl(currentVideoUrl) || { url: '', videoId: 'unknown', platform: 'unknown' }}
                    videoUrl={currentVideoUrl}
                    className="w-full h-48 sm:h-64"
                  />
                </div>
              ) : (
                /* Fallback when no video URL */
                <div className="bg-slate-100 rounded-lg p-4 mb-4">
                  <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                        <div className="w-0 h-0 border-l-6 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
                      </div>
                      <p className="text-sm text-slate-600">Video Content</p>
                      <p className="text-xs text-slate-500 mt-1">Transcript Available</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Copy and Timestamp buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <button
                  onClick={copyTranscript}
                  disabled={transcript.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-3 py-2.5 sm:py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowTimestamps(!showTimestamps)}
                  className={`flex-1 px-3 py-2.5 sm:py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base ${showTimestamps
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 focus:ring-slate-500'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700 focus:ring-blue-500'
                    }`}
                >
                  Timestamp {showTimestamps ? 'OFF' : 'ON'}
                </button>
              </div>

              {/* Save to History Button (Anonymous only) */}
              {!user && transcript.length > 0 && (
                <button
                  onClick={handleSaveToHistory}
                  className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 sm:py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Save className="h-4 w-4" />
                  Save to History
                </button>
              )}

              {/* Transcript Content */}
              <div className="bg-slate-50 rounded-lg p-3 sm:p-4 flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-slate-600 ml-3">Extracting transcript...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8 text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <p>{error}</p>
                  </div>
                ) : transcript.length > 0 ? (
                  showTimestamps ? (
                    <div className="space-y-3">
                      {transcript.map((line, index) => (
                        <div key={index} className="flex flex-row items-start space-x-3">
                          {line.timestamp && (
                            <span className="shrink-0 font-medium text-blue-600 text-xs sm:text-sm px-2 py-1 bg-blue-50 rounded min-w-[50px] sm:min-w-[60px] text-center">
                              {line.timestamp}
                            </span>
                          )}
                          <p className="text-slate-700 leading-relaxed flex-1 text-sm sm:text-base pt-0.5">{line.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                        {transcript.map(line => line.text).join(' ')}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center py-8 text-slate-500">
                    <p>No transcript available. Please extract a transcript first.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Features Section */}
          <div className="space-y-6 order-2 lg:order-2">
            <div className="bright-card p-4 sm:p-6 min-h-[400px] max-h-[80vh] lg:h-[600px] flex flex-col">
              {/* Header */}
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Summary
                </h3>
              </div>

              {/* Language Selection */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Globe className="h-4 w-4 text-gray-600" />
                  <label htmlFor="language-select" className="text-sm text-gray-600">
                    Language:
                  </label>
                </div>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isGeneratingSummary}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateSummary}
                disabled={isGeneratingSummary}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center gap-2 mb-4 text-sm sm:text-base"
              >
                {isGeneratingSummary ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Summary</span>
                  </>
                )}
              </button>

              {/* Summary Display */}
              {summary ? (
                <div className="mt-6 flex-1 overflow-y-auto">
                  <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Summary</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {getLanguageName(selectedLanguage)}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{summary}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Generate an AI-powered summary of your video transcript in your preferred language.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackPromptOpen}
        onClose={() => setFeedbackPromptOpen(false)}
        onSuccess={handleFeedbackSuccess}
      />

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium">Thank you for your feedback!</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TranscriptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading transcript...</p>
        </div>
      </div>
    }>
      <TranscriptContent />
    </Suspense>
  );
}
