-- Feature Interest Clicks Table
-- Used for "fake door" testing to validate user interest before building features

CREATE TABLE IF NOT EXISTS public.feature_interest_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by feature
CREATE INDEX IF NOT EXISTS idx_feature_interest_feature ON public.feature_interest_clicks(feature);
CREATE INDEX IF NOT EXISTS idx_feature_interest_timestamp ON public.feature_interest_clicks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feature_interest_user_id ON public.feature_interest_clicks(user_id);

-- Enable RLS
ALTER TABLE public.feature_interest_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert from authenticated and anonymous users (for tracking)
CREATE POLICY "Allow insert for all users" ON public.feature_interest_clicks
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only allow select for service role (admin access via API)
CREATE POLICY "Allow select for service role only" ON public.feature_interest_clicks
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT INSERT ON public.feature_interest_clicks TO anon;
GRANT INSERT ON public.feature_interest_clicks TO authenticated;
GRANT ALL ON public.feature_interest_clicks TO service_role;
