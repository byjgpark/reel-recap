'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    // Placeholder for Paddle integration
    // TODO: Implement Paddle Checkout here
    alert('Payment integration coming soon!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8 flex-grow">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-xl text-slate-600">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-7xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
            {/* Anonymous Plan */}
            <div className="border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-200 bg-white flex flex-col">
              <div className="p-6 flex-1">
                <h2 className="text-lg leading-6 font-medium text-slate-900">Anonymous</h2>
                <p className="mt-4 text-sm text-slate-500">No login required</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-slate-900">Free</span>
                </p>
                <Link
                  href="/"
                  className="mt-8 block w-full bg-slate-100 border border-transparent rounded-md py-2 text-sm font-semibold text-slate-900 text-center hover:bg-slate-200"
                >
                  Try Now
                </Link>
              </div>
              <div className="pt-6 pb-8 px-6 bg-slate-50 rounded-b-lg">
                <h3 className="text-xs font-medium text-slate-900 tracking-wide uppercase">What's included</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex space-x-3">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-slate-500">1 request per day</span>
                  </li>
                  <li className="flex space-x-3">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-slate-500">Basic transcripts</span>
                  </li>
                  <li className="flex space-x-3 text-slate-400">
                    <X className="flex-shrink-0 h-5 w-5" />
                    <span className="text-sm">No history</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Free (Auth) Plan */}
            <div className="border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-200 bg-white flex flex-col">
              <div className="p-6 flex-1">
                <h2 className="text-lg leading-6 font-medium text-slate-900">Registered</h2>
                <p className="mt-4 text-sm text-slate-500">For casual users</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-base font-medium text-slate-500">/mo</span>
                </p>
                <Link
                  href="/login"
                  className="mt-8 block w-full bg-slate-800 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-slate-900"
                >
                  Sign Up Free
                </Link>
              </div>
              <div className="pt-6 pb-8 px-6 bg-slate-50 rounded-b-lg">
                <h3 className="text-xs font-medium text-slate-900 tracking-wide uppercase">What's included</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex space-x-3">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-slate-500">2 requests per day</span>
                  </li>
                  <li className="flex space-x-3">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-slate-500">View last 3 history records</span>
                  </li>
                  <li className="flex space-x-3 text-slate-400">
                    <X className="flex-shrink-0 h-5 w-5" />
                    <span className="text-sm">Bulk extraction</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="border border-purple-200 rounded-lg shadow-sm divide-y divide-slate-200 bg-white ring-2 ring-purple-500 flex flex-col relative">
              <div className="absolute top-0 right-0 -mr-1 -mt-1 w-32 rounded-bl-lg rounded-tr-lg bg-purple-600 px-3 py-1 text-xs font-medium text-white text-center">
                Recommended
              </div>
              <div className="p-6 flex-1">
                <h2 className="text-lg leading-6 font-medium text-slate-900">Pro</h2>
                <p className="mt-4 text-sm text-slate-500">For power users</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-slate-900">$9.99</span>
                  <span className="text-base font-medium text-slate-500">/mo</span>
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="mt-8 block w-full bg-purple-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Loading...' : 'Subscribe to Pro'}
                </button>
              </div>
              <div className="pt-6 pb-8 px-6 bg-purple-50/50 rounded-b-lg">
                <h3 className="text-xs font-medium text-slate-900 tracking-wide uppercase">What's included</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex space-x-3">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-slate-700 font-medium">50 requests per day</span>
                  </li>
                  <li className="flex space-x-3">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-slate-700 font-medium">Bulk video extraction</span>
                  </li>
                  <li className="flex space-x-3">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-slate-700 font-medium">Unlimited history access</span>
                  </li>
                  <li className="flex space-x-3">
                    <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="text-sm text-slate-500">Priority support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}