import React from 'react';
import { 
  Home, 
  Search, 
  Camera, 
  Plus, 
  User, 
  TrendingUp, 
  Calendar,
  MessageCircle,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  BookOpen,
  Users,
  ShoppingBag,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/contexts/SidebarContext';

interface DesktopSidebarProps {
  mobile?: boolean;
  onItemClick?: () => void;
}

interface _NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number;
  type?: 'primary' | 'secondary';
}

const navigationSections = [
  {
    title: 'Main',
    items: [
      { icon: Home, label: 'For You', path: '/', type: 'primary' },
      { icon: Search, label: 'Discover', path: '/discover' },
      { icon: Camera, label: 'Camera', path: '/camera', type: 'primary' },
      { icon: Plus, label: 'Create', path: '/create' },
    ]
  },
  {
    title: 'Social',
    items: [
      { icon: MessageCircle, label: 'Messages', path: '/messages' },
      { icon: Bell, label: 'Notifications', path: '/notifications' },
      { icon: Heart, label: 'Favorites', path: '/favorites' },
      { icon: Users, label: 'Following', path: '/profile' },
    ]
  },
  {
    title: 'Explore',
    items: [
      { icon: TrendingUp, label: 'Trending', path: '/discover?tab=trending' },
      { icon: BookOpen, label: 'Tutorials', path: '/discover?tab=tutorials' },
      { icon: ShoppingBag, label: 'Products', path: '/discover?tab=products' },
      { icon: Calendar, label: 'Events', path: '/discover?tab=events' },
    ]
  },
  {
    title: 'Business',
    items: [
      { icon: Sparkles, label: 'Salon Portal', path: '/salon-auth' },
      { icon: Play, label: 'Business', path: '/business' },
    ]
  },
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile', path: '/profile' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ]
  }
];

const DesktopSidebar = ({ mobile = false, onItemClick }: DesktopSidebarProps) => {
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const _isMobile = useIsMobile();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleItemClick = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const sidebarWidth = mobile ? 'w-full' : (sidebarCollapsed ? 'w-20' : 'w-64');
  const isCompact = sidebarCollapsed && !mobile;

  return (
    <aside className={`${mobile ? '' : 'fixed left-0 top-16 h-[calc(100vh-4rem)]'} ${sidebarWidth} transition-all duration-300`}>
      <div className="h-full glass-panel border-r border-white/10 flex flex-col">
        {/* Collapse Toggle - Desktop Only */}
        {!mobile && (
          <div className="p-4 border-b border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full justify-center"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title}>
              {!isCompact && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const isPrimary = item.type === 'primary';
                  
                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleItemClick(item.path)}
                      className={`w-full ${isCompact ? 'justify-center px-2' : 'justify-start'} h-11 transition-all duration-200 ${
                        active
                          ? 'bg-gradient-primary text-white hover:bg-gradient-primary/90'
                          : isPrimary
                          ? 'text-primary hover:bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      } ${isPrimary && item.path === '/camera' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600' : ''}`}
                    >
                      <Icon className={`w-5 h-5 ${isCompact ? '' : 'mr-3'} ${active ? 'drop-shadow-glow-primary' : ''}`} />
                       {!isCompact && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10">
          {!isCompact ? (
            <div className="space-y-2">
              <Button 
                onClick={() => handleItemClick('/salon-auth')}
                className="w-full bg-gradient-primary text-white hover:bg-gradient-primary/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Join as Salon
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleItemClick('/salon-auth')}
              className="w-full justify-center"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;