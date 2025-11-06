-- Indexes for performance optimization

-- Index on users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Indexes on user_usage table
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_last_reset ON public.user_usage(last_reset);

-- Indexes on usage_logs table
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_ip_address ON public.usage_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);

-- Indexes on anonymous_usage table
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip_address ON public.anonymous_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_last_request ON public.anonymous_usage(last_request);

-- Indexes on feedback table
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_usage_log_id ON public.feedback(usage_log_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_updated_at ON public.feedback(updated_at);
CREATE INDEX IF NOT EXISTS idx_feedback_admin_user_id ON public.feedback(admin_user_id);