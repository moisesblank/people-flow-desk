// ============================================
// SYNAPSE v15.0 - PERFORMANCE HOOKS
// Mobile-first, 3G-optimized
// ============================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ============================================
// NETWORK DETECTION - Detecta 3G/slow connections
// ============================================
interface NetworkInfo {
  isSlowConnection: boolean;
  isMobile: boolean;
  effectiveType: string;
  saveData: boolean;
}

export function useNetworkInfo(): NetworkInfo {
  const [info, setInfo] = useState<NetworkInfo>({
    isSlowConnection: false,
    isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
    effectiveType: '4g',
    saveData: false,
  });

  useEffect(() => {
    const updateInfo = () => {
      const nav = navigator as any;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      const isMobile = window.innerWidth < 768;
      const effectiveType = connection?.effectiveType || '4g';
      const saveData = connection?.saveData || false;
      const isSlowConnection = ['slow-2g', '2g', '3g'].includes(effectiveType) || saveData;

      setInfo({ isSlowConnection, isMobile, effectiveType, saveData });
    };

    updateInfo();
    
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    connection?.addEventListener?.('change', updateInfo);
    window.addEventListener('resize', updateInfo);

    return () => {
      connection?.removeEventListener?.('change', updateInfo);
      window.removeEventListener('resize', updateInfo);
    };
  }, []);

  return info;
}

// ============================================
// LAZY LOAD HOOK - Intersection Observer
// ============================================
interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useLazyLoad(options: LazyLoadOptions = {}) {
  const { rootMargin = '200px', threshold = 0.01 } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || isIntersecting) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold, isIntersecting]);

  return { ref, isIntersecting };
}

// ============================================
// DEBOUNCE HOOK - Prevents excessive calls
// ============================================
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// THROTTLE CALLBACK - Limits function calls
// ============================================
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRan.current >= delay) {
        lastRan.current = now;
        callback(...args);
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastRan.current = Date.now();
          callback(...args);
        }, delay - (now - lastRan.current));
      }
    }) as T,
    [callback, delay]
  );
}

// ============================================
// REDUCED MOTION - Respects user preferences
// ============================================
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// ============================================
// VIEWPORT SIZE - Responsive breakpoints
// ============================================
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
    isTablet: typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: typeof window !== 'undefined' && window.innerWidth >= 1024,
  });

  useEffect(() => {
    let rafId: number;
    const updateViewport = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
          isMobile: window.innerWidth < 768,
          isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
          isDesktop: window.innerWidth >= 1024,
        });
      });
    };

    window.addEventListener('resize', updateViewport, { passive: true });
    return () => {
      window.removeEventListener('resize', updateViewport);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return viewport;
}

// ============================================
// PERFORMANCE CONTEXT - Global performance state
// Alias: usePerformance (for backward compatibility)
// ============================================
export function usePerformanceMode() {
  const network = useNetworkInfo();
  const reducedMotion = useReducedMotion();
  const viewport = useViewport();

  return {
    // Should use lightweight mode?
    isLightMode: network.isSlowConnection || network.saveData || reducedMotion,
    // Should disable animations?
    disableAnimations: reducedMotion || network.isSlowConnection,
    shouldReduceMotion: reducedMotion || network.isSlowConnection,
    // Should load lower quality images?
    useLowQualityImages: network.isSlowConnection || network.saveData,
    // Device info
    isMobile: viewport.isMobile,
    isTablet: viewport.isTablet,
    isDesktop: viewport.isDesktop,
    // Low-end device detection
    isLowEndDevice: network.isSlowConnection || network.saveData,
    // Animation duration based on connection
    animationDuration: network.isSlowConnection ? 100 : 200,
    // Connection type
    connectionType: network.effectiveType,
    // Metrics placeholder
    metrics: { fps: 60 },
    // Network info
    ...network,
  };
}

// Alias for backward compatibility
export const usePerformance = usePerformanceMode;

// ============================================
// OPTIMIZED ANIMATIONS - Reduced animations for mobile/slow
// ============================================
export function useOptimizedAnimations() {
  const { shouldReduceMotion, isMobile, isLowEndDevice } = usePerformance();
  
  return useMemo(() => ({
    // Should skip animations entirely
    skipAnimations: shouldReduceMotion || isLowEndDevice,
    // Reduced duration for mobile
    duration: shouldReduceMotion ? 0 : isMobile ? 0.15 : 0.25,
    // Simple easing
    ease: [0.25, 0.1, 0.25, 1],
    // Stagger delay for lists
    stagger: shouldReduceMotion ? 0 : 0.03,
  }), [shouldReduceMotion, isMobile, isLowEndDevice]);
}
