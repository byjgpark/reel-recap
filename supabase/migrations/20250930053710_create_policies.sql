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

-- Feedback table policies
CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own feedback" ON public.feedback
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND email IN ('admin@reelrecap.com', 'jungipark@example.com')
    )
  );

CREATE POLICY "Admins can update all feedback" ON public.feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND email IN ('admin@reelrecap.com', 'jungipark@example.com')
    )
  );

CREATE POLICY "Service role can manage feedback" ON public.feedback
  FOR ALL USING (true);