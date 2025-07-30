import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppErrorHandler, withErrorHandling } from '@/utils/error-handling';

export interface Post {
  id: string;
  content: string;
  image_url?: string;
  images?: string[];
  video_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

interface UsePostsOptions {
  currentUserId?: string;
  filterUserId?: string;
  profileView?: boolean;
  hashtag?: string;
  trending?: boolean;
}

export function usePosts(options: UsePostsOptions) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = withErrorHandling(async () => {
    setLoading(true);
    
    const { currentUserId, filterUserId, profileView, hashtag, trending } = options;

    if (trending) {
      return await fetchTrendingPosts();
    }

    // Build query based on filters
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (hashtag) {
      query = query.ilike('content', `%#${hashtag}%`);
    }

    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    } else if (profileView && currentUserId) {
      query = query.eq('user_id', currentUserId);
    }

    const { data: postsData, error: postsError } = await query.limit(20);
    if (postsError) throw postsError;

    const postsWithProfiles = await enrichPostsWithProfiles(postsData || []);
    const postsWithInteractions = currentUserId 
      ? await enrichPostsWithInteractions(postsWithProfiles, currentUserId)
      : postsWithProfiles;

    setPosts(postsWithInteractions);
  }, 'fetchPosts');

  const fetchTrendingPosts = withErrorHandling(async () => {
    const { data, error } = await supabase.rpc('get_trending_posts', { limit_count: 20 });
    if (error) throw error;

    const postsWithProfiles = await Promise.all(
      (data || []).map(async (post: any) => {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('user_id', post.user_id)
          .single();
        
        if (profileError) {
          console.warn(`Failed to fetch profile for user ${post.user_id}:`, profileError);
        }
        
        return {
          ...post,
          profiles: profile || {
            display_name: 'Unknown User',
            username: 'unknown',
            avatar_url: null
          }
        };
      })
    );

    setPosts(postsWithProfiles);
  }, 'fetchTrendingPosts');

  const enrichPostsWithProfiles = withErrorHandling(async (postsData: any[]) => {
    const userIds = [...new Set(postsData.map(post => post.user_id))];
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    const profilesMap = new Map(
      profilesData?.map(profile => [profile.user_id, profile]) || []
    );

    return postsData.map(post => ({
      ...post,
      profiles: profilesMap.get(post.user_id) || {
        display_name: 'Unknown User',
        username: 'unknown',
        avatar_url: null
      }
    }));
  }, 'enrichPostsWithProfiles');

  const enrichPostsWithInteractions = withErrorHandling(async (posts: Post[], userId: string) => {
    const [{ data: likesData }, { data: savedData }] = await Promise.all([
      supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId),
      supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', userId)
    ]);

    const likedPostIds = new Set((likesData || []).map(like => like.post_id));
    const savedPostIds = new Set((savedData || []).map(saved => saved.post_id));
    
    return posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id)
    }));
  }, 'enrichPostsWithInteractions');

  const toggleLike = withErrorHandling(async (postId: string, isLiked: boolean) => {
    if (!options.currentUserId) {
      toast({
        title: "Login required",
        description: "Please login to like posts.",
        variant: "destructive"
      });
      return;
    }

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', options.currentUserId)
        .eq('post_id', postId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: options.currentUserId,
          post_id: postId
        });

      if (error) throw error;
    }

    // Update local state optimistically
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !isLiked,
            likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
          }
        : post
    ));
  }, 'toggleLike');

  const updatePostSaveStatus = (postId: string, saved: boolean) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isSaved: saved }
        : post
    ));
  };

  useEffect(() => {
    fetchPosts().catch((error) => {
      const appError = AppErrorHandler.handleSupabaseError(error);
      toast({
        title: "Error",
        description: appError.message,
        variant: "destructive"
      });
    }).finally(() => {
      setLoading(false);
    });

    // Set up real-time updates
    const channel = supabase
      .channel('posts_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, () => {
        fetchPosts().catch(console.error);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'likes'
      }, () => {
        fetchPosts().catch(console.error);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.currentUserId, options.filterUserId, options.profileView, options.hashtag, options.trending]);

  return {
    posts,
    loading,
    toggleLike,
    updatePostSaveStatus,
    refetch: fetchPosts
  };
}