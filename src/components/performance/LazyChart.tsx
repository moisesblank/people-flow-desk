// ============================================
// 🌌🔥 LAZY CHART — GRÁFICOS LAZY LOAD NÍVEL NASA 🔥🌌
// ANO 2300 — RECHARTS SÓ CARREGA QUANDO NECESSÁRIO
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// PROBLEMA: Recharts adiciona ~445KB ao bundle
// SOLUÇÃO: Carregar somente quando o gráfico entra na viewport
//
// ============================================

import React, { Suspense, lazy, useRef, useState, useEffect, memo, ComponentType } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { perfFlags } from "@/lib/performance/performanceFlags";

// ============================================
// TIPOS
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartData = Record<string, unknown>[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartConfig = Record<string, unknown>;

interface LazyChartProps {
  // Tipo de gráfico
  type: "line" | "bar" | "pie" | "area" | "radar" | "composed";
  
  // Dados
  data: ChartData;
  
  // Configuração
  config?: ChartConfig;
  
  // Dimensões
  width?: number | string;
  height?: number;
  
  // Visual
  className?: string;
  showSkeleton?: boolean;
  
  // Callbacks
  onLoad?: () => void;
}

// ============================================
// SKELETON DE GRÁFICO
// ============================================
const ChartSkeleton = memo(({ 
  height = 300,
  className 
}: { 
  height?: number;
  className?: string;
}) => (
  <div 
    className={cn(
      "flex items-center justify-center bg-muted/50 rounded-lg animate-pulse",
      className
    )}
    style={{ height }}
  >
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-xs">Carregando gráfico...</span>
    </div>
  </div>
));

ChartSkeleton.displayName = "ChartSkeleton";

// ============================================
// PLACEHOLDER QUANDO CHARTS DESABILITADOS
// ============================================
const ChartPlaceholder = memo(({ 
  height = 300,
  className 
}: { 
  height?: number;
  className?: string;
}) => (
  <div 
    className={cn(
      "flex items-center justify-center bg-muted/30 rounded-lg border border-dashed",
      className
    )}
    style={{ height }}
  >
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <span className="text-4xl">📊</span>
      <span className="text-xs">Gráficos desativados (Modo Lite)</span>
      <button 
        onClick={() => perfFlags.set('chartsEnabled', true)}
        className="text-xs text-primary underline hover:no-underline"
      >
        Ativar gráficos
      </button>
    </div>
  </div>
));

ChartPlaceholder.displayName = "ChartPlaceholder";

// ============================================
// LAZY IMPORTS DOS COMPONENTES RECHARTS
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyChartComponent = ComponentType<any>;

const LazyLineChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.LineChart as LazyChartComponent }))
);

const LazyBarChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.BarChart as LazyChartComponent }))
);

const LazyPieChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.PieChart as LazyChartComponent }))
);

const LazyAreaChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.AreaChart as LazyChartComponent }))
);

const LazyRadarChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.RadarChart as LazyChartComponent }))
);

const LazyComposedChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.ComposedChart as LazyChartComponent }))
);

// Componentes auxiliares também lazy
const LazyResponsiveContainer = lazy(() => 
  import("recharts").then(mod => ({ default: mod.ResponsiveContainer as LazyChartComponent }))
);

// ============================================
// MAPEAMENTO
// ============================================
const CHART_COMPONENTS = {
  line: LazyLineChart,
  bar: LazyBarChart,
  pie: LazyPieChart,
  area: LazyAreaChart,
  radar: LazyRadarChart,
  composed: LazyComposedChart,
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const LazyChart = memo(({
  type,
  data,
  config = {},
  width = "100%",
  height = 300,
  className,
  showSkeleton = true,
  onLoad,
}: LazyChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Checar se gráficos estão habilitados
  const chartsEnabled = perfFlags.shouldLoadHeavyFeature('charts');

  // ============================================
  // INTERSECTION OBSERVER
  // ============================================
  useEffect(() => {
    if (!chartsEnabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px",
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [chartsEnabled]);

  // ============================================
  // HANDLER DE LOAD
  // ============================================
  useEffect(() => {
    if (isInView && !isLoaded) {
      // Marcar como carregado após um pequeno delay (pós-Suspense)
      const timer = setTimeout(() => {
        setIsLoaded(true);
        onLoad?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInView, isLoaded, onLoad]);

  // ============================================
  // RENDER — CHARTS DESABILITADOS
  // ============================================
  if (!chartsEnabled) {
    return <ChartPlaceholder height={height} className={className} />;
  }

  // ============================================
  // RENDER — AGUARDANDO ENTRAR NA VIEWPORT
  // ============================================
  if (!isInView) {
    return (
      <div 
        ref={containerRef}
        className={className}
        style={{ height }}
      >
        {showSkeleton && <ChartSkeleton height={height} />}
      </div>
    );
  }

  // ============================================
  // RENDER — GRÁFICO LAZY
  // ============================================
  const ChartComponent = CHART_COMPONENTS[type];

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ width, height }}
    >
      <Suspense fallback={<ChartSkeleton height={height} />}>
        <LazyResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data} {...config}>
            {config.children}
          </ChartComponent>
        </LazyResponsiveContainer>
      </Suspense>
    </div>
  );
});

LazyChart.displayName = "LazyChart";

export default LazyChart;
