// ============================================
// MOISES MEDEIROS v5.0 - ADVANCED KPIs
// Pilar 12: Business Intelligence Avançado
// ============================================

import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Clock, 
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPIData {
  // LTV (Lifetime Value)
  ltv: number;
  ltvPreviousPeriod: number;
  // CAC (Customer Acquisition Cost)
  cac: number;
  cacPreviousPeriod: number;
  // Churn Rate
  churnRate: number;
  churnRatePreviousPeriod: number;
  // MRR (Monthly Recurring Revenue)
  mrr: number;
  mrrPreviousPeriod: number;
  // ARR (Annual Recurring Revenue)
  arr: number;
  // NPS Score
  nps: number;
  npsPreviousPeriod: number;
  // Active Users
  activeUsers: number;
  totalUsers: number;
  // Revenue per User
  revenuePerUser: number;
  // Retention Rate
  retentionRate: number;
}

interface AdvancedKPIsProps {
  data: KPIData;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function getTrendIcon(change: number, invertColors: boolean = false) {
  if (Math.abs(change) < 0.1) {
    return { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" };
  }
  
  const isPositive = invertColors ? change < 0 : change > 0;
  
  return {
    icon: isPositive ? ArrowUpRight : ArrowDownRight,
    color: isPositive ? "text-green-600" : "text-red-600",
    bg: isPositive ? "bg-green-500/10" : "bg-red-500/10",
  };
}

export function AdvancedKPIs({ data }: AdvancedKPIsProps) {
  const metrics = useMemo(() => {
    const ltvCacRatio = data.cac > 0 ? data.ltv / data.cac : 0;
    
    return [
      {
        id: "ltv",
        title: "LTV",
        subtitle: "Lifetime Value",
        value: formatCurrency(data.ltv),
        change: calculateChange(data.ltv, data.ltvPreviousPeriod),
        icon: DollarSign,
        tooltip: "Valor médio que um cliente gera durante todo o relacionamento com a empresa",
      },
      {
        id: "cac",
        title: "CAC",
        subtitle: "Custo de Aquisição",
        value: formatCurrency(data.cac),
        change: calculateChange(data.cac, data.cacPreviousPeriod),
        invertColors: true,
        icon: Target,
        tooltip: "Custo médio para adquirir um novo cliente",
      },
      {
        id: "ltv-cac",
        title: "LTV/CAC",
        subtitle: "Proporção",
        value: `${ltvCacRatio.toFixed(1)}x`,
        change: 0,
        icon: TrendingUp,
        tooltip: "Proporção ideal deve ser > 3x para negócios saudáveis",
        highlight: ltvCacRatio >= 3,
        warning: ltvCacRatio < 3,
      },
      {
        id: "mrr",
        title: "MRR",
        subtitle: "Receita Recorrente Mensal",
        value: formatCurrency(data.mrr),
        change: calculateChange(data.mrr, data.mrrPreviousPeriod),
        icon: DollarSign,
        tooltip: "Receita previsível gerada mensalmente",
      },
      {
        id: "churn",
        title: "Churn",
        subtitle: "Taxa de Cancelamento",
        value: formatPercentage(data.churnRate),
        change: calculateChange(data.churnRate, data.churnRatePreviousPeriod),
        invertColors: true,
        icon: Users,
        tooltip: "Percentual de clientes que cancelaram no período",
        warning: data.churnRate > 5,
      },
      {
        id: "nps",
        title: "NPS",
        subtitle: "Net Promoter Score",
        value: data.nps.toString(),
        change: calculateChange(data.nps, data.npsPreviousPeriod),
        icon: Target,
        tooltip: "Índice de satisfação e probabilidade de recomendação (-100 a 100)",
        highlight: data.nps >= 70,
      },
    ];
  }, [data]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Título da seção */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">KPIs Estratégicos</h2>
            <p className="text-sm text-muted-foreground">
              Métricas avançadas de Business Intelligence
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Atualizado agora
          </Badge>
        </div>

        {/* Grid de KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, idx) => {
            const trend = getTrendIcon(metric.change, metric.invertColors);
            const TrendIcon = trend.icon;

            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
                      metric.highlight ? "ring-2 ring-green-500/50" : 
                      metric.warning ? "ring-2 ring-yellow-500/50" : ""
                    }`}>
                      {/* Warning indicator */}
                      {metric.warning && (
                        <div className="absolute top-3 right-3">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </div>
                      )}
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${metric.highlight ? "bg-green-500/10" : "bg-primary/10"}`}>
                            <metric.icon className={`h-4 w-4 ${metric.highlight ? "text-green-600" : "text-primary"}`} />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium">
                              {metric.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {metric.subtitle}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-foreground">
                            {metric.value}
                          </span>
                          
                          {metric.change !== 0 && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trend.bg} ${trend.color}`}>
                              <TrendIcon className="h-3 w-3" />
                              {Math.abs(metric.change).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{metric.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            );
          })}
        </div>

        {/* Métricas adicionais em linha */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* ARR */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">ARR</span>
                <Badge variant="secondary">Anual</Badge>
              </div>
              <p className="text-xl font-bold">{formatCurrency(data.arr)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Receita Recorrente Anual
              </p>
            </CardContent>
          </Card>

          {/* Active Users Rate */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Usuários Ativos</span>
                <span className="text-sm font-medium">
                  {data.activeUsers}/{data.totalUsers}
                </span>
              </div>
              <Progress 
                value={(data.activeUsers / data.totalUsers) * 100} 
                className="h-2 mb-2"
              />
              <p className="text-xs text-muted-foreground">
                {((data.activeUsers / data.totalUsers) * 100).toFixed(1)}% de engajamento
              </p>
            </CardContent>
          </Card>

          {/* Revenue per User */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Receita/Usuário</span>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-bold">{formatCurrency(data.revenuePerUser)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Média por usuário ativo
              </p>
            </CardContent>
          </Card>

          {/* Retention Rate */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Retenção</span>
                <Badge 
                  variant={data.retentionRate >= 80 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {data.retentionRate >= 80 ? "Saudável" : "Atenção"}
                </Badge>
              </div>
              <p className="text-xl font-bold">{formatPercentage(data.retentionRate)}</p>
              <Progress 
                value={data.retentionRate} 
                className={`h-2 mt-2 ${data.retentionRate >= 80 ? "" : "[&>div]:bg-yellow-500"}`}
              />
            </CardContent>
          </Card>
        </div>

        {/* Churn Prediction Alert */}
        {data.churnRate > 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">
                  Atenção: Taxa de Churn Elevada
                </h4>
                <p className="text-sm text-yellow-600/80 dark:text-yellow-300/80 mt-1">
                  A taxa de cancelamento está acima do ideal (5%). 
                  Considere analisar os motivos de cancelamento e implementar 
                  ações de retenção.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}
