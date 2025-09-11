'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Copy, Star, AlertCircle, Sparkles, Globe } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VideoThumbnail } from '@/components/VideoThumbnail';
import { useStore } from '@/store/useStore';
import Link from 'next/link';

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

export default function TranscriptPage() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('url');
  const { 
    transcript, 
    isLoading, 
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
    setError
  } = useStore();
  const [copied, setCopied] = useState(false);
  
  // Use videoUrl from store if available, otherwise use from search params
  const currentVideoUrl = storeVideoUrl || videoUrl || '';

  useEffect(() => {
    // If no transcript data and we have a URL, the user might have navigated directly
    // In this case, redirect back to home to extract transcript
    if (videoUrl && transcript.length === 0 && !isLoading && !error) {
      // Optional: You could implement direct API call here instead of redirecting
      console.log('No transcript data found, user should extract transcript first');
    }
  }, [videoUrl, transcript, isLoading, error]);

  const copyTranscript = async () => {
    const transcriptText = showTimestamps 
      ? transcript.map(line => `${line.timestamp ? line.timestamp + ' ' : ''}${line.text}`).join('\n')
      : transcript.map(line => line.text).join(' ');
    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy transcript:', err);
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
      
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptText,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
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

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transcript Section */}
          <div className="space-y-6">
            <div className="bright-card p-4 sm:p-6 h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Transcript</h2>
                <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              
              {/* Video Thumbnail */}
              {thumbnail && currentVideoUrl && (
                <div className="mb-4">
                  <VideoThumbnail 
                    thumbnail={thumbnail} 
                    videoUrl={currentVideoUrl} 
                    className="w-full" 
                  />
                </div>
              )}
              
              {/* Fallback when no thumbnail */}
              {(!thumbnail || !currentVideoUrl) && (
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-3 sm:py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button 
                  onClick={() => setShowTimestamps(!showTimestamps)}
                  className={`flex-1 px-4 py-3 sm:py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] ${
                    showTimestamps 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 focus:ring-slate-500' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700 focus:ring-blue-500'
                  }`}
                >
                  Timestamp {showTimestamps ? 'OFF' : 'ON'}
                </button>
              </div>

              {/* Transcript Content */}
              <div className="bg-slate-50 rounded-lg p-4 flex-1 overflow-y-auto max-h-96">
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
                        <div key={index} className="flex items-start space-x-3">
                          {line.timestamp && (
                            <span className="font-medium text-blue-600 min-w-[60px] text-sm px-2 py-1 bg-blue-50 rounded">
                              {line.timestamp}
                            </span>
                          )}
                          <p className="text-slate-700 leading-relaxed flex-1">{line.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <p className="text-slate-700 leading-relaxed">
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
          <div className="space-y-6">
           <div className="bright-card p-4 sm:p-6 h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col">
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
              <option key={lang.code} value={lang.name}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Generate Button */}
        <button
          onClick={generateSummary}
          disabled={isGeneratingSummary}
          className="w-full inline-flex items-center justify-center space-x-2 px-6 py-4 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[48px]"
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
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Summary</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {selectedLanguage}
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">{summary}</p>
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
    </div>
  );
}