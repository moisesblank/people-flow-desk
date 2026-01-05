// ============================================
// 🌌🔥 PERFORMANCE OVERLAY — MONITOR NÍVEL NASA 🔥🌌
// ANO 2300 — VISUALIZAÇÃO DE MÉTRICAS EM TEMPO REAL
// ============================================

import React, { memo, useState, useEffect, useCallback } from "react";
import { X, Zap, Wifi, Cpu, HardDrive, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerformanceConfig } from "@/hooks/usePerformanceConfig";
import { detectDeviceCapabilities, getPerformanceConfig } from "@/lib/performance/performanceFlags";

// ============================================
// TIPOS
// ============================================
interface PerformanceOverlayProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  compact?: boolean;
  showToggle?: boolean;
}

interface WebVitals {
  lcp: number | null;
  fcp: number | null;
  cls: number | null;
  ttfb: number | null;
}

interface ResourceMetrics {
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
  requestCount: number;
}

// ============================================
// FORMATAR BYTES
// ============================================
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ============================================
// FORMATAR TEMPO
// ============================================
function formatTime(ms: number | null): string {
  if (ms === null) return "-";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ============================================
// STATUS BADGE
// ============================================
const StatusBadge = memo(({ value, good, warning }: { value: number | null; good: number; warning: number }) => {
  if (value === null) return <span className="text-muted-foreground">-</span>;
  
  const isGood = value <= good;
  const isWarning = value > good && value <= warning;
  
  return (
    <span className={cn(
      "font-mono text-xs",
      isGood && "text-green-500",
      isWarning && "text-yellow-500",
      !isGood && !isWarning && "text-red-500"
    )}>
      {formatTime(value)}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

// ============================================
// HOOK PARA MEDIR WEB VITALS
// ============================================
function useWebVitals(): WebVitals {
  const [vitals, setVitals] = useState<WebVitals>({
    lcp: null,
    fcp: null,
    cls: null,
    ttfb: null,
  });

  useEffect(() => {
    // Performance Observer para LCP
    if ('PerformanceObserver' in window) {
      try {
        // LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
          setVitals(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // FCP
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
          if (fcpEntry) {
            setVitals(prev => ({ ...prev, fcp: fcpEntry.startTime }));
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });

        // CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput?: boolean; value?: number })[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value ?? 0;
              setVitals(prev => ({ ...prev, cls: clsValue }));
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // TTFB from navigation timing
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navEntry) {
          setVitals(prev => ({ ...prev, ttfb: navEntry.responseStart - navEntry.requestStart }));
        }

        return () => {
          lcpObserver.disconnect();
          fcpObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch {
        // PerformanceObserver not supported for some entry types
      }
    }
  }, []);

  return vitals;
}

// ============================================
// HOOK PARA MEDIR RECURSOS
// ============================================
function useResourceMetrics(): ResourceMetrics {
  const [metrics, setMetrics] = useState<ResourceMetrics>({
    jsSize: 0,
    cssSize: 0,
    imageSize: 0,
    totalSize: 0,
    requestCount: 0,
  });

  useEffect(() => {
    const measureResources = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let jsSize = 0;
      let cssSize = 0;
      let imageSize = 0;
      let totalSize = 0;

      resources.forEach(resource => {
        const size = resource.transferSize || 0;
        totalSize += size;

        if (resource.initiatorType === 'script' || resource.name.endsWith('.js')) {
          jsSize += size;
        } else if (resource.initiatorType === 'css' || resource.name.endsWith('.css')) {
          cssSize += size;
        } else if (resource.initiatorType === 'img' || /\.(png|jpg|jpeg|gif|webp|svg|avif)$/i.test(resource.name)) {
          imageSize += size;
        }
      });

      setMetrics({
        jsSize,
        cssSize,
        imageSize,
        totalSize,
        requestCount: resources.length,
      });
    };

    measureResources();
    
    // Atualizar periodicamente
    const interval = setInterval(measureResources, 5000);
    return () => clearInterval(interval);
  }, []);

  return metrics;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const PerformanceOverlay = memo(({
  position = "bottom-right",
  compact = false,
  showToggle = true,
}: PerformanceOverlayProps) => {
  const { config, capabilities, tier, toggleLiteMode, isLiteMode } = usePerformanceConfig();
  const vitals = useWebVitals();
  const resources = useResourceMetrics();
  
  const [isOpen, setIsOpen] = useState(false);
  const [fps, setFps] = useState(60);

  // Medir FPS
  useEffect(() => {
    if (!isOpen) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measureFps = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      
      rafId = requestAnimationFrame(measureFps);
    };

    rafId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  // Calcular score
  const calculateScore = useCallback((): number => {
    let score = 100;
    
    // Penalidades por Web Vitals
    if (vitals.lcp !== null) {
      if (vitals.lcp > 2500) score -= 20;
      else if (vitals.lcp > 4000) score -= 40;
    }
    if (vitals.fcp !== null) {
      if (vitals.fcp > 1800) score -= 15;
      else if (vitals.fcp > 3000) score -= 30;
    }
    if (vitals.cls !== null) {
      if (vitals.cls > 0.1) score -= 10;
      else if (vitals.cls > 0.25) score -= 25;
    }
    
    // Penalidades por recursos
    if (resources.totalSize > 2 * 1024 * 1024) score -= 15; // > 2MB
    if (resources.jsSize > 500 * 1024) score -= 10; // > 500KB JS
    if (resources.requestCount > 50) score -= 5;
    
    // Penalidade por FPS baixo
    if (fps < 30) score -= 20;
    else if (fps < 55) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }, [vitals, resources, fps]);

  const score = calculateScore();
  const isGoodPerformance = score >= 70;

  // Posicionamento
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  // ============================================
  // RENDER — BOTÃO TOGGLE
  // ============================================
  if (!isOpen) {
    return showToggle ? (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-[9999] p-2 rounded-full shadow-lg transition-all",
          "bg-background/80 backdrop-blur border hover:scale-110",
          positionClasses[position]
        )}
        title="Abrir Performance Monitor"
      >
        <Activity className="w-4 h-4 text-primary" />
      </button>
    ) : null;
  }

  // ============================================
  // RENDER — PAINEL COMPLETO
  // ============================================
  return (
    <div
      className={cn(
        "fixed z-[9999] w-72 rounded-lg shadow-xl",
        "bg-background/95 backdrop-blur-md border",
        "text-xs font-mono",
        positionClasses[position]
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-semibold">Performance</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Device Info */}
      <div className="p-2 border-b bg-muted/30">
        <div className="flex justify-between mb-1">
          <span className="text-muted-foreground">Device Tier</span>
          <span className={cn(
            "font-bold uppercase",
            tier === 'quantum' && "text-purple-500",
            tier === 'neural' && "text-cyan-500",
            tier === 'enhanced' && "text-green-500",
            tier === 'standard' && "text-yellow-500",
            tier === 'legacy' && "text-orange-500",
            tier === 'critical' && "text-red-500"
          )}>
            {tier}
          </span>
        </div>
        <div className="flex gap-2 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            {capabilities.cores} cores
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {capabilities.memory}GB
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            {capabilities.connection}
          </span>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="p-2 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground">Core Web Vitals</span>
          {isGoodPerformance ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-muted-foreground mb-1">LCP</p>
            <StatusBadge value={vitals.lcp} good={2500} warning={4000} />
          </div>
          <div className="text-center">
            <p className="text-muted-foreground mb-1">FCP</p>
            <StatusBadge value={vitals.fcp} good={1800} warning={3000} />
          </div>
          <div className="text-center">
            <p className="text-muted-foreground mb-1">CLS</p>
            <span className={cn(
              "font-mono text-xs",
              (vitals.cls ?? 0) <= 0.1 && "text-green-500",
              (vitals.cls ?? 0) > 0.1 && (vitals.cls ?? 0) <= 0.25 && "text-yellow-500",
              (vitals.cls ?? 0) > 0.25 && "text-red-500"
            )}>
              {vitals.cls?.toFixed(3) ?? "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="p-2 border-b">
        <p className="text-muted-foreground mb-2">Resources</p>
        <div className="grid grid-cols-2 gap-1">
          <div className="flex justify-between">
            <span>JS</span>
            <span className="text-foreground">{formatBytes(resources.jsSize)}</span>
          </div>
          <div className="flex justify-between">
            <span>CSS</span>
            <span className="text-foreground">{formatBytes(resources.cssSize)}</span>
          </div>
          <div className="flex justify-between">
            <span>Images</span>
            <span className="text-foreground">{formatBytes(resources.imageSize)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total</span>
            <span className="text-foreground">{formatBytes(resources.totalSize)}</span>
          </div>
          <div className="flex justify-between col-span-2">
            <span>Requests</span>
            <span className="text-foreground">{resources.requestCount}</span>
          </div>
        </div>
      </div>

      {/* Runtime */}
      <div className="p-2 border-b">
        <p className="text-muted-foreground mb-2">Runtime</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-muted-foreground mb-1">FPS</p>
            <span className={cn(
              "font-bold",
              fps >= 55 && "text-green-500",
              fps >= 30 && fps < 55 && "text-yellow-500",
              fps < 30 && "text-red-500"
            )}>
              {fps}
            </span>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground mb-1">Score</p>
            <span className={cn(
              "font-bold",
              score >= 70 && "text-green-500",
              score >= 50 && score < 70 && "text-yellow-500",
              score < 50 && "text-red-500"
            )}>
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Lite Mode Toggle */}
      <div className="p-2">
        <button
          onClick={toggleLiteMode}
          className={cn(
            "w-full py-1.5 px-3 rounded text-xs font-medium transition-colors",
            isLiteMode
              ? "bg-primary/20 text-primary hover:bg-primary/30"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {isLiteMode ? "🔋 Lite Mode ON" : "⚡ Lite Mode OFF"}
        </button>
      </div>
    </div>
  );
});

PerformanceOverlay.displayName = "PerformanceOverlay";

export default PerformanceOverlay;
