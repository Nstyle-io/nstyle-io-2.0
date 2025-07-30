import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Card, CardProps } from './card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends CardProps {
  children: React.ReactNode;
  animationType?: 'lift' | 'tilt' | 'glow' | 'scale' | 'slide';
  delay?: number;
}

const cardVariants = {
  lift: {
    whileHover: {
      y: -8,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      scale: 1.02,
    },
    whileTap: { scale: 0.98 },
  },
  tilt: {
    whileHover: {
      rotateY: 5,
      rotateX: 5,
      scale: 1.05,
    },
    whileTap: { scale: 0.95 },
  },
  glow: {
    whileHover: {
      boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
      borderColor: 'rgba(59, 130, 246, 0.5)',
    },
    whileTap: { scale: 0.98 },
  },
  scale: {
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.97 },
  },
  slide: {
    whileHover: { x: 4, y: -4 },
    whileTap: { x: 2, y: -2 },
  },
};

const entryVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    }
  },
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  animationType = 'lift',
  delay = 0,
  ...props
}) => {
  const animations = cardVariants[animationType];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={entryVariants}
      transition={{ delay }}
      whileHover={animations.whileHover}
      whileTap={animations.whileTap}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Card
        className={cn(
          'transition-all duration-300 cursor-pointer',
          animationType === 'tilt' && 'transform-gpu',
          className
        )}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
};