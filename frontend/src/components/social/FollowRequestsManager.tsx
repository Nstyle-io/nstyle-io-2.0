import React, { useState, useEffect } from 'react';
import { Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface FollowRequest {
  id: string;
  requester_id: string;
  status: string;
  created_at: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
  };
}

interface FollowRequestsManagerProps {
  currentUserId: string;
}

export const FollowRequestsManager: React.FC<FollowRequestsManagerProps> = ({
  currentUserId
}) => {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFollowRequests();
  }, [currentUserId]);

  const fetchFollowRequests = async () => {
    try {
      // Use a simpler approach similar to what we did for SocialFeed
      const { data: requestsData, error: requestsError } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('requested_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get unique requester IDs
      const requesterIds = [...new Set(requestsData?.map(req => req.requester_id) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio')
        .in('user_id', requesterIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.user_id, profile]) || []
      );

      // Combine requests with profiles
      const requestsWithProfiles = requestsData?.map(request => ({
        ...request,
        profiles: profilesMap.get(request.requester_id) || {
          display_name: 'Unknown User',
          username: 'unknown',
          avatar_url: null,
          bio: null
        }
      })) || [];

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'decline') => {
    try {
      if (action === 'approve') {
        // Update request status to approved
        const { error: updateError } = await supabase
          .from('follow_requests')
          .update({ status: 'approved' })
          .eq('id', requestId);

        if (updateError) throw updateError;

        // Find the request to get requester info
        const request = requests.find(r => r.id === requestId);
        if (request) {
          // Create follow relationship
          const { error: followError } = await supabase
            .from('follows')
            .insert({
              follower_id: request.requester_id,
              following_id: currentUserId
            });

          if (followError) throw followError;
        }

        toast({
          title: "Request approved",
          description: "Follow request has been approved.",
        });
      } else {
        // Update request status to declined
        const { error } = await supabase
          .from('follow_requests')
          .update({ status: 'declined' })
          .eq('id', requestId);

        if (error) throw error;

        toast({
          title: "Request declined",
          description: "Follow request has been declined.",
        });
      }

      // Remove request from local state
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error handling request action:', error);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No follow requests</h3>
          <p className="text-muted-foreground">
            You don't have any pending follow requests at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Follow Requests
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-4 glass-card rounded-xl">
              <div className="flex items-center space-x-3 flex-1">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={request.profiles?.avatar_url} />
                  <AvatarFallback>
                    {request.profiles?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {request.profiles?.display_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{request.profiles?.username || 'unknown'}
                  </p>
                  {request.profiles?.bio && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {request.profiles.bio}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(request.created_at))} ago
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleRequestAction(request.id, 'approve')}
                  className="gap-1"
                >
                  <Check className="w-3 h-3" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRequestAction(request.id, 'decline')}
                  className="gap-1"
                >
                  <X className="w-3 h-3" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};