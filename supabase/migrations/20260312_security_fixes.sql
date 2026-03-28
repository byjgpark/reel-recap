-- ============================================================================
-- Security Migration: Fix all security advisories
-- 1. Fix mutable search_path on all SECURITY DEFINER functions
-- 2. Fix RLS initplan: auth.uid() -> (select auth.uid())
-- 3. Fix feature_interest_clicks overly permissive INSERT policy
-- 4. Fix subscriptions service_role policy scoping
-- ============================================================================

-- ============================================================================
-- PART 1: Fix mutable search_path on all functions
-- Adding SET search_path = '' prevents search_path hijacking attacks
-- ============================================================================

-- 1a. safe_ip_cast
CREATE OR REPLACE FUNCTION public.safe_ip_cast(ip_text text)
RETURNS inet
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  BEGIN
    RETURN ip_text::inet;
  EXCEPTION WHEN OTHERS THEN
    RETURN '0.0.0.0'::inet;
  END;
END;
$function$;

-- 1b. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- 1c. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 1d. check_anonymous_usage_limit
CREATE OR REPLACE FUNCTION public.check_anonymous_usage_limit(p_ip_address text, p_anonymous_limit integer DEFAULT 10, p_reset_interval_hours integer DEFAULT 24)
RETURNS TABLE(allowed boolean, remaining_requests integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_usage_record public.anonymous_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT * INTO v_usage_record
  FROM public.anonymous_usage
  WHERE ip_address = public.safe_ip_cast(p_ip_address);

  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, p_anonymous_limit, p_anonymous_limit || ' free requests available';
    RETURN;
  END IF;

  v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_request)) / 3600;

  IF v_hours_since_last >= p_reset_interval_hours THEN
    RETURN QUERY SELECT TRUE, p_anonymous_limit, p_anonymous_limit || ' free requests available (reset)';
    RETURN;
  END IF;

  v_remaining := p_anonymous_limit - v_usage_record.request_count;

  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Free limit reached. Please sign in for more requests!';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_remaining, v_remaining || ' free requests available';
END;
$function$;

-- 1e. check_authenticated_usage_limit (2-param overload)
CREATE OR REPLACE FUNCTION public.check_authenticated_usage_limit(p_user_id uuid, p_daily_limit integer DEFAULT 20, p_reset_interval_hours integer DEFAULT 24)
RETURNS TABLE(allowed boolean, remaining_requests integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_usage_record public.user_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT * INTO v_usage_record
  FROM public.user_usage
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, p_daily_limit, p_daily_limit || ' requests available today';
    RETURN;
  END IF;

  v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_reset)) / 3600;

  IF v_hours_since_last >= p_reset_interval_hours THEN
    RETURN QUERY SELECT TRUE, p_daily_limit, p_daily_limit || ' requests available today (reset)';
    RETURN;
  END IF;

  v_remaining := p_daily_limit - (COALESCE(v_usage_record.transcript_count, 0) + COALESCE(v_usage_record.summary_count, 0));

  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily limit reached. Please try again tomorrow!';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_remaining, v_remaining || ' requests remaining today';
END;
$function$;

-- 1f. check_authenticated_usage_limit (4-param overload with IP)
CREATE OR REPLACE FUNCTION public.check_authenticated_usage_limit(p_user_id uuid, p_ip_address text, p_daily_limit integer DEFAULT 20, p_reset_interval_hours integer DEFAULT 24)
RETURNS TABLE(allowed boolean, remaining_requests integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_ip_record public.ip_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_reset NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_safe_ip TEXT;
BEGIN
  v_safe_ip := COALESCE(NULLIF(p_ip_address, 'unknown'), '0.0.0.0');

  SELECT * INTO v_ip_record
  FROM public.ip_usage
  WHERE ip_address = v_safe_ip;

  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, p_daily_limit, p_daily_limit || ' requests available today';
    RETURN;
  END IF;

  v_hours_since_reset := EXTRACT(EPOCH FROM (v_now - v_ip_record.last_reset)) / 3600;

  IF v_hours_since_reset >= p_reset_interval_hours THEN
    RETURN QUERY SELECT TRUE, p_daily_limit, p_daily_limit || ' requests available today (reset)';
    RETURN;
  END IF;

  v_remaining := p_daily_limit - v_ip_record.request_count;

  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily limit reached. Please try again tomorrow!';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_remaining, v_remaining || ' requests remaining today';
END;
$function$;

-- 1g. increment_anonymous_usage
CREATE OR REPLACE FUNCTION public.increment_anonymous_usage(p_ip_address text, p_action text, p_video_url text, p_anonymous_limit integer DEFAULT 10, p_reset_interval_hours integer DEFAULT 24)
RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_usage_record public.anonymous_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  SELECT * INTO v_usage_record
  FROM public.anonymous_usage
  WHERE ip_address = public.safe_ip_cast(p_ip_address)
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.anonymous_usage (ip_address, request_count, last_request, created_at)
    VALUES (public.safe_ip_cast(p_ip_address), 1, v_now, v_now)
    RETURNING * INTO v_usage_record;

    v_remaining := p_anonymous_limit - 1;
  ELSE
    v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_request)) / 3600;

    IF v_hours_since_last >= p_reset_interval_hours THEN
      UPDATE public.anonymous_usage
      SET request_count = 1,
          last_request = v_now
      WHERE ip_address = public.safe_ip_cast(p_ip_address);

      v_remaining := p_anonymous_limit - 1;
    ELSE
      UPDATE public.anonymous_usage
      SET request_count = request_count + 1,
          last_request = v_now
      WHERE ip_address = public.safe_ip_cast(p_ip_address);

      v_remaining := p_anonymous_limit - (v_usage_record.request_count + 1);
    END IF;
  END IF;

  INSERT INTO public.usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (NULL, public.safe_ip_cast(p_ip_address), p_action, p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;

  RETURN QUERY SELECT TRUE, v_remaining,
    CASE
      WHEN v_remaining = 0 THEN 'Request processed. Free limit reached - sign in for more!'
      ELSE v_remaining || ' free requests remaining'
    END,
    v_usage_log_id;
END;
$function$;

-- 1h. increment_authenticated_usage
CREATE OR REPLACE FUNCTION public.increment_authenticated_usage(p_user_id uuid, p_action text, p_video_url text, p_ip_address text, p_daily_limit integer DEFAULT 20, p_reset_interval_hours integer DEFAULT 24)
RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_usage_record public.user_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  SELECT * INTO v_usage_record
  FROM public.user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    IF p_action = 'transcript' THEN
      INSERT INTO public.user_usage (user_id, transcript_count, summary_count, last_reset, created_at)
      VALUES (p_user_id, 1, 0, v_now, v_now)
      RETURNING * INTO v_usage_record;
    ELSE
      INSERT INTO public.user_usage (user_id, transcript_count, summary_count, last_reset, created_at)
      VALUES (p_user_id, 0, 1, v_now, v_now)
      RETURNING * INTO v_usage_record;
    END IF;

    v_remaining := p_daily_limit - 1;
  ELSE
    v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_reset)) / 3600;

    IF v_hours_since_last >= p_reset_interval_hours THEN
      IF p_action = 'transcript' THEN
        UPDATE public.user_usage
        SET transcript_count = 1,
            summary_count = 0,
            last_reset = v_now,
            updated_at = v_now
        WHERE user_id = p_user_id;
      ELSE
        UPDATE public.user_usage
        SET transcript_count = 0,
            summary_count = 1,
            last_reset = v_now,
            updated_at = v_now
        WHERE user_id = p_user_id;
      END IF;

      v_remaining := p_daily_limit - 1;
    ELSE
      IF p_action = 'transcript' THEN
        UPDATE public.user_usage
        SET transcript_count = transcript_count + 1,
            updated_at = v_now
        WHERE user_id = p_user_id;
      ELSE
        UPDATE public.user_usage
        SET summary_count = summary_count + 1,
            updated_at = v_now
        WHERE user_id = p_user_id;
      END IF;

      v_remaining := p_daily_limit - (COALESCE(v_usage_record.transcript_count, 0) + COALESCE(v_usage_record.summary_count, 0) + 1);
    END IF;
  END IF;

  INSERT INTO public.usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (p_user_id, public.safe_ip_cast(p_ip_address), p_action, p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;

  RETURN QUERY SELECT TRUE, v_remaining,
    CASE
      WHEN v_remaining = 0 THEN 'Request processed. Daily limit reached!'
      ELSE v_remaining || ' requests remaining today'
    END,
    v_usage_log_id;
END;
$function$;

-- 1i. process_anonymous_request
CREATE OR REPLACE FUNCTION public.process_anonymous_request(p_ip_address text, p_action text, p_video_url text, p_anonymous_limit integer, p_reset_interval_hours integer)
RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_usage_record public.anonymous_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  SELECT * INTO v_usage_record
  FROM public.anonymous_usage
  WHERE ip_address = public.safe_ip_cast(p_ip_address)
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.anonymous_usage (ip_address, request_count, last_request, created_at)
    VALUES (public.safe_ip_cast(p_ip_address), 0, v_now, v_now)
    RETURNING * INTO v_usage_record;
  END IF;

  v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_request)) / 3600;

  IF v_hours_since_last >= p_reset_interval_hours THEN
    UPDATE public.anonymous_usage
    SET request_count = 0,
        last_request = v_now
    WHERE ip_address = public.safe_ip_cast(p_ip_address);

    v_usage_record.request_count := 0;
  END IF;

  v_remaining := p_anonymous_limit - v_usage_record.request_count;

  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Free limit reached. Please sign in for more requests!', NULL::UUID;
    RETURN;
  END IF;

  UPDATE public.anonymous_usage
  SET request_count = request_count + 1,
      last_request = v_now
  WHERE ip_address = public.safe_ip_cast(p_ip_address);

  INSERT INTO public.usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (NULL, public.safe_ip_cast(p_ip_address), p_action, p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;

  v_remaining := v_remaining - 1;
  RETURN QUERY SELECT TRUE, v_remaining,
    CASE
      WHEN v_remaining = 0 THEN 'Request processed. Free limit reached - sign in for more!'
      ELSE v_remaining || ' free requests remaining'
    END,
    v_usage_log_id;
END;
$function$;

-- 1j. process_authenticated_request
CREATE OR REPLACE FUNCTION public.process_authenticated_request(p_user_id uuid, p_action text, p_video_url text, p_ip_address text, p_daily_limit integer, p_reset_interval_hours integer)
RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_ip_record public.ip_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_reset NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  SELECT * INTO v_ip_record
  FROM public.ip_usage
  WHERE ip_address = public.safe_ip_cast(p_ip_address)
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.ip_usage (ip_address, request_count, last_reset, created_at)
    VALUES (public.safe_ip_cast(p_ip_address), 0, v_now, v_now)
    RETURNING * INTO v_ip_record;
  END IF;

  v_hours_since_reset := EXTRACT(EPOCH FROM (v_now - v_ip_record.last_reset)) / 3600;

  IF v_hours_since_reset >= p_reset_interval_hours THEN
    UPDATE public.ip_usage
    SET request_count = 0,
        last_reset = v_now
    WHERE ip_address = public.safe_ip_cast(p_ip_address);

    v_ip_record.request_count := 0;
  END IF;

  v_remaining := p_daily_limit - v_ip_record.request_count;

  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily limit reached. Please try again tomorrow!', NULL::UUID;
    RETURN;
  END IF;

  UPDATE public.ip_usage
  SET request_count = request_count + 1
  WHERE ip_address = public.safe_ip_cast(p_ip_address);

  INSERT INTO public.usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (p_user_id, public.safe_ip_cast(p_ip_address), p_action, p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;

  v_remaining := v_remaining - 1;
  RETURN QUERY SELECT TRUE, v_remaining,
    CASE
      WHEN v_remaining = 0 THEN 'Request processed. Daily limit reached.'
      ELSE v_remaining || ' requests remaining today'
    END,
    v_usage_log_id;
END;
$function$;

-- 1k. process_captcha_verified_request
CREATE OR REPLACE FUNCTION public.process_captcha_verified_request(p_ip_address text, p_action text, p_video_url text, p_reset_interval_hours integer)
RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_usage_record public.anonymous_usage%ROWTYPE;
  v_hours_since_last NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
BEGIN
  SELECT * INTO v_usage_record
  FROM public.anonymous_usage
  WHERE ip_address = public.safe_ip_cast(p_ip_address)
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.anonymous_usage (ip_address, request_count, last_request, created_at)
    VALUES (public.safe_ip_cast(p_ip_address), 0, v_now, v_now)
    RETURNING * INTO v_usage_record;
  END IF;

  v_hours_since_last := EXTRACT(EPOCH FROM (v_now - v_usage_record.last_request)) / 3600;

  IF v_hours_since_last >= p_reset_interval_hours THEN
    UPDATE public.anonymous_usage
    SET request_count = 0,
        last_request = v_now
    WHERE ip_address = public.safe_ip_cast(p_ip_address);

    v_usage_record.request_count := 0;
  END IF;

  UPDATE public.anonymous_usage
  SET request_count = request_count + 1,
      last_request = v_now
  WHERE ip_address = public.safe_ip_cast(p_ip_address);

  INSERT INTO public.usage_logs (user_id, ip_address, action, video_url, status, created_at)
  VALUES (NULL, public.safe_ip_cast(p_ip_address), p_action || '_captcha_verified', p_video_url, 'success', v_now)
  RETURNING id INTO v_usage_log_id;

  RETURN QUERY SELECT TRUE, 0, 'Request processed with CAPTCHA verification. Sign in for more requests!', v_usage_log_id;
END;
$function$;

-- 1l. get_feedback
CREATE OR REPLACE FUNCTION public.get_feedback(p_user_id uuid DEFAULT NULL::uuid, p_category text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_rating integer DEFAULT NULL::integer, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_order_by text DEFAULT 'created_at'::text, p_order_direction text DEFAULT 'DESC'::text)
RETURNS TABLE(id uuid, user_id uuid, rating integer, category text, title text, message text, email text, status text, admin_notes text, created_at timestamp with time zone, updated_at timestamp with time zone, user_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_query TEXT;
  v_safe_order_by TEXT;
  v_safe_order_direction TEXT;
BEGIN
  IF p_order_by IN ('id', 'created_at', 'updated_at', 'rating', 'category', 'status', 'title') THEN
    v_safe_order_by := p_order_by;
  ELSE
    v_safe_order_by := 'created_at';
  END IF;

  IF UPPER(p_order_direction) IN ('ASC', 'DESC') THEN
    v_safe_order_direction := UPPER(p_order_direction);
  ELSE
    v_safe_order_direction := 'DESC';
  END IF;

  v_query := 'SELECT f.id, f.user_id, f.rating, f.category, f.title, f.message, f.email, f.status, f.admin_notes, f.created_at, f.updated_at, u.name as user_name
              FROM public.feedback f
              LEFT JOIN public.users u ON f.user_id = u.id
              WHERE 1=1';

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

  v_query := v_query || ' ORDER BY f.' || v_safe_order_by || ' ' || v_safe_order_direction;
  v_query := v_query || ' LIMIT ' || LEAST(GREATEST(p_limit, 1), 100) || ' OFFSET ' || GREATEST(p_offset, 0);

  IF p_user_id IS NOT NULL THEN
    RETURN QUERY EXECUTE v_query USING p_user_id;
  ELSE
    RETURN QUERY EXECUTE v_query;
  END IF;
END;
$function$;

-- 1m. get_feedback_stats
CREATE OR REPLACE FUNCTION public.get_feedback_stats()
RETURNS TABLE(total_feedback integer, avg_rating numeric, feedback_by_category json, feedback_by_status json, recent_feedback_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.feedback) as total_feedback,
    (SELECT ROUND(AVG(f.rating), 2) FROM public.feedback f) as avg_rating,
    (SELECT json_object_agg(category, count) FROM (
      SELECT f2.category, COUNT(*) as count
      FROM public.feedback f2
      GROUP BY f2.category
    ) t) as feedback_by_category,
    (SELECT json_object_agg(status, count) FROM (
      SELECT f3.status, COUNT(*) as count
      FROM public.feedback f3
      GROUP BY f3.status
    ) t) as feedback_by_status,
    (SELECT COUNT(*)::INTEGER FROM public.feedback WHERE created_at > NOW() - INTERVAL '7 days') as recent_feedback_count;
END;
$function$;

-- 1n. submit_feedback
CREATE OR REPLACE FUNCTION public.submit_feedback(p_user_id uuid, p_usage_log_id uuid, p_rating integer, p_category text, p_title text, p_message text, p_email text, p_user_agent text, p_ip_address text)
RETURNS TABLE(success boolean, feedback_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_feedback_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Rating must be between 1 and 5';
    RETURN;
  END IF;

  IF p_category NOT IN ('feature_request', 'bug_report', 'general_feedback', 'platform_request', 'ui_ux', 'performance') THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid feedback category';
    RETURN;
  END IF;

  INSERT INTO public.feedback (
    user_id, usage_log_id, rating, category, title, message, email, user_agent, ip_address, created_at, updated_at
  ) VALUES (
    p_user_id, p_usage_log_id, p_rating, p_category, p_title, p_message, p_email, p_user_agent, public.safe_ip_cast(p_ip_address), v_now, v_now
  ) RETURNING id INTO v_feedback_id;

  RETURN QUERY SELECT TRUE, v_feedback_id, 'Feedback submitted successfully';
END;
$function$;

-- 1o. update_feedback_status
CREATE OR REPLACE FUNCTION public.update_feedback_status(p_feedback_id uuid, p_status text, p_admin_notes text, p_admin_user_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  IF p_status NOT IN ('open', 'in_progress', 'resolved', 'closed') THEN
    RETURN QUERY SELECT FALSE, 'Invalid status';
    RETURN;
  END IF;

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
$function$;

-- 1p. refund_anonymous_usage
CREATE OR REPLACE FUNCTION public.refund_anonymous_usage(p_ip_address text)
RETURNS TABLE(success boolean, remaining_requests integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_safe_ip TEXT;
  v_current_count INTEGER;
  v_remaining INTEGER;
BEGIN
  v_safe_ip := COALESCE(NULLIF(p_ip_address, 'unknown'), '0.0.0.0');

  UPDATE public.anonymous_usage
  SET request_count = GREATEST(0, request_count - 1)
  WHERE ip_address = v_safe_ip
  RETURNING request_count INTO v_current_count;

  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, 2, 'No usage to refund'::TEXT;
    RETURN;
  END IF;

  v_remaining := 2 - v_current_count;

  RETURN QUERY SELECT TRUE, v_remaining, 'Usage refunded successfully'::TEXT;
END;
$function$;

-- 1q. refund_authenticated_usage
CREATE OR REPLACE FUNCTION public.refund_authenticated_usage(p_user_id uuid, p_ip_address text, p_action text)
RETURNS TABLE(success boolean, remaining_requests integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_safe_ip TEXT;
  v_current_count INTEGER;
  v_remaining INTEGER;
BEGIN
  v_safe_ip := COALESCE(NULLIF(p_ip_address, 'unknown'), '0.0.0.0');

  UPDATE public.ip_usage
  SET request_count = GREATEST(0, request_count - 1)
  WHERE ip_address = v_safe_ip
  RETURNING request_count INTO v_current_count;

  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, 20, 'No usage to refund'::TEXT;
    RETURN;
  END IF;

  IF p_action = 'transcript' THEN
    UPDATE public.user_usage
    SET transcript_count = GREATEST(0, transcript_count - 1),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.user_usage
    SET summary_count = GREATEST(0, summary_count - 1),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  v_remaining := 20 - v_current_count;

  RETURN QUERY SELECT TRUE, v_remaining, 'Usage refunded successfully'::TEXT;
END;
$function$;

-- 1r. is_pro_user
CREATE OR REPLACE FUNCTION public.is_pro_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$function$;

-- 1s. get_user_subscription
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id uuid)
RETURNS TABLE(subscription_status text, is_trial boolean, period_end timestamp with time zone, trial_end_date timestamp with time zone, will_cancel boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.status,
    (s.status = 'trialing')::BOOLEAN,
    s.current_period_end,
    s.trial_end,
    s.cancel_at_period_end
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$function$;

-- ============================================================================
-- PART 2: Fix RLS policies - use (select auth.uid()) instead of auth.uid()
-- This prevents re-evaluation per row for better performance + security
-- ============================================================================

-- 2a. users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING ((select auth.uid()) = id);

-- 2b. user_usage policies
DROP POLICY IF EXISTS "Users can view their own usage" ON public.user_usage;
CREATE POLICY "Users can view their own usage" ON public.user_usage
  FOR SELECT USING ((select auth.uid()) = user_id);

-- 2c. usage_logs policies
DROP POLICY IF EXISTS "Users can view their own logs" ON public.usage_logs;
CREATE POLICY "Users can view their own logs" ON public.usage_logs
  FOR SELECT USING ((select auth.uid()) = user_id);

-- 2d. feedback policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback;
CREATE POLICY "Users can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (((select auth.uid()) = user_id) OR (user_id IS NULL));

DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback;
CREATE POLICY "Users can update their own feedback" ON public.feedback
  FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (EXISTS ( SELECT 1
   FROM public.users
  WHERE (users.id = (select auth.uid()) AND (users.email = ANY (ARRAY['admin@reelrecap.com'::text, 'jungipark@example.com'::text])))));

DROP POLICY IF EXISTS "Admins can update all feedback" ON public.feedback;
CREATE POLICY "Admins can update all feedback" ON public.feedback
  FOR UPDATE USING (EXISTS ( SELECT 1
   FROM public.users
  WHERE (users.id = (select auth.uid()) AND (users.email = ANY (ARRAY['admin@reelrecap.com'::text, 'jungipark@example.com'::text])))));

-- 2e. feature_interest_clicks policies
DROP POLICY IF EXISTS "Allow select for service role only" ON public.feature_interest_clicks;
CREATE POLICY "Allow select for service role only" ON public.feature_interest_clicks
  FOR SELECT USING ((select auth.role()) = 'service_role');

-- 2f. user_history policies
DROP POLICY IF EXISTS "Users can view their own history" ON public.user_history;
CREATE POLICY "Users can view their own history" ON public.user_history
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own history" ON public.user_history;
CREATE POLICY "Users can insert their own history" ON public.user_history
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own history" ON public.user_history;
CREATE POLICY "Users can update their own history" ON public.user_history
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own history" ON public.user_history;
CREATE POLICY "Users can delete their own history" ON public.user_history
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PART 3: Fix feature_interest_clicks overly permissive INSERT policy
-- Add minimal validation instead of WITH CHECK (true)
-- ============================================================================

DROP POLICY IF EXISTS "Allow insert for all users" ON public.feature_interest_clicks;
CREATE POLICY "Allow insert for all users" ON public.feature_interest_clicks
  FOR INSERT WITH CHECK (feature IS NOT NULL AND length(feature) > 0 AND length(feature) <= 100);

-- ============================================================================
-- PART 4: Fix subscriptions policies - proper role scoping
-- Scoping to specific roles avoids multiple permissive policy overlap
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role full access to subscriptions" ON public.subscriptions;
CREATE POLICY "Service role full access to subscriptions" ON public.subscriptions
  FOR ALL TO service_role
  USING (true);
