-- Secure anonymous_usage table
-- Previously, it allowed public read access. This exposes IP addresses and usage counts.
-- We restrict it so only the service role (backend) can access it.
DROP POLICY IF EXISTS "Anonymous usage is publicly readable" ON public.anonymous_usage;

-- Note: We do NOT need to create a "Service role only" policy.
-- When RLS is enabled and no policy matches (or no policy exists), access is DENIED by default.
-- The Service Role automatically BYPASSES RLS, so it can always access the table.
-- Therefore, simply dropping the public policy is enough to secure the table.

-- Remove dangerous "Service role" policies that actually granted public access.
-- The Service Role bypasses RLS by default, so it doesn't need policies.
-- These policies were effectively "ALLOW ALL" because they didn't specify a target role.
DROP POLICY IF EXISTS "Service role can manage anonymous usage" ON public.anonymous_usage;
DROP POLICY IF EXISTS "Service role can insert logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Service role can manage feedback" ON public.feedback;

-- Secure feedback table
-- Previously, 'OR user_id IS NULL' allowed any anonymous user to view ALL anonymous feedback.
-- We restrict it so only authenticated users can view their own feedback.
-- Anonymous users cannot view their submitted feedback list (privacy trade-off for security).
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;

CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);
