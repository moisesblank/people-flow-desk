// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - HOOKS DE DISPOSITIVOS                           ║
// ║   Hooks para garantir compatibilidade universal                             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  LEI_II_DISPOSITIVOS,
  getCurrentBreakpoint,
  isMobileWidth,
  isTabletWidth,
  getGridCols,
  getNetworkAdaptations,
  shouldUseLowEndMode,
} from '@/lib/constitution/LEI_II_DISPOSITIVOS';

// ============================================
// HOOK PRINCIPAL - useDeviceConstitution
// ============================================

export function useDeviceConstitution() {
  // Viewport
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });
  
  // Conexão
  const [connection, setConnection] = useState<string>('4g');
  const [isDataSaver, setIsDataSaver] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Preferências
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Detectar viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Throttle resize
    let timeout: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', throttledResize, { passive: true });
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeout);
    };
  }, []);
  
  // Detectar conexão
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    
    const conn = (navigator as any).connection;
    if (conn) {
      const updateConnection = () => {
        setConnection(conn.effectiveType || '4g');
        setIsDataSaver(conn.saveData === true);
      };
      
      updateConnection();
      conn.addEventListener('change', updateConnection);
      return () => conn.removeEventListener('change', updateConnection);
    }
  }, []);
  
  // Detectar online/offline
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Detectar reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  
  // ============================================
  // VALORES COMPUTADOS
  // ============================================
  
  const breakpoint = useMemo(() => getCurrentBreakpoint(viewport.width), [viewport.width]);
  const isMobile = useMemo(() => isMobileWidth(viewport.width), [viewport.width]);
  const isTablet = useMemo(() => isTabletWidth(viewport.width), [viewport.width]);
  const isDesktop = useMemo(() => viewport.width >= 1024, [viewport.width]);
  const isLowEnd = useMemo(() => shouldUseLowEndMode(), []);
  const gridCols = useMemo(() => getGridCols(viewport.width), [viewport.width]);
  const networkAdaptations = useMemo(() => getNetworkAdaptations(connection), [connection]);
  
  // Touch detection
  const isTouch = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);
  
  // Slow connection
  const isSlowConnection = useMemo(() => {
    return ['slow-2g', '2g', '3g'].includes(connection);
  }, [connection]);
  
  // ============================================
  // CONFIG COMPLETA
  // ============================================
  
  const config = useMemo(() => ({
    // Viewport
    viewport,
    breakpoint,
    
    // Device type
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    
    // Hardware
    isLowEnd,
    
    // Network
    connection,
    isSlowConnection,
    isDataSaver,
    isOnline,
    isOffline: !isOnline,
    networkAdaptations,
    
    // Preferences
    prefersReducedMotion,
    
    // Layout helpers
    gridCols,
    shouldUseMobileDashboard: isMobile,
    shouldUseDrawer: isMobile,
    shouldCollapeSidebar: isMobile || isTablet,
    
    // Touch targets
    minTouchTarget: LEI_II_DISPOSITIVOS.TOUCH.MIN_TOUCH_TARGET,
    
    // Adaptations
    shouldDisableBlur: isLowEnd || isSlowConnection,
    shouldDisableAnimations: prefersReducedMotion || isLowEnd,
    shouldDisableHDImages: isDataSaver || isSlowConnection,
    shouldSimplifyUI: isLowEnd || connection === '2g',
    
    // CSS classes helpers
    touchClass: isTouch ? 'touch-device' : 'mouse-device',
    deviceClass: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    
  }), [
    viewport, breakpoint, isMobile, isTablet, isDesktop, isTouch,
    isLowEnd, connection, isSlowConnection, isDataSaver, isOnline,
    networkAdaptations, prefersReducedMotion, gridCols,
  ]);
  
  return config;
}

// ============================================
// HOOKS ESPECÍFICOS
// ============================================

/**
 * Hook para viewport apenas
 */
export function useViewportConstitution() {
  const { viewport, breakpoint, isMobile, isTablet, isDesktop } = useDeviceConstitution();
  return { viewport, breakpoint, isMobile, isTablet, isDesktop };
}

/**
 * Hook para rede apenas
 */
export function useNetworkConstitution() {
  const { connection, isSlowConnection, isDataSaver, isOnline, isOffline, networkAdaptations } = useDeviceConstitution();
  return { connection, isSlowConnection, isDataSaver, isOnline, isOffline, networkAdaptations };
}

/**
 * Hook para touch
 */
export function useTouchConstitution() {
  const { isTouch, minTouchTarget } = useDeviceConstitution();
  
  return useMemo(() => ({
    isTouch,
    minTouchTarget,
    touchTargetClass: `min-h-[${minTouchTarget}px] min-w-[${minTouchTarget}px]`,
    activeState: isTouch ? 'active:' : 'hover:',
  }), [isTouch, minTouchTarget]);
}

/**
 * Hook para layout responsivo
 */
export function useResponsiveLayout() {
  const { isMobile, isTablet, gridCols, shouldUseMobileDashboard, shouldUseDrawer, shouldCollapeSidebar } = useDeviceConstitution();
  
  return useMemo(() => ({
    gridCols,
    gridClass: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`,
    shouldUseMobileDashboard,
    shouldUseDrawer,
    shouldCollapeSidebar,
    sidebarWidth: shouldCollapeSidebar 
      ? LEI_II_DISPOSITIVOS.LAYOUT.SIDEBAR.collapsedWidth 
      : LEI_II_DISPOSITIVOS.LAYOUT.SIDEBAR.expandedWidth,
  }), [isMobile, isTablet, gridCols, shouldUseMobileDashboard, shouldUseDrawer, shouldCollapeSidebar]);
}

/**
 * Hook para adaptações de low-end
 */
export function useLowEndAdaptations() {
  const { isLowEnd, shouldDisableBlur, shouldDisableAnimations, shouldSimplifyUI } = useDeviceConstitution();
  
  return useMemo(() => ({
    isLowEnd,
    shouldDisableBlur,
    shouldDisableAnimations,
    shouldSimplifyUI,
    
    // Classes para aplicar
    blurClass: shouldDisableBlur ? 'bg-background/95' : 'backdrop-blur-md bg-background/80',
    animationClass: shouldDisableAnimations ? '' : 'transition-all duration-300',
  }), [isLowEnd, shouldDisableBlur, shouldDisableAnimations, shouldSimplifyUI]);
}

/**
 * Hook para media queries
 */
export function useMediaQueryConstitution(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  
  return matches;
}

// Queries pré-definidas
export const useIsMobile = () => useMediaQueryConstitution('(max-width: 767px)');
export const useIsTablet = () => useMediaQueryConstitution('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQueryConstitution('(min-width: 1024px)');
export const useIsTouch = () => useMediaQueryConstitution('(hover: none)');
export const usePrefersReducedMotion = () => useMediaQueryConstitution('(prefers-reduced-motion: reduce)');
export const usePrefersReducedData = () => useMediaQueryConstitution('(prefers-reduced-data: reduce)');
export const useIsDarkMode = () => useMediaQueryConstitution('(prefers-color-scheme: dark)');
export const useIsHighContrast = () => useMediaQueryConstitution('(prefers-contrast: high)');

export default useDeviceConstitution;
