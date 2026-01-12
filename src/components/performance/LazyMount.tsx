// ============================================
// SYNAPSE v15.0 - LazyMount
// Mobile-first, 3G-optimized lazy loading
// ============================================

import React, { memo, ReactNode, Suspense, useEffect, useState } from "react";
import { useLazyLoad, useNetworkInfo } from "@/hooks/usePerformance";
import { cn } from "@/lib/utils";

interface LazyMountProps {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: number;
  priority?: boolean;
}

// Minimal skeleton loader
const DefaultLoader = memo(() => (
  <div className="w-full py-8 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-pink-500/50 border-t-pink-500 rounded-full animate-spin" />
  </div>
));

DefaultLoader.displayName = "DefaultLoader";

export const LazyMount = memo(function LazyMount({
  children,
  className,
  fallback,
  rootMargin,
  minHeight = 100,
  priority = false,
}: LazyMountProps) {
  const { isSlowConnection, isMobile, saveData } = useNetworkInfo();
  
  // Ajusta rootMargin baseado na conexão (LEI I - Artigo 5)
  // 3G/saveData = carrega MUITO mais cedo (800px) para compensar latência
  // Mobile 4G = carrega cedo (500px)
  // Desktop = pode esperar (300px)
  const effectiveMargin = rootMargin ?? (
    saveData ? "1000px" : // Data saver = máximo prefetch
    isSlowConnection ? "800px" : // 3G = prefetch agressivo
    isMobile ? "500px" : // Mobile 4G = balanceado
    "300px" // Desktop = normal
  );
  
  const { ref, isIntersecting } = useLazyLoad({ 
    rootMargin: effectiveMargin, 
    threshold: 0.01 
  });

  // Priority items render immediately
  const [shouldRender, setShouldRender] = useState(priority);

  useEffect(() => {
    if (isIntersecting && !shouldRender) {
      setShouldRender(true);
    }
  }, [isIntersecting, shouldRender]);

  return (
    <section
      ref={ref as any}
      className={cn(
        "content-lazy",
        // GPU acceleration hints
        "will-change-auto transform-gpu",
        className
      )}
      style={{ minHeight: shouldRender ? undefined : minHeight }}
    >
      {shouldRender ? (
        <Suspense fallback={fallback ?? <DefaultLoader />}>
          {children}
        </Suspense>
      ) : (
        fallback ?? <DefaultLoader />
      )}
    </section>
  );
});
