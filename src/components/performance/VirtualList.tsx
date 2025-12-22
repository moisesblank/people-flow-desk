// ============================================
// 🔥 VIRTUALIZAÇÃO DE LISTAS - MATRIZ 2300
// Performance máxima para 3G
// ============================================

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScrollEnd?: () => void;
  scrollEndThreshold?: number;
}

interface VirtualListState {
  scrollTop: number;
  startIndex: number;
  endIndex: number;
}

function VirtualListInner<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  onScrollEnd,
  scrollEndThreshold = 100,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<VirtualListState>({
    scrollTop: 0,
    startIndex: 0,
    endIndex: Math.ceil(containerHeight / itemHeight) + overscan,
  });

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor(scrollTop / itemHeight) + visibleCount + overscan
    );

    setState({ scrollTop, startIndex, endIndex });

    // Detectar fim do scroll
    if (onScrollEnd) {
      const scrollHeight = e.currentTarget.scrollHeight;
      const clientHeight = e.currentTarget.clientHeight;
      if (scrollHeight - scrollTop - clientHeight < scrollEndThreshold) {
        onScrollEnd();
      }
    }
  }, [itemHeight, items.length, visibleCount, overscan, onScrollEnd, scrollEndThreshold]);

  // Auto-scroll para o final quando novos itens são adicionados
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // Expor scroll to bottom
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [items.length, scrollToBottom]);

  const visibleItems = items.slice(state.startIndex, state.endIndex + 1);
  const offsetY = state.startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-auto will-change-scroll",
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
          }}
        >
          {visibleItems.map((item, idx) => (
            <div
              key={state.startIndex + idx}
              style={{ height: itemHeight }}
            >
              {renderItem(item, state.startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

// ============================================
// HOOK PARA VIRTUALIZAÇÃO SIMPLES
// ============================================

interface UseVirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualList<T>(items: T[], options: UseVirtualListOptions) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
    containerProps: {
      style: { height: containerHeight, overflow: 'auto' },
      onScroll: handleScroll,
    },
    innerProps: {
      style: { height: totalHeight, position: 'relative' as const },
    },
    itemsContainerProps: {
      style: { position: 'absolute' as const, top: offsetY, left: 0, right: 0 },
    },
  };
}

console.log('[VIRTUAL LIST] ⚡ Virtualização de listas carregada - Matriz 2300');
