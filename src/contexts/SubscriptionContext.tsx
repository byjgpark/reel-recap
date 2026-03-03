'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiHeaders } from '@/utils/auth';

interface SubscriptionContextType {
  isPro: boolean;
  isTrial: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState({
    isPro: false,
    isTrial: false,
    status: null as string | null,
    currentPeriodEnd: null as string | null,
    trialEnd: null as string | null,
    cancelAtPeriodEnd: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setState({
        isPro: false,
        isTrial: false,
        status: null,
        currentPeriodEnd: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
      });
      setLoading(false);
      return;
    }

    try {
      const headers = await getApiHeaders();
      const res = await fetch('/api/subscription/status', { headers });
      const data = await res.json();
      setState({
        isPro: data.isPro || false,
        isTrial: data.isTrial || false,
        status: data.status || null,
        currentPeriodEnd: data.currentPeriodEnd || null,
        trialEnd: data.trialEnd || null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      });
    } catch {
      // Fail closed - default to free tier
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription, user]);

  return (
    <SubscriptionContext.Provider value={{ ...state, loading, refresh: fetchSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
