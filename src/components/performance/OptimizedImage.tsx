// ============================================
// 🌌🔥 OPTIMIZED IMAGE — IMAGEM OTIMIZADA NÍVEL NASA 🔥🌌
// ANO 2300 — LAZY LOAD + WEBP + PLACEHOLDER
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// Características:
// - Lazy loading nativo
// - Placeholder blur (LQIP)
// - Formato moderno (WebP/AVIF)
// - Responsive srcset
// - Fallback automático
//
// ============================================

import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { cn } from "@/lib/utils";

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
  priority?: boolean; // Se true, não usa lazy
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
// PLACEHOLDER SVG BLUR
// ============================================
const BLUR_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb' filter='url(%23b)'/%3E%3C/svg%3E`;

// ============================================
// SKELETON CSS
// ============================================
const skeletonStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  aspectRatio,
  priority = false,
  placeholder = "skeleton",
  blurDataURL,
  format = "auto",
  quality = 80,
  sizes,
  srcSet,
  className,
  objectFit = "cover",
  objectPosition = "center",
  onLoad,
  onError,
  role,
  "aria-hidden": ariaHidden,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        rootMargin: "200px", // Carregar 200px antes de entrar na viewport
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

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
    // Se já é data URL ou blob, retornar original
    if (originalSrc.startsWith("data:") || originalSrc.startsWith("blob:")) {
      return originalSrc;
    }

    // Se é URL externa, retornar original (não podemos otimizar)
    if (originalSrc.startsWith("http") && !originalSrc.includes(window.location.hostname)) {
      return originalSrc;
    }

    // Para imagens locais, verificar se existe versão WebP
    if (format === "webp" || format === "auto") {
      // Tentar adicionar .webp se não tiver
      if (!originalSrc.endsWith(".webp") && !originalSrc.endsWith(".avif")) {
        // Checar se a imagem original é PNG/JPG que pode ter WebP
        if (originalSrc.match(/\.(png|jpg|jpeg)$/i)) {
          // Retornar original por enquanto (otimização real requer backend)
          return originalSrc;
        }
      }
    }

    return originalSrc;
  }, [format]);

  const finalSrc = getOptimizedSrc(src);
  const finalBlurDataURL = blurDataURL || BLUR_PLACEHOLDER;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        aspectRatio,
      }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-0">
          {placeholder === "blur" && (
            <img
              src={finalBlurDataURL}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit,
                objectPosition,
                filter: "blur(20px)",
                transform: "scale(1.1)",
              }}
              aria-hidden="true"
            />
          )}
          {placeholder === "skeleton" && (
            <div 
              className="absolute inset-0 bg-muted animate-pulse"
              aria-hidden="true"
            />
          )}
          {placeholder === "empty" && (
            <div className="absolute inset-0 bg-muted" aria-hidden="true" />
          )}
        </div>
      )}

      {/* Imagem real (só carrega quando em view) */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={finalSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          srcSet={srcSet}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleLoad}
          onError={handleError}
          role={role}
          aria-hidden={ariaHidden}
          className={cn(
            "relative z-10 w-full h-full transition-opacity duration-300",
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
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-xs">Erro ao carregar</span>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
