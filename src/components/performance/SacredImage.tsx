// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v2.0 ⚡
// DOGMA III: O RITUAL DO LAZY LOADING INTELIGENTE
// Componente de imagem ultra-otimizado
// 🏛️ LEI I Art. 10-14 - Imagens Sagradas
// ============================================

import React, { memo, useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  getOptimizedImageUrl, 
  getImageFormatSupport,
  generateBlurPlaceholder 
} from "@/lib/performance/compressionUtils";
import { 
  detectTier,
  getImageQuality,
  getRootMargin,
  IMAGE_CONSTITUTION,
  type PerformanceTier 
} from "@/lib/constitution/LEI_I_PERFORMANCE";

interface SacredImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty' | 'skeleton' | 'color';
  placeholderColor?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 🏛️ LEI I Art. 10-14 - Imagem otimizada com lazy loading e LQIP
 * - loading="lazy" nativo para below-the-fold
 * - Placeholder blur/color enquanto carrega
 * - Formatos modernos (AVIF/WebP) com fallback
 * - Otimização baseada em performance tier (6 tiers)
 */
export const SacredImage = memo(function SacredImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  quality,
  placeholder = 'blur',
  placeholderColor,
  objectFit = 'cover',
  sizes,
  onLoad,
  onError,
}: SacredImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);
  
  // 🏛️ LEI I - Usar tier oficial da Constituição
  const tier = useMemo(() => detectTier(), []);
  
  // Calcular qualidade baseada no tier (LEI I Art. 12)
  const effectiveQuality = useMemo(() => {
    if (quality) return quality;
    return getImageQuality(tier);
  }, [quality, tier]);
  
  // URL otimizada com formato moderno
  const optimizedSrc = useMemo(() => {
    return getOptimizedImageUrl(src, {
      width,
      height,
      quality: effectiveQuality,
      format: 'auto',
    });
  }, [src, width, height, effectiveQuality]);
  
  // 🏛️ LEI I Art. 10 - Gerar srcset completo com breakpoints constitucionais
  const generateSrcSet = useMemo(() => {
    // Só gera srcset para URLs do Supabase que suportam transformações
    if (!src.includes('supabase')) return undefined;
    
    const breakpoints = IMAGE_CONSTITUTION.SRCSET; // [320, 480, 640, 768, 1024, 1280, 1536, 1920]
    
    return (format?: 'avif' | 'webp') => {
      return breakpoints
        .map(bp => {
          const url = getOptimizedImageUrl(src, {
            width: bp,
            quality: effectiveQuality,
            format: format || 'auto',
          });
          return `${url} ${bp}w`;
        })
        .join(', ');
    };
  }, [src, effectiveQuality]);
  
  // Placeholder gradient
  const blurPlaceholder = useMemo(() => {
    return generateBlurPlaceholder(placeholderColor);
  }, [placeholderColor]);
  
  // 🏛️ LEI I Art. 7 - Intersection Observer para lazy loading
  useEffect(() => {
    if (priority || isInView) return;
    
    const element = imgRef.current;
    if (!element) return;
    
    // 🏛️ LEI I Art. 7 - rootMargin por tier oficial
    const rootMargin = getRootMargin(tier);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [priority, isInView, tier]);
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  
  // Object fit classes
  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  }[objectFit];
  
  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      style={{ width, height }}
    >
      {/* DOGMA III.3 - Placeholder (LQIP) */}
      {!isLoaded && !hasError && (
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            isLoaded ? 'opacity-0' : 'opacity-100'
          )}
          style={{
            background: placeholder === 'blur' || placeholder === 'color' 
              ? blurPlaceholder 
              : undefined,
          }}
          aria-hidden="true"
        >
          {placeholder === 'skeleton' && (
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30" />
          )}
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <span className="text-xs text-muted-foreground">Erro ao carregar</span>
        </div>
      )}
      
      {/* Imagem principal - só renderiza quando em view */}
      {isInView && !hasError && (
        <picture>
          {/* 🏛️ LEI I Art. 10 - AVIF com srcset completo multi-resolução */}
          {getImageFormatSupport().avif && src.includes('supabase') && generateSrcSet && (
            <source 
              srcSet={generateSrcSet('avif')} 
              sizes={sizes || '100vw'}
              type="image/avif" 
            />
          )}
          {/* 🏛️ LEI I Art. 10 - WebP com srcset completo multi-resolução */}
          {getImageFormatSupport().webp && src.includes('supabase') && generateSrcSet && (
            <source 
              srcSet={generateSrcSet('webp')} 
              sizes={sizes || '100vw'}
              type="image/webp" 
            />
          )}
          
          <img
            src={optimizedSrc}
            alt={alt}
            width={width}
            height={height}
            // 🏛️ LEI I Art. 10 - srcset fallback para formatos não-modernos
            srcSet={generateSrcSet?.() || undefined}
            sizes={sizes || '100vw'}
            // DOGMA III.1 - Native lazy loading
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full transition-opacity duration-300",
              objectFitClass,
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        </picture>
      )}
    </div>
  );
});

/**
 * DOGMA III.1 - Iframe com lazy loading nativo
 */
interface SacredIframeProps {
  src: string;
  title: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  allow?: string;
}

export const SacredIframe = memo(function SacredIframe({
  src,
  title,
  className,
  width,
  height,
  priority = false,
  allow,
}: SacredIframeProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const iframeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (priority || isInView) return;
    
    const element = iframeRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [priority, isInView]);
  
  return (
    <div
      ref={iframeRef}
      className={cn("relative overflow-hidden bg-muted/20", className)}
      style={{ width, height }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      {isInView && (
        <iframe
          src={src}
          title={title}
          width="100%"
          height="100%"
          // DOGMA III.1 - Native lazy loading para iframes
          loading={priority ? "eager" : "lazy"}
          allow={allow}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "w-full h-full border-0 transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
});

export default SacredImage;
