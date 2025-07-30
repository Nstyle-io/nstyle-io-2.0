import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const FeedLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="glass-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
          <CardContent className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/6"></div>
                </div>
              </div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-40 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};