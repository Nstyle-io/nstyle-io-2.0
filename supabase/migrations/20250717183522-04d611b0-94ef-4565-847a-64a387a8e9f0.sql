-- Create saved posts table for 3-dot menu save functionality
CREATE TABLE public.saved_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on saved_posts
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_posts
CREATE POLICY "Users can save posts" 
ON public.saved_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their saved posts" 
ON public.saved_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved posts" 
ON public.saved_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to send notifications
CREATE OR REPLACE FUNCTION public.send_notification(_user_id UUID, _type TEXT, _content TEXT, _actor_id UUID DEFAULT NULL, _related_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, content, actor_id, related_id)
  VALUES (_user_id, _type, _content, _actor_id, _related_id);
END;
$$;

-- Create trigger function for like notifications
CREATE OR REPLACE FUNCTION public.handle_like_notification()
RETURNS TRIGGER
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

-- Create trigger function for comment notifications
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER
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

-- Create triggers for notifications
CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_like_notification();

CREATE TRIGGER trigger_comment_notification
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_notification();