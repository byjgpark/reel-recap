CREATE TABLE IF NOT EXISTS public.user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  transcript TEXT,
  summary TEXT,
  language TEXT DEFAULT 'English',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON public.user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_created_at ON public.user_history(created_at DESC);

ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Users can view their own history" ON public.user_history;
DROP POLICY IF EXISTS "Users can insert their own history" ON public.user_history;
DROP POLICY IF EXISTS "Users can update their own history" ON public.user_history;
DROP POLICY IF EXISTS "Users can delete their own history" ON public.user_history;

CREATE POLICY "Users can view their own history" ON public.user_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history" ON public.user_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history" ON public.user_history
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own history" ON public.user_history
  FOR DELETE USING (auth.uid() = user_id);
