// ============================================
// SEÇÃO DE DASHBOARD REATIVA
// Componente completo para dashboards
// ============================================

import { useReactiveData } from '@/hooks/useReactiveData';
import { ReactiveKPICard, ReactiveKPIGrid, ReactiveGoalCard } from './ReactiveKPICard';
import { ReactiveConnectionStatus } from './ReactiveValue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Wallet,
  UserPlus,
  Briefcase,
  RefreshCw,
  Zap,
  BarChart3,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';

function formatError(err: unknown): string {
  if (!err) return 'Erro desconhecido';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || 'Erro desconhecido';
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

interface ReactiveDashboardSectionProps {
  className?: string;
  showRefreshButton?: boolean;
  compact?: boolean;
}

export function ReactiveDashboardSection({ 
  className, 
  showRefreshButton = true,
  compact = false 
}: ReactiveDashboardSectionProps) {
  const { data, loading, error, forceRefresh } = useReactiveData();
  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{formatError(error)}</p>
          <Button onClick={forceRefresh} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header com status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Dashboard Reativo</h2>
            <ReactiveConnectionStatus />
          </div>
        </div>
        
        {showRefreshButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Atualizar
          </Button>
        )}
      </div>

      {/* KPIs Financeiros - GPU optimized */}
      <motion.section
        {...gpuAnimationProps.fadeUp}
        transition={{ delay: 0.1 }}
        className="will-change-transform transform-gpu"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Financeiro
        </h3>
        <ReactiveKPIGrid columns={compact ? 2 : 4}>
          <ReactiveKPICard
            title="Receita do Mês"
            field="receita_mes"
            format="currency"
            icon={DollarSign}
            description="Atualiza em tempo real"
            colorScheme="success"
          />
          <ReactiveKPICard
            title="Despesas do Mês"
            field="despesa_mes"
            format="currency"
            icon={Wallet}
            colorScheme="danger"
          />
          <ReactiveKPICard
            title="Lucro Líquido"
            field="lucro_mes"
            format="currency"
            icon={TrendingUp}
            description="Receita - Despesas"
            colorScheme="info"
          />
          <ReactiveKPICard
            title="ROI"
            field="roi"
            format="percent"
            icon={BarChart3}
            description="Retorno sobre Investimento"
            colorScheme="default"
          />
        </ReactiveKPIGrid>
      </motion.section>

      {/* Contadores - GPU optimized */}
      <motion.section
        {...gpuAnimationProps.fadeUp}
        transition={{ delay: 0.2 }}
        className="will-change-transform transform-gpu"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Pessoas
        </h3>
        <ReactiveKPIGrid columns={compact ? 2 : 4}>
          <ReactiveKPICard
            title="Alunos Ativos"
            field="alunos_ativos"
            format="number"
            icon={Users}
            colorScheme="success"
          />
          <ReactiveKPICard
            title="Novos este Mês"
            field="novos_alunos_mes"
            format="number"
            icon={UserPlus}
            colorScheme="info"
          />
          <ReactiveKPICard
            title="Funcionários"
            field="total_funcionarios"
            format="number"
            icon={Briefcase}
          />
          <ReactiveKPICard
            title="Afiliados"
            field="total_afiliados"
            format="number"
            icon={Users}
          />
        </ReactiveKPIGrid>
      </motion.section>

      {/* KPIs de Performance */}
      {!compact && (
        <motion.section
          {...gpuAnimationProps.fadeUp}
          transition={{ delay: 0.3 }}
          className="will-change-transform transform-gpu"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance
          </h3>
          <ReactiveKPIGrid columns={4}>
            <ReactiveKPICard
              title="NPS"
              field="nps"
              format="number"
              description="Net Promoter Score"
              colorScheme="success"
            />
            <ReactiveKPICard
              title="Taxa Retenção"
              field="taxa_retencao"
              format="percent"
              colorScheme="info"
            />
            <ReactiveKPICard
              title="Taxa Churn"
              field="taxa_churn"
              format="percent"
              colorScheme="warning"
            />
            <ReactiveKPICard
              title="Margem Lucro"
              field="margem_lucro"
              format="percent"
              colorScheme="success"
            />
          </ReactiveKPIGrid>
        </motion.section>
      )}

      {/* Tarefas - GPU optimized */}
      <motion.section
        {...gpuAnimationProps.fadeUp}
        transition={{ delay: 0.4 }}
        className="will-change-transform transform-gpu"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Tarefas de Hoje
        </h3>
        <ReactiveKPIGrid columns={compact ? 2 : 3}>
          <ReactiveKPICard
            title="Total"
            field="tarefas_total"
            format="number"
            icon={Clock}
          />
          <ReactiveKPICard
            title="Concluídas"
            field="tarefas_concluidas"
            format="number"
            icon={CheckCircle2}
            colorScheme="success"
          />
          <ReactiveKPICard
            title="Taxa Conclusão"
            field="taxa_conclusao"
            format="percent"
            showProgress
            progressField="taxa_conclusao"
            colorScheme="info"
          />
        </ReactiveKPIGrid>
      </motion.section>

      {/* Metas - GPU optimized */}
      <motion.section
        {...gpuAnimationProps.fadeUp}
        transition={{ delay: 0.5 }}
        className="will-change-transform transform-gpu"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Metas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReactiveGoalCard
            title="Meta de Receita"
            currentField="receita_mes"
            goalField="meta_receita_mes"
            progressField="progresso_meta_receita"
            format="currency"
            icon={Target}
          />
          <ReactiveGoalCard
            title="Meta de Alunos"
            currentField="novos_alunos_mes"
            goalField="meta_alunos_mes"
            progressField="progresso_meta_alunos"
            format="number"
            icon={Users}
          />
        </div>
      </motion.section>

      {/* Footer com última atualização */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Última atualização: {new Date(data.last_updated).toLocaleTimeString('pt-BR')}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Computado em {data.computation_time_ms.toFixed(0)}ms
          </span>
        </div>
      </div>
    </div>
  );
}
