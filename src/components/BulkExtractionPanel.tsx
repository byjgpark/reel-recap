'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { trackEvent } from '@/utils/mixpanel';
import { getApiHeaders } from '@/utils/auth';
import { AlertCircle, CheckCircle, Clock, Loader2, Play, XCircle, FileText } from 'lucide-react';
import { generateThumbnailFromUrl } from '@/utils/videoUtils';

interface BulkItem {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  transcriptLength?: number;
  duration?: number;
  transcript?: any[];
}

export function BulkExtractionPanel() {
  const router = useRouter();
  const [inputUrls, setInputUrls] = useState('');
  const [items, setItems] = useState<BulkItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { setUsageLogId, setBulkItems } = useStore();

  const handleUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputUrls(e.target.value);
  };

  const parseUrls = () => {
    const urls = inputUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    // De-duplicate
    const uniqueUrls = Array.from(new Set(urls));
    
    // Limit to 10 for MVP
    if (uniqueUrls.length > 10) {
      alert('Bulk extraction is limited to 10 videos at a time for now.');
      return uniqueUrls.slice(0, 10);
    }
    
    return uniqueUrls;
  };

  const startBulkExtraction = async () => {
    const urls = parseUrls();
    if (urls.length === 0) return;

    const newItems: BulkItem[] = urls.map(url => ({
      id: Math.random().toString(36).substring(7),
      url,
      status: 'pending'
    }));

    setItems(newItems);
    setIsProcessing(true);
    setInputUrls(''); // Clear input

    trackEvent('Bulk Extraction Started', {
      count: newItems.length
    });

    const resultsMap = new Map<string, BulkItem>();
    newItems.forEach(item => resultsMap.set(item.id, { ...item }));

    // Process sequentially
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      
      // Update status to processing
      setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'processing' } : p));

      try {
        const headers = await getApiHeaders();
        const response = await fetch('/api/transcript', {
          method: 'POST',
          headers,
          body: JSON.stringify({ url: item.url }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to extract');
        }

        // Calculate duration
        const totalDuration = data.transcript.reduce((max: number, t: any) => {
            const endTime = (t.offset || 0) + (t.duration || 0);
            return Math.max(max, endTime);
        }, 0);
        const durationInSeconds = Math.floor(totalDuration / 1000);

        const updatedItem: BulkItem = {
          ...item,
          status: 'completed',
          transcriptLength: data.transcript.length,
          duration: durationInSeconds,
          transcript: data.transcript
        };

        // Update map and state
        resultsMap.set(item.id, updatedItem);
        setItems(prev => prev.map(p => p.id === item.id ? updatedItem : p));

        // Update usage log if available (just using the last one for now or we could collect them)
        if (data.usageLogId) {
            setUsageLogId(data.usageLogId);
        }

      } catch (error: any) {
        const failedItem: BulkItem = {
          ...item,
          status: 'failed',
          error: error.message || 'Unknown error'
        };
        resultsMap.set(item.id, failedItem);
        setItems(prev => prev.map(p => p.id === item.id ? failedItem : p));
      }
    }

    setIsProcessing(false);
    
    // Refresh usage stats
    if (typeof window !== 'undefined' && (window as any).refreshUsageData) {
        (window as any).refreshUsageData();
    }

    // Prepare data for store and redirect
    const finalBulkItems = Array.from(resultsMap.values()).map(item => ({
      id: item.id,
      url: item.url,
      transcript: item.transcript ? item.transcript.map((t: any) => ({
        text: t.text,
        timestamp: t.offset !== undefined ? `${Math.floor(t.offset / 1000)}s` : undefined
      })) : [],
      summary: undefined,
      thumbnail: generateThumbnailFromUrl(item.url),
      duration: item.duration,
      error: item.error,
      isLoading: false,
      isGeneratingSummary: false,
      selectedLanguage: 'en'
    }));

    setBulkItems(finalBulkItems);
    router.push('/transcript?view=bulk');
  };

  const getStatusIcon = (status: BulkItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-slate-400" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <strong>Bulk Extraction Beta:</strong> Process up to 10 videos at once. 
            Paste one URL per line.
          </div>
          <textarea
            value={inputUrls}
            onChange={handleUrlsChange}
            placeholder={`https://youtube.com/shorts/...\nhttps://tiktok.com/@user/video/...\nhttps://instagram.com/reel/...`}
            className="w-full h-48 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none text-sm font-mono"
          />
          <button
            onClick={startBulkExtraction}
            disabled={!inputUrls.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Batch Process</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-800">Processing Queue</h3>
            {isProcessing ? (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">Processing...</span>
            ) : (
                <button 
                    onClick={() => { setItems([]); setInputUrls(''); }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                    Start New Batch
                </button>
            )}
          </div>
          
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="shrink-0">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate" title={item.url}>
                      {item.url}
                    </p>
                    {item.error && (
                        <p className="text-xs text-red-500 truncate">{item.error}</p>
                    )}
                    {item.status === 'completed' && (
                        <p className="text-xs text-slate-500">
                            {Math.floor((item.duration || 0) / 60)}:{(item.duration || 0) % 60 < 10 ? '0' : ''}{(item.duration || 0) % 60} • {item.transcriptLength} lines
                        </p>
                    )}
                  </div>
                </div>
                
                {item.status === 'completed' && (
                    <a 
                        href={`/transcript?url=${encodeURIComponent(item.url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                    </a>
                )}
              </div>
            ))}
          </div>
          
          {!isProcessing && (
             <div className="pt-4 text-center">
                <p className="text-sm text-slate-500 mb-3">Batch complete! Check your History for full details.</p>
                <button
                    onClick={() => window.location.href = '/history'}
                    className="text-blue-600 font-medium hover:underline text-sm"
                >
                    Go to History
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}