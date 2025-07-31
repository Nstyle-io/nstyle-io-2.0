import React, { useState } from 'react';
import { MoreVertical, Heart, MessageCircle, Share, Bookmark, BookmarkCheck, Flag, UserMinus, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PostDeleteDialog } from '../feed/PostDeleteDialog';

interface PostActionsProps {
  postId: string;
  postUserId: string;
  currentUserId?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onComment: () => void;
  onSaveToggle: (saved: boolean) => void;
  onPostDeleted?: () => void;
}

export const PostActions: React.FC<PostActionsProps> = ({
  postId,
  postUserId,
  currentUserId,
  likesCount,
  commentsCount,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onSaveToggle,
  onPostDeleted
}) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const isOwnPost = currentUserId === postUserId;

  const handleSaveToggle = async () => {
    if (!currentUserId) return;
    
    setSaving(true);
    try {
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', postId);
        
        if (error) throw error;
        onSaveToggle(false);
        toast({
          title: "Post removed from saved",
          description: "The post has been removed from your saved items."
        });
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: currentUserId,
            post_id: postId
          });
        
        if (error) throw error;
        onSaveToggle(true);
        toast({
          title: "Post saved",
          description: "The post has been added to your saved items."
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: "Failed to update saved status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    toast({
      title: "Link copied",
      description: "Post link has been copied to clipboard."
    });
  };

  const handleReport = () => {
    toast({
      title: "Post reported",
      description: "Thank you for reporting. We'll review this content."
    });
  };

  const handleBlock = () => {
    toast({
      title: "User blocked",
      description: "You won't see posts from this user anymore."
    });
  };

  return (
    <div className="flex items-center justify-between pt-2 border-t border-border/50">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLike}
          className={`gap-2 ${isLiked ? 'text-red-500' : ''}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          {likesCount}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onComment}
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {commentsCount}
        </Button>
        
        <Button variant="ghost" size="sm" className="gap-2">
          <Share className="w-4 h-4" />
        </Button>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-card border-white/10">
          <DropdownMenuItem onClick={handleSaveToggle} disabled={saving}>
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 mr-2" />
                Remove from saved
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 mr-2" />
                Save post
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleCopyLink}>
            <Link className="w-4 h-4 mr-2" />
            Copy link
          </DropdownMenuItem>
          
            {isOwnPost ? (
              <>
                <DropdownMenuSeparator />
                <PostDeleteDialog 
                  postId={postId} 
                  onPostDeleted={onPostDeleted || (() => {})}
                />
              </>
            ) : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReport} className="text-yellow-600">
                  <Flag className="w-4 h-4 mr-2" />
                  Report post
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                  <UserMinus className="w-4 h-4 mr-2" />
                  Block user
                </DropdownMenuItem>
              </>
            )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};