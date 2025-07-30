import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'sparkle';
}

const LoadingDots: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  const dotSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'bg-primary rounded-full animate-bounce',
            dotSize[size]
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );
};

const LoadingPulse: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  const pulseSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('relative', pulseSize[size])}>
      <div className="absolute inset-0 bg-primary rounded-full animate-pulse opacity-80" />
      <div className="absolute inset-2 bg-primary rounded-full animate-pulse opacity-60" style={{ animationDelay: '0.3s' }} />
    </div>
  );
};

const LoadingSparkle: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  const sparkleSize = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="animate-spin">
      <Sparkles className={cn('text-primary', sparkleSize[size])} />
    </div>
  );
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text = 'Loading...',
  variant = 'spinner',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots size={size} />;
      case 'pulse':
        return <LoadingPulse size={size} />;
      case 'sparkle':
        return <LoadingSparkle size={size} />;
      default:
        return (
          <div className="animate-spin">
            <Loader2 className={cn('text-primary', sizeClasses[size])} />
          </div>
        );
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300', className)}>
      <div className="mb-4">
        {renderLoader()}
      </div>
      <p className="text-sm text-muted-foreground font-medium animate-in fade-in-0 duration-500 delay-200">
        {text}
      </p>
    </div>
  );
};