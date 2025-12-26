// ============================================
// MASTER PRO ULTRA v3.0 - VIRTUAL TABLE
// Para tabelas grandes (>40 itens) - LEI I Art. 47-50
// ============================================

import React, { useRef, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { cn } from '@/lib/utils';

// Threshold para virtualização automática
const VIRTUALIZATION_THRESHOLD = 40;

interface VirtualTableProps<T> {
  items: T[];
  rowHeight?: number;
  overscan?: number;
  className?: string;
  containerHeight?: number | string;
  emptyMessage?: string;
  renderRow: (item: T, index: number) => ReactNode;
  renderHeader?: () => ReactNode;
  // Fallback para listas pequenas - usa renderização normal
  forceVirtualization?: boolean;
}

export function VirtualTable<T>({
  items,
  rowHeight = 56,
  overscan = 5,
  className,
  containerHeight = 400,
  emptyMessage = 'Nenhum item encontrado',
  renderRow,
  renderHeader,
  forceVirtualization = false,
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightPx, setContainerHeightPx] = useState(0);

  // Determinar se virtualização é necessária
  const shouldVirtualize = useMemo(() => 
    forceVirtualization || items.length > VIRTUALIZATION_THRESHOLD, 
    [items.length, forceVirtualization]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldVirtualize) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeightPx(entry.contentRect.height);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [shouldVirtualize]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!shouldVirtualize) return;
    // Use requestAnimationFrame para scroll mais suave
    requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
    });
  }, [shouldVirtualize]);

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn('flex flex-col', className)}>
        {renderHeader?.()}
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  // Se poucos itens, renderizar normalmente (sem virtualização)
  if (!shouldVirtualize) {
    return (
      <div className={cn('flex flex-col', className)}>
        {renderHeader?.()}
        <div className="overflow-auto" style={{ maxHeight: containerHeight }}>
          {items.map((item, index) => (
            <div key={index}>{renderRow(item, index)}</div>
          ))}
        </div>
      </div>
    );
  }

  // Virtualização ativa
  const totalHeight = items.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeightPx) / rowHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  return (
    <div className={cn('flex flex-col', className)}>
      {renderHeader?.()}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto"
        style={{ 
          height: containerHeight, 
          contain: 'strict',
          willChange: 'scroll-position'
        }}
      >
        <div 
          style={{ 
            height: totalHeight, 
            position: 'relative',
            contain: 'layout style'
          }}
        >
          <div 
            style={{ 
              transform: `translateY(${offsetY}px)`,
              willChange: 'transform'
            }}
          >
            {visibleItems.map((item, index) => (
              <div 
                key={startIndex + index} 
                style={{ 
                  height: rowHeight,
                  contain: 'layout style'
                }}
              >
                {renderRow(item, startIndex + index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VirtualListSimple - Para listas sem tabela
// ============================================

interface VirtualListSimpleProps<T> {
  items: T[];
  itemHeight?: number;
  overscan?: number;
  className?: string;
  containerHeight?: number | string;
  emptyMessage?: string;
  renderItem: (item: T, index: number) => ReactNode;
}

export function VirtualListSimple<T>({
  items,
  itemHeight = 64,
  overscan = 5,
  className,
  containerHeight = 400,
  emptyMessage = 'Nenhum item encontrado',
  renderItem,
}: VirtualListSimpleProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightPx, setContainerHeightPx] = useState(0);

  const shouldVirtualize = items.length > VIRTUALIZATION_THRESHOLD;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldVirtualize) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeightPx(entry.contentRect.height);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [shouldVirtualize]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!shouldVirtualize) return;
    requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
    });
  }, [shouldVirtualize]);

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8 text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  // Sem virtualização para listas pequenas
  if (!shouldVirtualize) {
    return (
      <div className={cn('space-y-3 overflow-auto', className)} style={{ maxHeight: containerHeight }}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    );
  }

  // Com virtualização
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeightPx) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn('overflow-auto', className)}
      style={{ 
        height: containerHeight,
        contain: 'strict',
        willChange: 'scroll-position'
      }}
    >
      <div 
        style={{ 
          height: totalHeight, 
          position: 'relative',
          contain: 'layout style'
        }}
      >
        <div 
          style={{ 
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform'
          }}
          className="space-y-3"
        >
          {visibleItems.map((item, index) => (
            <div 
              key={startIndex + index} 
              style={{ 
                height: itemHeight,
                contain: 'layout style'
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export constantes úteis
export const VIRTUALIZATION_CONFIG = {
  threshold: VIRTUALIZATION_THRESHOLD,
  defaultRowHeight: 56,
  defaultItemHeight: 64,
  defaultOverscan: 5,
} as const;
