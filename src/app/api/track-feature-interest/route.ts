import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feature } = body;

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature name is required' },
        { status: 400 }
      );
    }

    // Get user info if authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert click record
    const { error: insertError } = await supabaseAdmin
      .from('feature_interest_clicks')
      .insert({
        feature,
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_agent: userAgent,
        ip_address: ipAddress,
        timestamp: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting feature interest click:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to track click' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking feature interest:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
