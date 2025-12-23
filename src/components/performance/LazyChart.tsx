// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - LazyChart
// Gráficos lazy load nível NASA - Recharts só carrega quando necessário
// LEI I: Recharts adiciona ~445KB - carregar somente quando visível
// ============================================

import React, { Suspense, lazy, useRef, useState, useEffect, memo, ComponentType, ReactNode } from "react";
import { Loader2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { perfFlags } from "@/lib/performance/performanceFlags";

// ============================================
// TIPOS
// ============================================
type ChartData = Record<string, unknown>[];
type ChartConfig = Record<string, unknown> & { children?: ReactNode };

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
      "flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-border/50",
      className
    )}
    style={{ height }}
  >
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-sm">Carregando gráfico...</span>
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
      "flex flex-col items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border/50",
      className
    )}
    style={{ height }}
  >
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <BarChart3 className="w-10 h-10 opacity-50" />
      <span className="text-sm">Gráficos desativados (Modo Lite)</span>
      <button
        onClick={() => perfFlags.set('chartsEnabled', true)}
        className="text-xs text-primary underline hover:no-underline transition-all"
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

// ResponsiveContainer também lazy
const LazyResponsiveContainer = lazy(() => 
  import("recharts").then(mod => ({ default: mod.ResponsiveContainer as LazyChartComponent }))
);

// ============================================
// MAPEAMENTO
// ============================================
const CHART_COMPONENTS: Record<LazyChartProps['type'], LazyChartComponent> = {
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
export const LazyChart = memo(function LazyChart({
  type,
  data,
  config = {},
  width = "100%",
  height = 300,
  className,
  showSkeleton = true,
  onLoad,
}: LazyChartProps) {
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
      <div ref={containerRef} className={className} style={{ minHeight: height }}>
        {showSkeleton && <ChartSkeleton height={height} />}
      </div>
    );
  }

  // ============================================
  // RENDER — GRÁFICO LAZY
  // ============================================
  const ChartComponent = CHART_COMPONENTS[type];
  const { children, ...chartConfig } = config;

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <Suspense fallback={<ChartSkeleton height={height} />}>
        <LazyResponsiveContainer width={width} height={height}>
          <ChartComponent data={data} {...chartConfig}>
            {children}
          </ChartComponent>
        </LazyResponsiveContainer>
      </Suspense>
    </div>
  );
});

LazyChart.displayName = "LazyChart";

export { ChartSkeleton, ChartPlaceholder };
export default LazyChart;
