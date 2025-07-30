-- Enable realtime for existing tables
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create live sessions table for user presence
CREATE TABLE public.live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'viewing', -- 'viewing', 'broadcasting', 'story'
  room_id TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on live sessions
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for live sessions
CREATE POLICY "Users can view active live sessions"
ON public.live_sessions
FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can manage their own live sessions"
ON public.live_sessions
FOR ALL
USING (auth.uid() = user_id);

-- Add realtime for live sessions
ALTER TABLE public.live_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;

-- Update stories table to include live streaming features
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS live_viewers INTEGER DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS stream_key TEXT;

-- Create trigger for updating timestamps
CREATE TRIGGER update_live_sessions_updated_at
BEFORE UPDATE ON public.live_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();