// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   ⚡ PERFORMANCE PROVIDER v5.0 ⚡                                             ║
// ║   Aplica classes de performance ao documento e gerencia estado global        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import React, { createContext, useContext, useEffect, useMemo, memo } from 'react';
import { 
  detectUltraPerformance, 
  setupPerformanceListener,
  getPerformanceClasses,
  type UltraPerformanceState 
} from '@/lib/performance/ultraPerformance3G';

// ============================================
// CONTEXT
// ============================================

const PerformanceContext = createContext<UltraPerformanceState | null>(null);

export function usePerformanceContext(): UltraPerformanceState {
  const ctx = useContext(PerformanceContext);
  if (!ctx) {
    return detectUltraPerformance();
  }
  return ctx;
}

// ============================================
// PROVIDER
// ============================================

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export const PerformanceProvider = memo(function PerformanceProvider({ 
  children 
}: PerformanceProviderProps) {
  const [state, setState] = React.useState<UltraPerformanceState>(() => 
    detectUltraPerformance()
  );
  
  // Aplica classes ao <html> element
  useEffect(() => {
    const html = document.documentElement;
    const classes = getPerformanceClasses();
    
    // Remove classes antigas
    html.classList.forEach(cls => {
      if (cls.startsWith('perf-')) {
        html.classList.remove(cls);
      }
    });
    
    // Adiciona novas classes
    classes.split(' ').forEach(cls => {
      if (cls) html.classList.add(cls);
    });
    
    // Log em dev
    if (import.meta.env.DEV) {
      console.log(`[PERF-PROVIDER] ⚡ Tier: ${state.tier}, Classes: ${classes}`);
    }
  }, [state.tier, state.flags]);
  
  // Listener para mudanças de conexão
  useEffect(() => {
    const cleanup = setupPerformanceListener((newState) => {
      setState(newState);
    });
    
    return cleanup;
  }, []);
  
  // CSS Variables para performance
  useEffect(() => {
    const root = document.documentElement;
    
    // Animation variables
    root.style.setProperty('--perf-duration', `${state.animation.duration}ms`);
    root.style.setProperty('--perf-stagger', `${state.animation.stagger}ms`);
    root.style.setProperty('--perf-easing', state.animation.easing);
    
    // Image variables
    root.style.setProperty('--perf-img-quality', String(state.image.quality));
    root.style.setProperty('--perf-img-max-width', `${state.image.maxWidth}px`);
    
    // Lazy loading variables
    root.style.setProperty('--perf-lazy-margin', state.lazy.rootMargin);
  }, [state.animation, state.image, state.lazy]);
  
  const value = useMemo(() => state, [state]);
  
  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
});

// ============================================
// GLOBAL PERFORMANCE CSS
// ============================================

export const PerformanceStyles = memo(function PerformanceStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* ============================================ */
      /* ULTRA PERFORMANCE CSS - 3G OPTIMIZED        */
      /* ============================================ */
      
      /* TIER: CRITICAL - Zero efeitos visuais */
      .perf-tier-critical *,
      .perf-tier-critical *::before,
      .perf-tier-critical *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.001ms !important;
        transition-delay: 0ms !important;
      }
      
      .perf-tier-critical .blur-\\[,
      .perf-tier-critical [class*="blur-"],
      .perf-tier-critical [class*="backdrop-blur"] {
        filter: none !important;
        backdrop-filter: none !important;
      }
      
      .perf-tier-critical [class*="shadow"],
      .perf-tier-critical [class*="drop-shadow"] {
        box-shadow: none !important;
        filter: none !important;
      }
      
      /* TIER: LOW - Animações mínimas */
      .perf-tier-low * {
        animation-duration: 0.001ms !important;
        transition-duration: 50ms !important;
      }
      
      .perf-tier-low [class*="blur-"],
      .perf-tier-low [class*="backdrop-blur"] {
        filter: none !important;
        backdrop-filter: none !important;
      }
      
      /* NO ANIMATIONS */
      .perf-no-animations * {
        animation: none !important;
        transition: none !important;
      }
      
      /* NO BLUR */
      .perf-no-blur [class*="blur-"],
      .perf-no-blur [class*="backdrop-blur"] {
        filter: none !important;
        backdrop-filter: none !important;
        background-color: rgba(0, 0, 0, 0.8) !important;
      }
      
      /* NO SHADOWS */
      .perf-no-shadows [class*="shadow"] {
        box-shadow: none !important;
      }
      
      /* NO PARTICLES */
      .perf-no-particles .perf-particles,
      .perf-no-particles [data-perf="particles"] {
        display: none !important;
      }
      
      /* NO GRADIENTS */
      .perf-no-gradients [class*="bg-gradient"] {
        background: var(--primary) !important;
      }
      
      /* REDUCED MOTION */
      .perf-reduced-motion *,
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
          scroll-behavior: auto !important;
        }
      }
      
      /* AMBIENT-ONLY: Elementos decorativos */
      .perf-tier-critical .perf-ambient-only,
      .perf-tier-low .perf-ambient-only,
      .perf-no-particles .perf-ambient-only {
        display: none !important;
      }
      
      /* GPU ACCELERATION HINTS */
      .perf-tier-ultra .perf-gpu,
      .perf-tier-high .perf-gpu {
        will-change: transform, opacity;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      
      /* CONTENT VISIBILITY for below-fold content */
      .perf-lazy-section {
        content-visibility: auto;
        contain-intrinsic-size: 0 500px;
      }
      
      /* IMAGE OPTIMIZATION */
      .perf-tier-critical img,
      .perf-tier-low img {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: optimizeSpeed;
      }
      
      /* FONT OPTIMIZATION */
      .perf-tier-critical,
      .perf-tier-low {
        text-rendering: optimizeSpeed;
        -webkit-font-smoothing: none;
      }
    `}} />
  );
});

// ============================================
// CONDITIONAL WRAPPER COMPONENTS
// ============================================

interface PerformanceGateProps {
  minTier?: 'critical' | 'low' | 'medium' | 'high' | 'ultra';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renderiza children apenas se tier >= minTier
 */
export const PerformanceGate = memo(function PerformanceGate({
  minTier = 'medium',
  children,
  fallback = null,
}: PerformanceGateProps) {
  const state = usePerformanceContext();
  const tierOrder = ['critical', 'low', 'medium', 'high', 'ultra'];
  const currentIndex = tierOrder.indexOf(state.tier);
  const minIndex = tierOrder.indexOf(minTier);
  
  if (currentIndex >= minIndex) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
});

/**
 * Componente que só renderiza em conexões rápidas
 */
export const FastConnectionOnly = memo(function FastConnectionOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PerformanceGate minTier="medium" fallback={fallback}>
      {children}
    </PerformanceGate>
  );
});

/**
 * Componente que só renderiza partículas/efeitos pesados em hardware bom
 */
export const ParticlesGate = memo(function ParticlesGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = usePerformanceContext();
  
  if (!state.flags.enableParticles) {
    return null;
  }
  
  return <div className="perf-particles">{children}</div>;
});

/**
 * Wrapper que aplica blur apenas se habilitado
 */
export const BlurGate = memo(function BlurGate({
  children,
  fallbackBg = 'bg-background/90',
}: {
  children: React.ReactNode;
  fallbackBg?: string;
}) {
  const state = usePerformanceContext();
  
  if (!state.flags.enableBlur) {
    return <div className={fallbackBg}>{children}</div>;
  }
  
  return <>{children}</>;
});
