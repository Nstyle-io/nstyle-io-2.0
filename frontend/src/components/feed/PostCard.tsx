import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, MapPin, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Post {
  id: string;
  user: {
    username: string;
    avatar: string;
    verified: boolean;
    type: 'user' | 'salon';
  };
  content: {
    images: string[];
    caption: string;
    tags: string[];
  };
  engagement: {
    likes: number;
    comments: number;
    saves: number;
  };
  salon?: {
    name: string;
    rating: number;
    location: string;
    service: string;
    price: string;
  };
  timestamp: string;
}

interface PostCardProps {
  post: Post;
}

const PostCard = React.memo(({ post }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  return (
    <div className="feed-post animate-in fade-in-0 slide-in-from-bottom-4 duration-400">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={post.user.avatar}
              alt={post.user.username}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
              loading="lazy"
            />
            {post.user.verified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm">{post.user.username}</span>
              <Badge variant="secondary" className="text-xs">
                {post.user.type === 'salon' ? 'Salon' : 'Enthusiast'}
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>{post.timestamp}</span>
              {post.salon && (
                <>
                  <span>•</span>
                  <MapPin className="w-3 h-3" />
                  <span>{post.salon.location}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Image Carousel */}
      <div className="relative rounded-xl overflow-hidden mb-3">
        <img
          src={post.content.images[currentImageIndex]}
          alt={`Nail art by ${post.user.username}`}
          className="w-full aspect-square object-cover"
          loading="lazy"
        />
        {post.content.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {post.content.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Booking Badge */}
        {post.salon && (
          <div className="absolute top-3 right-3 glass-card px-3 py-1.5 bg-black/20">
            <div className="flex items-center space-x-1 text-xs text-white">
              <Calendar className="w-3 h-3" />
              <span>Book Now</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`p-1 transition-all duration-200 active:scale-90 ${
              liked ? 'text-red-500 scale-110' : 'hover:text-red-500'
            }`}
            aria-label={liked ? 'Unlike post' : 'Like post'}
          >
            <Heart className={`w-6 h-6 transition-transform duration-300 ${liked ? 'fill-current scale-110' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" className="p-1" aria-label="Comment on post">
            <MessageCircle className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="sm" className="p-1" aria-label="Share post">
            <Share className="w-6 h-6" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className={`p-1 transition-all duration-200 active:scale-90 ${
            saved ? 'text-primary scale-110' : 'hover:text-primary'
          }`}
          aria-label={saved ? 'Unsave post' : 'Save post'}
        >
          <Bookmark className={`w-6 h-6 transition-transform duration-400 ${saved ? 'fill-current scale-110 rotate-12' : ''}`} />
        </Button>
      </div>

      {/* Engagement Stats */}
      <div className="mb-2">
        <span className="font-semibold text-sm">
          {post.engagement.likes.toLocaleString()} likes
        </span>
      </div>

      {/* Caption */}
      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-semibold">{post.user.username}</span>{' '}
          {post.content.caption}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {post.content.tags.map((tag, index) => (
            <span key={index} className="text-sm text-primary hover:underline cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>

        {/* Salon Info */}
        {post.salon && (
          <div className="glass-card mt-3 p-3 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">{post.salon.name}</h4>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{post.salon.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{post.salon.service}</span>
                  <span>•</span>
                  <span className="text-primary font-medium">{post.salon.price}</span>
                </div>
              </div>
              <Button size="sm" className="btn-gradient">
                Book
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comments Preview */}
      {post.engagement.comments > 0 && (
        <button className="text-sm text-muted-foreground mt-2 hover:text-foreground transition-colors">
          View all {post.engagement.comments} comments
        </button>
      )}
    </div>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;