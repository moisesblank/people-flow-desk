// ============================================
// CARD DE KPI REATIVO
// Exibe KPIs com atualização automática
// ============================================

import { ReactiveValue } from './ReactiveValue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReactiveStore } from '@/stores/reactiveStore';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ReactiveKPICardProps {
  title: string;
  field: string;
  format?: 'currency' | 'percent' | 'number' | 'compact';
  icon?: LucideIcon;
  description?: string;
  className?: string;
  showProgress?: boolean;
  progressField?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  colorScheme?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const colorSchemes = {
  default: 'from-primary/10 to-primary/5 border-primary/20',
  success: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
  warning: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
  danger: 'from-red-500/10 to-red-500/5 border-red-500/20',
  info: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
};

const iconColors = {
  default: 'text-primary',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  info: 'text-blue-500',
};

export function ReactiveKPICard({ 
  title, 
  field, 
  format = 'currency', 
  icon: Icon, 
  description, 
  className,
  showProgress = false,
  progressField,
  colorScheme = 'default'
}: ReactiveKPICardProps) {
  const progressValue = useReactiveStore(s => 
    progressField ? (s.data as any)[progressField] as number : 0
  );
  const lastUpdated = useReactiveStore(s => s.data.last_updated);
  const isRecent = Date.now() - lastUpdated < 2000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        'transition-all duration-300 hover:shadow-lg border bg-gradient-to-br',
        colorSchemes[colorScheme],
        isRecent && 'ring-2 ring-primary/30',
        className
      )}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {Icon && <Icon className={cn('w-4 h-4', iconColors[colorScheme])} />}
        </CardHeader>
        <CardContent>
          <ReactiveValue 
            field={field} 
            format={format} 
            size="lg" 
            showTrend 
            showFormula
          />
          
          {showProgress && progressField && (
            <div className="mt-3 space-y-1">
              <Progress 
                value={Math.min(progressValue, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                <ReactiveValue field={progressField} format="percent" size="xs" showPulse={false} /> da meta
              </p>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===== GRID DE KPIs =====
interface ReactiveKPIGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ReactiveKPIGrid({ children, columns = 4, className }: ReactiveKPIGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// ===== CARD DE META =====
interface ReactiveGoalCardProps {
  title: string;
  currentField: string;
  goalField: string;
  progressField: string;
  format?: 'currency' | 'number';
  icon?: LucideIcon;
  className?: string;
}

export function ReactiveGoalCard({
  title,
  currentField,
  goalField,
  progressField,
  format = 'currency',
  icon: Icon,
  className
}: ReactiveGoalCardProps) {
  const progress = useReactiveStore(s => (s.data as any)[progressField] as number) || 0;
  
  const progressColor = useMemo(() => {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }, [progress]);

  return (
    <Card className={cn('transition-all hover:shadow-lg', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Atual</span>
          <ReactiveValue field={currentField} format={format} size="sm" showPulse={false} />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Meta</span>
          <ReactiveValue field={goalField} format={format} size="sm" showPulse={false} />
        </div>
        
        <div className="space-y-1">
          <Progress value={Math.min(progress, 100)} className={cn('h-3', progressColor)} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <ReactiveValue field={progressField} format="percent" size="xs" showPulse={false} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== MINI KPI INLINE =====
interface ReactiveMiniKPIProps {
  label: string;
  field: string;
  format?: 'currency' | 'percent' | 'number';
  icon?: LucideIcon;
  className?: string;
}

export function ReactiveMiniKPI({ label, field, format = 'number', icon: Icon, className }: ReactiveMiniKPIProps) {
  return (
    <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-muted/50', className)}>
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <ReactiveValue field={field} format={format} size="sm" showPulse={false} />
      </div>
    </div>
  );
}
