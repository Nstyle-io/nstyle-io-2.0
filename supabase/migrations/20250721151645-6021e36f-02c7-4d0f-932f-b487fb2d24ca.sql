-- Fix the update_hashtag_trends function to avoid DELETE without WHERE clause error
CREATE OR REPLACE FUNCTION public.update_hashtag_trends()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    hashtag_pattern text := '#\w+';
    hashtag_record record;
BEGIN
    -- Clear existing trends with proper WHERE clause
    DELETE FROM public.hashtag_trends WHERE last_updated < now() - interval '1 hour' OR id IS NOT NULL;
    
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
$function$