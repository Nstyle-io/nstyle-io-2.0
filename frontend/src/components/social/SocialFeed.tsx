import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { PostActions } from './PostActions';
import { CommentSection } from './CommentSection';
import { PostCarousel } from '../feed/PostCarousel';
import { useNavigate } from 'react-router-dom';

interface Post {
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

interface SocialFeedProps {
  currentUserId?: string;
  filterUserId?: string;
  profileView?: boolean;
  hashtag?: string;
  trending?: boolean;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ currentUserId, filterUserId, profileView = false, hashtag, trending = false }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
    
    // Set up real-time updates for new posts
    const channel = supabase
      .channel('posts_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, () => {
        fetchPosts();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'likes'
      }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, filterUserId, profileView, hashtag, trending]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      if (trending) {
        // Use trending posts function
        const { data, error } = await supabase.rpc('get_trending_posts', { limit_count: 20 });
        
        if (error) {
          console.error('Error fetching trending posts:', error);
          return;
        }

        // Get profile information for trending posts
        const postsWithProfiles = await Promise.all(
          (data || []).map(async (post: any) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, display_name, avatar_url')
              .eq('user_id', post.user_id)
              .single();
            
            return {
              ...post,
              profiles: profile
            };
          })
        );

        setPosts(postsWithProfiles);
        return;
      }

      // Build query based on profileView and filters
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by hashtag if provided
      if (hashtag) {
        query = query.ilike('content', `%#${hashtag}%`);
      }

      // Filter by specific user if filterUserId is provided
      if (filterUserId) {
        query = query.eq('user_id', filterUserId);
      }
      // Otherwise, if profileView is true and we have a currentUserId, only fetch that user's posts  
      else if (profileView && currentUserId) {
        query = query.eq('user_id', currentUserId);
      }

      const { data: postsData, error: postsError } = await query.limit(20);

      if (postsError) throw postsError;

      // Get unique user IDs from posts
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.user_id, profile]) || []
      );

      // Combine posts with profiles
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: profilesMap.get(post.user_id) || {
          display_name: 'Unknown User',
          username: 'unknown',
          avatar_url: null
        }
      })) || [];

      // Check which posts the current user has liked and saved
      let postsWithInteractions = postsWithProfiles;
      if (currentUserId) {
        const [{ data: likesData }, { data: savedData }] = await Promise.all([
          supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', currentUserId),
          supabase
            .from('saved_posts')
            .select('post_id')
            .eq('user_id', currentUserId)
        ]);

        const likedPostIds = new Set((likesData || []).map(like => like.post_id));
        const savedPostIds = new Set((savedData || []).map(saved => saved.post_id));
        
        postsWithInteractions = postsWithProfiles.map(post => ({
          ...post,
          isLiked: likedPostIds.has(post.id),
          isSaved: savedPostIds.has(post.id)
        }));
      }

      setPosts(postsWithInteractions);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUserId) {
      toast({
        title: "Login required",
        description: "Please login to like posts.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', postId);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: currentUserId,
            post_id: postId
          });

        if (error) throw error;
      }

      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !isLiked,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
            }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleSaveToggle = (postId: string, saved: boolean) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isSaved: saved }
        : post
    ));
  };

  const handleProfileClick = (userId: string) => {
    if (userId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/6"></div>
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-40 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="glass-card animate-fade-in">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-muted/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce-in">
            <div className="w-8 h-8 bg-muted/40 rounded"></div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">
            {hashtag 
              ? `No posts found for #${hashtag}`
              : trending 
                ? "No trending posts available"
                : "Follow some users or create your first post to see content here!"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {posts.map((post, index) => (
        <Card key={post.id} className="feed-post animate-fade-in-delayed" style={{ animationDelay: `${index * 0.1}s` }}>
          <CardContent className="p-3 sm:p-4">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-smooth hover:scale-105"
                onClick={() => handleProfileClick(post.user_id)}
              >
                <Avatar className="w-10 h-10 transition-smooth hover:scale-110">
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback>
                    {post.profiles?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm hover:text-primary transition-smooth">
                    {post.profiles?.display_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{post.profiles?.username} • {formatDistanceToNow(new Date(post.created_at))} ago
                  </p>
                </div>
              </div>
            </div>

            {/* Post Content */}
            {post.content && (
              <p className="mb-4 text-sm leading-relaxed">{post.content}</p>
            )}

            {/* Post Media */}
            {(post.images && post.images.length > 0) ? (
              <PostCarousel images={post.images} className="mb-4" />
            ) : post.image_url ? (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src={post.image_url} 
                  alt="Post content" 
                  className="w-full h-auto max-h-80 sm:max-h-96 object-cover transition-smooth hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : null}

            {post.video_url && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <video 
                  src={post.video_url} 
                  controls 
                  className="w-full h-auto max-h-80 sm:max-h-96 object-cover transition-smooth"
                  preload="metadata"
                />
              </div>
            )}

            {/* Post Actions */}
            <PostActions
              postId={post.id}
              postUserId={post.user_id}
              currentUserId={currentUserId}
              likesCount={post.likes_count}
              commentsCount={post.comments_count}
              isLiked={post.isLiked || false}
              isSaved={post.isSaved || false}
              onLike={() => handleLike(post.id, post.isLiked || false)}
              onComment={() => toggleComments(post.id)}
              onSaveToggle={(saved) => handleSaveToggle(post.id, saved)}
              onPostDeleted={() => fetchPosts()}
            />

            {/* Comment Section */}
            <div className={expandedComments.has(post.id) ? "animate-slide-up" : ""}>
              <CommentSection
                postId={post.id}
                currentUserId={currentUserId}
                isOpen={expandedComments.has(post.id)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};