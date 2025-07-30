import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface RouteLoaderProps {
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'sparkle';
}

export const RouteLoader: React.FC<RouteLoaderProps> = ({ 
  text = 'Loading page...', 
  variant = 'sparkle' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 animate-in fade-in-0 duration-300">
      <div className="animate-in fade-in-0 zoom-in-95 duration-500">
        <LoadingSpinner size="lg" text={text} variant={variant} />
      </div>
    </div>
  );
};