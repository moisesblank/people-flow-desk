// ============================================
// SYNAPSE v15.0 - PERFORMANCE ULTRA HOOK
// Sistema de otimização automática para todos os dispositivos
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';

interface PerformanceConfig {
  // Device detection
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  
  // Connection quality
  isSlowConnection: boolean;
  isFastConnection: boolean;
  connectionType: string;
  
  // Performance mode
  shouldReduceMotion: boolean;
  shouldReduceData: boolean;
  isLowEndDevice: boolean;
  
  // Optimizations
  animationDuration: number;
  debounceDelay: number;
  throttleDelay: number;
  imageSrcSet: 'low' | 'medium' | 'high';
  prefetchEnabled: boolean;
  
  // Screen info
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number | null;
  loadTime: number;
  isPerformanceOptimal: boolean;
}

// Detect if device is low-end based on hardware
function detectLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) return true;
  
  // Check device memory (if available)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory <= 2) return true;
  
  // Check for mobile with older GPU
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (gl) {
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      // Check for older/integrated GPUs
      if (renderer && (
        renderer.includes('Mali-4') ||
        renderer.includes('Adreno 3') ||
        renderer.includes('PowerVR SGX')
      )) {
        return true;
      }
    }
  }
  
  return false;
}

// Get connection info
function getConnectionInfo(): { type: string; isSlowConnection: boolean } {
  if (typeof navigator === 'undefined') {
    return { type: 'unknown', isSlowConnection: false };
  }
  
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (!connection) {
    return { type: 'unknown', isSlowConnection: false };
  }
  
  const effectiveType = connection.effectiveType || '4g';
  const isSlowConnection = ['slow-2g', '2g', '3g'].includes(effectiveType) || 
                          (connection.downlink && connection.downlink < 1.5);
  
  return { type: effectiveType, isSlowConnection };
}

export function usePerformance(): PerformanceConfig & { metrics: PerformanceMetrics } {
  const [screenWidth, setScreenWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );
  const [screenHeight, setScreenHeight] = useState(() => 
    typeof window !== 'undefined' ? window.innerHeight : 1080
  );
  const [connectionInfo, setConnectionInfo] = useState(() => getConnectionInfo());
  const [fps, setFps] = useState(60);
  
  // Detect device type
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const isTouchDevice = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  
  // Device & motion preferences
  const shouldReduceMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEndDevice = useMemo(() => detectLowEndDevice(), []);
  
  // Connection-based optimizations
  const shouldReduceData = connectionInfo.isSlowConnection || isLowEndDevice;
  
  // Calculate optimal settings based on device
  const config = useMemo((): PerformanceConfig => {
    // Animation duration: faster on mobile, instant if reduced motion
    let animationDuration = 300;
    if (shouldReduceMotion) animationDuration = 0;
    else if (isLowEndDevice || connectionInfo.isSlowConnection) animationDuration = 150;
    else if (isMobile) animationDuration = 200;
    
    // Debounce/throttle: more aggressive on slow devices
    let debounceDelay = 100;
    let throttleDelay = 50;
    if (isLowEndDevice || connectionInfo.isSlowConnection) {
      debounceDelay = 200;
      throttleDelay = 100;
    } else if (isMobile) {
      debounceDelay = 150;
      throttleDelay = 75;
    }
    
    // Image quality based on connection and device
    let imageSrcSet: 'low' | 'medium' | 'high' = 'high';
    if (connectionInfo.isSlowConnection || isLowEndDevice) {
      imageSrcSet = 'low';
    } else if (isMobile) {
      imageSrcSet = 'medium';
    }
    
    // Prefetch only on fast connections
    const prefetchEnabled = !connectionInfo.isSlowConnection && !isLowEndDevice;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      isSlowConnection: connectionInfo.isSlowConnection,
      isFastConnection: !connectionInfo.isSlowConnection,
      connectionType: connectionInfo.type,
      shouldReduceMotion,
      shouldReduceData,
      isLowEndDevice,
      animationDuration,
      debounceDelay,
      throttleDelay,
      imageSrcSet,
      prefetchEnabled,
      screenWidth,
      screenHeight,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      orientation: screenWidth > screenHeight ? 'landscape' : 'portrait',
    };
  }, [
    isMobile, isTablet, isDesktop, isTouchDevice,
    shouldReduceMotion, isLowEndDevice, connectionInfo,
    screenWidth, screenHeight
  ]);
  
  // Track screen size changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      // Debounce resize events
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setScreenWidth(window.innerWidth);
        setScreenHeight(window.innerHeight);
      }, 100);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Track connection changes
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    
    const connection = (navigator as any).connection;
    if (!connection) return;
    
    const handleConnectionChange = () => {
      setConnectionInfo(getConnectionInfo());
    };
    
    connection.addEventListener('change', handleConnectionChange);
    return () => connection.removeEventListener('change', handleConnectionChange);
  }, []);
  
  // FPS monitoring (lightweight)
  useEffect(() => {
    if (typeof window === 'undefined' || isLowEndDevice) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, [isLowEndDevice]);
  
  // Performance metrics
  const metrics: PerformanceMetrics = useMemo(() => {
    const memory = (performance as any).memory;
    return {
      fps,
      memoryUsage: memory ? memory.usedJSHeapSize / memory.jsHeapSizeLimit : null,
      loadTime: typeof window !== 'undefined' 
        ? performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0
        : 0,
      isPerformanceOptimal: fps >= 30 && !isLowEndDevice,
    };
  }, [fps, isLowEndDevice]);
  
  return { ...config, metrics };
}

// Optimized animation variants based on performance
export function useOptimizedAnimations() {
  const { shouldReduceMotion, animationDuration, isLowEndDevice, isMobile } = usePerformance();
  
  return useMemo(() => {
    if (shouldReduceMotion || isLowEndDevice) {
      // No animations for reduced motion or low-end devices
      return {
        fadeIn: {},
        fadeOut: {},
        slideIn: {},
        slideOut: {},
        scaleIn: {},
        scaleOut: {},
        stagger: {},
        container: {},
        item: {},
      };
    }
    
    const duration = animationDuration / 1000;
    const fastDuration = duration * 0.6;
    
    return {
      fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: fastDuration },
      },
      fadeOut: {
        initial: { opacity: 1 },
        animate: { opacity: 0 },
        transition: { duration: fastDuration },
      },
      slideIn: {
        initial: { opacity: 0, y: isMobile ? 10 : 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
      },
      slideOut: {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 0, y: isMobile ? 10 : 20 },
        transition: { duration: fastDuration },
      },
      scaleIn: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: fastDuration },
      },
      scaleOut: {
        initial: { opacity: 1, scale: 1 },
        animate: { opacity: 0, scale: 0.95 },
        transition: { duration: fastDuration },
      },
      // Stagger for lists - reduced on mobile
      stagger: {
        staggerChildren: isMobile ? 0.03 : 0.05,
        delayChildren: 0,
      },
      container: {
        initial: { opacity: 0 },
        animate: { 
          opacity: 1,
          transition: { staggerChildren: isMobile ? 0.03 : 0.05 }
        },
      },
      item: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: fastDuration },
      },
    };
  }, [shouldReduceMotion, animationDuration, isLowEndDevice, isMobile]);
}

// Optimized debounce hook
export function useOptimizedDebounce<T>(value: T, customDelay?: number): T {
  const { debounceDelay } = usePerformance();
  const [debouncedValue, setDebouncedValue] = useState(value);
  const delay = customDelay ?? debounceDelay;
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// Optimized throttle hook
export function useOptimizedThrottle<T extends (...args: any[]) => any>(
  callback: T,
  customDelay?: number
): T {
  const { throttleDelay } = usePerformance();
  const delay = customDelay ?? throttleDelay;
  
  const lastRun = useMemo(() => ({ current: 0 }), []);
  
  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay, lastRun]
  );
}

// Intersection observer hook for lazy loading
export function useLazyLoad(options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px', threshold: 0.1, ...options }
    );
    
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);
  
  return { ref: setRef, isIntersecting };
}

// Image loading optimization
export function useOptimizedImage(src: string) {
  const { imageSrcSet, shouldReduceData } = usePerformance();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Generate optimized src based on device
  const optimizedSrc = useMemo(() => {
    if (shouldReduceData && src.includes('supabase')) {
      // Add quality parameter for Supabase storage
      const separator = src.includes('?') ? '&' : '?';
      const quality = imageSrcSet === 'low' ? 50 : imageSrcSet === 'medium' ? 75 : 90;
      return `${src}${separator}quality=${quality}`;
    }
    return src;
  }, [src, imageSrcSet, shouldReduceData]);
  
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    img.src = optimizedSrc;
  }, [optimizedSrc]);
  
  return { src: optimizedSrc, loaded, error };
}

// Export a global performance indicator
export function getPerformanceMode(): 'ultra' | 'high' | 'balanced' | 'low' {
  if (typeof window === 'undefined') return 'balanced';
  
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  const connection = getConnectionInfo();
  
  if (cores >= 8 && memory >= 8 && !connection.isSlowConnection) return 'ultra';
  if (cores >= 4 && memory >= 4 && !connection.isSlowConnection) return 'high';
  if (cores >= 2 && memory >= 2) return 'balanced';
  return 'low';
}

export default usePerformance;
