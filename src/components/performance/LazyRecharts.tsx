// ============================================
// ⚡ LAZY RECHARTS - Carregamento sob demanda
// 🏛️ LEI I: Bundle splitting para 3G
// ============================================

import React, { Suspense, lazy, memo, useState, useEffect } from 'react';

// Skeleton para gráficos - EXPORTADO
export const ChartSkeleton = memo(({ height = 300 }: { height?: number }) => (
  <div 
    className="animate-pulse bg-muted/30 rounded-lg flex items-center justify-center"
    style={{ height }}
  >
    <div className="text-muted-foreground text-sm">Carregando gráfico...</div>
  </div>
));
ChartSkeleton.displayName = 'ChartSkeleton';

// Flag para pré-carregamento
let isPreloaded = false;

// Função para pré-carregar Recharts (chamar no hover de botões de relatório)
export async function preloadRecharts(): Promise<void> {
  if (isPreloaded) return;
  try {
    await import('recharts');
    isPreloaded = true;
  } catch {
    // Silencioso
  }
}

// Wrapper inteligente que decide se mostra gráfico ou fallback
interface SmartChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  onHover?: () => void;
  simplified?: boolean;
}

export const SmartChartWrapper = memo(function SmartChartWrapper({
  children,
  height = 300,
  onHover,
  simplified = false
}: SmartChartWrapperProps) {
  // Pré-carregar Recharts no hover
  const handleMouseEnter = () => {
    preloadRecharts();
    onHover?.();
  };
  
  if (simplified) {
    return (
      <div 
        className="bg-muted/20 rounded-lg p-4 text-center text-muted-foreground"
        style={{ minHeight: height }}
      >
        📊 Gráfico simplificado (modo economia)
      </div>
    );
  }
  
  return (
    <div 
      onMouseEnter={handleMouseEnter}
      style={{ minHeight: height }}
      className="perf-lazy-section"
    >
      <Suspense fallback={<ChartSkeleton height={height} />}>
        {children}
      </Suspense>
    </div>
  );
});

// 🏛️ PREMIUM GARANTIDO: Hook sempre retorna isLowEnd = false
export function useChartPerformance() {
  return {
    isLowEnd: false,
    shouldSimplify: false,
    preload: preloadRecharts
  };
}

// 🏛️ LEI I: Log apenas em dev
if (import.meta.env.DEV) {
  console.log('[PERF] ⚡ LazyRecharts helper carregado');
}
