drop policy if exists "Anonymous usage is publicly readable" on "public"."anonymous_usage";

drop policy if exists "Service role can manage anonymous usage" on "public"."anonymous_usage";

drop policy if exists "Users can update their own usage" on "public"."user_usage";

drop policy if exists "Users can view their own feedback" on "public"."feedback";

revoke delete on table "public"."anonymous_usage" from "anon";

revoke insert on table "public"."anonymous_usage" from "anon";

revoke references on table "public"."anonymous_usage" from "anon";

revoke select on table "public"."anonymous_usage" from "anon";

revoke trigger on table "public"."anonymous_usage" from "anon";

revoke truncate on table "public"."anonymous_usage" from "anon";

revoke update on table "public"."anonymous_usage" from "anon";

revoke delete on table "public"."anonymous_usage" from "authenticated";

revoke insert on table "public"."anonymous_usage" from "authenticated";

revoke references on table "public"."anonymous_usage" from "authenticated";

revoke select on table "public"."anonymous_usage" from "authenticated";

revoke trigger on table "public"."anonymous_usage" from "authenticated";

revoke truncate on table "public"."anonymous_usage" from "authenticated";

revoke update on table "public"."anonymous_usage" from "authenticated";

revoke delete on table "public"."anonymous_usage" from "service_role";

revoke insert on table "public"."anonymous_usage" from "service_role";

revoke references on table "public"."anonymous_usage" from "service_role";

revoke select on table "public"."anonymous_usage" from "service_role";

revoke trigger on table "public"."anonymous_usage" from "service_role";

revoke truncate on table "public"."anonymous_usage" from "service_role";

revoke update on table "public"."anonymous_usage" from "service_role";

revoke delete on table "public"."feedback" from "anon";

revoke insert on table "public"."feedback" from "anon";

revoke references on table "public"."feedback" from "anon";

revoke select on table "public"."feedback" from "anon";

revoke trigger on table "public"."feedback" from "anon";

revoke truncate on table "public"."feedback" from "anon";

revoke update on table "public"."feedback" from "anon";

revoke delete on table "public"."feedback" from "authenticated";

revoke insert on table "public"."feedback" from "authenticated";

revoke references on table "public"."feedback" from "authenticated";

revoke select on table "public"."feedback" from "authenticated";

revoke trigger on table "public"."feedback" from "authenticated";

revoke truncate on table "public"."feedback" from "authenticated";

revoke update on table "public"."feedback" from "authenticated";

revoke delete on table "public"."feedback" from "service_role";

revoke insert on table "public"."feedback" from "service_role";

revoke references on table "public"."feedback" from "service_role";

revoke select on table "public"."feedback" from "service_role";

revoke trigger on table "public"."feedback" from "service_role";

revoke truncate on table "public"."feedback" from "service_role";

revoke update on table "public"."feedback" from "service_role";

revoke delete on table "public"."usage_logs" from "anon";

revoke insert on table "public"."usage_logs" from "anon";

revoke references on table "public"."usage_logs" from "anon";

revoke select on table "public"."usage_logs" from "anon";

revoke trigger on table "public"."usage_logs" from "anon";

revoke truncate on table "public"."usage_logs" from "anon";

revoke update on table "public"."usage_logs" from "anon";

revoke delete on table "public"."usage_logs" from "authenticated";

revoke insert on table "public"."usage_logs" from "authenticated";

revoke references on table "public"."usage_logs" from "authenticated";

revoke select on table "public"."usage_logs" from "authenticated";

revoke trigger on table "public"."usage_logs" from "authenticated";

revoke truncate on table "public"."usage_logs" from "authenticated";

revoke update on table "public"."usage_logs" from "authenticated";

revoke delete on table "public"."usage_logs" from "service_role";

revoke insert on table "public"."usage_logs" from "service_role";

revoke references on table "public"."usage_logs" from "service_role";

revoke select on table "public"."usage_logs" from "service_role";

revoke trigger on table "public"."usage_logs" from "service_role";

revoke truncate on table "public"."usage_logs" from "service_role";

revoke update on table "public"."usage_logs" from "service_role";

revoke delete on table "public"."user_usage" from "anon";

revoke insert on table "public"."user_usage" from "anon";

revoke references on table "public"."user_usage" from "anon";

revoke select on table "public"."user_usage" from "anon";

revoke trigger on table "public"."user_usage" from "anon";

revoke truncate on table "public"."user_usage" from "anon";

revoke update on table "public"."user_usage" from "anon";

revoke delete on table "public"."user_usage" from "authenticated";

revoke insert on table "public"."user_usage" from "authenticated";

revoke references on table "public"."user_usage" from "authenticated";

revoke select on table "public"."user_usage" from "authenticated";

revoke trigger on table "public"."user_usage" from "authenticated";

revoke truncate on table "public"."user_usage" from "authenticated";

revoke update on table "public"."user_usage" from "authenticated";

revoke delete on table "public"."user_usage" from "service_role";

revoke insert on table "public"."user_usage" from "service_role";

revoke references on table "public"."user_usage" from "service_role";

revoke select on table "public"."user_usage" from "service_role";

revoke trigger on table "public"."user_usage" from "service_role";

revoke truncate on table "public"."user_usage" from "service_role";

revoke update on table "public"."user_usage" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

create table if not exists "public"."feature_interest_clicks" (
    "id" uuid not null default gen_random_uuid(),
    "feature" text not null,
    "user_id" uuid,
    "user_email" text,
    "user_agent" text,
    "ip_address" text,
    "timestamp" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter table "public"."feature_interest_clicks" enable row level security;

create table if not exists "public"."user_history" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "video_url" text not null,
    "title" text,
    "thumbnail_url" text,
    "transcript" text,
    "summary" text,
    "language" text default 'English'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_history" enable row level security;

alter table "public"."anonymous_usage" enable row level security;

alter table "public"."feedback" enable row level security;

alter table "public"."usage_logs" enable row level security;

alter table "public"."user_usage" enable row level security;

alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX IF NOT EXISTS feature_interest_clicks_pkey ON public.feature_interest_clicks USING btree (id);

CREATE INDEX IF NOT EXISTS idx_feature_interest_feature ON public.feature_interest_clicks USING btree (feature);

CREATE INDEX IF NOT EXISTS idx_feature_interest_timestamp ON public.feature_interest_clicks USING btree ("timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_feature_interest_user_id ON public.feature_interest_clicks USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_history_created_at ON public.user_history USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON public.user_history USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_history_pkey ON public.user_history USING btree (id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feature_interest_clicks_pkey') THEN
    ALTER TABLE "public"."feature_interest_clicks" ADD CONSTRAINT "feature_interest_clicks_pkey" PRIMARY KEY USING INDEX "feature_interest_clicks_pkey";
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_history_pkey') THEN
    ALTER TABLE "public"."user_history" ADD CONSTRAINT "user_history_pkey" PRIMARY KEY USING INDEX "user_history_pkey";
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feature_interest_clicks_user_id_fkey') THEN
    ALTER TABLE "public"."feature_interest_clicks" ADD CONSTRAINT "feature_interest_clicks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

alter table "public"."feature_interest_clicks" validate constraint "feature_interest_clicks_user_id_fkey";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_history_user_id_fkey') THEN
    ALTER TABLE "public"."user_history" ADD CONSTRAINT "user_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

alter table "public"."user_history" validate constraint "user_history_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_anonymous_usage_limit(p_ip_address text, p_anonymous_limit integer DEFAULT 10, p_reset_interval_hours integer DEFAULT 24)
 RETURNS TABLE(allowed boolean, remaining_requests integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_authenticated_usage_limit(p_user_id uuid, p_daily_limit integer DEFAULT 20, p_reset_interval_hours integer DEFAULT 24)
 RETURNS TABLE(allowed boolean, remaining_requests integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_feedback(p_user_id uuid DEFAULT NULL::uuid, p_category text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_rating integer DEFAULT NULL::integer, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_order_by text DEFAULT 'created_at'::text, p_order_direction text DEFAULT 'DESC'::text)
 RETURNS TABLE(id uuid, user_id uuid, rating integer, category text, title text, message text, email text, status text, admin_notes text, created_at timestamp with time zone, updated_at timestamp with time zone, user_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_feedback_stats()
 RETURNS TABLE(total_feedback integer, avg_rating numeric, feedback_by_category json, feedback_by_status json, recent_feedback_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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
$function$
;

CREATE OR REPLACE FUNCTION public.increment_anonymous_usage(p_ip_address text, p_action text, p_video_url text, p_anonymous_limit integer DEFAULT 10, p_reset_interval_hours integer DEFAULT 24)
 RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.increment_authenticated_usage(p_user_id uuid, p_action text, p_video_url text, p_ip_address text, p_daily_limit integer DEFAULT 20, p_reset_interval_hours integer DEFAULT 24)
 RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_anonymous_request(p_ip_address text, p_action text, p_video_url text, p_anonymous_limit integer, p_reset_interval_hours integer)
 RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_authenticated_request(p_user_id uuid, p_action text, p_video_url text, p_ip_address text, p_daily_limit integer, p_reset_interval_hours integer)
 RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_captcha_verified_request(p_ip_address text, p_action text, p_video_url text, p_reset_interval_hours integer)
 RETURNS TABLE(success boolean, remaining_requests integer, message text, usage_log_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.safe_ip_cast(ip_text text)
 RETURNS inet
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Try to cast the IP address to inet
  BEGIN
    RETURN ip_text::inet;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails (e.g., 'unknown'), return localhost
    RETURN '0.0.0.0'::inet;
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_feedback(p_user_id uuid, p_usage_log_id uuid, p_rating integer, p_category text, p_title text, p_message text, p_email text, p_user_agent text, p_ip_address text)
 RETURNS TABLE(success boolean, feedback_id uuid, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_feedback_status(p_feedback_id uuid, p_status text, p_admin_notes text, p_admin_user_id uuid)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

DROP POLICY IF EXISTS "Allow insert for all users" ON "public"."feature_interest_clicks";
create policy "Allow insert for all users"
on "public"."feature_interest_clicks"
as permissive
for insert
to public
with check (true);


DROP POLICY IF EXISTS "Allow select for service role only" ON "public"."feature_interest_clicks";
create policy "Allow select for service role only"
on "public"."feature_interest_clicks"
as permissive
for select
to public
using ((auth.role() = 'service_role'::text));


DROP POLICY IF EXISTS "Users can delete their own history" ON "public"."user_history";
create policy "Users can delete their own history"
on "public"."user_history"
as permissive
for delete
to public
using ((auth.uid() = user_id));


DROP POLICY IF EXISTS "Users can insert their own history" ON "public"."user_history";
create policy "Users can insert their own history"
on "public"."user_history"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


DROP POLICY IF EXISTS "Users can update their own history" ON "public"."user_history";
create policy "Users can update their own history"
on "public"."user_history"
as permissive
for update
to public
using ((auth.uid() = user_id));


DROP POLICY IF EXISTS "Users can view their own history" ON "public"."user_history";
create policy "Users can view their own history"
on "public"."user_history"
as permissive
for select
to public
using ((auth.uid() = user_id));


DROP POLICY IF EXISTS "Users can view their own feedback" ON "public"."feedback";
create policy "Users can view their own feedback"
on "public"."feedback"
as permissive
for select
to public
using ((auth.uid() = user_id));

-- Note: Storage triggers (enforce_bucket_name_length_trigger, objects_*, prefixes_*, etc.)
-- are managed by Supabase internally and should not be included in user migrations.
