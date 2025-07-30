import React, { useState, useEffect } from 'react';
import { Send, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  isOpen: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  currentUserId,
  isOpen
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        // Get profile information for comment authors
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        // Create a map of user profiles
        const profilesMap = new Map();
        (profilesData || []).forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        // Combine comments with profiles
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || {
            display_name: 'Unknown User',
            username: 'unknown',
            avatar_url: null
          }
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-border/50 pt-4 mt-4">
      {/* Comments List */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.profiles?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {comment.profiles?.display_name?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="glass-card p-3 rounded-2xl">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm">
                      {comment.profiles?.display_name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at))} ago
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
                
                <div className="flex items-center space-x-2 mt-2 ml-3">
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                    <Heart className="w-3 h-3 mr-1" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      {currentUserId && (
        <form onSubmit={handleSubmitComment} className="flex items-center space-x-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 glass-card"
            disabled={submitting}
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!newComment.trim() || submitting}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
};