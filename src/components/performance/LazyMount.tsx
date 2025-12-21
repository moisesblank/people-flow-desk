// ============================================
// SYNAPSE v15.0 - LazyMount
// Renderiza conteúdo apenas quando entrar no viewport (performance)
// ============================================

import React, { memo, ReactNode, Suspense } from "react";
import { useLazyLoad } from "@/hooks/usePerformance";
import { cn } from "@/lib/utils";

interface LazyMountProps {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: number;
}

export const LazyMount = memo(function LazyMount({
  children,
  className,
  fallback,
  rootMargin = "600px",
  minHeight = 240,
}: LazyMountProps) {
  const { ref, isIntersecting } = useLazyLoad({ rootMargin, threshold: 0.01 });

  return (
    <section
      ref={ref as any}
      className={cn("content-lazy contain-layout", className)}
      style={{ minHeight }}
    >
      {isIntersecting ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback ?? <div className="w-full" aria-hidden="true" />
      )}
    </section>
  );
});
