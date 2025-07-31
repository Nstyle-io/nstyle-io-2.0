import { useState, useEffect } from 'react';
import { Home, Search, Plus, User, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  id: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'For You', id: 'home', path: '/' },
  { icon: Search, label: 'Discover', id: 'search', path: '/discover' },
  { icon: Palette, label: 'Designer', id: 'designer', path: '/nail-designer' },
  { icon: Plus, label: 'Create', id: 'create', path: '/create' },
  { icon: User, label: 'Profile', id: 'profile', path: '/profile' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = navItems.find(item => item.path === currentPath);
    if (activeItem) {
      setActiveTab(activeItem.id);
    }
  }, [location]);

  const handleNavigation = (item: NavItem) => {
    setActiveTab(item.id);
    navigate(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isCamera = item.id === 'camera';
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item)}
              className={`flex-1 flex-col h-14 space-y-1 ${
                (isActive && !isCamera)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              } ${
                isCamera
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:text-white rounded-xl mx-1'
                  : ''
              }`}
            >
              <Icon className={`w-5 h-5 ${(isActive && !isCamera) ? 'drop-shadow-glow-primary' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
              {(isActive && !isCamera) && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;