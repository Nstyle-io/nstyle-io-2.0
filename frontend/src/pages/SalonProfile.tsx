import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, Clock, Star, Camera, Edit, Share2, Heart, MessageCircle, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import BookingModal from '@/components/booking/BookingModal';
import salonInterior from '@/assets/salon-interior.jpg';
import nailArt1 from '@/assets/nail-art-1.jpg';
import heroNails from '@/assets/hero-nails.jpg';

const SalonProfile = () => {
  const navigate = useNavigate();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwner, setIsOwner] = useState(true); // Temporarily set to true for preview
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Check if current user owns this salon (using mock salon id for now)
      if (user) {
        const { data: salonProfile } = await supabase
          .from('salon_profiles')
          .select('owner_id')
          .eq('id', salon.id)
          .single();
        
        setIsOwner(salonProfile?.owner_id === user.id);
      }
    };

    checkOwnership();
  }, []);

  // Mock salon data
  const salon = {
    id: '1',
    name: 'Luxe Nail Studio',
    username: '@luxenailstudio',
    avatar: salonInterior,
    coverImage: salonInterior,
    bio: 'Premium nail salon in the heart of Beverly Hills. Specializing in luxury nail art, gel extensions, and nail care treatments. Book your appointment today! ✨',
    location: 'Beverly Hills, CA',
    phone: '(555) 123-4567',
    rating: 4.9,
    reviewCount: 2847,
    verified: true,
    stats: {
      posts: 127,
      followers: 15600,
      following: 89,
    },
    hours: {
      'Mon-Fri': '9:00 AM - 8:00 PM',
      'Saturday': '9:00 AM - 6:00 PM',
      'Sunday': '10:00 AM - 5:00 PM',
    },
    services: [
      { id: '1', name: 'Gel Extensions', price: '$85', duration: '90 min' },
      { id: '2', name: 'Chrome Nails', price: '$95', duration: '75 min' },
      { id: '3', name: 'Nail Art', price: '$70', duration: '60 min' },
      { id: '4', name: 'Classic Manicure', price: '$45', duration: '45 min' },
    ],
  };

  const posts = [
    { id: '1', image: nailArt1, likes: 234, comments: 12 },
    { id: '2', image: heroNails, likes: 567, comments: 23 },
    { id: '3', image: salonInterior, likes: 891, comments: 45 },
    { id: '4', image: nailArt1, likes: 123, comments: 8 },
    { id: '5', image: heroNails, likes: 456, comments: 19 },
    { id: '6', image: salonInterior, likes: 789, comments: 34 },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 text-white glass-panel"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 z-10 text-white glass-panel"
        >
          <Share2 className="w-5 h-5" />
        </Button>

        {/* Cover Image */}
        <div className="h-48 bg-gradient-primary relative overflow-hidden">
          <img
            src={salon.coverImage}
            alt="Salon cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      </div>

      <div className="px-4 pb-20">
        {/* Profile Section */}
        <div className="relative -mt-16 mb-6">
          <div className="flex items-end space-x-4">
            <div className="relative">
              <img
                src={salon.avatar}
                alt={salon.name}
                className="w-24 h-24 rounded-full border-4 border-background object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1 pb-2">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-xl font-bold text-foreground">{salon.name}</h1>
                {salon.verified && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{salon.username}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-4 glass-card p-4 rounded-xl">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{salon.stats.posts}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{salon.stats.followers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{salon.stats.following}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-xl font-bold text-foreground">{salon.rating}</span>
              </div>
              <div className="text-xs text-muted-foreground">{salon.reviewCount} reviews</div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-foreground mt-4 leading-relaxed">{salon.bio}</p>

          {/* Location & Contact */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{salon.location}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{salon.phone}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            {isOwner ? (
              // Owner view - Show dashboard link
              <Button 
                onClick={() => navigate('/salon-dashboard')}
                className="flex-1 btn-gradient"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Salon
              </Button>
            ) : (
              // Visitor view - Show booking button
              <Button 
                onClick={() => setBookingModalOpen(true)}
                className="flex-1 btn-gradient"
              >
                Book Now
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-6 border-white/20 ${
                isFollowing ? 'bg-primary text-primary-foreground' : 'text-foreground'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button variant="outline" size="icon" className="border-white/20">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 glass-card">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div key={post.id} className="relative aspect-square">
                  <img
                    src={post.image}
                    alt="Post"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <div className="flex items-center space-x-4 text-white text-sm">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {salon.services.map((service) => (
              <div key={service.id} className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{service.name}</h3>
                    <p className="text-muted-foreground text-sm">{service.duration}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{service.price}</div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setBookingModalOpen(true)}
                      className="border-primary/30 text-primary hover:bg-primary/10"
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            <div className="glass-card p-4 rounded-xl">
              <h3 className="font-semibold text-foreground mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Business Hours
              </h3>
              <div className="space-y-2">
                {Object.entries(salon.hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-muted-foreground">{day}</span>
                    <span className="text-foreground">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <h3 className="font-semibold text-foreground mb-3">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Gel Extensions</Badge>
                <Badge variant="secondary">Nail Art</Badge>
                <Badge variant="secondary">Chrome Nails</Badge>
                <Badge variant="secondary">Luxury Manicures</Badge>
                <Badge variant="secondary">Nail Care</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        salon={{
          id: salon.id,
          name: salon.name,
          rating: salon.rating,
          location: salon.location,
          phone: salon.phone,
          image: salon.avatar,
          services: salon.services.map(s => ({
            ...s,
            description: `Professional ${s.name.toLowerCase()} service`,
          })),
        }}
      />
    </div>
  );
};

export default SalonProfile;