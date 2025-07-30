import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends Omit<ButtonProps, 'asChild'> {
  loading?: boolean;
  loadingText?: string;
  animationType?: 'scale' | 'slide' | 'bounce' | 'glow';
}

const animationVariants = {
  scale: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.02 },
  },
  slide: {
    whileTap: { x: 2 },
    whileHover: { x: -2 },
  },
  bounce: {
    whileTap: { scale: 0.9 },
    whileHover: { y: -2 },
  },
  glow: {
    whileTap: { scale: 0.98 },
    whileHover: { 
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
      scale: 1.02 
    },
  },
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  animationType = 'scale',
  className,
  disabled,
  ...props
}) => {
  const animations = animationVariants[animationType];

  return (
    <motion.div
      whileTap={disabled || loading ? {} : animations.whileTap}
      whileHover={disabled || loading ? {} : animations.whileHover}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Button
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          loading && 'cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        <motion.div
          className="flex items-center justify-center"
          animate={{
            opacity: loading ? 0 : 1,
            y: loading ? 10 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
        
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              <span className="text-sm">{loadingText}</span>
            </div>
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
};