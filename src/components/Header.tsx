'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { HistoryButton } from '@/components/HistoryButton';
import { AuthButton } from '@/components/AuthButton';
import { Menu, X, CreditCard } from 'lucide-react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isPro, isTrial } = useSubscription();

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RR</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Reel Recap
                </h1>
                <p className="text-xs text-slate-600 hidden sm:block">
                  Video Transcript Extractor
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {(isPro || isTrial) && (
              <Link
                href="/billing"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-purple-300 hover:scale-105 transition-all duration-200"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Manage Billing
              </Link>
            )}
            <div className="flex items-center space-x-3 ml-2">
              <HistoryButton />
              <AuthButton />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <HistoryButton />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3">
            <Link
              href="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {(isPro || isTrial) && (
              <Link
                href="/billing"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium hover:shadow-md transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <CreditCard className="h-4 w-4" />
                Manage Billing
              </Link>
            )}
            <div className="px-3 py-2">
              <AuthButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}