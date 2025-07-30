-- Fix search path security issue for all functions
-- Update all functions to have immutable search paths

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Fix handle_follow_request function
CREATE OR REPLACE FUNCTION public.handle_follow_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix handle_like_notification function
CREATE OR REPLACE FUNCTION public.handle_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  post_owner_id UUID;
  actor_name TEXT;
BEGIN
  -- Get post owner ID
  SELECT user_id INTO post_owner_id 
  FROM public.posts 
  WHERE id = NEW.post_id;
  
  -- Don't notify if user liked their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get actor display name
  SELECT COALESCE(display_name, username, 'Someone') INTO actor_name
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- Send notification
  PERFORM public.send_notification(
    post_owner_id,
    'like',
    actor_name || ' liked your post',
    NEW.user_id,
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$;

-- Fix handle_comment_notification function
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  post_owner_id UUID;
  actor_name TEXT;
BEGIN
  -- Get post owner ID
  SELECT user_id INTO post_owner_id 
  FROM public.posts 
  WHERE id = NEW.post_id;
  
  -- Don't notify if user commented on their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get actor display name
  SELECT COALESCE(display_name, username, 'Someone') INTO actor_name
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- Send notification
  PERFORM public.send_notification(
    post_owner_id,
    'comment',
    actor_name || ' commented on your post',
    NEW.user_id,
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$;

-- Fix update_conversation_last_message function
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Fix update_post_likes_count function
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix update_post_comments_count function
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trending posts function
CREATE OR REPLACE FUNCTION public.get_trending_posts(limit_count integer DEFAULT 10)
RETURNS TABLE (
    id uuid,
    content text,
    image_url text,
    video_url text,
    user_id uuid,
    created_at timestamp with time zone,
    likes_count integer,
    comments_count integer,
    trend_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.image_url,
    p.video_url,
    p.user_id,
    p.created_at,
    p.likes_count,
    p.comments_count,
    -- Calculate trend score based on likes, comments, and recency
    (
      COALESCE(p.likes_count, 0) * 1.0 + 
      COALESCE(p.comments_count, 0) * 2.0 +
      -- Boost recent posts (posts from last 7 days get higher score)
      CASE 
        WHEN p.created_at > now() - interval '7 days' THEN 50
        WHEN p.created_at > now() - interval '30 days' THEN 25
        ELSE 0
      END
    )::numeric as trend_score
  FROM public.posts p
  WHERE p.visibility = 'public'
    AND (p.likes_count > 0 OR p.comments_count > 0)
  ORDER BY trend_score DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create hashtag trends table and function
CREATE TABLE IF NOT EXISTS public.hashtag_trends (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hashtag text NOT NULL UNIQUE,
    post_count integer DEFAULT 0,
    trend_score numeric DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on hashtag_trends
ALTER TABLE public.hashtag_trends ENABLE ROW LEVEL SECURITY;

-- Create policy for hashtag_trends (read-only for all users)
CREATE POLICY "Anyone can view hashtag trends" 
ON public.hashtag_trends 
FOR SELECT 
USING (true);

-- Function to update hashtag trends
CREATE OR REPLACE FUNCTION public.update_hashtag_trends()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    hashtag_pattern text := '#\w+';
    hashtag_record record;
BEGIN
    -- Clear existing trends
    DELETE FROM public.hashtag_trends;
    
    -- Extract and count hashtags from posts
    INSERT INTO public.hashtag_trends (hashtag, post_count, trend_score, last_updated)
    SELECT 
        LOWER(regexp_replace(hashtag, '#', '')) as hashtag,
        COUNT(*) as post_count,
        -- Calculate trend score based on post count and recency
        (COUNT(*) * 10 + 
         SUM(CASE 
             WHEN p.created_at > now() - interval '7 days' THEN 50
             WHEN p.created_at > now() - interval '30 days' THEN 25
             ELSE 5
         END))::numeric as trend_score,
        now() as last_updated
    FROM (
        SELECT 
            p.created_at,
            unnest(regexp_split_to_array(p.content, '\s+')) as hashtag
        FROM public.posts p
        WHERE p.content IS NOT NULL 
          AND p.visibility = 'public'
          AND p.created_at > now() - interval '90 days'
    ) p
    WHERE hashtag ~ '^#\w+$'
    GROUP BY LOWER(regexp_replace(hashtag, '#', ''))
    HAVING COUNT(*) > 0
    ORDER BY trend_score DESC;
END;
$$;

-- Function to get trending hashtags
CREATE OR REPLACE FUNCTION public.get_trending_hashtags(limit_count integer DEFAULT 10)
RETURNS TABLE (
    hashtag text,
    post_count integer,
    trend_score numeric,
    is_trending boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Update trends first
    PERFORM public.update_hashtag_trends();
    
    RETURN QUERY
    SELECT 
        ht.hashtag,
        ht.post_count,
        ht.trend_score,
        (ht.trend_score > 100)::boolean as is_trending
    FROM public.hashtag_trends ht
    ORDER BY ht.trend_score DESC, ht.post_count DESC
    LIMIT limit_count;
END;
$$;