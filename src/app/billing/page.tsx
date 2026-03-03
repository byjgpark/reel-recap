'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Header } from '@/components/Header';
import { CreditCard, Calendar, Clock, Zap } from 'lucide-react';

function getRemainingTrialDays(trialEnd: string | null): number | null {
  if (!trialEnd) return null;
  const now = new Date();
  const end = new Date(trialEnd);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, isTrial, currentPeriodEnd, trialEnd, cancelAtPeriodEnd, loading } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </main>
      </div>
    );
  }

  if (!user) return null;

  const remainingDays = getRemainingTrialDays(trialEnd);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Billing & Subscription</h2>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Plan Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-slate-500" />
                  <h3 className="text-lg font-semibold text-slate-900">Current Plan</h3>
                </div>
                {isTrial ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                    Pro Trial
                  </span>
                ) : isPro ? (
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                      Pro
                    </span>
                    {cancelAtPeriodEnd && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                        Canceling
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                    Free
                  </span>
                )}
              </div>
            </div>

            {/* Plan Details */}
            <div className="p-6 space-y-4">
              {/* Daily Limit */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm">Daily requests</span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {isTrial ? '15' : isPro ? '50' : '2'} / day
                </span>
              </div>

              {/* Trial-specific: Days Remaining */}
              {isTrial && remainingDays !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Trial remaining</span>
                  </div>
                  <span className={`text-sm font-medium ${remainingDays <= 3 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {remainingDays} {remainingDays === 1 ? 'day' : 'days'} left
                  </span>
                </div>
              )}

              {/* Trial End Date */}
              {isTrial && trialEnd && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Trial ends</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {formatDate(trialEnd)}
                  </span>
                </div>
              )}

              {/* Pro Active: Next billing date */}
              {isPro && !isTrial && !cancelAtPeriodEnd && currentPeriodEnd && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Next billing date</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {formatDate(currentPeriodEnd)}
                  </span>
                </div>
              )}

              {/* Pro Canceling: Downgrade date */}
              {isPro && cancelAtPeriodEnd && currentPeriodEnd && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-amber-800">
                    Your Pro plan will be downgraded to Free on <span className="font-semibold">{formatDate(currentPeriodEnd)}</span>. You retain Pro access until then.
                  </p>
                </div>
              )}

              {/* Price */}
              {(isPro || isTrial) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm">Price</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {isTrial ? 'Free during trial, then $9.99/mo' : '$9.99/mo'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              {isTrial ? (
                <a
                  href="/api/portal/polar"
                  className="block w-full bg-purple-600 border border-transparent rounded-md py-2.5 text-sm font-semibold text-white text-center hover:bg-purple-700 transition-colors"
                >
                  Manage Billing
                </a>
              ) : isPro && !cancelAtPeriodEnd ? (
                <a
                  href="/api/portal/polar"
                  className="block w-full bg-slate-600 border border-transparent rounded-md py-2.5 text-sm font-semibold text-white text-center hover:bg-slate-700 transition-colors"
                >
                  Manage Billing
                </a>
              ) : isPro && cancelAtPeriodEnd ? (
                <a
                  href="/api/portal/polar"
                  className="block w-full bg-purple-600 border border-transparent rounded-md py-2.5 text-sm font-semibold text-white text-center hover:bg-purple-700 transition-colors"
                >
                  Resubscribe
                </a>
              ) : (
                <Link
                  href="/pricing"
                  className="block w-full bg-purple-600 border border-transparent rounded-md py-2.5 text-sm font-semibold text-white text-center hover:bg-purple-700 transition-colors"
                >
                  Upgrade to Pro
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
