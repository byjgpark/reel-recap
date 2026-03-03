-- Add function to refund/decrement usage when API calls fail
-- This allows us to give back the usage slot if the external API call fails

-- Refund for authenticated users (decrements ip_usage)
CREATE OR REPLACE FUNCTION refund_authenticated_usage(
  p_user_id UUID,
  p_ip_address TEXT,
  p_action TEXT
) RETURNS TABLE(
  success BOOLEAN,
  remaining_requests INTEGER,
  message TEXT
) AS $$
DECLARE
  v_safe_ip TEXT;
  v_current_count INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Safely cast IP address (same logic as process_authenticated_request)
  v_safe_ip := COALESCE(NULLIF(p_ip_address, 'unknown'), '0.0.0.0');

  -- Decrement the counter (but don't go below 0)
  UPDATE ip_usage
  SET request_count = GREATEST(0, request_count - 1)
  WHERE ip_address = v_safe_ip
  RETURNING request_count INTO v_current_count;

  IF NOT FOUND THEN
    -- No record found, nothing to refund
    RETURN QUERY SELECT TRUE, 20, 'No usage to refund'::TEXT;
    RETURN;
  END IF;

  -- Also decrement user_usage for analytics consistency
  IF p_action = 'transcript' THEN
    UPDATE user_usage
    SET transcript_count = GREATEST(0, transcript_count - 1),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_usage
    SET summary_count = GREATEST(0, summary_count - 1),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  v_remaining := 20 - v_current_count; -- Assuming 20 is the daily limit

  RETURN QUERY SELECT TRUE, v_remaining, 'Usage refunded successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refund for anonymous users (decrements anonymous_usage)
CREATE OR REPLACE FUNCTION refund_anonymous_usage(
  p_ip_address TEXT
) RETURNS TABLE(
  success BOOLEAN,
  remaining_requests INTEGER,
  message TEXT
) AS $$
DECLARE
  v_safe_ip TEXT;
  v_current_count INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Safely cast IP address
  v_safe_ip := COALESCE(NULLIF(p_ip_address, 'unknown'), '0.0.0.0');

  -- Decrement the counter (but don't go below 0)
  UPDATE anonymous_usage
  SET request_count = GREATEST(0, request_count - 1)
  WHERE ip_address = v_safe_ip
  RETURNING request_count INTO v_current_count;

  IF NOT FOUND THEN
    -- No record found, nothing to refund
    RETURN QUERY SELECT TRUE, 2, 'No usage to refund'::TEXT;
    RETURN;
  END IF;

  v_remaining := 2 - v_current_count; -- Assuming 2 is the anonymous limit

  RETURN QUERY SELECT TRUE, v_remaining, 'Usage refunded successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
