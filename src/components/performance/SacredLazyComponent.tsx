// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v3.0 ⚡
// DOGMA III.2: LAZY LOADING DE COMPONENTES
// ANO 2300 - Carregamento Quântico
// ============================================

import React, { 
  Suspense, 
  lazy, 
  ComponentType, 
  ReactNode,
  memo,
  useState,
  useEffect 
} from 'react';
import { usePerformanceTier } from '@/hooks/useEvangelhoVelocidade';
import { cn } from '@/lib/utils';

/**
 * Skeleton loader padrão para componentes lazy
 */
const ComponentSkeleton = memo(({ 
  className,
  minHeight = 200 
}: { 
  className?: string;
  minHeight?: number;
}) => (
  <div 
    className={cn(
      "flex items-center justify-center bg-muted/10 rounded-lg animate-pulse",
      className
    )}
    style={{ minHeight }}
  >
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-xs text-muted-foreground">Carregando...</span>
    </div>
  </div>
));
ComponentSkeleton.displayName = 'ComponentSkeleton';

/**
 * DOGMA III.2 - Wrapper para lazy loading de componentes
 * Carrega componentes pesados apenas quando necessário
 */
interface LazyComponentProps<T extends ComponentType<any>> {
  loader: () => Promise<{ default: T }>;
  fallback?: ReactNode;
  minHeight?: number;
  className?: string;
  props?: React.ComponentProps<T>;
  preload?: boolean;
}

export function createLazyComponent<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  options?: {
    preload?: boolean;
    fallback?: ReactNode;
    minHeight?: number;
  }
) {
  const LazyComponent = lazy(loader);
  
  // Preload se especificado
  if (options?.preload) {
    loader();
  }
  
  return memo(function WrappedLazyComponent(props: React.ComponentProps<T>) {
    const { tier } = usePerformanceTier();
    const [shouldLoad, setShouldLoad] = useState(tier === 'quantum');
    
    // Delay de carregamento para dispositivos lentos (v3.0 tiers)
    useEffect(() => {
      if (shouldLoad) return;
      
      const delayMap = { quantum: 0, neural: 25, enhanced: 50, standard: 100, legacy: 200 };
      const timer = setTimeout(() => setShouldLoad(true), delayMap[tier]);
      
      return () => clearTimeout(timer);
    }, [tier, shouldLoad]);
    
    if (!shouldLoad) {
      return options?.fallback ?? <ComponentSkeleton minHeight={options?.minHeight} />;
    }
    
    return (
      <Suspense fallback={options?.fallback ?? <ComponentSkeleton minHeight={options?.minHeight} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  });
}

/**
 * Componente wrapper para Suspense com fallback inteligente
 */
interface SacredSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  minHeight?: number;
  className?: string;
}

export const SacredSuspense = memo(function SacredSuspense({
  children,
  fallback,
  minHeight = 200,
  className,
}: SacredSuspenseProps) {
  return (
    <Suspense 
      fallback={
        fallback ?? <ComponentSkeleton className={className} minHeight={minHeight} />
      }
    >
      {children}
    </Suspense>
  );
});

/**
 * HOC para adicionar lazy loading a qualquer componente
 */
export function withLazyLoading<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    minHeight?: number;
    delay?: number;
  }
) {
  return memo(function LazyLoadedComponent(props: P) {
    const [isVisible, setIsVisible] = useState(false);
    const { tier } = usePerformanceTier();
    
    useEffect(() => {
      // v3.0 tier mapping
      const delay = options?.delay ?? (tier === 'legacy' ? 200 : 50);
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }, [tier]);
    
    if (!isVisible) {
      return options?.fallback ?? <ComponentSkeleton minHeight={options?.minHeight} />;
    }
    
    return <WrappedComponent {...props} />;
  });
}

/**
 * Preloader de componentes lazy
 * Inicia o download do chunk antes de precisar
 */
export function preloadComponent(
  loader: () => Promise<{ default: ComponentType<any> }>
): void {
  // Usa requestIdleCallback se disponível, senão setTimeout
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      loader().catch(() => {});
    });
  } else {
    setTimeout(() => {
      loader().catch(() => {});
    }, 100);
  }
}

/**
 * Preload múltiplos componentes em batch
 */
export function preloadComponents(
  loaders: (() => Promise<{ default: ComponentType<any> }>)[]
): void {
  loaders.forEach(preloadComponent);
}

export { ComponentSkeleton };
