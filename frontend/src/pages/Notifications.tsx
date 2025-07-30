import { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, Calendar, Star, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  actor_id?: string;
  related_id?: string;
  actor_profile?: {
    display_name: string;
    avatar_url: string;
    username: string;
  } | null;
}

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (notifications && !error) {
      // Fetch actor profiles separately
      const actorIds = notifications
        .filter(n => n.actor_id)
        .map(n => n.actor_id)
        .filter((id, index, arr) => arr.indexOf(id) === index); // unique ids

      let actorProfiles: Record<string, any> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, username')
          .in('user_id', actorIds);

        if (profiles) {
          actorProfiles = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combine notifications with actor profiles
      const notificationsWithProfiles = notifications.map(notification => ({
        ...notification,
        actor_profile: notification.actor_id ? actorProfiles[notification.actor_id] : null
      }));

      setNotifications(notificationsWithProfiles);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    fetchNotifications();
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-primary" />;
      case 'booking':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Heart className="w-5 h-5 text-primary" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <ResponsiveLayout>
      <div className="container mx-auto px-4 max-w-2xl py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 glass-card">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="glass-card p-4 rounded-2xl">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                  <p>When people interact with your content, you'll see it here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`glass-card p-4 rounded-2xl transition-all cursor-pointer hover:bg-accent/20 ${
                        !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.type === 'follow' && notification.actor_profile?.username) {
                          navigate(`/profile/${notification.actor_profile.username}`);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notification.actor_profile?.avatar_url} />
                            <AvatarFallback>
                              {notification.actor_profile?.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold text-sm truncate">
                              {notification.actor_profile?.display_name || 'Someone'}
                            </p>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.content}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>

                      {notification.type === 'follow' && (
                        <div className="mt-3 flex space-x-2">
                          <Button size="sm" className="flex-1">
                            Follow Back
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            View Profile
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mentions" className="mt-6">
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No mentions yet</h3>
                <p className="text-muted-foreground">
                  When someone mentions you in a post or comment, it will appear here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="mt-6">
              <div className="space-y-4">
                {notifications
                  .filter(n => n.type === 'booking')
                  .map((notification) => (
                    <div key={notification.id} className="glass-card p-4 rounded-2xl">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={notification.actor_profile?.avatar_url} />
                          <AvatarFallback>
                            {notification.actor_profile?.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{notification.actor_profile?.display_name}</p>
                          <p className="text-sm text-muted-foreground">{notification.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.created_at)}</p>
                        </div>
                        <Button size="sm">View Details</Button>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
      </div>
    </ResponsiveLayout>
  );
};

export default Notifications;