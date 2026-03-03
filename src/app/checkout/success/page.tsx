'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { getApiHeaders } from '@/utils/auth';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');
  const { isAuthenticated } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !checkoutId) {
      setChecking(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 15;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const headers = await getApiHeaders();
        const res = await fetch('/api/subscription/status', { headers });
        const data = await res.json();
        if (data.isPro) {
          setConfirmed(true);
          setChecking(false);
          clearInterval(interval);
        }
      } catch {
        // ignore, keep polling
      }
      if (attempts >= maxAttempts) {
        setChecking(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkoutId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {checking ? (
            <>
              <Loader2 className="w-16 h-16 text-purple-500 mx-auto animate-spin" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Activating your Pro plan...
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Please wait while we confirm your subscription.
              </p>
            </>
          ) : confirmed ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Welcome to Pro!
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Your subscription is now active. Enjoy 50 requests per day, bulk extraction, and unlimited history.
              </p>
              <Link
                href="/"
                className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Start Using Pro
              </Link>
            </>
          ) : (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Payment received!
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Your Pro plan will be activated shortly. You can start using it right away.
              </p>
              <Link
                href="/"
                className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Go to Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
