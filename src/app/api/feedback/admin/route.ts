import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface StatusUpdate {
  feedbackId: string;
  status: string;
  adminNotes?: string;
}

// Helper function to get user from session
async function getCurrentUser(request: NextRequest): Promise<AdminUser | null> {
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
    
    return { id: user.id, email: user.email } as AdminUser;
  } catch {
    return null;
  }
}

// Helper function to check if user is admin
function isAdmin(user: AdminUser | null): boolean {
  const email = user?.email ?? null;
  return email === 'admin@reelrecap.com' || email === 'jungipark@example.com';
}

// PUT - Update feedback status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body: StatusUpdate = await request.json();
    const { feedbackId, status, adminNotes } = body;

    // Validation
    if (!feedbackId) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update feedback status
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('update_feedback_status', {
      p_feedback_id: feedbackId,
      p_status: status,
      p_admin_notes: adminNotes || null,
      p_admin_user_id: user.id
    });

    if (error) {
      console.error('Error updating feedback status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update feedback status' },
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
      message: result.message
    });

  } catch (error) {
    console.error('Feedback status update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get feedback statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_feedback_stats');

    if (error) {
      console.error('Error retrieving feedback stats:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve feedback statistics' },
        { status: 500 }
      );
    }

    const stats = data[0];
    return NextResponse.json({
      success: true,
      stats: {
        totalFeedback: stats.total_feedback,
        averageRating: stats.avg_rating,
        feedbackByCategory: stats.feedback_by_category,
        feedbackByStatus: stats.feedback_by_status,
        recentFeedbackCount: stats.recent_feedback_count
      }
    });

  } catch (error) {
    console.error('Feedback stats retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
interface AdminUser {
  id: string;
  email?: string | null;
}