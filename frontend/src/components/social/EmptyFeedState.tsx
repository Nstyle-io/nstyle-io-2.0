import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyFeedStateProps {
  hashtag?: string;
  trending?: boolean;
}

export const EmptyFeedState: React.FC<EmptyFeedStateProps> = ({ hashtag, trending }) => {
  const getEmptyStateMessage = () => {
    if (hashtag) {
      return `No posts found for #${hashtag}`;
    }
    if (trending) {
      return "No trending posts available";
    }
    return "Follow some users or create your first post to see content here!";
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-muted/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce-in">
          <div className="w-8 h-8 bg-muted/40 rounded"></div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground">
          {getEmptyStateMessage()}
        </p>
      </CardContent>
    </Card>
  );
};