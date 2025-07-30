import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface RouteTransitionsProps {
  children: React.ReactNode;
}

// Define transition types based on route patterns
const getTransitionType = (pathname: string) => {
  // Modal-like pages (auth, setup, etc.)
  if (pathname.includes('login') || pathname.includes('signup') || 
      pathname.includes('setup') || pathname.includes('auth')) {
    return 'modal';
  }
  
  // Profile and detail pages
  if (pathname.includes('profile') || pathname.includes('salon/') || 
      pathname.includes('user/')) {
    return 'slide';
  }
  
  // Main navigation pages
  if (pathname.includes('feed') || pathname.includes('discover') || 
      pathname.includes('messages') || pathname.includes('notifications')) {
    return 'fade';
  }
  
  // Settings and secondary pages
  if (pathname.includes('settings') || pathname.includes('help') || 
      pathname.includes('privacy')) {
    return 'scale';
  }
  
  // Default transition
  return 'default';
};

const transitionVariants = {
  default: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 1.02 },
  },
  modal: {
    initial: { opacity: 0, scale: 0.9, y: 50 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 1.1, y: -50 },
  },
  slide: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
};

const transitionConfig = {
  default: {
    type: 'tween',
    ease: [0.25, 0.46, 0.45, 0.94],
    duration: 0.4,
  },
  modal: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  slide: {
    type: 'tween',
    ease: [0.4, 0, 0.2, 1],
    duration: 0.3,
  },
  fade: {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.2,
  },
  scale: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },
};

export const RouteTransitions: React.FC<RouteTransitionsProps> = ({ children }) => {
  const location = useLocation();
  const transitionType = getTransitionType(location.pathname);
  
  const variants = transitionVariants[transitionType as keyof typeof transitionVariants];
  const transition = transitionConfig[transitionType as keyof typeof transitionConfig];

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
      className="w-full h-full"
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
};