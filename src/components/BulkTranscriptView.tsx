'use client';

import { useState } from 'react';
import { useStore, BulkTranscriptItem } from '@/store/useStore';
import { VideoThumbnail } from './VideoThumbnail';
import { Sparkles, Copy, AlertCircle, ChevronDown, ChevronUp, Check, Clock } from 'lucide-react';
import { getApiHeaders } from '@/utils/auth';
import { generateThumbnailFromUrl } from '@/utils/videoUtils';

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

export function BulkTranscriptView() {
  const { bulkItems, updateBulkItem } = useStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Track timestamp visibility per item ID
  const [timestampVisibility, setTimestampVisibility] = useState<Set<string>>(new Set());

  // Initialize all to visible on mount if desired, or keep as empty set (hidden by default)
  // For now, let's default to visible for consistency with previous behavior, or let's default hidden.
  // The user asked to put the button on each card, implying individual control.
  // Let's initialize with all IDs in the set so they are ON by default.
  useState(() => {
    const allIds = new Set(bulkItems.map(i => i.id));
    setTimestampVisibility(allIds);
  });

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const toggleTimestamp = (id: string) => {
    const newVisibility = new Set(timestampVisibility);
    if (newVisibility.has(id)) {
      newVisibility.delete(id);
    } else {
      newVisibility.add(id);
    }
    setTimestampVisibility(newVisibility);
  };


  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const generateSummary = async (item: BulkTranscriptItem) => {
    if (!item.transcript || item.transcript.length === 0) return;

    updateBulkItem(item.id, { isGeneratingSummary: true, error: undefined });

    try {
      const transcriptText = item.transcript.map(t => t.text).join(' ');
      const language = item.selectedLanguage || 'en';
      const languageName = SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'English';

      const headers = await getApiHeaders();
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transcript: transcriptText,
          language: languageName,
          videoUrl: item.url,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      updateBulkItem(item.id, { summary: data.summary, isGeneratingSummary: false });
    } catch (err) {
      updateBulkItem(item.id, { 
        error: 'Failed to generate summary', 
        isGeneratingSummary: false 
      });
    }
  };

  if (bulkItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No transcripts available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Bulk Extraction Results</h1>
      </div>
      
      <div className="grid gap-6">
        {bulkItems.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                {/* Thumbnail Section */}
                <div className="w-full sm:w-48 shrink-0 self-center sm:self-center">
                  <VideoThumbnail 
                    thumbnail={item.thumbnail || generateThumbnailFromUrl(item.url) || { url: '', videoId: 'unknown', platform: 'unknown' }}
                    videoUrl={item.url}
                    className="w-full aspect-video rounded-lg shadow-sm"
                  />
                  <div className="mt-2 text-xs text-slate-500 truncate">{item.url}</div>
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  {item.error ? (
                    <div className="flex items-center text-red-600 bg-red-50 p-4 rounded-lg">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <p>{item.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Actions Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-slate-700">
                                {item.transcript?.length || 0} lines
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-sm text-slate-500">
                                {Math.floor((item.duration || 0) / 60)}:{(item.duration || 0) % 60 < 10 ? '0' : ''}{(item.duration || 0) % 60}
                            </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleTimestamp(item.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              timestampVisibility.has(item.id)
                                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                                : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'
                            }`}
                            title={timestampVisibility.has(item.id) ? "Hide Timestamps" : "Show Timestamps"}
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopy(item.id, item.transcript.map(t => t.text).join(' '))}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Copy Transcript"
                          >
                            {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            {expandedIds.has(item.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Transcript Preview (or full if expanded) */}
                      <div className={`bg-slate-50 rounded-lg p-4 text-sm text-slate-700 ${expandedIds.has(item.id) ? '' : 'max-h-32 overflow-hidden relative'}`}>
                        {item.transcript?.map((t, i) => (
                          <span key={i}>
                            {timestampVisibility.has(item.id) && t.timestamp && (
                              <span className="text-blue-500 text-xs font-medium mr-1 select-none">
                                [{t.timestamp}]
                              </span>
                            )}
                            {t.text}{' '}
                          </span>
                        ))}
                        {!expandedIds.has(item.id) && (
                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />
                        )}
                      </div>

                      {/* Summary Section */}
                      <div className="border-t border-slate-100 pt-4">
                        {item.summary ? (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2 text-purple-800 font-medium">
                                <Sparkles className="w-4 h-4" />
                                <h3>AI Summary</h3>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{item.summary}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <select
                              value={item.selectedLanguage || 'en'}
                              onChange={(e) => updateBulkItem(item.id, { selectedLanguage: e.target.value })}
                              className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                              disabled={item.isGeneratingSummary}
                            >
                              {SUPPORTED_LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => generateSummary(item)}
                              disabled={item.isGeneratingSummary}
                              className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {item.isGeneratingSummary ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  Generate Summary
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
