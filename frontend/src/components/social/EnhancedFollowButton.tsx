import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedFollowButtonProps {
  targetUserId: string;
  currentUserId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

type FollowStatus = 'not_following' | 'following' | 'pending' | 'blocked';

export const EnhancedFollowButton: React.FC<EnhancedFollowButtonProps> = ({
  targetUserId,
  currentUserId,
  variant = 'default',
  size = 'default'
}) => {
  const [followStatus, setFollowStatus] = useState<FollowStatus>('not_following');
  const [isTargetPrivate, setIsTargetPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUserId && targetUserId && currentUserId !== targetUserId) {
      checkFollowStatus();
      checkIfTargetIsPrivate();
    }
  }, [currentUserId, targetUserId, checkFollowStatus, checkIfTargetIsPrivate]);

  const checkIfTargetIsPrivate = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('user_id', targetUserId)
        .single();

      if (error) throw error;
      setIsTargetPrivate(data?.is_private || false);
    } catch (error) {
      console.error('Error checking if user is private:', error);
    }
  }, [targetUserId]);

  const checkFollowStatus = useCallback(async () => {
    if (!currentUserId) return;

    try {
      // Check if already following
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (followError) throw followError;

      if (followData) {
        setFollowStatus('following');
        return;
      }

      // Check if there's a pending request
      const { data: requestData, error: requestError } = await supabase
        .from('follow_requests')
        .select('status')
        .eq('requester_id', currentUserId)
        .eq('requested_id', targetUserId)
        .maybeSingle();

      if (requestError) throw requestError;

      if (requestData) {
        setFollowStatus(requestData.status === 'pending' ? 'pending' : 'not_following');
      } else {
        setFollowStatus('not_following');
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, [currentUserId, targetUserId]);

  const handleFollowAction = async () => {
    if (!currentUserId || currentUserId === targetUserId) return;

    setIsLoading(true);
    try {
      if (followStatus === 'following') {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;

        setFollowStatus('not_following');
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        });
      } else if (followStatus === 'pending') {
        // Cancel request
        const { error } = await supabase
          .from('follow_requests')
          .delete()
          .eq('requester_id', currentUserId)
          .eq('requested_id', targetUserId);

        if (error) throw error;

        setFollowStatus('not_following');
        toast({
          title: "Request cancelled",
          description: "Follow request has been cancelled.",
        });
      } else {
        // Follow or request to follow
        if (isTargetPrivate) {
          // Send follow request for private account
          const { error } = await supabase
            .from('follow_requests')
            .insert({
              requester_id: currentUserId,
              requested_id: targetUserId,
              status: 'pending'
            });

          if (error) throw error;

          setFollowStatus('pending');
          toast({
            title: "Request sent",
            description: "Follow request sent to this private account.",
          });
        } else {
          // Follow public account directly (will be auto-approved by trigger)
          const { error } = await supabase
            .from('follow_requests')
            .insert({
              requester_id: currentUserId,
              requested_id: targetUserId
            });

          if (error) throw error;

          setFollowStatus('following');
          toast({
            title: "Following",
            description: "You are now following this user!",
          });
        }
      }
    } catch (error) {
      console.error('Error handling follow action:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if user is viewing their own profile
  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  const getButtonContent = () => {
    switch (followStatus) {
      case 'following':
        return (
          <>
            <UserCheck className="w-4 h-4" />
            Following
          </>
        );
      case 'pending':
        return (
          <>
            <Clock className="w-4 h-4" />
            Requested
          </>
        );
      default:
        return (
          <>
            <UserPlus className="w-4 h-4" />
            {isTargetPrivate ? 'Request' : 'Follow'}
          </>
        );
    }
  };

  return (
    <Button
      variant={followStatus === 'following' ? 'outline' : variant}
      size={size}
      onClick={handleFollowAction}
      disabled={isLoading}
      className="gap-2"
    >
      {getButtonContent()}
    </Button>
  );
};