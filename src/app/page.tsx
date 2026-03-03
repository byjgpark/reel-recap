'use client';

import { useState } from 'react';
import { VideoUrlInput } from '@/components/VideoUrlInput';
import { UsageDisplay } from '@/components/UsageDisplay';
import { useStore } from '@/store/useStore';
import { AlertCircle } from 'lucide-react';
import { Header } from '@/components/Header';
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
      <Header />

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
          
        </div>
      </main>

      {/* Footer */}


      {/* Floating Feedback Button */}
      <FeedbackButton />
    </div>
  );
}
