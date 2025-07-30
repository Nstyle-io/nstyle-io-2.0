import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Users, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import PostCard from '@/components/feed/PostCard';

const SearchResults = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock search results
  const [results] = useState({
    posts: [
      {
        id: '1',
        user: { username: 'sarahnails', avatar: '/placeholder.svg', verified: true, type: 'user' as const },
        content: {
          images: ['/placeholder.svg'],
          caption: 'Pink gradient nails with glitter accent ✨ #pinkstyle #nails',
          tags: ['pinkstyle', 'nails', 'gradient']
        },
        engagement: { likes: 324, comments: 15, saves: 48 },
        timestamp: '2h'
      },
      {
        id: '2',
        user: { username: 'emmaw', avatar: '/placeholder.svg', verified: false, type: 'user' as const },
        content: {
          images: ['/placeholder.svg'],
          caption: 'Matte black with gold details 🖤✨ #blacknails #gold',
          tags: ['blacknails', 'gold', 'matte']
        },
        engagement: { likes: 189, comments: 8, saves: 23 },
        timestamp: '4h'
      }
    ],
    users: [
      {
        id: 1,
        name: 'Sarah Johnson',
        username: 'sarahnails',
        avatar: '/placeholder.svg',
        followers: '12.5K',
        bio: '💅 Nail enthusiast | Pink lover',
        isFollowing: false
      },
      {
        id: 2,
        name: 'Nail Studio NYC',
        username: 'nailstudionyc',
        avatar: '/placeholder.svg',
        followers: '45K',
        bio: '🏢 Professional nail salon in Manhattan',
        isFollowing: true,
        isBusiness: true
      }
    ],
    salons: [
      {
        id: 1,
        name: 'Glamour Nails Spa',
        image: '/placeholder.svg',
        rating: 4.8,
        reviews: 234,
        location: 'Manhattan, NY',
        distance: '0.5 miles',
        priceRange: '$$',
        specialties: ['Gel Manicure', 'Nail Art', 'Pedicure']
      },
      {
        id: 2,
        name: 'Pink Paradise Nails',
        image: '/placeholder.svg',
        rating: 4.6,
        reviews: 156,
        location: 'Brooklyn, NY',
        distance: '2.1 miles',
        priceRange: '$',
        specialties: ['French Manicure', 'Acrylic Nails']
      }
    ],
    hashtags: [
      { tag: 'pinkstyle', posts: 15420 },
      { tag: 'pinknails', posts: 8930 },
      { tag: 'pinkmanicure', posts: 3240 }
    ]
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <main className="pt-16 pb-20 md:pb-4">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Search Header */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for posts, users, or salons..."
                  className="pl-10 glass-card"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </form>

            {initialQuery && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Results for "<span className="text-foreground font-medium">{initialQuery}</span>"
                </p>
                <div className="flex items-center space-x-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 glass-card">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="salons">Salons</TabsTrigger>
              <TabsTrigger value="hashtags">Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-8">
                {/* Top Results */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.posts.slice(0, 2).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>

                {/* Users */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">People</h3>
                  <div className="space-y-3">
                    {results.users.slice(0, 3).map((user) => (
                      <div key={user.id} className="glass-card p-4 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold">{user.name}</h4>
                                {user.isBusiness && (
                                  <Badge variant="secondary">Business</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                              <p className="text-sm text-muted-foreground">{user.followers} followers</p>
                            </div>
                          </div>
                          <Button 
                            variant={user.isFollowing ? 'outline' : 'default'}
                            size="sm"
                          >
                            {user.isFollowing ? 'Following' : 'Follow'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="posts" className="mt-6">
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <div className="space-y-3">
                {results.users.map((user) => (
                  <div key={user.id} className="glass-card p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{user.name}</h4>
                            {user.isBusiness && (
                              <Badge variant="secondary">Business</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.bio}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Users className="w-3 h-3 inline mr-1" />
                            {user.followers} followers
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant={user.isFollowing ? 'outline' : 'default'}
                        size="sm"
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="salons" className="mt-6">
              <div className="space-y-4">
                {results.salons.map((salon) => (
                  <div key={salon.id} className="glass-card p-4 rounded-2xl">
                    <div className="flex items-start space-x-4">
                      <img 
                        src={salon.image} 
                        alt={salon.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{salon.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                <span className="text-sm ml-1">{salon.rating}</span>
                                <span className="text-sm text-muted-foreground ml-1">
                                  ({salon.reviews} reviews)
                                </span>
                              </div>
                              <Badge variant="outline">{salon.priceRange}</Badge>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {salon.location} • {salon.distance}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {salon.specialties.map((specialty, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Button size="sm">Book Now</Button>
                            <Button variant="outline" size="sm">View Profile</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="hashtags" className="mt-6">
              <div className="space-y-3">
                {results.hashtags.map((hashtag, index) => (
                  <Link 
                    key={index}
                    to={`/hashtag/${hashtag.tag}`}
                    className="glass-card p-4 rounded-2xl block hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">#{hashtag.tag}</h4>
                        <p className="text-sm text-muted-foreground">
                          {hashtag.posts.toLocaleString()} posts
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg" />
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SearchResults;