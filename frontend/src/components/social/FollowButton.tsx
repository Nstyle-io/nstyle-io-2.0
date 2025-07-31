// This component is now deprecated in favor of EnhancedFollowButton
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  targetUserId: string;
  currentUserId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  currentUserId,
  variant = 'default',
  size = 'default'
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUserId && targetUserId && currentUserId !== targetUserId) {
      checkFollowStatus();
    }
  }, [currentUserId, targetUserId, checkFollowStatus]);

  const checkFollowStatus = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, [currentUserId, targetUserId]);

  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === targetUserId) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId
          });

        if (error) throw error;
        setIsFollowing(true);
        toast({
          title: "Following",
          description: "You are now following this user!",
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
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

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={isLoading}
      className="gap-2"
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </Button>
  );
};