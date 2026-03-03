-- Fix SQL injection vulnerability in get_feedback function
-- The p_order_by and p_order_direction parameters were directly concatenated
-- into the SQL query without validation, allowing SQL injection attacks.
-- This migration adds allowlist validation as defense-in-depth.

CREATE OR REPLACE FUNCTION public.get_feedback(
  p_user_id uuid DEFAULT NULL::uuid,
  p_category text DEFAULT NULL::text,
  p_status text DEFAULT NULL::text,
  p_rating integer DEFAULT NULL::integer,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_order_by text DEFAULT 'created_at'::text,
  p_order_direction text DEFAULT 'DESC'::text
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  rating integer,
  category text,
  title text,
  message text,
  email text,
  status text,
  admin_notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  user_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_query TEXT;
  v_safe_order_by TEXT;
  v_safe_order_direction TEXT;
BEGIN
  -- SECURITY: Validate order_by against allowlist to prevent SQL injection
  IF p_order_by IN ('id', 'created_at', 'updated_at', 'rating', 'category', 'status', 'title') THEN
    v_safe_order_by := p_order_by;
  ELSE
    v_safe_order_by := 'created_at';
  END IF;

  -- SECURITY: Validate order_direction against allowlist to prevent SQL injection
  IF UPPER(p_order_direction) IN ('ASC', 'DESC') THEN
    v_safe_order_direction := UPPER(p_order_direction);
  ELSE
    v_safe_order_direction := 'DESC';
  END IF;

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

  -- Add ordering with validated values (no longer vulnerable to SQL injection)
  v_query := v_query || ' ORDER BY f.' || v_safe_order_by || ' ' || v_safe_order_direction;

  -- Add pagination with bounds checking
  v_query := v_query || ' LIMIT ' || LEAST(GREATEST(p_limit, 1), 100) || ' OFFSET ' || GREATEST(p_offset, 0);

  -- Execute query
  IF p_user_id IS NOT NULL THEN
    RETURN QUERY EXECUTE v_query USING p_user_id;
  ELSE
    RETURN QUERY EXECUTE v_query;
  END IF;
END;
$function$;

-- Add comment documenting the security fix
COMMENT ON FUNCTION public.get_feedback IS 'Retrieves feedback records with filtering and pagination. Security: p_order_by and p_order_direction are validated against allowlists to prevent SQL injection.';
