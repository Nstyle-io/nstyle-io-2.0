import React from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { SocialFeed } from '@/components/social/SocialFeed';

const TrendingPosts = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 px-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="font-bold text-lg">Trending Posts</h2>
        <TrendingUp className="w-4 h-4 text-orange-500" />
      </div>
      
      <SocialFeed trending={true} />
    </div>
  );
};

export default TrendingPosts;