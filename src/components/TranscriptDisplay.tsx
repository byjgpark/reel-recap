'use client';

import { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { VideoThumbnail } from './VideoThumbnail';

export function TranscriptDisplay() {
  const [copied, setCopied] = useState(false);
  const { transcript, showTimestamps, setShowTimestamps, thumbnail, videoUrl } = useStore();

  const copyToClipboard = async () => {
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

  if (transcript.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="bright-card rounded-xl">
        {/* Video Thumbnail Section */}
        {thumbnail && videoUrl && (
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <VideoThumbnail 
                  thumbnail={thumbnail} 
                  videoUrl={videoUrl} 
                  className="w-full lg:w-80" 
                  wordCount={transcript.reduce((count, line) => count + line.text.split(' ').length, 0)}
                />
              </div>
              <div className="flex-grow">
                <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                  Video Transcript
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                  Extracted from {thumbnail.platform === 'youtube' ? 'YouTube' : 
                                 thumbnail.platform === 'tiktok' ? 'TikTok' : 
                                 thumbnail.platform === 'instagram' ? 'Instagram' : 
                                 thumbnail.platform === 'twitter' ? 'Twitter/X' : 'Video'} content
                </p>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Fallback header when no thumbnail */}
        {(!thumbnail || !videoUrl) && (
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-800">
              Video Transcript
            </h2>
            
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Transcript Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📄 Video Transcript</h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {transcript.length} segments
                </span>
                <button
                  onClick={() => setShowTimestamps(!showTimestamps)}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors duration-200"
                >
                  {showTimestamps ? 'Hide Times' : 'Show Times'}
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {showTimestamps ? (
                <div className="space-y-4">
                  {transcript.map((line, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {line.timestamp && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md min-w-[60px] justify-center">
                          {line.timestamp}
                        </span>
                      )}
                      <p className="text-gray-700 leading-relaxed flex-1">
                        {line.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {transcript.map(line => line.text).join(' ')}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Total words: <span className="font-medium">{transcript.reduce((count, line) => count + line.text.split(' ').length, 0)}</span>
              </span>
              <span className="text-sm text-gray-600">
                Duration: <span className="font-medium">{Math.ceil(transcript.length * 2)}min read</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}