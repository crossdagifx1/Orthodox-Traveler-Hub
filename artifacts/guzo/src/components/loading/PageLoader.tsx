import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { Sparkles, Loader2 } from 'lucide-react';

export function PageLoader() {
  const { isPageLoading } = useUIStore();

  return (
    <AnimatePresence>
      {isPageLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary"
              />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
            </div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-muted-foreground font-medium"
            >
              Loading...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Skeleton loader for cards
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card rounded-2xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Skeleton for detail pages
export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-64 bg-muted rounded-2xl" />
      <div className="space-y-3">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 bg-muted rounded-full w-24" />
        <div className="h-10 bg-muted rounded-full w-24" />
      </div>
    </div>
  );
}

// Suspense fallback wrapper
export function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
