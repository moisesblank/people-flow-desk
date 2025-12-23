// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - OptimizedImage
// Imagem otimizada nível NASA - Lazy Load + WebP + Placeholder
// LEI I Art. 7-9: SEMPRE loading="lazy" decoding="async" width height alt
// ============================================

import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getPerformanceConfig } from "@/lib/performance/performanceFlags";

// ============================================
// TIPOS
// ============================================
interface OptimizedImageProps {
  src: string;
  alt: string;
  
  // Dimensões
  width?: number;
  height?: number;
  aspectRatio?: string;
  
  // Loading
  priority?: boolean;
  placeholder?: "blur" | "empty" | "skeleton";
  blurDataURL?: string;
  
  // Formato
  format?: "auto" | "webp" | "avif" | "original";
  quality?: number;
  
  // Responsive
  sizes?: string;
  srcSet?: string;
  
  // Estilo
  className?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  objectPosition?: string;
  
  // Callbacks
  onLoad?: () => void;
  onError?: () => void;
  
  // Acessibilidade
  role?: string;
  "aria-hidden"?: boolean;
}

// ============================================
// PLACEHOLDERS
// ============================================
const BLUR_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23374151' filter='url(%23b)'/%3E%3C/svg%3E`;

const ERROR_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cline x1='9' y1='9' x2='15' y2='15'/%3E%3Cline x1='15' y1='9' x2='9' y2='15'/%3E%3C/svg%3E`;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  aspectRatio,
  priority = false,
  placeholder = "skeleton",
  blurDataURL,
  format = "auto",
  quality,
  sizes,
  srcSet,
  className,
  objectFit = "cover",
  objectPosition = "center",
  onLoad,
  onError,
  role,
  "aria-hidden": ariaHidden,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Config de performance
  const config = getPerformanceConfig();
  const finalQuality = quality ?? config.imageQuality;
  const rootMargin = config.prefetchMargin;

  // ============================================
  // INTERSECTION OBSERVER (LAZY LOAD)
  // ============================================
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView, rootMargin]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // ============================================
  // GERAR SRC OTIMIZADO
  // ============================================
  const getOptimizedSrc = useCallback((originalSrc: string): string => {
    // Data URL ou blob - retornar original
    if (originalSrc.startsWith("data:") || originalSrc.startsWith("blob:")) {
      return originalSrc;
    }

    // URL Supabase Storage - adicionar transformações
    if (originalSrc.includes("supabase") && originalSrc.includes("/storage/")) {
      try {
        const url = new URL(originalSrc);
        if (width) url.searchParams.set("width", String(width));
        if (finalQuality) url.searchParams.set("quality", String(finalQuality));
        return url.toString();
      } catch {
        return originalSrc;
      }
    }

    return originalSrc;
  }, [width, finalQuality]);

  const finalSrc = getOptimizedSrc(src);
  const finalBlurDataURL = blurDataURL || BLUR_PLACEHOLDER;

  // Container styles
  const containerStyle: React.CSSProperties = {
    aspectRatio: aspectRatio,
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        className
      )}
      style={containerStyle}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder === "blur" && (
            <img
              src={finalBlurDataURL}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm"
            />
          )}
          {placeholder === "skeleton" && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          {placeholder === "empty" && (
            <div className="absolute inset-0 bg-muted/50" />
          )}
        </div>
      )}

      {/* Imagem real (só carrega quando em view) */}
      {isInView && !hasError && (
        <img
          src={finalSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          srcSet={srcSet}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          role={role}
          aria-hidden={ariaHidden}
          className={cn(
            "w-full h-full transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{
            objectFit,
            objectPosition,
          }}
        />
      )}

      {/* Fallback de erro */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground gap-2">
          <img 
            src={ERROR_PLACEHOLDER} 
            alt="" 
            aria-hidden="true"
            className="w-8 h-8 opacity-50"
          />
          <span className="text-xs">Erro ao carregar</span>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
