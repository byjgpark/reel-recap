'use client';

import { Sparkles, Globe } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { trackEvent } from '@/utils/mixpanel';

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
    
    // Track summary generation start
    trackEvent('Summary Generation Started', {
      language: getLanguageName(selectedLanguage),
      languageCode: selectedLanguage,
      transcriptLength: transcript.length,
      timestamp: new Date().toISOString()
    });

    try {
      const transcriptText = transcript.map(line => line.text).join(' ');
      
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptText,
          language: getLanguageName(selectedLanguage),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      
      // Track successful summary generation
      trackEvent('Summary Generated Successfully', {
        language: getLanguageName(selectedLanguage),
        languageCode: selectedLanguage,
        transcriptLength: transcript.length,
        summaryLength: data.summary?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      const errorMessage = 'Failed to generate summary. Please try again.';
      setError(errorMessage);
      
      // Track summary generation error
      trackEvent('Summary Generation Failed', {
        language: getLanguageName(selectedLanguage),
        languageCode: selectedLanguage,
        transcriptLength: transcript.length,
        error: error instanceof Error ? error.message : errorMessage,
        timestamp: new Date().toISOString()
      });
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
            onChange={(e) => {
              const newLanguage = e.target.value;
              setSelectedLanguage(newLanguage);
              
              // Track language selection
              trackEvent('Summary Language Changed', {
                previousLanguage: getLanguageName(selectedLanguage),
                newLanguage: getLanguageName(newLanguage),
                previousLanguageCode: selectedLanguage,
                newLanguageCode: newLanguage,
                timestamp: new Date().toISOString()
              });
            }}
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