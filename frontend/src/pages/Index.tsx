import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import StoryBar from '@/components/feed/StoryBar';
import PostCard from '@/components/feed/PostCard';
import TrendingSection from '@/components/feed/TrendingSection';
import AIChatBubble from '@/components/ai/AIChatBubble';
import BookingModal from '@/components/booking/BookingModal';
import SlidingNavigation from '@/components/navigation/SlidingNavigation';
import { SocialFeed } from '@/components/social/SocialFeed';
import { supabase } from '@/integrations/supabase/client';
import heroNails from '@/assets/hero-nails.jpg';
import nailArt1 from '@/assets/nail-art-1.jpg';
import salonInterior from '@/assets/salon-interior.jpg';

// Real posts data will be fetched from the database
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

const Index = () => {
  const navigate = useNavigate();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('for-you');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const navigationItems = [
    { id: 'for-you', label: 'For You', count: 120 },
    { id: 'trending', label: 'Trending', count: 89 },
    { id: 'nail-art', label: 'Nail Art', count: 234 },
    { id: 'salons', label: 'Salons', count: 156 },
    { id: 'tutorials', label: 'Tutorials', count: 67 },
    { id: 'products', label: 'Products', count: 98 },
    { id: 'events', label: 'Events', count: 23 },
  ];

  return (
    <ResponsiveLayout>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <TrendingSection />
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6">
              <div className="space-y-6">
                {/* Category Navigation */}
                <div className="glass-card rounded-2xl p-4">
                  <SlidingNavigation
                    items={navigationItems}
                    activeId={activeCategory}
                    onItemClick={setActiveCategory}
                  />
                </div>

                {/* Dynamic Content Based on Active Category */}
                {activeCategory === 'for-you' && (
                  <>
                    {/* Stories */}
                    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in">
                      <StoryBar />
                    </div>

                    {/* Posts */}
                    <div className="animate-slide-up">
                      <SocialFeed currentUserId={currentUserId} />
                    </div>
                  </>
                )}

                {activeCategory === 'trending' && (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl p-6 animate-slide-up">
                      <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
                      <SocialFeed currentUserId={currentUserId} trending={true} />
                    </div>
                  </div>
                )}

                {activeCategory === 'products' && (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl p-6 animate-slide-up">
                      <h2 className="text-2xl font-bold mb-6">Shop Products</h2>
                      
                      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
                        <div className="bg-gradient-primary rounded-full px-4 py-2 text-white font-medium whitespace-nowrap transition-smooth hover:scale-105">All</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap hover:bg-muted/80 transition-smooth cursor-pointer">Polish</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap hover:bg-muted/80 transition-smooth cursor-pointer">Tools</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap hover:bg-muted/80 transition-smooth cursor-pointer">Care</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap hover:bg-muted/80 transition-smooth cursor-pointer">Accessories</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card rounded-xl p-4 card-interactive">
                          <div className="aspect-square bg-muted rounded-lg mb-3 relative animate-fade-in">
                            <div className="absolute top-2 left-2">
                              <span className="bg-gradient-primary text-white text-xs px-2 py-1 rounded-full">Bestseller</span>
                            </div>
                          </div>
                          <h3 className="font-semibold truncate">Professional Powder Set</h3>
                          <div className="flex items-center space-x-1 text-sm text-yellow-400 mb-2">
                            <span>⭐</span>
                            <span>4.8 (324)</span>
                          </div>
                          <p className="text-lg font-bold">$45.99</p>
                        </div>
                        
                        <div className="glass-card rounded-xl p-4 card-interactive">
                          <div className="aspect-square bg-muted rounded-lg mb-3 relative animate-fade-in" style={{animationDelay: '0.1s'}}>
                            <div className="absolute top-2 left-2">
                              <span className="bg-gradient-primary text-white text-xs px-2 py-1 rounded-full">Pro Choice</span>
                            </div>
                          </div>
                          <h3 className="font-semibold truncate">Gel X Extension Kit</h3>
                          <div className="flex items-center space-x-1 text-sm text-yellow-400 mb-2">
                            <span>⭐</span>
                            <span>4.9 (567)</span>
                          </div>
                          <p className="text-lg font-bold">$89.99</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeCategory === 'tutorials' && (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl p-6">
                      <h2 className="text-2xl font-bold mb-6">Learn & Create</h2>
                      
                      <div className="flex gap-2 mb-6 overflow-x-auto">
                        <div className="bg-gradient-primary rounded-full px-4 py-2 text-white font-medium whitespace-nowrap">All Levels</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap">Beginner</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap">Intermediate</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap">Advanced</div>
                      </div>

                      <div className="glass-card rounded-xl overflow-hidden">
                        <div className="aspect-video bg-muted flex items-center justify-center relative">
                          <div className="absolute top-3 left-3">
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Beginner</span>
                          </div>
                          <div className="absolute bottom-3 right-3">
                            <span className="bg-black/50 text-white text-sm px-2 py-1 rounded">3:45</span>
                          </div>
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[18px] border-b-white ml-1"></div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg mb-1">Perfect French Manicure in 5 Steps</h3>
                          <p className="text-muted-foreground text-sm mb-2">by NailPro</p>
                          <p className="text-sm text-muted-foreground">1.2M views</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeCategory === 'events' && (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl p-6">
                      <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
                      
                      <div className="flex gap-2 mb-6 overflow-x-auto">
                        <div className="bg-gradient-primary rounded-full px-4 py-2 text-white font-medium whitespace-nowrap">All Events</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap">Near Me</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap">Online</div>
                        <div className="bg-muted rounded-full px-4 py-2 text-muted-foreground whitespace-nowrap">This Week</div>
                      </div>

                      <div className="glass-card rounded-xl overflow-hidden">
                        <div className="aspect-video bg-muted flex items-center justify-center relative">
                          <div className="absolute top-3 right-3">
                            <button className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                              <span className="text-white">🔖</span>
                            </button>
                          </div>
                          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-2xl">🎨</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg mb-1">International Nail Art Convention 2025</h3>
                          <p className="text-muted-foreground text-sm mb-1">Jan 15-17, 2025</p>
                          <p className="text-muted-foreground text-sm">Los Angeles Convention Center</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeCategory === 'salons' && (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl p-6">
                      <h2 className="text-2xl font-bold mb-6">Featured Salons</h2>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 glass-card rounded-xl">
                          <img
                            src={salonInterior}
                            alt="Salon"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold">Luxe Nail Studio</h3>
                            <p className="text-sm text-muted-foreground">Los Angeles, CA</p>
                            <div className="flex items-center space-x-1 text-sm">
                              <span className="text-yellow-400">⭐</span>
                              <span>4.9 (234 reviews)</span>
                            </div>
                          </div>
                          <button className="btn-gradient px-4 py-2 rounded-lg text-sm">
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeCategory === 'nail-art' && (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in">
                      <StoryBar />
                    </div>
                    
                    <div className="animate-slide-up">
                      <SocialFeed currentUserId={currentUserId} />
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Right Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 space-y-6">
                <AIChatBubble />
                <div className="glass-card p-4 rounded-2xl">
                  <h3 className="font-bold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setBookingModalOpen(true)}
                      className="w-full btn-gradient text-left"
                    >
                      Book Appointment
                    </button>
                    <button 
                      onClick={() => navigate('/discover')}
                      className="w-full glass-card p-3 rounded-lg text-left hover:border-primary/30 transition-colors"
                    >
                      Find Salons Near Me
                    </button>
                    <button className="w-full glass-card p-3 rounded-lg text-left hover:border-primary/30 transition-colors">
                      Nail Care Tips
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BookingModal temporarily removed - needs real salon data */}
    </ResponsiveLayout>
  );
};

export default Index;
