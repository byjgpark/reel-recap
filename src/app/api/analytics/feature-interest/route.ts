import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

interface ClickData {
  id: string;
  feature: string;
  user_id: string;
  user_email: string | null;
  timestamp: string;
  user_agent: string;
  ip_address: string;
}

interface AdminUser {
  id: string;
  email?: string | null;
}

// Helper function to check if user is admin
function isAdmin(user: AdminUser | null): boolean {
  const email = user?.email ?? null;
  return email === 'byjpark21@gmail.com';
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !isAdmin(user)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized - Admin access required',
          clicks: [],
          stats: {
            totalClicks: 0,
            uniqueUsers: 0,
            authenticatedClicks: 0,
          }
        },
        { status: 403 }
      );
    }

    // Get feature filter from query params
    const { searchParams } = new URL(request.url);
    const featureFilter = searchParams.get('feature');

    // Build query
    let query = supabaseAdmin
      .from('feature_interest_clicks')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (featureFilter) {
      query = query.eq('feature', featureFilter);
    }

    const { data: clicks, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    const clicksData = (clicks || []) as ClickData[];

    const totalClicks = clicksData.length;
    const identityKeys = clicksData
      .map((click: ClickData) => click.user_id ?? click.ip_address)
      .filter(Boolean) as string[];
    const uniqueUsers = new Set(identityKeys).size;
    const authenticatedClicks = clicksData.filter((click: ClickData) => click.user_email).length;

    const countsByIdentity: Record<string, number> = {};
    for (const key of identityKeys) {
      countsByIdentity[key] = (countsByIdentity[key] ?? 0) + 1;
    }
    const repeatUsers = Object.values(countsByIdentity).filter(c => c >= 2).length;
    const avgClicksPerUser = uniqueUsers > 0 ? Number((totalClicks / uniqueUsers).toFixed(2)) : 0;

    const stats = {
      totalClicks,
      uniqueUsers,
      authenticatedClicks,
      repeatUsers,
      avgClicksPerUser,
    };

    return NextResponse.json({
      success: true,
      clicks: clicksData,
      stats,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics',
        clicks: [],
        stats: {
          totalClicks: 0,
          uniqueUsers: 0,
          authenticatedClicks: 0,
        }
      },
      { status: 500 }
    );
  }
}
