// ============================================
// 🚀 OPTIMIZED IMAGE COMPONENT - LEI I PERFORMANCE
// Blur placeholder + Lazy loading + LQIP
// Design: 2300 | Performance: 3500
// ============================================

import { useState, useRef, useEffect, memo, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  priority?: boolean; // Se true, carrega imediatamente (above the fold)
  placeholderColor?: string; // Cor dominante para placeholder
  aspectRatio?: 'square' | '16:9' | '4:3' | '3:4' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Gera um placeholder blur SVG inline (LQIP - Low Quality Image Placeholder)
const generateBlurPlaceholder = (color: string = '#1a1a1a'): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect fill="${color}" width="8" height="8"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Aspect ratio classes
const aspectRatioClasses: Record<string, string> = {
  'square': 'aspect-square',
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
  'auto': '',
};

export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  priority = false,
  placeholderColor = '#1a1a1a',
  aspectRatio = 'auto',
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Se priority, já está "em view"
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver para lazy loading
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
        rootMargin: '200px', // Pré-carrega 200px antes de entrar no viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const placeholderSrc = generateBlurPlaceholder(placeholderColor);

  const containerStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: placeholderColor,
  };

  const imageStyle: CSSProperties = {
    objectFit,
    objectPosition,
    transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
    filter: isLoaded ? 'none' : 'blur(10px)',
  };

  const placeholderStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    objectFit,
    objectPosition,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 0 : 1,
    filter: 'blur(10px)',
    transform: 'scale(1.1)', // Evita bordas durante blur
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
      style={containerStyle}
    >
      {/* Placeholder blur */}
      <img
        src={placeholderSrc}
        alt=""
        aria-hidden="true"
        className={cn('w-full h-full pointer-events-none select-none', className)}
        style={placeholderStyle}
        width={width}
        height={height}
      />

      {/* Imagem real - só carrega quando em view */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn('w-full h-full', className)}
          style={imageStyle}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Fallback para erro */}
      {hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500"
          aria-label={`Erro ao carregar imagem: ${alt}`}
        >
          <svg 
            className="w-12 h-12 opacity-50" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
