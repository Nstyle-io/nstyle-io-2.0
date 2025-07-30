-- Security Fix 1: Update database functions to secure search_path
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

-- Fix can_view_post function
CREATE OR REPLACE FUNCTION public.can_view_post(post_user_id UUID, post_visibility TEXT, post_allowed_users TEXT[], viewer_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix can_view_story function
CREATE OR REPLACE FUNCTION public.can_view_story(story_user_id UUID, story_visibility TEXT, story_allowed_users TEXT[], viewer_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix handle_follow_request function
CREATE OR REPLACE FUNCTION public.handle_follow_request()
RETURNS TRIGGER 
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

-- Security Fix 2: Update profile RLS policies to respect privacy settings
-- Drop the overly permissive policy
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

-- Create secure profile viewing policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (is_private = false OR is_private IS NULL);

CREATE POLICY "Private profile owners can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Followers can view private profiles" 
ON public.profiles 
FOR SELECT 
USING (
  is_private = true AND 
  EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = auth.uid() AND following_id = user_id
  )
);

-- Create function to check if user can view private profile details
CREATE OR REPLACE FUNCTION public.can_view_private_profile_details(profile_user_id UUID, profile_is_private BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If profile is not private, anyone can view
  IF profile_is_private = false OR profile_is_private IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Profile owner can always view their own details
  IF profile_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- Check if viewer follows the private profile owner
  RETURN EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = auth.uid() AND following_id = profile_user_id
  );
END;
$$;