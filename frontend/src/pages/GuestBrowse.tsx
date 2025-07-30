import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, MessageCircle, Share, Eye, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import heroNails from '@/assets/hero-nails.jpg';
import nailArt1 from '@/assets/nail-art-1.jpg';
import salonInterior from '@/assets/salon-interior.jpg';

interface Post {
  id: string;
  user_id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    user_type?: string;
  };
}

const GuestBrowse = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Sample posts for demo when no real posts available
  const samplePosts = [
    {
      id: 'sample-1',
      user_id: 'sample',
      content: 'Loving this gradient sunset design! Perfect for summer vibes ✨',
      image_url: heroNails,
      likes_count: 1240,
      comments_count: 89,
      created_at: new Date().toISOString(),
      profiles: {
        username: 'nailartist_pro',
        display_name: 'Nail Artist Pro',
        avatar_url: undefined,
        user_type: 'user'
      }
    },
    {
      id: 'sample-2', 
      user_id: 'sample',
      content: 'Classic French tips never go out of style! Who else agrees? 💅',
      image_url: nailArt1,
      likes_count: 856,
      comments_count: 34,
      created_at: new Date().toISOString(),
      profiles: {
        username: 'glam_nails_studio',
        display_name: 'Glam Nails Studio',
        avatar_url: undefined,
        user_type: 'salon'
      }
    },
    {
      id: 'sample-3',
      user_id: 'sample',
      content: 'Our new chrome powder collection is here! Book your appointment today ✨',
      image_url: salonInterior,
      likes_count: 2103,
      comments_count: 156,
      created_at: new Date().toISOString(),
      profiles: {
        username: 'luxe_nail_spa',
        display_name: 'Luxe Nail Spa',
        avatar_url: undefined,
        user_type: 'salon'
      }
    }
  ];

  useEffect(() => {
    fetchPublicPosts();
  }, []);

  useEffect(() => {
    // Filter posts based on search query
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = posts.filter(post => {
      // Search by post ID
      if (post.id.toLowerCase().includes(query)) return true;
      
      // Search by content
      if (post.content?.toLowerCase().includes(query)) return true;
      
      // Search by username
      if (post.profiles?.username?.toLowerCase().includes(query)) return true;
      
      // Search by display name
      if (post.profiles?.display_name?.toLowerCase().includes(query)) return true;
      
      // Search by hashtags in content
      const hashtags = post.content?.match(/#\w+/g) || [];
      if (hashtags.some(tag => tag.toLowerCase().includes(query))) return true;
      
      return false;
    });
    
    setFilteredPosts(filtered);
  }, [searchQuery, posts]);

  const fetchPublicPosts = async () => {
    try {
      // Try to fetch some public posts
      const { data: publicPosts, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          image_url,
          video_url,
          likes_count,
          comments_count,
          created_at,
          visibility,
          profiles (
            username,
            display_name,
            avatar_url,
            user_type
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching posts:', error);
        // Use sample posts if there's an error
        setPosts(samplePosts);
        setFilteredPosts(samplePosts);
      } else if (publicPosts && publicPosts.length > 0) {
        setPosts(publicPosts);
        setFilteredPosts(publicPosts);
      } else {
        // Use sample posts if no real posts available
        setPosts(samplePosts);
        setFilteredPosts(samplePosts);
      }
    } catch (error) {
      console.error('Error:', error);
      setPosts(samplePosts);
      setFilteredPosts(samplePosts);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAction = () => {
    toast({
      title: "Join Nstyle to Interact",
      description: "Sign up or log in to like, comment, and share posts!",
      action: (
        <Link to="/signup">
          <Button size="sm">Sign Up</Button>
        </Link>
      ),
    });
  };

  const handleShare = async (postId: string) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "The post link has been copied to your clipboard.",
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Link Copied!",
        description: "The post link has been copied to your clipboard.",
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Nstyle
            </span>
          </Link>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by username, content, tags, or post ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full bg-background/50 border-border/50"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Guest Banner */}
      <div className="pt-16 bg-gradient-primary/10 border-b border-border/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">
                You're browsing as a guest. Join to interact with posts!
              </span>
            </div>
            <Link to="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Sign Up
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Discover Amazing Nail Art</h1>
            <p className="text-muted-foreground">
              See what our community is creating. Join to share your own designs!
            </p>
          </div>

          {filteredPosts.length === 0 && searchQuery ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try searching with different keywords or browse all posts
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            filteredPosts.map((post) => (
            <div key={post.id} className="glass-card rounded-2xl overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                  {post.profiles?.avatar_url ? (
                    <img 
                      src={post.profiles.avatar_url} 
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {post.profiles?.display_name?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-sm">
                      {post.profiles?.display_name || 'Nail Artist'}
                    </h3>
                    {post.profiles?.user_type === 'salon' && (
                      <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                        Salon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    @{post.profiles?.username || 'username'} • {formatTimeAgo(post.created_at)}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              {post.content && (
                <div className="px-4 pb-3">
                  <p className="text-sm leading-relaxed">{post.content}</p>
                </div>
              )}

              {/* Post Image */}
              {post.image_url && (
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={post.image_url} 
                    alt="Nail art"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="p-4 border-t border-border/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-6">
                    <button 
                      onClick={handleGuestAction}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">{post.likes_count}</span>
                    </button>
                    <button 
                      onClick={handleGuestAction}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comments_count}</span>
                    </button>
                    <button 
                      onClick={() => handleShare(post.id)}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Share className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {post.likes_count} likes • {post.comments_count} comments
                </div>
              </div>
            </div>
          ))
          )}

          {/* Join CTA */}
          <div className="glass-card rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Join the Nail Art Community
            </h3>
            <p className="text-muted-foreground mb-6">
              Sign up to share your own designs, follow your favorite artists, 
              and connect with nail enthusiasts worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Sign Up Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  I Have an Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestBrowse;