// ============================================
// SYNAPSE v15.0 - OptimizedImage
// Mobile-first, 3G-optimized image component
// ============================================

import { memo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  onLoad?: () => void;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = "empty",
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Detectar conexão lenta para ajustar rootMargin
  const [rootMargin] = useState(() => {
    if (typeof navigator === 'undefined') return "300px";
    const conn = (navigator as any).connection;
    if (!conn) return "300px";
    if (conn.saveData) return "800px"; // Data saver = prefetch agressivo
    if (['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return "600px"; // 3G
    return "300px"; // 4G/WiFi
  });

  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority, isInView, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div
      ref={imgRef as any}
      className={cn(
        "relative overflow-hidden bg-muted/20",
        className
      )}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && placeholder === "blur" && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10 animate-pulse" />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
});
