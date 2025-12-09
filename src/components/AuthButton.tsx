'use client';

import { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AuthButton() {
  const { user, signIn, signOut, loading, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setIsDropdownOpen(false);
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Loading...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const userName = user.user_metadata?.name || user.email;
    const displayName = userName.length > 15 ? `${userName.substring(0, 15)}...` : userName;

    return (
      <div className="relative" ref={dropdownRef}>
        {/* User button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          <User className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300 truncate max-w-[100px] sm:max-w-none">
            {displayName}
          </span>
          <ChevronDown className={`w-3 h-3 text-green-600 dark:text-green-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {user.user_metadata?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
    >
      <LogIn className="w-4 h-4 flex-shrink-0" />
      <span className="text-xs sm:text-sm font-medium">
        <span className="hidden sm:inline">{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
        <span className="sm:hidden">{isLoading ? 'Signing in...' : 'Sign in'}</span>
      </span>
    </button>
  );
}