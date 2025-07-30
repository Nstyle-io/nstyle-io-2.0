import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { PostActions } from './PostActions';
import { CommentSection } from './CommentSection';
import { PostCarousel } from '../feed/PostCarousel';
import { Post } from '@/hooks/usePosts';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  isCommentsExpanded: boolean;
  onProfileClick: (userId: string) => void;
  onLike: () => void;
  onToggleComments: () => void;
  onSaveToggle: (saved: boolean) => void;
  onPostDeleted: () => void;
  animationDelay?: number;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  isCommentsExpanded,
  onProfileClick,
  onLike,
  onToggleComments,
  onSaveToggle,
  onPostDeleted,
  animationDelay = 0
}) => {
  return (
    <Card 
      key={post.id} 
      className="feed-post animate-fade-in-delayed" 
      style={{ animationDelay: `${animationDelay * 0.1}s` }}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-smooth hover:scale-105"
            onClick={() => onProfileClick(post.user_id)}
          >
            <Avatar className="w-10 h-10 transition-smooth hover:scale-110">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback>
                {post.profiles?.display_name?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm hover:text-primary transition-smooth">
                {post.profiles?.display_name || 'Unknown User'}
              </p>
              <p className="text-xs text-muted-foreground">
                @{post.profiles?.username} • {formatDistanceToNow(new Date(post.created_at))} ago
              </p>
            </div>
          </div>
        </div>

        {/* Post Content */}
        {post.content && (
          <p className="mb-4 text-sm leading-relaxed">{post.content}</p>
        )}

        {/* Post Media */}
        <PostMedia post={post} />

        {/* Post Actions */}
        <PostActions
          postId={post.id}
          postUserId={post.user_id}
          currentUserId={currentUserId}
          likesCount={post.likes_count}
          commentsCount={post.comments_count}
          isLiked={post.isLiked || false}
          isSaved={post.isSaved || false}
          onLike={onLike}
          onComment={onToggleComments}
          onSaveToggle={onSaveToggle}
          onPostDeleted={onPostDeleted}
        />

        {/* Comment Section */}
        <div className={isCommentsExpanded ? "animate-slide-up" : ""}>
          <CommentSection
            postId={post.id}
            currentUserId={currentUserId}
            isOpen={isCommentsExpanded}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const PostMedia: React.FC<{ post: Post }> = ({ post }) => {
  if (post.images && post.images.length > 0) {
    return <PostCarousel images={post.images} className="mb-4" />;
  }
  
  if (post.image_url) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <img 
          src={post.image_url} 
          alt="Post content" 
          className="w-full h-auto max-h-80 sm:max-h-96 object-cover transition-smooth hover:scale-105"
          loading="lazy"
        />
      </div>
    );
  }
  
  if (post.video_url) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden">
        <video 
          src={post.video_url} 
          controls 
          className="w-full h-auto max-h-80 sm:max-h-96 object-cover transition-smooth"
          preload="metadata"
        />
      </div>
    );
  }
  
  return null;
};