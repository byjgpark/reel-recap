import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isAdminEmail } from '@/lib/adminAuth';

interface FeedbackSubmission {
  rating: number;
  category: string;
  title?: string;
  message?: string;
  email?: string;
  usageLogId?: string;
}

interface FeedbackQuery {
  category?: string;
  status?: string;
  rating?: number;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

// Helper function to get user from session
async function getCurrentUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

// POST - Submit feedback
export async function POST(request: NextRequest) {
  try {
    const body: FeedbackSubmission = await request.json();
    const { rating, category, title, message, email, usageLogId } = body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    const validCategories = ['feature_request', 'bug_report', 'general_feedback', 'platform_request', 'ui_ux', 'performance'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Get user and IP
    const user = await getCurrentUser(request);
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Submit feedback using database function
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('submit_feedback', {
      p_user_id: user?.id || null,
      p_rating: rating,
      p_category: category,
      p_title: title || null,
      p_message: message || null,
      p_email: email || user?.email || null,
      p_user_agent: userAgent,
      p_ip_address: clientIP,
      p_usage_log_id: usageLogId || null
    });

    if (error) {
      console.error('Error submitting feedback:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    const result = data[0];
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      feedbackId: result.feedback_id,
      message: result.message
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve feedback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getCurrentUser(request);

    // Parse query parameters
    const query: FeedbackQuery = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      orderBy: searchParams.get('orderBy') || 'created_at',
      orderDirection: (searchParams.get('orderDirection') as 'ASC' | 'DESC') || 'DESC'
    };

    // For non-admin users, only show their own feedback
    const userIsAdmin = isAdminEmail(user?.email);
    const userId = userIsAdmin ? null : user?.id;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_feedback', {
      p_user_id: userId,
      p_category: query.category,
      p_status: query.status,
      p_rating: query.rating,
      p_limit: query.limit,
      p_offset: query.offset,
      p_order_by: query.orderBy,
      p_order_direction: query.orderDirection
    });

    if (error) {
      console.error('Error retrieving feedback:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: data,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        hasMore: data.length === query.limit
      }
    });

  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}