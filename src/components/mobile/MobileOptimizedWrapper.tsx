// ============================================
// SYNAPSE v15.0 - Mobile Optimized Wrapper
// Container otimizado para performance mobile
// ============================================

import { memo, ReactNode, useMemo } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { usePerformance, useOptimizedAnimations } from '@/hooks/usePerformance';
import { cn } from '@/lib/utils';

interface MobileOptimizedWrapperProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
}

export const MobileOptimizedWrapper = memo(function MobileOptimizedWrapper({
  children,
  className,
  animate = true,
  delay = 0,
  direction = 'fade'
}: MobileOptimizedWrapperProps) {
  const { shouldReduceMotion, animationDuration, isMobile } = usePerformance();
  
  // 🏛️ PREMIUM GARANTIDO: Apenas reduced motion do SO é respeitado
  if (shouldReduceMotion || !animate) {
    return (
      <div className={cn('gpu-accelerate transform-gpu', className)}>
        {children}
      </div>
    );
  }
  
  const duration = animationDuration / 1000;
  const offset = isMobile ? 10 : 20;
  
  const variants = useMemo(() => {
    const initial: Record<string, any> = { opacity: 0 };
    const animate: Record<string, any> = { opacity: 1 };
    
    switch (direction) {
      case 'up':
        initial.y = offset;
        animate.y = 0;
        break;
      case 'down':
        initial.y = -offset;
        animate.y = 0;
        break;
      case 'left':
        initial.x = offset;
        animate.x = 0;
        break;
      case 'right':
        initial.x = -offset;
        animate.x = 0;
        break;
      case 'scale':
        initial.scale = 0.95;
        animate.scale = 1;
        break;
    }
    
    return { initial, animate };
  }, [direction, offset]);
  
  return (
    <motion.div
      className={cn('gpu-accelerate', className)}
      initial={variants.initial}
      animate={variants.animate}
      transition={{
        duration,
        delay: delay * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
});

// Optimized list item for mobile
interface OptimizedListItemProps {
  children: ReactNode;
  index: number;
  className?: string;
  onClick?: () => void;
}

export const OptimizedListItem = memo(function OptimizedListItem({
  children,
  index,
  className,
  onClick
}: OptimizedListItemProps) {
  const { shouldReduceMotion, isLowEndDevice, isMobile } = usePerformance();
  
  // No animation for performance-constrained devices
  if (shouldReduceMotion || isLowEndDevice) {
    return (
      <div 
        className={cn('mobile-card-interactive', className)}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }
  
  return (
    <motion.div
      className={cn('mobile-card-interactive gpu-accelerate', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: isMobile ? 0.15 : 0.2,
        delay: Math.min(index * 0.03, 0.3) // Cap delay at 300ms
      }}
      onClick={onClick}
      whileTap={isMobile ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  );
});

// Skeleton loader optimized for mobile
interface OptimizedSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'button';
  lines?: number;
}

export const OptimizedSkeleton = memo(function OptimizedSkeleton({
  className,
  variant = 'text',
  lines = 1
}: OptimizedSkeletonProps) {
  const baseClasses = 'skeleton-pulse rounded';
  
  switch (variant) {
    case 'card':
      return (
        <div className={cn(baseClasses, 'h-32 w-full', className)} />
      );
    case 'circle':
      return (
        <div className={cn(baseClasses, 'h-10 w-10 rounded-full', className)} />
      );
    case 'button':
      return (
        <div className={cn(baseClasses, 'h-10 w-24 rounded-lg', className)} />
      );
    case 'text':
    default:
      return (
        <div className={cn('space-y-2', className)}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                baseClasses,
                'h-4',
                i === lines - 1 ? 'w-3/4' : 'w-full'
              )}
            />
          ))}
        </div>
      );
  }
});

// Performance indicator component
export const PerformanceIndicator = memo(function PerformanceIndicator() {
  const { metrics, isMobile, isLowEndDevice, connectionType } = usePerformance();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;
  
  const fpsColor = metrics.fps >= 50 ? 'text-stats-green' : 
                   metrics.fps >= 30 ? 'text-warning' : 'text-destructive';
  
  return (
    <div className="fixed bottom-20 left-2 z-50 p-2 bg-card/90 backdrop-blur-sm rounded-lg text-xs font-mono border border-border">
      <div className={fpsColor}>{metrics.fps} FPS</div>
      <div className="text-muted-foreground">
        {isMobile ? 'Mobile' : 'Desktop'} | {connectionType}
      </div>
      {isLowEndDevice && (
        <div className="text-warning">Low-end mode</div>
      )}
    </div>
  );
});

export default MobileOptimizedWrapper;
