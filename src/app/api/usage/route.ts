import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserUsageStats, getUsageStatsForDisplay } from '@/lib/usageTracking';

// Import the same constants used in usageTracking
const ANONYMOUS_LIMIT = 10;
const AUTHENTICATED_DAILY_LIMIT = 20;

interface UsageStatsResponse {
  success: boolean;
  usageInfo?: {
    remainingRequests: number;
    isAuthenticated: boolean;
    requiresAuth: boolean;
    message: string;
    totalRequests?: number;
    dailyLimit?: number;
  };
  error?: string;
}

// Helper function to get user from session
async function getCurrentUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<UsageStatsResponse>> {
  try {
    // Extract client IP for anonymous user tracking
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown';
    
    // Get current user from session
    const user = await getCurrentUser(request);
    const userId = user?.id || null;
    
    // Get usage statistics for display purposes
    const usageCheck = await getUsageStatsForDisplay(userId, clientIP);
    
    // Calculate additional stats for authenticated users
    let totalRequests = 0;
    const isAuthenticated = !!userId;
    const dailyLimit = isAuthenticated ? AUTHENTICATED_DAILY_LIMIT : ANONYMOUS_LIMIT;
    
    if (isAuthenticated && userId) {
      // Get detailed stats for authenticated users
      const userStats = await getUserUsageStats(userId);
      totalRequests = userStats.totalUsage;
    } else {
      // For anonymous users, calculate from remaining requests
      totalRequests = dailyLimit - usageCheck.remainingRequests;
    }
    
    return NextResponse.json({
      success: true,
      usageInfo: {
        remainingRequests: usageCheck.remainingRequests,
        isAuthenticated: usageCheck.isAuthenticated,
        requiresAuth: usageCheck.requiresAuth,
        message: usageCheck.message,
        totalRequests,
        dailyLimit
      }
    });
    
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch usage statistics' 
      },
      { status: 500 }
    );
  }
}