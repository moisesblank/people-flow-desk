// ============================================
// ⚡ HOOK LAZY LOADING v3500 ⚡
// Lazy loading inteligente com tier-awareness
// Otimizado para 3G - Performance ANO 3500
// ============================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { detectConnectionSpeed } from '@/lib/performance/cacheConfig';

/**
 * Configuração de rootMargin por velocidade de conexão
 * Conexões lentas = prefetch mais cedo (maior margem)
 */
const ROOT_MARGIN_BY_SPEED = {
  slow: '1200px',   // 3G: Carrega MUITO antes (economiza tempo)
  medium: '600px',  // 4G: Carrega moderadamente antes
  fast: '300px',    // WiFi: Carrega quando próximo
} as const;

/**
 * Threshold por velocidade
 */
const THRESHOLD_BY_SPEED = {
  slow: 0.01,   // 3G: Trigger com 1% visível
  medium: 0.1,  // 4G: Trigger com 10% visível
  fast: 0.25,   // WiFi: Trigger com 25% visível
} as const;

export interface UseLazyLoad3500Options {
  /** Forçar carregamento imediato (crítico) */
  priority?: boolean;
  /** Override do rootMargin */
  rootMargin?: string;
  /** Override do threshold */
  threshold?: number;
  /** Callback quando entra em view */
  onVisible?: () => void;
  /** Callback quando sai de view */
  onHidden?: () => void;
  /** Desabilitar lazy loading */
  disabled?: boolean;
}

export interface UseLazyLoad3500Result {
  /** Ref para anexar ao elemento */
  ref: React.RefObject<HTMLElement>;
  /** Se o elemento está visível */
  isVisible: boolean;
  /** Se já foi visível alguma vez */
  hasBeenVisible: boolean;
  /** Velocidade da conexão detectada */
  connectionSpeed: 'slow' | 'medium' | 'fast';
  /** Forçar visibilidade */
  forceVisible: () => void;
}

/**
 * Hook de Lazy Loading v3500
 * Adapta-se automaticamente à velocidade da conexão
 */
export function useLazyLoad3500(
  options: UseLazyLoad3500Options = {}
): UseLazyLoad3500Result {
  const {
    priority = false,
    rootMargin,
    threshold,
    onVisible,
    onHidden,
    disabled = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(priority);
  const [hasBeenVisible, setHasBeenVisible] = useState(priority);
  const connectionSpeed = useMemo(() => detectConnectionSpeed(), []);

  // Calcular rootMargin e threshold baseado na conexão
  const computedRootMargin = rootMargin ?? ROOT_MARGIN_BY_SPEED[connectionSpeed];
  const computedThreshold = threshold ?? THRESHOLD_BY_SPEED[connectionSpeed];

  const forceVisible = useCallback(() => {
    setIsVisible(true);
    setHasBeenVisible(true);
  }, []);

  useEffect(() => {
    if (priority || disabled) return;

    const element = ref.current;
    if (!element) return;

    // Verificar suporte a IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
            onVisible?.();
            
            // Em conexão lenta, não descarregar (economiza re-requests)
            if (connectionSpeed === 'slow') {
              observer.disconnect();
            }
          } else {
            // Só marca como não visível em conexões rápidas
            if (connectionSpeed !== 'slow') {
              setIsVisible(false);
              onHidden?.();
            }
          }
        });
      },
      {
        rootMargin: computedRootMargin,
        threshold: computedThreshold,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [
    priority,
    disabled,
    computedRootMargin,
    computedThreshold,
    connectionSpeed,
    onVisible,
    onHidden,
  ]);

  return {
    ref: ref as React.RefObject<HTMLElement>,
    isVisible,
    hasBeenVisible,
    connectionSpeed,
    forceVisible,
  };
}

/**
 * Hook para lazy loading de imagens v3500
 * Com fallback e qualidade adaptativa
 */
export interface UseLazyImage3500Options extends UseLazyLoad3500Options {
  /** URL da imagem */
  src: string;
  /** URL de placeholder/blur */
  placeholder?: string;
  /** Qualidade da imagem (1-100) */
  quality?: number;
}

export interface UseLazyImage3500Result extends UseLazyLoad3500Result {
  /** URL atual da imagem (placeholder ou real) */
  currentSrc: string;
  /** Se a imagem real foi carregada */
  isLoaded: boolean;
  /** Se houve erro ao carregar */
  hasError: boolean;
}

export function useLazyImage3500(
  options: UseLazyImage3500Options
): UseLazyImage3500Result {
  const {
    src,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4=',
    quality,
    ...lazyOptions
  } = options;

  const lazy = useLazyLoad3500(lazyOptions);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Qualidade adaptativa baseada na conexão
  const adaptiveQuality = useMemo(() => {
    if (quality) return quality;
    switch (lazy.connectionSpeed) {
      case 'slow': return 40;   // 3G: Qualidade baixa
      case 'medium': return 70; // 4G: Qualidade média
      case 'fast': return 90;   // WiFi: Qualidade alta
    }
  }, [quality, lazy.connectionSpeed]);

  // Construir URL com qualidade (se supabase storage)
  const optimizedSrc = useMemo(() => {
    if (!src) return placeholder;
    
    // Se for Supabase Storage, adicionar transformação
    if (src.includes('supabase') && src.includes('/storage/')) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}quality=${adaptiveQuality}`;
    }
    
    return src;
  }, [src, adaptiveQuality, placeholder]);

  // Preload da imagem quando visível
  useEffect(() => {
    if (!lazy.isVisible || isLoaded || hasError) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      setHasError(true);
      console.warn('[LazyImage3500] Erro ao carregar:', src);
    };
    
    img.src = optimizedSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [lazy.isVisible, optimizedSrc, isLoaded, hasError, src]);

  const currentSrc = useMemo(() => {
    if (hasError) return placeholder;
    if (isLoaded) return optimizedSrc;
    return placeholder;
  }, [hasError, isLoaded, optimizedSrc, placeholder]);

  return {
    ...lazy,
    currentSrc,
    isLoaded,
    hasError,
  };
}

/**
 * Hook para lazy loading de componentes pesados
 * Com skeleton e delay por tier
 */
export interface UseLazyComponent3500Options extends UseLazyLoad3500Options {
  /** Delay mínimo antes de renderizar (evita flash) */
  minDelay?: number;
}

export function useLazyComponent3500(
  options: UseLazyComponent3500Options = {}
): UseLazyLoad3500Result & { shouldRender: boolean } {
  const { minDelay, ...lazyOptions } = options;
  const lazy = useLazyLoad3500(lazyOptions);
  const [delayPassed, setDelayPassed] = useState(!minDelay);

  // Delay adaptativo por conexão
  const adaptiveDelay = useMemo(() => {
    if (minDelay) return minDelay;
    switch (lazy.connectionSpeed) {
      case 'slow': return 0;     // 3G: Sem delay (mostrar ASAP)
      case 'medium': return 50;  // 4G: 50ms
      case 'fast': return 100;   // WiFi: 100ms (animação suave)
    }
  }, [minDelay, lazy.connectionSpeed]);

  useEffect(() => {
    if (!lazy.isVisible || delayPassed) return;

    const timer = setTimeout(() => {
      setDelayPassed(true);
    }, adaptiveDelay);

    return () => clearTimeout(timer);
  }, [lazy.isVisible, adaptiveDelay, delayPassed]);

  return {
    ...lazy,
    shouldRender: lazy.isVisible && delayPassed,
  };
}

/**
 * Hook para prefetch de rotas
 * Baseado em proximidade do link
 */
export function usePrefetchRoute(route: string, enabled: boolean = true) {
  const connectionSpeed = useMemo(() => detectConnectionSpeed(), []);
  const prefetched = useRef(false);

  useEffect(() => {
    // Em conexão lenta, não prefetch (economiza dados)
    if (connectionSpeed === 'slow' || !enabled || prefetched.current) return;

    const prefetch = () => {
      if (prefetched.current) return;
      prefetched.current = true;

      // Criar link de prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      link.as = 'document';
      document.head.appendChild(link);

      console.log(`[LazyLoad3500] 📦 Prefetched: ${route}`);
    };

    // Usar requestIdleCallback se disponível
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetch, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(prefetch, 100);
      return () => clearTimeout(timer);
    }
  }, [route, enabled, connectionSpeed]);
}

console.log('[LazyLoad v3500] ⚡ Sistema de Lazy Loading Quântico carregado');
