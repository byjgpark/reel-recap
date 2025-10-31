'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, User, Users, RefreshCw } from 'lucide-react';
import { getApiHeaders } from '@/utils/auth';

// Add interface for window object with refreshUsageDisplay
interface WindowWithRefresh extends Window {
  refreshUsageDisplay?: () => void;
}

interface UsageInfo {
  remainingRequests: number;
  isAuthenticated: boolean;
  requiresAuth: boolean;
  message: string;
  totalRequests?: number;
  dailyLimit?: number;
}

interface UsageDisplayProps {
  usageInfo?: UsageInfo;
  className?: string;
  onUsageUpdate?: (usageInfo: UsageInfo) => void;
}

export function UsageDisplay({ usageInfo, className = '', onUsageUpdate }: UsageDisplayProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentUsageInfo, setCurrentUsageInfo] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [migrationNotification, setMigrationNotification] = useState<string | null>(null);

  // Fetch usage data from API
  const fetchUsageData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const headers = await getApiHeaders();
      const response = await fetch('/api/usage', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      
      if (data.success && data.usageInfo) {
        setCurrentUsageInfo(data.usageInfo);
        onUsageUpdate?.(data.usageInfo);
      } else {
        throw new Error(data.error || 'Failed to fetch usage data');
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
      
      // Fallback to default usage info based on auth state
      const fallbackUsageInfo: UsageInfo = {
        remainingRequests: user ? 20 : 10,
        isAuthenticated: !!user,
        requiresAuth: false,
        message: user ? '20 requests remaining today' : '10 free requests remaining'
      };
      setCurrentUsageInfo(fallbackUsageInfo);
    } finally {
      setIsLoading(false);
    }
  }, [user, onUsageUpdate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // If usageInfo is provided as prop, use it
      if (usageInfo) {
        setCurrentUsageInfo(usageInfo);
        setIsLoading(false);
      } else {
        // Otherwise fetch from API
        fetchUsageData();
      }
    }
  }, [mounted, usageInfo, fetchUsageData]);

  // Refresh usage data (can be called externally)
  const refreshUsageData = useCallback(() => {
    if (!usageInfo) {
      fetchUsageData();
    }
  }, [usageInfo, fetchUsageData]);

  // Expose refresh function globally for other components
  useEffect(() => {
    const windowWithRefresh = window as WindowWithRefresh;
    windowWithRefresh.refreshUsageDisplay = refreshUsageData;
    return () => {
      delete windowWithRefresh.refreshUsageDisplay;
    };
  }, [refreshUsageData]);

  // Listen for migration events
  useEffect(() => {
    const handleMigrationEvent = (event: CustomEvent) => {
      const { migratedRequests } = event.detail;
      if (migratedRequests > 0) {
        // setMigrationNotification(`✅ Successfully migrated ${migratedRequests} requests to your account!`);
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setMigrationNotification(null);
        }, 5000);
        
        // Refresh usage data to show updated counts
        refreshUsageData();
      }
    };

    window.addEventListener('usage-migrated', handleMigrationEvent as EventListener);
    
    return () => {
      window.removeEventListener('usage-migrated', handleMigrationEvent as EventListener);
    };
  }, [refreshUsageData]);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`bg-slate-50 border-2 border-slate-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="h-5 w-5 text-slate-400 animate-spin mr-2" />
          <span className="text-slate-600">Loading usage data...</span>
        </div>
      </div>
    );
  }

  if (!currentUsageInfo) {
    return null;
  }
  
  const { remainingRequests, isAuthenticated, requiresAuth, message } = currentUsageInfo;

  // Determine the color scheme based on remaining requests
  const getColorScheme = () => {
    if (requiresAuth) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        icon: 'text-amber-600'
      };
    }
    
    if (remainingRequests === 0) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600'
      };
    }
    
    if (remainingRequests <= 2 && !isAuthenticated) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        icon: 'text-orange-600'
      };
    }
    
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600'
    };
  };

  const colors = getColorScheme();
  const Icon = isAuthenticated ? User : Users;

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}>
      {/* Migration notification */}
      {migrationNotification && (
        <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800 text-sm font-medium">
            {migrationNotification}
          </p>
        </div>
      )}
      
      <div className="flex items-center space-x-3">
        <div className={`${colors.icon} flex-shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`${colors.text} text-sm font-medium`}>
                {isAuthenticated ? 'Authenticated User' : 'Anonymous User'}
              </span>
              {!isAuthenticated && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Free Tier
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Activity className={`h-4 w-4 ${colors.icon}`} />
              <span className={`${colors.text} text-sm font-semibold`}>
                {remainingRequests}
              </span>
            </div>
          </div>
          
          <p className={`${colors.text} text-sm mt-1`}>
            {message}
          </p>
          
          {requiresAuth && (
            <div className="mt-2">
              <p className="text-xs text-amber-700">
                💡 Sign in with Google for more requests!
              </p>
            </div>
          )}
          
          {!isAuthenticated && remainingRequests <= 2 && remainingRequests > 0 && (
            <div className="mt-2">
              <p className="text-xs text-orange-700">
                ⚠️ Running low on free requests.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Usage Progress</span>
          <span>
            {(() => {
              const dailyLimit = currentUsageInfo.dailyLimit || (isAuthenticated ? 20 : 5);
              const totalRequests = currentUsageInfo.totalRequests || (dailyLimit - remainingRequests);
              return `${totalRequests}/${dailyLimit} used`;
            })()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              remainingRequests === 0 
                ? 'bg-red-500' 
                : remainingRequests <= 2 && !isAuthenticated
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`}
            style={{
              width: `${(() => {
                const dailyLimit = currentUsageInfo.dailyLimit || (isAuthenticated ? 20 : 5);
                const totalRequests = currentUsageInfo.totalRequests || (dailyLimit - remainingRequests);
                return (totalRequests / dailyLimit) * 100;
              })()}%`
            }}
          />
        </div>
      </div>
      
      {/* Reset timer for authenticated users */}
      {isAuthenticated && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Resets daily at midnight UTC</span>
        </div>
      )}
    </div>
  );
}