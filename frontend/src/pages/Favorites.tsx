import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Favorites = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLikedPosts();
  }, []);

  const fetchLikedPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get posts that the user has liked
      const { data: likedPostIds, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (likesError) throw likesError;

      if (likedPostIds && likedPostIds.length > 0) {
        const postIds = likedPostIds.map(like => like.post_id);
        
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Get user profiles for the posts
        const userIds = [...new Set(posts?.map(post => post.user_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map(
          profiles?.map(profile => [profile.user_id, profile]) || []
        );

        const postsWithProfiles = posts?.map(post => ({
          ...post,
          user: profilesMap.get(post.user_id) || {
            display_name: 'Unknown User',
            username: 'unknown',
            avatar_url: null
          }
        })) || [];

        setLikedPosts(postsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = likedPosts.filter(post =>
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-40 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="container mx-auto px-4 py-4 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Favorites</h1>
          </div>
          <Heart className="w-6 h-6 text-red-500 fill-current" />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-card border-white/10"
          />
        </div>

        {/* Content */}
        {filteredPosts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground">
                Like posts to save them here for later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.user.avatar_url} />
                      <AvatarFallback>
                        {post.user.display_name?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{post.user.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{post.user.username}</p>
                    </div>
                  </div>
                  
                  {post.content && (
                    <p className="text-sm mb-3">{post.content}</p>
                  )}
                  
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post content" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default Favorites;