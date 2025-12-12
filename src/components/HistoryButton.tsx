'use client';

import { useState } from 'react';
import { History, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function HistoryButton() {
    // const { isAuthenticated } = useAuth();
    const [showComingSoonModal, setShowComingSoonModal] = useState(false);

    // Only show for authenticated users
    // if (!isAuthenticated) {
    //     return null;
    // }

    const handleHistoryClick = async () => {
        // Track the click
        try {
            await fetch('/api/track-feature-interest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feature: 'history' }),
            });
        } catch (error) {
            console.error('Failed to track click:', error);
        }

        // Show coming soon modal
        setShowComingSoonModal(true);
    };

    return (
        <>
            {/* Prominent History Button */}
            <button
                onClick={handleHistoryClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 group"
            >
                <History className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-blue-700 hidden sm:inline">History</span>
                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            </button>

            {/* Coming Soon Modal */}
            {showComingSoonModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
                    onClick={() => setShowComingSoonModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl transform animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <History className="w-6 h-6 text-blue-600" />
                            </div>
                            <button
                                onClick={() => setShowComingSoonModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                            History Feature Coming Soon! 🚀
                        </h3>

                        <p className="text-slate-600 mb-4">
                            We&apos;re working on a feature that lets you view all your past video transcripts. Thanks for your interest!
                        </p>

                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <p className="text-sm text-blue-700">
                                <Sparkles className="w-4 h-4 inline mr-1" />
                                Your interest has been noted! This helps us prioritize features.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowComingSoonModal(false)}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
