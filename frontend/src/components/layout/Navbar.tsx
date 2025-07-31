import { useState, useEffect } from 'react';
import { Search, Settings, Sparkles, Camera, Heart, MessageCircle, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LiveNotifications } from '@/components/notifications/LiveNotifications';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UserSearch from '@/components/search/UserSearch';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email?: string;
  [key: string]: unknown;
}

interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogoClick = () => {
    if (user) {
      navigate('/');
    } else {
      navigate('/landing');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={handleLogoClick}
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Nstyle
            </span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-2">
            {/* Pop-out Search */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSearch(!showSearch)}
                className="rounded-full w-10 h-10 p-0 hover:scale-110 transition-transform"
              >
                <Search className="w-5 h-5" />
              </Button>
              
              {showSearch && (
                <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto glass-card rounded-xl p-4 shadow-xl z-50">
                  <UserSearch currentUserId={user?.id} />
                </div>
              )}
            </div>
            {/* Pop-out Navigation Buttons */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/salon-auth')}
              className="hidden md:flex rounded-full w-10 h-10 p-0 hover:scale-110 transition-transform"
              title="Salon Portal"
            >
              <Sparkles className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/camera')}
              className="rounded-full w-10 h-10 p-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:scale-110 transition-all"
              title="Camera"
            >
              <Camera className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/favorites')}
              className="rounded-full w-10 h-10 p-0 hover:scale-110 transition-transform"
              title="Favorites"
            >
              <Heart className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/messages')}
              className="rounded-full w-10 h-10 p-0 hover:scale-110 transition-transform"
              title="Messages"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>

            <div className="rounded-full hover:scale-110 transition-transform">
              <LiveNotifications />
            </div>

            {/* Profile Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full w-10 h-10 p-0 hover:scale-110 transition-transform"
                  title="Account Menu"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.display_name || profile?.username || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;