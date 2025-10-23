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