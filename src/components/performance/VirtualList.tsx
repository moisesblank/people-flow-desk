// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - LEI I Art. 25-26                                 ║
// ║   VirtualList - Listas > 50 itens = virtualização obrigatória                ║
// ║   Overscan por tier: critical=1, low=2, medium=3, high=5, ultra=8            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import React, { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useConstitution } from '@/hooks/useConstitution';

// ============================================
// TIPOS
// ============================================

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight?: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  overscan?: number; // Se não fornecido, usa tier
  className?: string;
  onScrollEnd?: () => void;
  scrollEndThreshold?: number;
  keyExtractor?: (item: T, index: number) => string | number;
  emptyMessage?: React.ReactNode;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  virtualizationThreshold?: number; // Padrão: 50 (LEI I Art. 25)
}

interface VirtualListState {
  scrollTop: number;
  startIndex: number;
  endIndex: number;
}

// ============================================
// CONFIGURAÇÃO POR TIER (LEI I Art. 26)
// ============================================

const OVERSCAN_BY_TIER = {
  critical: 1,
  low: 2,
  medium: 3,
  high: 5,
  ultra: 8,
} as const;

const VIRTUALIZATION_THRESHOLD = 50; // LEI I Art. 25

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function VirtualListInner<T>({
  items,
  itemHeight,
  containerHeight: propContainerHeight,
  renderItem,
  overscan: propOverscan,
  className,
  onScrollEnd,
  scrollEndThreshold = 100,
  keyExtractor,
  emptyMessage = 'Nenhum item encontrado',
  loadingMore = false,
  onLoadMore,
  virtualizationThreshold = VIRTUALIZATION_THRESHOLD,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { tier, overscan: tierOverscan, shouldAnimate } = useConstitution();
  
  // Usar overscan do tier se não fornecido via props
  const effectiveOverscan = propOverscan ?? OVERSCAN_BY_TIER[tier as keyof typeof OVERSCAN_BY_TIER] ?? tierOverscan;
  
  // Altura do container
  const [containerHeight, setContainerHeight] = useState(propContainerHeight ?? 400);
  
  // Atualizar altura quando resize
  useEffect(() => {
    if (propContainerHeight) {
      setContainerHeight(propContainerHeight);
      return;
    }
    
    const container = containerRef.current;
    if (!container) return;
    
    const updateHeight = () => {
      const parent = container.parentElement;
      if (parent) {
        setContainerHeight(parent.clientHeight || 400);
      }
    };
    
    updateHeight();
    
    const resizeObserver = new ResizeObserver(updateHeight);
    if (container.parentElement) {
      resizeObserver.observe(container.parentElement);
    }
    
    return () => resizeObserver.disconnect();
  }, [propContainerHeight]);
  
  // Se menos de 50 itens, renderiza normal (LEI I Art. 25)
  const shouldVirtualize = items.length > virtualizationThreshold;
  
  const [state, setState] = useState<VirtualListState>({
    scrollTop: 0,
    startIndex: 0,
    endIndex: Math.ceil(containerHeight / itemHeight) + effectiveOverscan,
  });

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  // Handler de scroll otimizado com throttle implícito via RAF
  const rafRef = useRef<number>();
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    // Cancelar RAF anterior
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - effectiveOverscan);
      const endIndex = Math.min(
        items.length - 1,
        Math.floor(scrollTop / itemHeight) + visibleCount + effectiveOverscan
      );

      setState({ scrollTop, startIndex, endIndex });

      // Detectar fim do scroll para infinite loading
      if (onScrollEnd || onLoadMore) {
        const scrollHeight = e.currentTarget.scrollHeight;
        const clientHeight = e.currentTarget.clientHeight;
        if (scrollHeight - scrollTop - clientHeight < scrollEndThreshold) {
          onScrollEnd?.();
          onLoadMore?.();
        }
      }
    });
  }, [itemHeight, items.length, visibleCount, effectiveOverscan, onScrollEnd, onLoadMore, scrollEndThreshold]);

  // Cleanup RAF
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Scroll to index
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      const targetScroll = index * itemHeight;
      containerRef.current.scrollTo({
        top: targetScroll,
        behavior: shouldAnimate ? behavior : 'auto',
      });
    }
  }, [itemHeight, shouldAnimate]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // Auto-scroll to bottom quando novos itens são adicionados
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom && items.length > 0) {
        scrollToBottom();
      }
    }
  }, [items.length, scrollToBottom]);

  // Items visíveis
  const visibleItems = useMemo(() => {
    if (!shouldVirtualize) return items;
    return items.slice(state.startIndex, state.endIndex + 1);
  }, [items, state.startIndex, state.endIndex, shouldVirtualize]);
  
  const offsetY = shouldVirtualize ? state.startIndex * itemHeight : 0;

  // Lista vazia
  if (items.length === 0) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center text-muted-foreground py-8",
          className
        )}
        style={{ height: containerHeight }}
      >
        {emptyMessage}
      </div>
    );
  }

  // Renderização sem virtualização para listas pequenas
  if (!shouldVirtualize) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "overflow-auto will-change-scroll contain-strict",
          className
        )}
        style={{ height: containerHeight }}
      >
        {items.map((item, idx) => (
          <div
            key={keyExtractor ? keyExtractor(item, idx) : idx}
            style={{ height: itemHeight }}
          >
            {renderItem(item, idx, true)}
          </div>
        ))}
        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // Renderização virtualizada
  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-auto will-change-scroll contain-strict",
        className
      )}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
            willChange: 'transform',
          }}
        >
          {visibleItems.map((item, idx) => {
            const actualIndex = state.startIndex + idx;
            return (
              <div
                key={keyExtractor ? keyExtractor(item, actualIndex) : actualIndex}
                style={{ height: itemHeight }}
                className="contain-layout"
              >
                {renderItem(item, actualIndex, true)}
              </div>
            );
          })}
        </div>
      </div>
      
      {loadingMore && (
        <div 
          className="flex items-center justify-center py-4"
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        >
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

// ============================================
// HOOK PARA VIRTUALIZAÇÃO (LEI I Art. 25-26)
// ============================================

interface UseVirtualListOptions {
  itemHeight: number;
  containerHeight?: number;
  overscan?: number;
}

export function useVirtualList<T>(items: T[], options: UseVirtualListOptions) {
  const { itemHeight, containerHeight = 400, overscan: propOverscan } = options;
  const { tier, overscan: tierOverscan } = useConstitution();
  
  const effectiveOverscan = propOverscan ?? OVERSCAN_BY_TIER[tier as keyof typeof OVERSCAN_BY_TIER] ?? tierOverscan;
  
  const [scrollTop, setScrollTop] = useState(0);
  const rafRef = useRef<number>();

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - effectiveOverscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + effectiveOverscan * 2);

  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );
  
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
    });
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Verificar se deve virtualizar
  const shouldVirtualize = items.length > VIRTUALIZATION_THRESHOLD;

  return {
    visibleItems: shouldVirtualize ? visibleItems : items,
    totalHeight,
    offsetY: shouldVirtualize ? offsetY : 0,
    handleScroll,
    startIndex,
    endIndex,
    shouldVirtualize,
    overscan: effectiveOverscan,
    containerProps: {
      style: { height: containerHeight, overflow: 'auto' as const },
      onScroll: handleScroll,
      className: 'contain-strict',
    },
    innerProps: {
      style: { 
        height: shouldVirtualize ? totalHeight : 'auto', 
        position: 'relative' as const 
      },
    },
    itemsContainerProps: {
      style: { 
        position: shouldVirtualize ? 'absolute' as const : 'relative' as const, 
        top: shouldVirtualize ? offsetY : 0, 
        left: 0, 
        right: 0,
        willChange: 'transform',
      },
    },
  };
}

// ============================================
// COMPONENTE WRAPPER SIMPLES
// ============================================

interface SimpleVirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  className?: string;
  maxHeight?: number;
}

export function SimpleVirtualList<T>({
  items,
  renderItem,
  itemHeight = 56,
  className,
  maxHeight = 400,
}: SimpleVirtualListProps<T>) {
  return (
    <VirtualList
      items={items}
      itemHeight={itemHeight}
      containerHeight={maxHeight}
      className={className}
      renderItem={(item, index) => renderItem(item, index)}
    />
  );
}

// Log em dev
if (import.meta.env.DEV) {
  console.log('[CONSTITUTION] 🏛️ VirtualList v5.0 - LEI I Art. 25-26 enforced');
}
