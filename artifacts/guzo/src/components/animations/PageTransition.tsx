import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const { setPageLoading } = useUIStore();
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setPageLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [setPageLoading]);

  return (
    <AnimatePresence mode="wait">
      {isAnimating ? (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary"
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Card hover animations
export function AnimatedCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Button press effect
export function AnimatedButton({ children, className = '', onClick }: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

// Staggered list animations
export function AnimatedList({ children, className = '' }: { children: React.ReactNode[]; className?: string }) {
  return (
    <motion.div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Floating animation for decorative elements
export function FloatingElement({ children, className = '', duration = 3 }: { 
  children: React.ReactNode; 
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Pulse glow effect
export function PulseGlow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      animate={{ 
        boxShadow: [
          '0 0 0 0 rgba(var(--primary), 0)',
          '0 0 20px 5px rgba(var(--primary), 0.3)',
          '0 0 0 0 rgba(var(--primary), 0)'
        ]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
