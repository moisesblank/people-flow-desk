// ============================================
// 🌌🔥 PERFORMANCE OVERLAY — MONITOR NÍVEL NASA 🔥🌌
// ANO 2300 — VISUALIZAÇÃO DE MÉTRICAS EM TEMPO REAL
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import React, { memo, useState, useEffect } from "react";
import { X, Zap, Wifi, Cpu, HardDrive, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerformance } from "@/hooks/usePerformance";

// ============================================
// TIPOS
// ============================================
interface PerformanceOverlayProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  compact?: boolean;
  showToggle?: boolean;
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
  const isBad = value > warning;
  
  return (
    <span className={cn(
      "font-mono text-xs",
      isGood && "text-green-500",
      isWarning && "text-yellow-500",
      isBad && "text-red-500"
    )}>
      {formatTime(value)}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const PerformanceOverlay = memo(({
  position = "bottom-right",
  compact = false,
  showToggle = true,
}: PerformanceOverlayProps) => {
  const { 
    config, 
    capabilities, 
    metrics, 
    toggleLiteMode, 
    refreshMetrics 
  } = usePerformance();
  
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
        <Activity className="h-4 w-4 text-primary" />
      </button>
    ) : null;
  }

  // ============================================
  // RENDER — PAINEL COMPLETO
  // ============================================
  return (
    <div
      className={cn(
        "fixed z-[9999] p-3 rounded-lg shadow-xl",
        "bg-background/95 backdrop-blur-sm border",
        "text-xs font-mono",
        compact ? "w-64" : "w-80",
        positionClasses[position]
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Performance</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={refreshMetrics}
            className="p-1 hover:bg-muted rounded"
            title="Atualizar métricas"
          >
            <Activity className="h-3 w-3" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Device Info */}
      <div className="mb-3 p-2 bg-muted/50 rounded">
        <div className="flex items-center justify-between mb-1">
          <span className="text-muted-foreground">Device Tier</span>
          <span className={cn(
            "font-bold uppercase",
            capabilities.tier === "quantum" && "text-purple-500",
            capabilities.tier === "neural" && "text-blue-500",
            capabilities.tier === "enhanced" && "text-green-500",
            capabilities.tier === "standard" && "text-yellow-500",
            capabilities.tier === "legacy" && "text-orange-500",
            capabilities.tier === "lite" && "text-red-500"
          )}>
            {capabilities.tier}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {capabilities.cores} cores
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {capabilities.memory}GB
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            {capabilities.connection}
          </span>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="mb-3">
        <h4 className="text-muted-foreground mb-2 flex items-center gap-1">
          Core Web Vitals
          {metrics?.isGood ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
          )}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-1 bg-muted/30 rounded">
            <div className="text-muted-foreground text-[10px]">LCP</div>
            <StatusBadge value={metrics?.lcp ?? null} good={2500} warning={4000} />
          </div>
          <div className="text-center p-1 bg-muted/30 rounded">
            <div className="text-muted-foreground text-[10px]">FCP</div>
            <StatusBadge value={metrics?.fcp ?? null} good={1800} warning={3000} />
          </div>
          <div className="text-center p-1 bg-muted/30 rounded">
            <div className="text-muted-foreground text-[10px]">CLS</div>
            <span className={cn(
              "text-xs",
              (metrics?.cls ?? 0) <= 0.1 && "text-green-500",
              (metrics?.cls ?? 0) > 0.1 && (metrics?.cls ?? 0) <= 0.25 && "text-yellow-500",
              (metrics?.cls ?? 0) > 0.25 && "text-red-500"
            )}>
              {metrics?.cls?.toFixed(3) ?? "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="mb-3">
        <h4 className="text-muted-foreground mb-2">Resources</h4>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">JS</span>
            <span>{formatBytes(metrics?.jsSize ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CSS</span>
            <span>{formatBytes(metrics?.cssSize ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Images</span>
            <span>{formatBytes(metrics?.imageSize ?? 0)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
            <span>Total</span>
            <span>{formatBytes(metrics?.totalSize ?? 0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Requests</span>
            <span>{metrics?.requestCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Runtime */}
      <div className="mb-3">
        <h4 className="text-muted-foreground mb-2">Runtime</h4>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-muted-foreground text-[10px]">FPS</div>
            <span className={cn(
              "text-sm font-bold",
              fps >= 55 && "text-green-500",
              fps >= 30 && fps < 55 && "text-yellow-500",
              fps < 30 && "text-red-500"
            )}>
              {fps}
            </span>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground text-[10px]">Score</div>
            <span className={cn(
              "text-sm font-bold",
              (metrics?.score ?? 0) >= 70 && "text-green-500",
              (metrics?.score ?? 0) >= 50 && (metrics?.score ?? 0) < 70 && "text-yellow-500",
              (metrics?.score ?? 0) < 50 && "text-red-500"
            )}>
              {metrics?.score ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Lite Mode Toggle */}
      <div className="pt-2 border-t">
        <button
          onClick={toggleLiteMode}
          className={cn(
            "w-full py-2 px-3 rounded text-center transition-colors",
            config.liteMode
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {config.liteMode ? "🔋 Lite Mode ON" : "⚡ Lite Mode OFF"}
        </button>
      </div>
    </div>
  );
});

PerformanceOverlay.displayName = "PerformanceOverlay";

export default PerformanceOverlay;
