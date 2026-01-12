// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v2.0 ⚡
// SacredLazySection - Lazy loading divino
// ============================================

import React, { memo, forwardRef, useState, useEffect, useRef, Suspense, ReactNode } from "react";
import { usePerformanceTier, useRenderPriority } from "@/hooks/useEvangelhoVelocidade";
import { PERFORMANCE_DOGMAS } from "@/lib/performance/evangelhoVelocidade";
import { cn } from "@/lib/utils";

const SacredSkeleton = memo(({ minHeight = 100 }: { minHeight?: number }) => (
  <div className="flex items-center justify-center animate-pulse" style={{ minHeight }}>
    <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
));
SacredSkeleton.displayName = "SacredSkeleton";

interface SacredLazySectionProps {
  children: ReactNode;
  className?: string;
  minHeight?: number;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  skeleton?: ReactNode;
  id?: string;
}

export const SacredLazySection = memo(forwardRef<HTMLDivElement, SacredLazySectionProps>(
  ({ children, className = "", minHeight = 100, priority = 'normal', skeleton, id }, forwardedRef) => {
    const { tier } = usePerformanceTier();
    const { shouldRender: priorityShouldRender } = useRenderPriority(priority);
    const internalRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(priority === 'critical');
    
    const margins = { divine: '250px', blessed: '500px', mortal: '750px', challenged: '1000px' };
    const effectiveMargin = margins[tier];

    useEffect(() => {
      if (isVisible || priority === 'critical') return;
      const element = internalRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
        { rootMargin: effectiveMargin, threshold: 0.01 }
      );
      observer.observe(element);
      return () => observer.disconnect();
    }, [isVisible, effectiveMargin, priority]);

    const shouldRenderContent = isVisible && priorityShouldRender;

    return (
      <section
        id={id}
        ref={(node: HTMLDivElement | null) => {
          internalRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        className={cn("sacred-lazy-section will-change-auto transform-gpu", className)}
        style={{ minHeight: shouldRenderContent ? undefined : minHeight }}
        data-visible={shouldRenderContent}
      >
        {shouldRenderContent ? (
          <Suspense fallback={skeleton ?? <SacredSkeleton minHeight={minHeight} />}>
            {children}
          </Suspense>
        ) : (
          skeleton ?? <SacredSkeleton minHeight={minHeight} />
        )}
      </section>
    );
  }
));

SacredLazySection.displayName = "SacredLazySection";
export default SacredLazySection;
