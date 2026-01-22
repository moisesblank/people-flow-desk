// =====================================================
// TaxonomyHierarchyTable - Design Year 2300 Cinematic HUD
// MACRO → MICRO → TEMA (se houver)
// Acurácia %, Total, Erros - Visual Premium Integrado
// P0 FIX: Hardening contra React Error #61
// =====================================================

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Target, ChevronRight, Zap, AlertTriangle, CheckCircle2, Layers } from "lucide-react";
import type { TaxonomyNode } from "@/hooks/student-performance";

// ============================================
// P0 FIX — HARDENING CONTRA React Error #61
// ============================================
const toSafeString = (v: unknown, fallback = ""): string => {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return fallback;
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if (typeof obj.name === "string") return obj.name;
    if (typeof obj.label === "string") return obj.label;
    try { return JSON.stringify(v); } catch { return fallback; }
  }
  return String(v);
};

const toSafeNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === "number" && !isNaN(v)) return v;
  if (typeof v === "string") {
    const parsed = parseFloat(v);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

interface TaxonomyHierarchyTableProps {
  data: TaxonomyNode[];
  isLoading: boolean;
  className?: string;
}

function getAccuracyConfig(accuracy: number) {
  if (accuracy >= 70) return { 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    icon: CheckCircle2
  };
  if (accuracy >= 50) return { 
    color: "text-amber-400", 
    bg: "bg-amber-500/10", 
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
    icon: Zap
  };
  return { 
    color: "text-rose-400", 
    bg: "bg-rose-500/10", 
    border: "border-rose-500/30",
    glow: "shadow-rose-500/20",
    icon: AlertTriangle
  };
}

// Componente de Macro Card
function MacroCard({ 
  macro, 
  children 
}: { 
  macro: TaxonomyNode; 
  children: React.ReactNode;
}) {
  // P0 FIX: Garantir valores seguros
  const macroName = toSafeString(macro?.name, "Sem Nome");
  const macroAccuracy = toSafeNumber(macro?.accuracyPercent, 0);
  const macroTotal = toSafeNumber(macro?.totalAttempts, 0);
  const macroCorrect = toSafeNumber(macro?.correctAttempts, 0);
  
  const config = getAccuracyConfig(macroAccuracy);
  const errors = macroTotal - macroCorrect;
  
  return (
    <div className={cn(
      "rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden",
      "transition-all duration-300 hover:shadow-lg",
      config.border,
      `hover:${config.glow}`
    )}>
      {/* Header do Macro */}
      <div className={cn(
        "px-4 py-3 border-b flex items-center justify-between",
        config.bg,
        config.border
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            config.bg,
            config.border,
            "border"
          )}>
            <Target className={cn("h-4 w-4", config.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{macroName}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{macroTotal} questões</span>
              <span>•</span>
              <span className={errors > 0 ? "text-rose-400" : "text-emerald-400"}>
                {errors} erros
              </span>
            </div>
          </div>
        </div>
        
        {/* Accuracy Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Progress 
              value={macroAccuracy} 
              className="h-2 w-20"
            />
            <span className={cn("text-lg font-bold tabular-nums", config.color)}>
              {macroAccuracy.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Micros */}
      <div className="divide-y divide-border/50">
        {children}
      </div>
    </div>
  );
}

// Componente de Micro Row
function MicroRow({ 
  micro, 
  temas 
}: { 
  micro: TaxonomyNode; 
  temas: TaxonomyNode[];
}) {
  // P0 FIX: Garantir valores seguros
  const microName = toSafeString(micro?.name, "Sem Nome");
  const microAccuracy = toSafeNumber(micro?.accuracyPercent, 0);
  const microTotal = toSafeNumber(micro?.totalAttempts, 0);
  const microCorrect = toSafeNumber(micro?.correctAttempts, 0);
  
  const config = getAccuracyConfig(microAccuracy);
  const errors = microTotal - microCorrect;
  const StatusIcon = config.icon;
  
  return (
    <div className="px-4 py-2">
      {/* Micro Header */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <StatusIcon className={cn("h-3.5 w-3.5", config.color)} />
          <span className="text-sm font-medium text-foreground/90">{microName}</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Progress value={microAccuracy} className="h-1.5 w-12" />
            <span className={cn("font-semibold tabular-nums", config.color)}>
              {microAccuracy.toFixed(0)}%
            </span>
          </div>
          <span className="text-muted-foreground tabular-nums w-8 text-right">
            {microTotal}
          </span>
          <span className={cn(
            "tabular-nums w-6 text-right font-medium",
            errors > 0 ? "text-rose-400" : "text-emerald-400"
          )}>
            {errors}
          </span>
        </div>
      </div>
      
      {/* Temas (se houver) */}
      {temas.length > 0 && (
        <div className="ml-6 pl-3 border-l border-border/30 space-y-1 pb-1">
          {temas.map((tema, idx) => {
            // P0 FIX: Garantir valores seguros
            const temaName = toSafeString(tema?.name, "Sem Nome");
            const temaAccuracy = toSafeNumber(tema?.accuracyPercent, 0);
            const temaTotal = toSafeNumber(tema?.totalAttempts, 0);
            const temaCorrect = toSafeNumber(tema?.correctAttempts, 0);
            
            const temaConfig = getAccuracyConfig(temaAccuracy);
            const temaErrors = temaTotal - temaCorrect;
            
            return (
              <div 
                key={`tema-${temaName}-${idx}`}
                className="flex items-center justify-between py-1 text-xs"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  <span>{temaName}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={cn("font-medium tabular-nums", temaConfig.color)}>
                    {temaAccuracy.toFixed(0)}%
                  </span>
                  <span className="text-muted-foreground tabular-nums w-8 text-right">
                    {temaTotal}
                  </span>
                  <span className={cn(
                    "tabular-nums w-6 text-right",
                    temaErrors > 0 ? "text-rose-400" : "text-emerald-400"
                  )}>
                    {temaErrors}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TaxonomyHierarchyTable({ data, isLoading, className }: TaxonomyHierarchyTableProps) {
  if (isLoading) {
    return (
      <Card className={cn("border-border/50 bg-card/30 backdrop-blur-sm", className)}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn("border-border/50 bg-card/30 backdrop-blur-sm", className)}>
        <CardContent className="p-8 text-center">
          <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhum dado de taxonomia disponível</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Resolva algumas questões para ver sua performance por área
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedMacros = [...data].sort((a, b) => b.totalAttempts - a.totalAttempts);

  return (
    <Card className={cn(
      "border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden",
      className
    )}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Desempenho por Área
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Acurácia</span>
            <span className="w-8 text-right">Total</span>
            <span className="w-6 text-right">Erros</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {sortedMacros.map(macro => {
          const sortedMicros = Array.from(macro.children.values())
            .filter(m => m.name && m.name.trim() !== '')
            .sort((a, b) => b.totalAttempts - a.totalAttempts);
          
          return (
            <MacroCard key={`macro-${macro.name}`} macro={macro}>
              {sortedMicros.map(micro => {
                const sortedTemas = Array.from(micro.children.values())
                  .filter(t => t.name && t.name.trim() !== '')
                  .sort((a, b) => b.totalAttempts - a.totalAttempts);
                
                return (
                  <MicroRow 
                    key={`micro-${macro.name}-${micro.name}`}
                    micro={micro}
                    temas={sortedTemas}
                  />
                );
              })}
            </MacroCard>
          );
        })}
      </CardContent>
    </Card>
  );
}
