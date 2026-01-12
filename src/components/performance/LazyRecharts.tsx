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

// Hook para detectar se deve mostrar gráficos simplificados
export function useChartPerformance() {
  const [isLowEnd, setIsLowEnd] = useState(false);
  
  useEffect(() => {
    // Detectar conexão lenta
    const connection = (navigator as any).connection;
    if (connection) {
      const isSlowConnection = ['slow-2g', '2g', '3g'].includes(connection.effectiveType);
      const saveData = connection.saveData || false;
      setIsLowEnd(isSlowConnection || saveData);
    }
    
    // Detectar dispositivo fraco
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    if (cores <= 2 || memory <= 2) {
      setIsLowEnd(true);
    }
  }, []);
  
  return {
    isLowEnd,
    shouldSimplify: isLowEnd,
    preload: preloadRecharts
  };
}

// 🏛️ LEI I: Log apenas em dev
if (import.meta.env.DEV) {
  console.log('[PERF] ⚡ LazyRecharts helper carregado');
}
