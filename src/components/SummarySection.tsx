'use client';

import { Sparkles, Globe } from 'lucide-react';
import { useStore } from '@/store/useStore';

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

export function SummarySection() {
  
  const {
    transcript,
    summary,
    selectedLanguage,
    isGeneratingSummary,
    setSelectedLanguage,
    setSummary,
    setIsGeneratingSummary,
    setError
  } = useStore();

  const generateSummary = async () => {
    if (transcript.length === 0) {
      setError('No transcript available to summarize');
      return;
    }

    setIsGeneratingSummary(true);
    setError(null);

    try {
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
    } catch (error) {
      console.error('Error generating summary:', error);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };



  if (transcript.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
          className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        
        {/* Empty State Message */}
        {!summary && (
          <div className="mt-6 text-center">
            <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Generate an AI-powered summary of your video transcript in your preferred language.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}