// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🌌 TESE 2: PROTOCOLO DE REATIVIDADE QUÂNTICA                               ║
// ║   Hook central para experiência pós-load de 60 FPS                           ║
// ║   Memoização cirúrgica + Animações GPU + Transições Concorrentes             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { 
  useCallback, 
  useMemo, 
  useRef, 
  useState, 
  useEffect,
  useTransition,
  useDeferredValue,
  startTransition,
  type DependencyList,
  type ReactNode
} from 'react';
import { useConstitution } from '@/hooks/useConstitution';
import type { HTMLMotionProps, Transition, Easing } from 'framer-motion';

// ============================================
// TIPOS
// ============================================

export interface QuantumReactivityConfig {
  // Estado
  tier: string;
  isLowEnd: boolean;
  
  // Animação
  shouldAnimate: boolean;
  gpuAnimationProps: GPUAnimationProps;
  
  // Transições
  isPending: boolean;
  startLowPriorityTransition: (callback: () => void) => void;
  deferValue: <T>(value: T) => T;
  
  // Helpers
  throttle: <T extends (...args: any[]) => any>(fn: T, ms?: number) => T;
  debounce: <T extends (...args: any[]) => any>(fn: T, ms?: number) => T;
  
  // Virtualização
  shouldVirtualize: (itemCount: number) => boolean;
  getVirtualConfig: () => VirtualConfig;
}

// Tipo compatível com framer-motion
type GPUMotionConfig = {
  initial?: { opacity?: number; y?: number; x?: number; scale?: number } | false;
  animate?: { opacity?: number; y?: number; x?: number; scale?: number };
  exit?: { opacity?: number; y?: number; x?: number; scale?: number };
  transition?: {
    duration?: number;
    ease?: Easing;
  };
};

export interface GPUAnimationProps {
  fadeIn: GPUMotionConfig;
  fadeUp: GPUMotionConfig;
  scaleIn: GPUMotionConfig;
  slideIn: GPUMotionConfig;
  none: Record<string, never>;
}

interface VirtualConfig {
  threshold: number;
  overscan: number;
  itemHeight: number;
}

// ============================================
// CONSTANTES (TESE 2)
// ============================================

const THROTTLE_MS_BY_TIER = {
  critical: 200,
  low: 150,
  medium: 100,
  high: 50,
  ultra: 16, // ~60fps
} as const;

const DEBOUNCE_MS_BY_TIER = {
  critical: 500,
  low: 400,
  medium: 300,
  high: 200,
  ultra: 150,
} as const;

const VIRTUALIZATION_THRESHOLD = 50; // TESE 2.3

// ============================================
// HOOK PRINCIPAL: useQuantumReactivity
// ============================================

export function useQuantumReactivity(): QuantumReactivityConfig {
  const constitution = useConstitution();
  const [isPending, startTransitionFn] = useTransition();
  
  // ============================================
  // TESE 2.1: Throttle/Debounce adaptativos
  // ============================================
  
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    ms?: number
  ): T => {
    const delay = ms ?? THROTTLE_MS_BY_TIER[constitution.tier as keyof typeof THROTTLE_MS_BY_TIER] ?? 100;
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = delay - (now - lastCall);
      
      if (remaining <= 0) {
        lastCall = now;
        return fn(...args);
      }
      
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, remaining);
    }) as T;
  }, [constitution.tier]);
  
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    ms?: number
  ): T => {
    const delay = ms ?? DEBOUNCE_MS_BY_TIER[constitution.tier as keyof typeof DEBOUNCE_MS_BY_TIER] ?? 300;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    return ((...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  }, [constitution.tier]);
  
  // ============================================
  // TESE 2.2: Animações GPU-ONLY
  // ============================================
  
  const gpuAnimationProps = useMemo<GPUAnimationProps>(() => {
    const { shouldAnimate, animationDuration } = constitution;
    const duration = animationDuration(250) / 1000;
    const ease: Easing = [0.4, 0, 0.2, 1]; // Material easing - cubic bezier tuple
    
    if (!shouldAnimate) {
      return {
        fadeIn: { initial: false },
        fadeUp: { initial: false },
        scaleIn: { initial: false },
        slideIn: { initial: false },
        none: {},
      };
    }
    
    return {
      // GPU-ONLY: Apenas transform + opacity
      fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration, ease },
      },
      fadeUp: {
        initial: { opacity: 0, y: 20 }, // y usa transform
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration, ease },
      },
      scaleIn: {
        initial: { opacity: 0, scale: 0.95 }, // scale usa transform
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration, ease },
      },
      slideIn: {
        initial: { opacity: 0, x: 20 }, // x usa transform
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
        transition: { duration, ease },
      },
      none: {},
    };
  }, [constitution.shouldAnimate, constitution.animationDuration]);
  
  // ============================================
  // TESE 2.3: Transições Concorrentes
  // ============================================
  
  const startLowPriorityTransition = useCallback((callback: () => void) => {
    startTransitionFn(callback);
  }, [startTransitionFn]);
  
// 🛡️ P0 FIX: deferValue REMOVIDO - viola regras de hooks
  // useDeferredValue NÃO pode ser usado dentro de callback
  // Componentes que precisam diferir valores devem usar useDeferredValue diretamente
  const deferValue = useCallback(<T,>(value: T): T => {
    // Retorna valor sem transformação - use useDeferredValue direto no componente
    return value;
  }, []);
  
  // ============================================
  // TESE 2.3: Virtualização
  // ============================================
  
  const shouldVirtualize = useCallback((itemCount: number): boolean => {
    return itemCount > VIRTUALIZATION_THRESHOLD;
  }, []);
  
  const getVirtualConfig = useCallback((): VirtualConfig => {
    return {
      threshold: VIRTUALIZATION_THRESHOLD,
      overscan: constitution.overscan,
      itemHeight: constitution.isLowEnd ? 56 : 64,
    };
  }, [constitution.overscan, constitution.isLowEnd]);
  
  return {
    tier: constitution.tier,
    isLowEnd: constitution.isLowEnd,
    shouldAnimate: constitution.shouldAnimate,
    gpuAnimationProps,
    isPending,
    startLowPriorityTransition,
    deferValue,
    throttle,
    debounce,
    shouldVirtualize,
    getVirtualConfig,
  };
}

// ============================================
// HOOKS ESPECIALIZADOS
// ============================================

/**
 * TESE 2.1: useOptimizedCallback
 * useCallback com dependências cirúrgicas + ref estável
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const callbackRef = useRef(callback);
  
  // Atualizar ref quando callback mudar
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  // Retornar função estável que sempre chama a versão mais recente
  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    deps
  );
}

/**
 * TESE 2.1: useStableRef
 * Ref que não causa re-renderização
 */
export function useStableRef<T>(value: T): { current: T } {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/**
 * TESE 2.2: useThrottledValue
 * Valor throttled para eventos de alta frequência (scroll, mousemove)
 */
export function useThrottledValue<T>(value: T, ms?: number): T {
  const { tier } = useConstitution();
  const delay = ms ?? THROTTLE_MS_BY_TIER[tier as keyof typeof THROTTLE_MS_BY_TIER] ?? 100;
  
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdate = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  useEffect(() => {
    const now = Date.now();
    const remaining = delay - (now - lastUpdate.current);
    
    if (remaining <= 0) {
      lastUpdate.current = now;
      setThrottledValue(value);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastUpdate.current = Date.now();
        setThrottledValue(value);
      }, remaining);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);
  
  return throttledValue;
}

/**
 * TESE 2.2: useDebouncedValue
 * Valor debounced para inputs de busca
 */
export function useDebouncedValue<T>(value: T, ms?: number): T {
  const { tier } = useConstitution();
  const delay = ms ?? DEBOUNCE_MS_BY_TIER[tier as keyof typeof DEBOUNCE_MS_BY_TIER] ?? 300;
  
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * TESE 2.3: useLowPriorityState
 * Estado que atualiza com baixa prioridade (não bloqueia UI)
 */
export function useLowPriorityState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransitionFn] = useTransition();
  
  const setLowPriorityValue = useCallback((newValue: T | ((prev: T) => T)) => {
    startTransitionFn(() => {
      setValue(newValue);
    });
  }, []);
  
  return [value, setLowPriorityValue, isPending];
}

/**
 * TESE 2.3: useDeferredRender
 * Adia renderização de conteúdo pesado
 */
export function useDeferredRender<T>(value: T): T {
  return useDeferredValue(value);
}

/**
 * TESE 2.3: useRenderPriority
 * Controla prioridade de renderização baseado no tier
 */
export function useRenderPriority(
  priority: 'critical' | 'high' | 'normal' | 'low'
): { shouldRender: boolean; isPending: boolean } {
  const { tier } = useConstitution();
  const [shouldRender, setShouldRender] = useState(priority === 'critical');
  const [isPending, startTransitionFn] = useTransition();
  
  useEffect(() => {
    if (priority === 'critical') {
      setShouldRender(true);
      return;
    }
    
    // Delays baseados no tier
    const delays: Record<string, Record<string, number>> = {
      ultra: { high: 0, normal: 0, low: 0 },
      high: { high: 0, normal: 0, low: 50 },
      medium: { high: 0, normal: 50, low: 100 },
      low: { high: 50, normal: 100, low: 200 },
      critical: { high: 100, normal: 200, low: 500 },
    };
    
    const delay = delays[tier]?.[priority] ?? 100;
    
    const timer = setTimeout(() => {
      startTransitionFn(() => {
        setShouldRender(true);
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, [priority, tier]);
  
  return { shouldRender, isPending };
}

/**
 * TESE 2.2: useScrollOptimized
 * Scroll handler otimizado com throttle + passive listener
 */
export function useScrollOptimized(
  onScroll: (scrollTop: number, scrollLeft: number) => void,
  deps: DependencyList = []
) {
  const { tier } = useConstitution();
  const throttleMs = THROTTLE_MS_BY_TIER[tier as keyof typeof THROTTLE_MS_BY_TIER] ?? 100;
  const lastCall = useRef(0);
  const rafRef = useRef<number>();
  
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    const now = Date.now();
    
    if (now - lastCall.current >= throttleMs) {
      lastCall.current = now;
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        onScroll(target.scrollTop, target.scrollLeft);
      });
    }
  }, [onScroll, throttleMs, ...deps]);
  
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  return {
    onScroll: handleScroll,
    scrollProps: {
      onScroll: handleScroll,
      // Passive listener hint para melhor performance
    },
  };
}

// ============================================
// EXPORTS
// ============================================

export default useQuantumReactivity;

// Log em dev
if (import.meta.env.DEV) {
  console.log('[TESE 2] 🌌 Protocolo de Reatividade Quântica carregado');
}
