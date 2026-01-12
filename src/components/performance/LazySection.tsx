// ============================================
// SYNAPSE v15.0 - LazySection
// Mobile-first, 3G-optimized lazy loading
// Suporta 5000+ usuários simultâneos
// ============================================

import React, { memo, forwardRef, useState, useEffect, useRef, Suspense, ReactNode } from "react";
import { usePerformance } from "@/hooks/usePerformance";

// ============================================
// SECTION LOADER - Ultra minimal skeleton
// ============================================
const SectionLoader = memo(() => (
  <div className="w-full py-8 flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-pink-500/40 border-t-pink-500 rounded-full animate-spin" />
  </div>
));

SectionLoader.displayName = "SectionLoader";

// ============================================
// LAZY SECTION - forwardRef optimized
// ============================================
interface LazySectionProps {
  children: ReactNode;
  className?: string;
  minHeight?: number;
  priority?: boolean;
}

export const LazySection = memo(forwardRef<HTMLDivElement, LazySectionProps>(
  ({ children, className = "", minHeight = 100, priority = false }, forwardedRef) => {
    const { isSlowConnection, isMobile } = usePerformance();
    const internalRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(priority);
    
    // Adjust rootMargin based on connection - load earlier on slow connections
    const rootMargin = isSlowConnection ? "800px" : isMobile ? "500px" : "300px";

    useEffect(() => {
      if (isVisible || priority) return;
      
      const element = internalRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin, threshold: 0.01 }
      );

      observer.observe(element);
      return () => observer.disconnect();
    }, [isVisible, rootMargin, priority]);

    return (
      <div
        ref={(node) => {
          // Handle both refs
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof forwardedRef === "function") {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        className={`will-change-auto transform-gpu ${className}`}
        style={{ minHeight: isVisible ? undefined : minHeight }}
      >
        {isVisible ? (
          <Suspense fallback={<SectionLoader />}>
            {children}
          </Suspense>
        ) : (
          <div className="flex items-center justify-center" style={{ minHeight }}>
            <div className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }
));

LazySection.displayName = "LazySection";

export default LazySection;
