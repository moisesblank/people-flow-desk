// ============================================
// PLANILHA VIVA v2.0 - VALOR REATIVO
// Componente universal para exibir valores reativos
// ============================================

import { memo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useLiveValue, useLiveSheet } from "@/contexts/LiveSheetContext";
import { cn } from "@/lib/utils";
import { formatCurrency, formatCurrencyCompact } from "@/utils/format";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LiveValueProps {
  // Identificador da variável no sistema
  dataKey: string;
  
  // Formatação
  format?: 'currency' | 'percent' | 'number' | 'compact';
  
  // Aparência
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  color?: 'default' | 'green' | 'red' | 'gold' | 'blue' | 'purple' | 'auto';
  
  // Comportamento
  animate?: boolean;
  showTrend?: boolean;
  showTooltip?: boolean;
  hideOnZero?: boolean;
  
  // Fallback para valores não encontrados
  fallback?: string | number;
  
  // Prefixo/Sufixo
  prefix?: string;
  suffix?: string;
}

const sizeClasses = {
  'xs': 'text-xs',
  'sm': 'text-sm',
  'md': 'text-base',
  'lg': 'text-lg',
  'xl': 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

const colorClasses = {
  'default': 'text-foreground',
  'green': 'text-[hsl(var(--stats-green))]',
  'red': 'text-destructive',
  'gold': 'text-[hsl(var(--stats-gold))]',
  'blue': 'text-[hsl(var(--stats-blue))]',
  'purple': 'text-[hsl(var(--stats-purple))]',
  'auto': '', // Determinado dinamicamente
};

export const LiveValue = memo(function LiveValue({
  dataKey,
  format = 'number',
  className,
  size = 'md',
  color = 'default',
  animate = true,
  showTrend = false,
  showTooltip = true,
  hideOnZero = false,
  fallback,
  prefix,
  suffix,
}: LiveValueProps) {
  const { value, formatted, formula, dependents } = useLiveValue(dataKey, format === 'compact' ? 'number' : format);
  const { state } = useLiveSheet();
  const prevValueRef = useRef(value);
  
  // Determinar cor automática
  const autoColor = color === 'auto' 
    ? value > 0 ? 'green' : value < 0 ? 'red' : 'default'
    : color;
  
  // Detectar mudança para animação
  const hasChanged = prevValueRef.current !== value;
  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);
  
  // Formatar valor compacto
  const displayValue = format === 'compact' 
    ? formatCompact(value)
    : formatted;
  
  if (hideOnZero && value === 0) {
    return null;
  }
  
  const content = (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={animate ? { opacity: 0, y: hasChanged ? 5 : 0, scale: hasChanged ? 0.95 : 1 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={animate ? { opacity: 0, y: -5, scale: 1.05 } : undefined}
        transition={{ duration: 0.15 }}
        className={cn(
          "font-semibold inline-flex items-center gap-1",
          sizeClasses[size],
          colorClasses[autoColor],
          hasChanged && animate && "animate-pulse-once",
          className
        )}
      >
        {prefix}
        {displayValue || fallback || '—'}
        {suffix}
        {showTrend && hasChanged && (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "text-xs",
              value > prevValueRef.current ? "text-[hsl(var(--stats-green))]" : "text-destructive"
            )}
          >
            {value > prevValueRef.current ? "↑" : "↓"}
          </motion.span>
        )}
      </motion.span>
    </AnimatePresence>
  );
  
  if (!showTooltip || !formula) {
    return content;
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1 text-xs">
          <p className="font-semibold">{formula.name}</p>
          {formula.dependencies.length > 0 && (
            <p className="text-muted-foreground">
              Depende de: {formula.dependencies.join(', ')}
            </p>
          )}
          {dependents.length > 0 && (
            <p className="text-muted-foreground">
              Afeta: {dependents.slice(0, 3).join(', ')}
              {dependents.length > 3 && ` +${dependents.length - 3}`}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/70">
            Atualizado: {state.lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

// ===== COMPONENTE DE COMPARAÇÃO =====
interface LiveCompareProps {
  dataKey: string;
  compareKey: string;
  format?: 'currency' | 'percent' | 'number';
  className?: string;
}

export const LiveCompare = memo(function LiveCompare({
  dataKey,
  compareKey,
  format = 'number',
  className,
}: LiveCompareProps) {
  const current = useLiveValue(dataKey, format);
  const previous = useLiveValue(compareKey, format);
  
  const diff = current.value - previous.value;
  const percentChange = previous.value > 0 
    ? ((diff / previous.value) * 100).toFixed(1)
    : '0';
  
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)}>
      <span className={cn(
        "font-medium",
        diff > 0 ? "text-[hsl(var(--stats-green))]" : 
        diff < 0 ? "text-destructive" : 
        "text-muted-foreground"
      )}>
        {diff > 0 ? '+' : ''}{percentChange}%
      </span>
    </span>
  );
});

// ===== COMPONENTE DE STATUS DE CONEXÃO =====
export const LiveStatus = memo(function LiveStatus({ className }: { className?: string }) {
  const { state, isReactive, latency } = useLiveSheet();
  
  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span className={cn(
        "flex h-2 w-2 rounded-full",
        isReactive ? "bg-green-500" : "bg-yellow-500"
      )}>
        {isReactive && (
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
        )}
      </span>
      <span className={cn(
        "font-medium",
        isReactive ? "text-green-500" : "text-yellow-500"
      )}>
        {isReactive ? 'LIVE' : 'OFFLINE'}
      </span>
      {latency > 0 && (
        <span className="text-muted-foreground">
          {latency.toFixed(0)}ms
        </span>
      )}
    </div>
  );
});

// ===== HELPERS (usa utils centralizados) =====
function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_00) {
    return `R$ ${(value / 1_000_000_00).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000_00) {
    return `R$ ${(value / 1_000_00).toFixed(1)}k`;
  }
  return formatCurrency(value);
}

// CSS para animação pulse-once (adicionar ao index.css se não existir)
// @keyframes pulse-once { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
// .animate-pulse-once { animation: pulse-once 0.3s ease-in-out; }
