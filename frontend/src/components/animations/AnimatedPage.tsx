import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

// Slide variants for mobile-like transitions
const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  in: {
    x: 0,
    opacity: 1
  },
  out: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

const slideTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

// Fade variants for simple transitions
const fadeVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1
  },
  out: {
    opacity: 0
  }
};

const fadeTransition = {
  duration: 0.2
};

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{
        width: '100%',
        height: '100%'
      }}
    >
      {children}
    </motion.div>
  );
};

export const SlidePage: React.FC<AnimatedPageProps & { direction?: number }> = ({ 
  children, 
  className = '',
  direction = 1
}) => {
  return (
    <motion.div
      className={className}
      custom={direction}
      initial="initial"
      animate="in"
      exit="out"
      variants={slideVariants}
      transition={slideTransition}
      style={{
        width: '100%',
        height: '100%'
      }}
    >
      {children}
    </motion.div>
  );
};

export const FadePage: React.FC<AnimatedPageProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={fadeVariants}
      transition={fadeTransition}
      style={{
        width: '100%',
        height: '100%'
      }}
    >
      {children}
    </motion.div>
  );
};

// Page transition wrapper with route-based animations
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Stagger children animation
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}> = ({ children, staggerDelay = 0.1, className = '' }) => {
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};

// Individual stagger item
export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const itemVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={itemVariants}
    >
      {children}
    </motion.div>
  );
};
