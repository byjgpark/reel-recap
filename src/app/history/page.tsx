'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, ExternalLink, Calendar, FileText, Sparkles, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthButton } from '@/components/AuthButton';
import { HistoryButton } from '@/components/HistoryButton';
import { VideoThumbnail } from '@/components/VideoThumbnail';
import { generateThumbnailFromUrl } from '@/utils/videoUtils';

interface HistoryItem {
  id: string;
  video_url: string;
  title?: string;
  thumbnail_url?: string;
  summary?: string;
  created_at: string;
  updated_at?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isImporting = useRef(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const importPending = async () => {
      if (!user || isImporting.current) return;
      
      const pending = typeof window !== 'undefined' ? localStorage.getItem('pending_history') : null;
      if (!pending) return;

      isImporting.current = true;
      try {
        const body = JSON.parse(pending);
        // Remove immediately to prevent double submission
        localStorage.removeItem('pending_history');
        
        const response = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        
        if (response.ok) {
          await fetchHistory();
        } else {
          // If failed, restore it so user can try again (optional, but good UX)
          localStorage.setItem('pending_history', pending);
        }
      } catch (e) {
        // If error, restore
        localStorage.setItem('pending_history', pending);
      } finally {
        isImporting.current = false;
      }
    };
    importPending();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.status === 401) {
        router.push('/'); // Redirect if unauthorized
        return;
      }
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setHistory(history.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
              <Link
                href="/"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 hidden sm:inline">Back to Home</span>
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Your History</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No history yet</h3>
            <p className="text-slate-500 mb-6">Extract transcripts to see them here.</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Extracting
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-full">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/transcript?id=${item.id}&url=${encodeURIComponent(item.video_url)}&from=history`)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer group w-full max-w-full overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Thumbnail / Icon */}
                  <div className="shrink-0 w-full sm:w-64 aspect-video sm:h-36">
                    <VideoThumbnail
                      thumbnail={
                        item.thumbnail_url 
                          ? { 
                              url: item.thumbnail_url, 
                              videoId: 'unknown', 
                              platform: generateThumbnailFromUrl(item.video_url)?.platform || 'unknown' 
                            }
                          : generateThumbnailFromUrl(item.video_url) || { 
                              url: '', 
                              videoId: 'unknown', 
                              platform: 'unknown' 
                            }
                      }
                      videoUrl={item.video_url}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 break-words">
                          {item.title || item.video_url}
                        </h3>
                        <a
                          href={item.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-slate-500 hover:text-blue-500 flex items-center gap-1 mb-3 max-w-full"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate block">{new URL(item.video_url).hostname}</span>
                        </a>
                      </div>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors shrink-0 -mr-2 sm:mr-0 self-start"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-2 sm:mt-0">
                      <div className="flex flex-col gap-1 text-xs sm:text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span>Created: {new Date(item.created_at).toLocaleString([], {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        {item.updated_at && item.updated_at !== item.created_at && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span>Modified: {new Date(item.updated_at).toLocaleString([], {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 shrink-0" />
                        Transcript
                      </div>
                      {item.summary && (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <Sparkles className="w-4 h-4 shrink-0" />
                          Summary
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
