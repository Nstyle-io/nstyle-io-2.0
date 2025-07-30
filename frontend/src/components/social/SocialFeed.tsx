import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';
import { PostCard } from './PostCard';
import { FeedLoadingSkeleton } from './FeedLoadingSkeleton';
import { EmptyFeedState } from './EmptyFeedState';

interface SocialFeedProps {
  currentUserId?: string;
  filterUserId?: string;
  profileView?: boolean;
  hashtag?: string;
  trending?: boolean;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ 
  currentUserId, 
  filterUserId, 
  profileView = false, 
  hashtag, 
  trending = false 
}) => {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  
  const { posts, loading, toggleLike, updatePostSaveStatus, refetch } = usePosts({
    currentUserId,
    filterUserId,
    profileView,
    hashtag,
    trending
  });


  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleProfileClick = (userId: string) => {
    if (userId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  const handleLike = (postId: string, isLiked: boolean) => {
    toggleLike(postId, isLiked).catch(console.error);
  };

  if (loading) {
    return <FeedLoadingSkeleton />;
  }

  if (posts.length === 0) {
    return <EmptyFeedState hashtag={hashtag} trending={trending} />;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          isCommentsExpanded={expandedComments.has(post.id)}
          onProfileClick={handleProfileClick}
          onLike={() => handleLike(post.id, post.isLiked || false)}
          onToggleComments={() => toggleComments(post.id)}
          onSaveToggle={(saved) => updatePostSaveStatus(post.id, saved)}
          onPostDeleted={refetch}
          animationDelay={index}
        />
      ))}
    </div>
  );
};