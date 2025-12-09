'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Users, MousePointer, ArrowLeft, RefreshCw } from 'lucide-react';

interface ClickData {
    id: string;
    feature: string;
    user_id: string | null;
    user_email: string | null;
    timestamp: string;
    user_agent: string;
    ip_address: string;
}

interface Stats {
    totalClicks: number;
    uniqueUsers: number;
    authenticatedClicks: number;
}

export default function AnalyticsClient() {
    const [clicks, setClicks] = useState<ClickData[]>([]);
    const [stats, setStats] = useState<Stats>({ totalClicks: 0, uniqueUsers: 0, authenticatedClicks: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/analytics/feature-interest?feature=history');
            const data = await response.json();

            if (data.success) {
                setClicks(data.clicks);
                setStats(data.stats);
            } else {
                setError(data.error || 'Failed to fetch analytics');
            }
        } catch (err) {
            setError('Failed to fetch analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="flex items-center text-slate-600 hover:text-slate-800 transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Link>
                            <h1 className="text-xl font-bold text-slate-800">📊 Feature Interest Analytics</h1>
                        </div>
                        <button
                            onClick={fetchAnalytics}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <MousePointer className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Clicks</p>
                                <p className="text-3xl font-bold text-slate-800">{stats.totalClicks}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Unique Users</p>
                                <p className="text-3xl font-bold text-slate-800">{stats.uniqueUsers}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Authenticated</p>
                                <p className="text-3xl font-bold text-slate-800">{stats.authenticatedClicks}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decision Guide */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-8">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">📋 Decision Framework</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <h3 className="font-semibold text-green-800 mb-2">✅ Build It</h3>
                            <ul className="text-sm text-green-700 space-y-1">
                                <li>• 10+ clicks in first week</li>
                                <li>• 50%+ authenticated users</li>
                                <li>• Multiple clicks per user</li>
                            </ul>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <h3 className="font-semibold text-yellow-800 mb-2">⏳ Wait</h3>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                <li>• 5-10 clicks</li>
                                <li>• Run for 2 more weeks</li>
                                <li>• Consider A/B testing</li>
                            </ul>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <h3 className="font-semibold text-red-800 mb-2">❌ Skip</h3>
                            <ul className="text-sm text-red-700 space-y-1">
                                <li>• Less than 5 clicks in 2 weeks</li>
                                <li>• Only anonymous clicks</li>
                                <li>• Focus on other features</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Clicks Table */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800">Click History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Feature</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {clicks.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            No clicks recorded yet. The History button will track user interest.
                                        </td>
                                    </tr>
                                ) : (
                                    clicks.map((click) => (
                                        <tr key={click.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {new Date(click.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {click.user_email ? (
                                                    <span className="text-green-600 font-medium">{click.user_email}</span>
                                                ) : (
                                                    <span className="text-slate-400">Anonymous</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    {click.feature}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {click.ip_address}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
