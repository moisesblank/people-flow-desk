// ============================================
// COMPONENTE DE VALOR REATIVO
// Exibe valores do store com formatação automática
// ============================================

import { useReactiveStore } from '@/stores/reactiveStore';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '@/utils/format';

interface ReactiveValueProps {
  field: string;
  format?: 'currency' | 'percent' | 'number' | 'compact';
  showTrend?: boolean;
  showPulse?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  prefix?: string;
  suffix?: string;
  invertTrend?: boolean; // Para campos onde menor é melhor (ex: despesas)
  showFormula?: boolean;
}

// Mapa de fórmulas para tooltip
const FORMULA_MAP: Record<string, string> = {
  lucro_mes: 'Receita Mês - Despesa Mês',
  lucro_ano: 'Receita Ano - Despesa Ano',
  alunos_inativos: 'Total Alunos - Alunos Ativos',
  taxa_conversao: '(Novos Alunos / Leads) × 100',
  margem_lucro: '(Lucro / Receita) × 100',
  taxa_churn: '100 - Taxa Retenção',
  cac: 'Despesa Marketing / Novos Alunos',
  ltv: '(Receita Ano / Alunos Ativos) × 12',
  roi: '((Receita - Despesa) / Despesa) × 100',
  progresso_meta_receita: '(Receita / Meta) × 100',
  progresso_meta_alunos: '(Novos Alunos / Meta) × 100',
  falta_para_meta: 'Meta - Receita Atual',
  tarefas_pendentes: 'Total - Concluídas',
  taxa_conclusao: '(Concluídas / Total) × 100',
};

export function ReactiveValue({ 
  field, 
  format = 'number', 
  showTrend = false, 
  showPulse = true,
  className, 
  size = 'md',
  prefix = '',
  suffix = '',
  invertTrend = false,
  showFormula = false
}: ReactiveValueProps) {
  const value = useReactiveStore(s => (s.data as any)[field] as number) || 0;
  const lastUpdated = useReactiveStore(s => s.data.last_updated);
  const computationTime = useReactiveStore(s => s.data.computation_time_ms);

  // Formatar valor (usando utils centralizados)
  const formatted = useMemo(() => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'compact':
        if (Math.abs(value) >= 100000000) return `${(value / 100000000).toFixed(1)}M`;
        if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(1)}K`;
        if (Math.abs(value) >= 100) return formatCurrency(value);
        return value.toString();
      default:
        return formatNumber(value);
    }
  }, [value, format]);

  // Determinar tendência
  const trend = useMemo(() => {
    const isPositive = invertTrend ? value < 0 : value > 0;
    const isNegative = invertTrend ? value > 0 : value < 0;
    return isPositive ? 'up' : isNegative ? 'down' : 'neutral';
  }, [value, invertTrend]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg font-semibold',
    lg: 'text-2xl font-bold',
    xl: 'text-4xl font-black'
  };

  const isRecentUpdate = Date.now() - lastUpdated < 1000;
  const formula = FORMULA_MAP[field];

  const content = (
    <span className={cn(
      sizeClasses[size], 
      'tabular-nums transition-all duration-200',
      isRecentUpdate && 'scale-105',
      className
    )}>
      {prefix}{formatted}{suffix}
    </span>
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showFormula && formula ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-sm">{field.replace(/_/g, ' ').toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono bg-muted px-1 rounded">{formula}</span>
                </p>
                <p className="text-xs flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Atualizado em {computationTime.toFixed(0)}ms
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : content}
      
      {showTrend && (
        <TrendIcon className={cn('w-4 h-4', trendColor)} />
      )}
      
      {/* Indicador de atualização recente */}
      {showPulse && isRecentUpdate && (
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
      )}
    </div>
  );
}

// ===== COMPONENTE DE COMPARAÇÃO =====
interface ReactiveCompareProps {
  field1: string;
  field2: string;
  format?: 'currency' | 'percent' | 'number';
  separator?: string;
  className?: string;
}

export function ReactiveCompare({ 
  field1, 
  field2, 
  format = 'currency', 
  separator = '/', 
  className 
}: ReactiveCompareProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ReactiveValue field={field1} format={format} showPulse={false} />
      <span className="text-muted-foreground">{separator}</span>
      <ReactiveValue field={field2} format={format} showPulse={false} />
    </div>
  );
}

// ===== COMPONENTE DE STATUS DE CONEXÃO =====
export function ReactiveConnectionStatus({ className }: { className?: string }) {
  const connected = useReactiveStore(s => s.connected);
  const loading = useReactiveStore(s => s.loading);
  const lastUpdate = useReactiveStore(s => s.data.last_updated);
  const computationTime = useReactiveStore(s => s.data.computation_time_ms);

  const status = connected ? 'online' : loading ? 'syncing' : 'offline';
  const statusColor = {
    online: 'bg-emerald-500',
    syncing: 'bg-amber-500 animate-pulse',
    offline: 'bg-red-500'
  };
  const statusText = {
    online: 'Conectado',
    syncing: 'Sincronizando...',
    offline: 'Desconectado'
  };

  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      <span className={cn('w-2 h-2 rounded-full', statusColor[status])} />
      <span>{statusText[status]}</span>
      {connected && (
        <>
          <span className="mx-1">•</span>
          <span>{computationTime.toFixed(0)}ms</span>
          <span className="mx-1">•</span>
          <span>{new Date(lastUpdate).toLocaleTimeString('pt-BR')}</span>
        </>
      )}
    </div>
  );
}
