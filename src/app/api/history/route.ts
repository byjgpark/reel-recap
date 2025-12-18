import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'History item not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        history: data
      });
    }

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const query = searchParams.get('q');

    let dbQuery = supabase
      .from('user_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,video_url.ilike.%${query}%`);
    }

    const { data, count, error } = await dbQuery;

    if (error) {
      console.error('Error fetching history:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history: data,
      total: count
    });
  } catch (error) {
    console.error('Error in history API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const payload = await request.json();
    const {
      video_url,
      transcript,
      summary,
      title,
      thumbnail_url,
      language
    } = payload;
    if (!video_url || !transcript) {
      return NextResponse.json(
        { success: false, error: 'video_url and transcript are required' },
        { status: 400 }
      );
    }
    const { data: existing } = await supabase
      .from('user_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_url', video_url)
      .single();
      
    if (existing) {
      const { error } = await supabase
        .from('user_history')
        .update({
          transcript,
          summary: summary ?? null,
          title: title ?? null,
          thumbnail_url: thumbnail_url ?? null,
          language: language ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to update history' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, id: existing.id });
    } else {
      const { data, error } = await supabase
        .from('user_history')
        .insert({
          user_id: user.id,
          video_url,
          transcript,
          summary: summary ?? null,
          title: title ?? null,
          thumbnail_url: thumbnail_url ?? null,
          language: language ?? null
        })
        .select('id')
        .single();
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to save history' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, id: data.id });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'History ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user owns the record

    if (error) {
      console.error('Error deleting history:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete history item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in history API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
