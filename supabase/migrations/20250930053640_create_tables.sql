-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_logs table for tracking individual requests
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  action TEXT NOT NULL CHECK (action IN ('transcript', 'summary', 'transcript_captcha_verified', 'summary_captcha_verified')),
  video_url TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'other')),
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'rate_limited')),
  error_message TEXT,
  processing_time_ms INTEGER,
  transcript_length INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_usage table for tracking usage counts
CREATE TABLE IF NOT EXISTS public.user_usage (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  transcript_count INTEGER DEFAULT 0,
  summary_count INTEGER DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anonymous_usage table for tracking IP-based usage
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  ip_address INET PRIMARY KEY,
  request_count INTEGER DEFAULT 0,
  last_request TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);