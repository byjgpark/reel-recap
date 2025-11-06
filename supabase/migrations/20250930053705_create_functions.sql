-- Helper function to safely cast IP address to inet type
CREATE OR REPLACE FUNCTION public.safe_ip_cast(ip_text text)
RETURNS INET AS $$
BEGIN
  -- Try to cast the IP address to inet
  BEGIN
    RETURN ip_text::inet;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails (e.g., 'unknown'), return localhost
    RETURN '0.0.0.0'::inet;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_usage (user_id)
  
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit feedback
CREATE OR REPLACE FUNCTION submit_feedback(
  p_user_id UUID,
  p_usage_log_id UUID,
  p_rating INTEGER,
  p_category TEXT,
  p_title TEXT,
  p_message TEXT,
  p_email TEXT,
  p_user_agent TEXT,
  p_ip_address TEXT
)
RETURNS TABLE(success BOOLEAN, feedback_id UUID, message TEXT) AS $$
DECLARE
  v_feedback_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Rating must be between 1 and 5';
    RETURN;
  END IF;
  
  -- Validate category
  IF p_category NOT IN ('feature_request', 'bug_report', 'general_feedback', 'platform_request', 'ui_ux', 'performance') THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid feedback category';
    RETURN;
  END IF;
  
  -- Insert feedback
  INSERT INTO public.feedback (
    user_id, usage_log_id, rating, category, title, message, email, user_agent, ip_address, created_at, updated_at
  ) VALUES (
    p_user_id, p_usage_log_id, p_rating, p_category, p_title, p_message, p_email, p_user_agent, public.safe_ip_cast(p_ip_address), v_now, v_now
  ) RETURNING id INTO v_feedback_id;
  
  RETURN QUERY SELECT TRUE, v_feedback_id, 'Feedback submitted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feedback with filtering and pagination
CREATE OR REPLACE FUNCTION get_feedback(
  p_user_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_rating INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_order_by TEXT DEFAULT 'created_at',
  p_order_direction TEXT DEFAULT 'DESC'
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  rating INTEGER,
  category TEXT,
  title TEXT,
  message TEXT,
  email TEXT,
  status TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT
) AS $$
DECLARE
  v_query TEXT;
BEGIN
  -- Build dynamic query with filters
  v_query := 'SELECT f.id, f.user_id, f.rating, f.category, f.title, f.message, f.email, f.status, f.admin_notes, f.created_at, f.updated_at, u.name as user_name
              FROM public.feedback f
              LEFT JOIN public.users u ON f.user_id = u.id
              WHERE 1=1';
  
  -- Add filters
  IF p_user_id IS NOT NULL THEN
    v_query := v_query || ' AND f.user_id = $1';
  END IF;
  
  IF p_category IS NOT NULL THEN
    v_query := v_query || ' AND f.category = ' || quote_literal(p_category);
  END IF;
  
  IF p_status IS NOT NULL THEN
    v_query := v_query || ' AND f.status = ' || quote_literal(p_status);
  END IF;
  
  IF p_rating IS NOT NULL THEN
    v_query := v_query || ' AND f.rating = ' || p_rating;
  END IF;
  
  -- Add ordering
  v_query := v_query || ' ORDER BY f.' || p_order_by || ' ' || p_order_direction;
  
  -- Add pagination
  v_query := v_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  
  -- Execute query
  IF p_user_id IS NOT NULL THEN
    RETURN QUERY EXECUTE v_query USING p_user_id;
  ELSE
    RETURN QUERY EXECUTE v_query;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update feedback status (admin only)
CREATE OR REPLACE FUNCTION update_feedback_status(
  p_feedback_id UUID,
  p_status TEXT,
  p_admin_notes TEXT,
  p_admin_user_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Validate status
  IF p_status NOT IN ('open', 'in_progress', 'resolved', 'closed') THEN
    RETURN QUERY SELECT FALSE, 'Invalid status';
    RETURN;
  END IF;
  
  -- Update feedback
  UPDATE public.feedback
  SET status = p_status,
      admin_notes = p_admin_notes,
      admin_user_id = p_admin_user_id,
      resolved_at = CASE WHEN p_status IN ('resolved', 'closed') THEN v_now ELSE NULL END,
      updated_at = v_now
  WHERE id = p_feedback_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, 'Feedback status updated successfully';
  ELSE
    RETURN QUERY SELECT FALSE, 'Feedback not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS TABLE(
  total_feedback INTEGER,
  avg_rating NUMERIC,
  feedback_by_category JSON,
  feedback_by_status JSON,
  recent_feedback_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.feedback) as total_feedback,
    (SELECT ROUND(AVG(rating), 2) FROM public.feedback) as avg_rating,
    (SELECT json_object_agg(category, count) FROM (
      SELECT category, COUNT(*) as count 
      FROM public.feedback 
      GROUP BY category
    ) t) as feedback_by_category,
    (SELECT json_object_agg(status, count) FROM (
      SELECT status, COUNT(*) as count 
      FROM public.feedback 
      GROUP BY status
    ) t) as feedback_by_status,
    (SELECT COUNT(*)::INTEGER FROM public.feedback WHERE created_at > NOW() - INTERVAL '7 days') as recent_feedback_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Function to check anonymous usage limits without incrementing
CREATE OR REPLACE FUNCTION check_anonymous_usage_limit(
  p_ip_address TEXT,
  p_anonymous_limit INTEGER DEFAULT 10,
  p_reset_interval_hours INTEGER DEFAULT 24
)
RETURNS TABLE(allowed BOOLEAN, remaining_requests INTEGER, message TEXT) AS $$
DECLARE
  v_usage_record anonymous_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Get anonymous usage record
  SELECT * INTO v_usage_record
  FROM anonymous_usage
  WHERE ip_address = public.safe_ip_cast(p_ip_address);
  
  -- If no record exists, user has full limit available
  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, p_anonymous_limit, p_anonymous_limit || ' free requests available';
    RETURN;
  END IF;
  
  -- Check if reset is needed (24 hours passed)
  v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_request)) / 3600;
  
  IF v_hours_since_last >= p_reset_interval_hours THEN
    -- Reset would happen, so user has full limit
    RETURN QUERY SELECT TRUE, p_anonymous_limit, p_anonymous_limit || ' free requests available (reset)';
    RETURN;
  END IF;
  
  -- Calculate remaining requests
  v_remaining := p_anonymous_limit - v_usage_record.request_count;
  
  -- Check if user has exceeded limit
  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Free limit reached. Please sign in for more requests!';
    RETURN;
  END IF;
  
  -- Return available requests
  RETURN QUERY SELECT TRUE, v_remaining, v_remaining || ' free requests available';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment anonymous usage count after successful API call
CREATE OR REPLACE FUNCTION increment_anonymous_usage(
  p_ip_address TEXT,
  p_action TEXT,
  p_video_url TEXT,
  p_anonymous_limit INTEGER DEFAULT 10,
  p_reset_interval_hours INTEGER DEFAULT 24
)
RETURNS TABLE(success BOOLEAN, remaining_requests INTEGER, message TEXT, usage_log_id UUID) AS $$
DECLARE
  v_usage_record anonymous_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  -- Get or create anonymous usage record with row-level locking
  SELECT * INTO v_usage_record
  FROM anonymous_usage
  WHERE ip_address = public.safe_ip_cast(p_ip_address)
  FOR UPDATE;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO anonymous_usage (ip_address, request_count, last_request, created_at)
    VALUES (public.safe_ip_cast(p_ip_address), 1, v_now, v_now)
    RETURNING * INTO v_usage_record;
    
    v_remaining := p_anonymous_limit - 1;
  ELSE
    -- Check if reset is needed (24 hours passed)
    v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_request)) / 3600;
    
    IF v_hours_since_last >= p_reset_interval_hours THEN
      -- Reset counter and increment
      UPDATE anonymous_usage
      SET request_count = 1,
          last_request = v_now
      WHERE ip_address = public.safe_ip_cast(p_ip_address);
      
      v_remaining := p_anonymous_limit - 1;
    ELSE
      -- Increment the counter
      UPDATE anonymous_usage
      SET request_count = request_count + 1,
          last_request = v_now
      WHERE ip_address = public.safe_ip_cast(p_ip_address);
      
      v_remaining := p_anonymous_limit - (v_usage_record.request_count + 1);
    END IF;
  END IF;
  
  -- Log the successful usage
  INSERT INTO usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (NULL, public.safe_ip_cast(p_ip_address), p_action, p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;
  
  -- Return success with updated remaining count
  RETURN QUERY SELECT TRUE, v_remaining,
    CASE 
      WHEN v_remaining = 0 THEN 'Request processed. Free limit reached - sign in for more!'
      ELSE v_remaining || ' free requests remaining'
    END,
    v_usage_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check authenticated user usage limits without incrementing
CREATE OR REPLACE FUNCTION check_authenticated_usage_limit(
  p_user_id UUID,
  p_daily_limit INTEGER DEFAULT 20,
  p_reset_interval_hours INTEGER DEFAULT 24
)
RETURNS TABLE(allowed BOOLEAN, remaining_requests INTEGER, message TEXT) AS $$
DECLARE
  v_usage_record user_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Get user usage record
  SELECT * INTO v_usage_record
  FROM user_usage
  WHERE user_id = p_user_id;
  
  -- If no record exists, user has full limit available
  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, p_daily_limit, p_daily_limit || ' requests available today';
    RETURN;
  END IF;
  
  -- Check if reset is needed (24 hours passed)
  v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_reset)) / 3600;
  
  IF v_hours_since_last >= p_reset_interval_hours THEN
    -- Reset would happen, so user has full limit
    RETURN QUERY SELECT TRUE, p_daily_limit, p_daily_limit || ' requests available today (reset)';
    RETURN;
  END IF;
  
  -- Calculate remaining requests (transcript_count + summary_count)
  v_remaining := p_daily_limit - (COALESCE(v_usage_record.transcript_count, 0) + COALESCE(v_usage_record.summary_count, 0));
  
  -- Check if user has exceeded limit
  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily limit reached. Please try again tomorrow!';
    RETURN;
  END IF;
  
  -- Return available requests
  RETURN QUERY SELECT TRUE, v_remaining, v_remaining || ' requests remaining today';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment authenticated user usage count after successful API call
CREATE OR REPLACE FUNCTION increment_authenticated_usage(
  p_user_id UUID,
  p_action TEXT,
  p_video_url TEXT,
  p_ip_address TEXT,
  p_daily_limit INTEGER DEFAULT 20,
  p_reset_interval_hours INTEGER DEFAULT 24
)
RETURNS TABLE(success BOOLEAN, remaining_requests INTEGER, message TEXT, usage_log_id UUID) AS $$
DECLARE
  v_usage_record user_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  -- Get or create user usage record with row-level locking
  SELECT * INTO v_usage_record
  FROM user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    IF p_action = 'transcript' THEN
      INSERT INTO user_usage (user_id, transcript_count, summary_count, last_reset, created_at)
      VALUES (p_user_id, 1, 0, v_now, v_now)
      RETURNING * INTO v_usage_record;
    ELSE
      INSERT INTO user_usage (user_id, transcript_count, summary_count, last_reset, created_at)
      VALUES (p_user_id, 0, 1, v_now, v_now)
      RETURNING * INTO v_usage_record;
    END IF;
    
    v_remaining := p_daily_limit - 1;
  ELSE
    -- Check if reset is needed (24 hours passed)
    v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_reset)) / 3600;
    
    IF v_hours_since_last >= p_reset_interval_hours THEN
      -- Reset counters to 0 first, then increment the appropriate counter
      IF p_action = 'transcript' THEN
        UPDATE user_usage
        SET transcript_count = 1,
            summary_count = 0,
            last_reset = v_now,
            updated_at = v_now
        WHERE user_id = p_user_id;
      ELSE
        UPDATE user_usage
        SET transcript_count = 0,
            summary_count = 1,
            last_reset = v_now,
            updated_at = v_now
        WHERE user_id = p_user_id;
      END IF;
      
      v_remaining := p_daily_limit - 1;
    ELSE
      -- Increment the appropriate counter
      IF p_action = 'transcript' THEN
        UPDATE user_usage
        SET transcript_count = transcript_count + 1,
            updated_at = v_now
        WHERE user_id = p_user_id;
      ELSE
        UPDATE user_usage
        SET summary_count = summary_count + 1,
            updated_at = v_now
        WHERE user_id = p_user_id;
      END IF;
      
      v_remaining := p_daily_limit - (COALESCE(v_usage_record.transcript_count, 0) + COALESCE(v_usage_record.summary_count, 0) + 1);
    END IF;
  END IF;
  
  -- Log the successful usage
  INSERT INTO usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (p_user_id, public.safe_ip_cast(p_ip_address), p_action, p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;
  
  -- Return success with updated remaining count
  RETURN QUERY SELECT TRUE, v_remaining,
    CASE 
      WHEN v_remaining = 0 THEN 'Request processed. Daily limit reached!'
      ELSE v_remaining || ' requests remaining today'
    END,
    v_usage_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to atomically process CAPTCHA-verified anonymous user requests
-- This allows one additional request after successful CAPTCHA verification
CREATE OR REPLACE FUNCTION process_captcha_verified_request(
  p_ip_address TEXT,
  p_action TEXT,
  p_video_url TEXT,
  p_reset_interval_hours INTEGER
) RETURNS TABLE(
  success BOOLEAN,
  remaining_requests INTEGER,
  message TEXT,
  usage_log_id UUID
) AS $$
DECLARE
  v_usage_record anonymous_usage%ROWTYPE;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  -- Get or create anonymous usage record with row-level locking
  SELECT * INTO v_usage_record
  FROM anonymous_usage
  WHERE ip_address = public.safe_ip_cast(p_ip_address)
  FOR UPDATE;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO anonymous_usage (ip_address, request_count, last_request, created_at)
    VALUES (public.safe_ip_cast(p_ip_address), 0, v_now, v_now)
    RETURNING * INTO v_usage_record;
  END IF;
  
  -- Check if reset is needed (24 hours passed)
  v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_request)) / 3600;
  
  IF v_hours_since_last >= p_reset_interval_hours THEN
    -- Reset counter
    UPDATE anonymous_usage
    SET request_count = 0,
        last_request = v_now
    WHERE ip_address = public.safe_ip_cast(p_ip_address);
    
    v_usage_record.request_count := 0;
  END IF;
  
  -- For CAPTCHA-verified requests, we allow one additional request beyond the normal limit
  -- Increment the counter
  UPDATE anonymous_usage
  SET request_count = request_count + 1,
      last_request = v_now
  WHERE ip_address = public.safe_ip_cast(p_ip_address);
  
  -- Log the usage with CAPTCHA verification note
  INSERT INTO usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (NULL, public.safe_ip_cast(p_ip_address), p_action || '_captcha_verified', p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;
  
  -- Return success - CAPTCHA verification allows the request
  RETURN QUERY SELECT TRUE, 0, 'Request processed with CAPTCHA verification. Sign in for more requests!', v_usage_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to atomically process authenticated user requests
CREATE OR REPLACE FUNCTION process_authenticated_request(
  p_user_id UUID,
  p_action TEXT,
  p_video_url TEXT,
  p_ip_address TEXT,
  p_daily_limit INTEGER,
  p_reset_interval_hours INTEGER
) RETURNS TABLE(
  success BOOLEAN,
  remaining_requests INTEGER,
  message TEXT,
  usage_log_id UUID
) AS $$
DECLARE
  v_usage_record user_usage%ROWTYPE;
  v_total_usage INTEGER;
  v_remaining INTEGER;
  v_hours_since_reset NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  -- Get or create user usage record with row-level locking
  SELECT * INTO v_usage_record
  FROM user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_usage (user_id, transcript_count, summary_count, last_reset, created_at, updated_at)
    VALUES (p_user_id, 0, 0, v_now, v_now, v_now)
    RETURNING * INTO v_usage_record;
  END IF;
  
  -- Check if reset is needed (24 hours passed)
  v_hours_since_reset := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_reset)) / 3600;
  
  IF v_hours_since_reset >= p_reset_interval_hours THEN
    -- Reset counters
    UPDATE user_usage
    SET transcript_count = 0,
        summary_count = 0,
        last_reset = v_now,
        updated_at = v_now
    WHERE user_id = p_user_id;
    
    v_usage_record.transcript_count := 0;
    v_usage_record.summary_count := 0;
  END IF;
  
  -- Calculate current usage
  v_total_usage := v_usage_record.transcript_count + v_usage_record.summary_count;
  v_remaining := p_daily_limit - v_total_usage;
  
  -- Check if user has exceeded limit
  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily limit reached. Please try again tomorrow!';
    RETURN;
  END IF;
  
  -- Increment the appropriate counter
  IF p_action = 'transcript' THEN
    UPDATE user_usage
    SET transcript_count = transcript_count + 1,
        updated_at = v_now
    WHERE user_id = p_user_id;
  ELSIF p_action = 'summary' THEN
    UPDATE user_usage
    SET summary_count = summary_count + 1,
        updated_at = v_now
    WHERE user_id = p_user_id;
  END IF;
  
  
  -- Log the usage
  INSERT INTO usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (p_user_id, public.safe_ip_cast(p_ip_address), p_action, p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;
  
  -- Return success with updated remaining count
  v_remaining := v_remaining - 1;
  RETURN QUERY SELECT TRUE, v_remaining, 
    CASE 
      WHEN v_remaining = 0 THEN 'Request processed. Daily limit reached.'
      ELSE v_remaining || ' requests remaining today'
    END,
    v_usage_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Function to atomically process anonymous user requests
CREATE OR REPLACE FUNCTION process_anonymous_request(
  p_ip_address TEXT,
  p_action TEXT,
  p_video_url TEXT,
  p_anonymous_limit INTEGER,
  p_reset_interval_hours INTEGER
) RETURNS TABLE(
  success BOOLEAN,
  remaining_requests INTEGER,
  message TEXT,
  usage_log_id UUID
) AS $$
DECLARE
  v_usage_record anonymous_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  -- Get or create anonymous usage record with row-level locking
  SELECT * INTO v_usage_record
  FROM anonymous_usage
  WHERE ip_address = public.safe_ip_cast(p_ip_address)
  FOR UPDATE;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO anonymous_usage (ip_address, request_count, last_request, created_at)
    VALUES (public.safe_ip_cast(p_ip_address), 0, v_now, v_now)
    RETURNING * INTO v_usage_record;
  END IF;
  
  -- Check if reset is needed (24 hours passed)
  v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_request)) / 3600;
  
  IF v_hours_since_last >= p_reset_interval_hours THEN
    -- Reset counter
    UPDATE anonymous_usage
    SET request_count = 0,
        last_request = v_now
    WHERE ip_address = public.safe_ip_cast(p_ip_address);
    
    v_usage_record.request_count := 0;
  END IF;
  
  -- Calculate remaining requests
  v_remaining := p_anonymous_limit - v_usage_record.request_count;
  
  -- Check if user has exceeded limit
  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Free limit reached. Please sign in for more requests!';
    RETURN;
  END IF;
  
  -- Increment the counter
  UPDATE anonymous_usage
  SET request_count = request_count + 1,
      last_request = v_now
  WHERE ip_address = public.safe_ip_cast(p_ip_address);
  
  -- Log the usage
  INSERT INTO usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (NULL, public.safe_ip_cast(p_ip_address), p_action, p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;
  
  -- Return success with updated remaining count
  v_remaining := v_remaining - 1;
  RETURN QUERY SELECT TRUE, v_remaining,
    CASE 
      WHEN v_remaining = 0 THEN 'Request processed. Free limit reached - sign in for more!'
      ELSE v_remaining || ' free requests remaining'
    END,
    v_usage_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;