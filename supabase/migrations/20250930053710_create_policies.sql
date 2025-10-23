-- Row Level Security Policies

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- User usage table policies
CREATE POLICY "Users can view their own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON public.user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Usage logs table policies
CREATE POLICY "Users can view their own logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert logs" ON public.usage_logs
  FOR INSERT WITH CHECK (true);

-- Anonymous usage table policies
CREATE POLICY "Anonymous usage is publicly readable" ON public.anonymous_usage
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage anonymous usage" ON public.anonymous_usage
  FOR ALL USING (true);