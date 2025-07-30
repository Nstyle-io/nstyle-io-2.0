import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  width,
  height,
  animate = true,
}) => {
  const baseClasses = 'bg-muted';
  
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const SkeletonElement = animate ? motion.div : 'div';
  const animationProps = animate ? {
    animate: {
      opacity: [0.5, 1, 0.5],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  } : {};

  return (
    <SkeletonElement
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={style}
      {...animationProps}
    />
  );
};

// Pre-built skeleton components for common use cases
export const PostSkeleton: React.FC = () => (
  <div className="space-y-4 p-4 border rounded-lg">
    <div className="flex items-center space-x-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="space-y-2 flex-1">
        <Skeleton height={16} width="30%" />
        <Skeleton height={12} width="20%" />
      </div>
    </div>
    <Skeleton height={200} className="rounded-lg" />
    <div className="space-y-2">
      <Skeleton height={16} width="80%" />
      <Skeleton height={16} width="60%" />
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" width={80} height={80} />
      <div className="space-y-3 flex-1">
        <Skeleton height={24} width="40%" />
        <Skeleton height={16} width="60%" />
        <Skeleton height={20} width="30%" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} height={120} className="aspect-square rounded-lg" />
      ))}
    </div>
  </div>
);

export const FeedSkeleton: React.FC = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <PostSkeleton key={i} />
    ))}
  </div>
);

export const SearchSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="space-y-2 flex-1">
          <Skeleton height={16} width="40%" />
          <Skeleton height={12} width="60%" />
        </div>
      </div>
    ))}
  </div>
);

export const SalonListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton height={20} width="60%" />
            <Skeleton height={14} width="40%" />
          </div>
          <Skeleton height={24} width={60} />
        </div>
        <Skeleton height={80} className="rounded-md" />
        <div className="flex space-x-2">
          <Skeleton height={24} width={80} />
          <Skeleton height={24} width={60} />
        </div>
      </div>
    ))}
  </div>
);

export { Skeleton };