'use client';

import { useState } from 'react';
import { VideoUrlInput } from '@/components/VideoUrlInput';
import { UsageDisplay } from '@/components/UsageDisplay';
import { useStore } from '@/store/useStore';
import { AlertCircle } from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';
import { FeedbackButton } from '@/components/FeedbackButton';

interface UsageInfo {
  remainingRequests: number;
  isAuthenticated: boolean;
  requiresAuth: boolean;
  message: string;
  totalRequests?: number;
  dailyLimit?: number;
}

export default function Home() {
  const { error } = useStore();
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
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
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        {/* Hero Section */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight">
              🎬 Reel Recap
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Transform your video content into concise, AI-powered summaries. Extract transcripts and generate insights from YouTube Shorts, TikTok videos, and Instagram Reels.
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-10">
          {/* Usage Display */}
          <UsageDisplay 
            className="max-w-2xl mx-auto" 
            onUsageUpdate={setUsageInfo}
          />
          
          <VideoUrlInput usageInfo={usageInfo} />
          
          {/* <TranscriptDisplay /> */}
          
          {/* <SummarySection /> */}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-600">
            <p className="text-sm">
              Built with Next.js, Tailwind CSS, and AI. Extract transcripts from videos ≤3 minutes.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Feedback Button */}
      <FeedbackButton />
    </div>
  );
}
