-- Fix remaining functions with mutable search paths
-- Update send_notification function to have immutable search path
CREATE OR REPLACE FUNCTION public.send_notification(_user_id UUID, _type TEXT, _content TEXT, _actor_id UUID DEFAULT NULL, _related_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, content, actor_id, related_id)
  VALUES (_user_id, _type, _content, _actor_id, _related_id);
END;
$$;