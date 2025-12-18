'use client';

import { useRouter } from 'next/navigation';
import { History, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function HistoryButton() {
    const router = useRouter();
    const { user } = useAuth();

    if (!user) return null;

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

        router.push('/history');
    };

    return (
        <button
            onClick={handleHistoryClick}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 group"
        >
            <History className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-700 hidden sm:inline">History</span>
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
        </button>
    );
}
