-- Add privacy fields to posts table
ALTER TABLE public.posts ADD COLUMN visibility TEXT DEFAULT 'public';
ALTER TABLE public.posts ADD COLUMN allowed_users TEXT[];

-- Add privacy fields to profiles table
ALTER TABLE public.profiles ADD COLUMN is_private BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN allow_messages_from TEXT DEFAULT 'everyone';
ALTER TABLE public.profiles ADD COLUMN story_visibility TEXT DEFAULT 'public';
ALTER TABLE public.profiles ADD COLUMN show_email_publicly BOOLEAN DEFAULT false;

-- Create follow_requests table for private account approvals
CREATE TABLE public.follow_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  requested_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, requested_id)
);

-- Create stories table for 24-hour content
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  visibility TEXT DEFAULT 'public',
  allowed_users TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_views table to track who viewed stories
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS on new tables
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Create policies for follow_requests
CREATE POLICY "Users can view follow requests involving them" 
ON public.follow_requests 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = requested_id);

CREATE POLICY "Users can create follow requests" 
ON public.follow_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update requests they received" 
ON public.follow_requests 
FOR UPDATE 
USING (auth.uid() = requested_id);

CREATE POLICY "Users can delete their own requests" 
ON public.follow_requests 
FOR DELETE 
USING (auth.uid() = requester_id);

-- Create function to check if user can see posts based on privacy
CREATE OR REPLACE FUNCTION public.can_view_post(post_user_id UUID, post_visibility TEXT, post_allowed_users TEXT[], viewer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Public posts are visible to everyone
  IF post_visibility = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Private posts only visible to author
  IF post_visibility = 'private' THEN
    RETURN post_user_id = viewer_id;
  END IF;
  
  -- Custom visibility - check allowed users
  IF post_visibility = 'custom' THEN
    RETURN post_user_id = viewer_id OR viewer_id::text = ANY(post_allowed_users);
  END IF;
  
  -- Followers only - check if viewer follows the author
  IF post_visibility = 'followers' THEN
    IF post_user_id = viewer_id THEN
      RETURN TRUE;
    END IF;
    
    -- Check if viewer follows the author
    RETURN EXISTS (
      SELECT 1 FROM public.follows 
      WHERE follower_id = viewer_id AND following_id = post_user_id
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can see stories
CREATE OR REPLACE FUNCTION public.can_view_story(story_user_id UUID, story_visibility TEXT, story_allowed_users TEXT[], viewer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Same logic as posts but for stories
  IF story_visibility = 'public' THEN
    RETURN TRUE;
  END IF;
  
  IF story_visibility = 'private' THEN
    RETURN story_user_id = viewer_id;
  END IF;
  
  IF story_visibility = 'custom' THEN
    RETURN story_user_id = viewer_id OR viewer_id::text = ANY(story_allowed_users);
  END IF;
  
  IF story_visibility = 'followers' THEN
    IF story_user_id = viewer_id THEN
      RETURN TRUE;
    END IF;
    
    RETURN EXISTS (
      SELECT 1 FROM public.follows 
      WHERE follower_id = viewer_id AND following_id = story_user_id
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update posts policies to respect privacy settings
DROP POLICY "Users can view all posts" ON public.posts;
CREATE POLICY "Users can view posts based on privacy settings" 
ON public.posts 
FOR SELECT 
USING (
  public.can_view_post(user_id, visibility, allowed_users, auth.uid())
);

-- Create policies for stories
CREATE POLICY "Users can view stories based on privacy settings" 
ON public.stories 
FOR SELECT 
USING (
  expires_at > now() AND 
  public.can_view_story(user_id, visibility, allowed_users, auth.uid())
);

CREATE POLICY "Users can create their own stories" 
ON public.stories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" 
ON public.stories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON public.stories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for story views
CREATE POLICY "Users can view story views for their own stories" 
ON public.story_views 
FOR SELECT 
USING (
  story_id IN (
    SELECT id FROM public.stories WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can record story views" 
ON public.story_views 
FOR INSERT 
WITH CHECK (auth.uid() = viewer_id);

-- Update follows policies to handle private accounts
DROP POLICY "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow public accounts or have approved requests" 
ON public.follows 
FOR INSERT 
WITH CHECK (
  auth.uid() = follower_id AND (
    -- Following public accounts is allowed
    NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = following_id AND is_private = true
    ) OR
    -- Or there's an approved follow request
    EXISTS (
      SELECT 1 FROM public.follow_requests 
      WHERE requester_id = follower_id 
      AND requested_id = following_id 
      AND status = 'approved'
    )
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_follow_requests_updated_at
  BEFORE UPDATE ON public.follow_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-approve follow requests for public accounts
CREATE OR REPLACE FUNCTION public.handle_follow_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the requested user has a private account
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = NEW.requested_id AND is_private = true
  ) THEN
    -- Private account - leave request pending
    RETURN NEW;
  ELSE
    -- Public account - auto-approve and create follow relationship
    NEW.status := 'approved';
    NEW.updated_at := now();
    
    -- Insert into follows table
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.requester_id, NEW.requested_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-approving follow requests
CREATE TRIGGER auto_approve_follow_requests
  BEFORE INSERT ON public.follow_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_request();