-- Fix process_authenticated_request to return 4 columns (was returning 3)
-- This ensures the function signature matches what the TypeScript code expects

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
  v_ip_record ip_usage%ROWTYPE;
  v_remaining INTEGER;
  v_hours_since_reset NUMERIC;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_usage_log_id UUID;
  v_safe_ip TEXT;
BEGIN
  -- Safely cast IP address
  v_safe_ip := COALESCE(NULLIF(p_ip_address, 'unknown'), '0.0.0.0');

  -- Get or create IP usage record with row-level locking
  SELECT * INTO v_ip_record
  FROM ip_usage
  WHERE ip_address = v_safe_ip
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO ip_usage (ip_address, request_count, last_reset, created_at)
    VALUES (v_safe_ip, 0, v_now, v_now)
    RETURNING * INTO v_ip_record;
  END IF;

  -- Check if reset is needed (24 hours passed)
  v_hours_since_reset := EXTRACT(EPOCH FROM (v_now - v_ip_record.last_reset)) / 3600;

  IF v_hours_since_reset >= p_reset_interval_hours THEN
    -- Reset counter
    UPDATE ip_usage
    SET request_count = 0,
        last_reset = v_now
    WHERE ip_address = v_safe_ip;

    v_ip_record.request_count := 0;
  END IF;

  -- Calculate remaining requests
  v_remaining := p_daily_limit - v_ip_record.request_count;

  -- Check if limit exceeded
  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily limit reached. Please try again tomorrow!'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Increment the counter
  UPDATE ip_usage
  SET request_count = request_count + 1
  WHERE ip_address = v_safe_ip;

  -- ALSO update user_usage table for analytics/history
  INSERT INTO user_usage (user_id, transcript_count, summary_count, last_reset, created_at, updated_at)
  VALUES (p_user_id, CASE WHEN p_action = 'transcript' THEN 1 ELSE 0 END, CASE WHEN p_action = 'summary' THEN 1 ELSE 0 END, v_now, v_now, v_now)
  ON CONFLICT (user_id) DO UPDATE
  SET transcript_count = user_usage.transcript_count + CASE WHEN EXCLUDED.transcript_count > 0 THEN 1 ELSE 0 END,
      summary_count = user_usage.summary_count + CASE WHEN EXCLUDED.summary_count > 0 THEN 1 ELSE 0 END,
      updated_at = v_now;

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
    END::TEXT,
    v_usage_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
