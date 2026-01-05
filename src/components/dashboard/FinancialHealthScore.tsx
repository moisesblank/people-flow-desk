// ============================================
// MOISÉS MEDEIROS v8.0 - FINANCIAL HEALTH SCORE
// Score de Saúde Financeira com Indicadores
// ============================================

import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Heart, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Shield,
  Wallet,
  PiggyBank,
  Target
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

interface FinancialHealthProps {
  income: number;
  expenses: number;
  savings: number;
  debts: number;
  emergencyFund: number;
  monthlyGoal: number;
}

interface HealthIndicator {
  name: string;
  score: number;
  status: "excellent" | "good" | "warning" | "critical";
  description: string;
  recommendation?: string;
  icon: any;
}

export function FinancialHealthScore({ 
  income = 0, 
  expenses = 0, 
  savings = 0,
  debts = 0,
  emergencyFund = 0,
  monthlyGoal = 0
}: Partial<FinancialHealthProps>) {
  
  const healthData = useMemo(() => {
    // Calculate individual scores (0-100)
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;
    const debtRatio = income > 0 ? (debts / income) * 100 : 0;
    const goalProgress = monthlyGoal > 0 ? (savings / monthlyGoal) * 100 : 0;
    const emergencyMonths = expenses > 0 ? emergencyFund / expenses : 0;

    // Individual indicator scores
    const indicators: HealthIndicator[] = [
      {
        name: "Taxa de Poupança",
        score: Math.min(savingsRate * 5, 100), // 20% savings = 100 score
        status: savingsRate >= 20 ? "excellent" : savingsRate >= 10 ? "good" : savingsRate >= 5 ? "warning" : "critical",
        description: `${savingsRate.toFixed(1)}% da renda`,
        recommendation: savingsRate < 20 ? "Tente poupar pelo menos 20% da sua renda" : undefined,
        icon: PiggyBank,
      },
      {
        name: "Controle de Gastos",
        score: Math.max(100 - expenseRatio, 0),
        status: expenseRatio <= 70 ? "excellent" : expenseRatio <= 85 ? "good" : expenseRatio <= 95 ? "warning" : "critical",
        description: `${expenseRatio.toFixed(1)}% da renda`,
        recommendation: expenseRatio > 70 ? "Reduza gastos não essenciais" : undefined,
        icon: Wallet,
      },
      {
        name: "Nível de Dívidas",
        score: Math.max(100 - debtRatio * 3, 0),
        status: debtRatio <= 20 ? "excellent" : debtRatio <= 35 ? "good" : debtRatio <= 50 ? "warning" : "critical",
        description: `${debtRatio.toFixed(1)}% da renda`,
        recommendation: debtRatio > 35 ? "Priorize quitar dívidas de juros altos" : undefined,
        icon: Shield,
      },
      {
        name: "Reserva de Emergência",
        score: Math.min(emergencyMonths * 16.67, 100), // 6 months = 100 score
        status: emergencyMonths >= 6 ? "excellent" : emergencyMonths >= 3 ? "good" : emergencyMonths >= 1 ? "warning" : "critical",
        description: `${emergencyMonths.toFixed(1)} meses`,
        recommendation: emergencyMonths < 6 ? "Construa uma reserva de 6 meses de despesas" : undefined,
        icon: Shield,
      },
      {
        name: "Progresso de Metas",
        score: Math.min(goalProgress, 100),
        status: goalProgress >= 100 ? "excellent" : goalProgress >= 75 ? "good" : goalProgress >= 50 ? "warning" : "critical",
        description: `${goalProgress.toFixed(0)}% concluído`,
        recommendation: goalProgress < 75 ? "Aumente as contribuições para suas metas" : undefined,
        icon: Target,
      },
    ];

    // Overall score (weighted average)
    const overallScore = indicators.reduce((sum, ind) => sum + ind.score, 0) / indicators.length;
    
    let overallStatus: "excellent" | "good" | "warning" | "critical";
    if (overallScore >= 80) overallStatus = "excellent";
    else if (overallScore >= 60) overallStatus = "good";
    else if (overallScore >= 40) overallStatus = "warning";
    else overallStatus = "critical";

    return { indicators, overallScore, overallStatus };
  }, [income, expenses, savings, debts, emergencyFund, monthlyGoal]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-[hsl(var(--stats-green))]";
      case "good": return "text-[hsl(var(--stats-blue))]";
      case "warning": return "text-[hsl(var(--stats-gold))]";
      case "critical": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "excellent": return "bg-[hsl(var(--stats-green))]/10";
      case "good": return "bg-[hsl(var(--stats-blue))]/10";
      case "warning": return "bg-[hsl(var(--stats-gold))]/10";
      case "critical": return "bg-destructive/10";
      default: return "bg-muted";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "excellent": return "[&>div]:bg-[hsl(var(--stats-green))]";
      case "good": return "[&>div]:bg-[hsl(var(--stats-blue))]";
      case "warning": return "[&>div]:bg-[hsl(var(--stats-gold))]";
      case "critical": return "[&>div]:bg-destructive";
      default: return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "excellent": return "Excelente";
      case "good": return "Bom";
      case "warning": return "Atenção";
      case "critical": return "Crítico";
      default: return status;
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        {/* Header with Overall Score */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`p-3 rounded-xl ${getStatusBg(healthData.overallStatus)}`}
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Heart className={`h-6 w-6 ${getStatusColor(healthData.overallStatus)}`} />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Saúde Financeira</h3>
              <p className="text-xs text-muted-foreground">Análise completa das suas finanças</p>
            </div>
          </div>
          
          <div className="text-right">
            <motion.div
              className="text-4xl font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <span className={getStatusColor(healthData.overallStatus)}>
                {healthData.overallScore.toFixed(0)}
              </span>
              <span className="text-lg text-muted-foreground">/100</span>
            </motion.div>
            <Badge 
              variant="outline" 
              className={`mt-1 ${getStatusColor(healthData.overallStatus)} border-current`}
            >
              {getStatusLabel(healthData.overallStatus)}
            </Badge>
          </div>
        </div>

        {/* Overall Progress Ring */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-muted stroke-current"
                strokeWidth="8"
                fill="transparent"
                r="54"
                cx="64"
                cy="64"
              />
              <motion.circle
                className={`${getStatusColor(healthData.overallStatus)} stroke-current`}
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                r="54"
                cx="64"
                cy="64"
                initial={{ strokeDashoffset: 339.292 }}
                animate={{ strokeDashoffset: 339.292 * (1 - healthData.overallScore / 100) }}
                style={{ strokeDasharray: 339.292 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className={`text-2xl font-bold ${getStatusColor(healthData.overallStatus)}`}>
                  {healthData.overallScore.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="space-y-4">
          {healthData.indicators.map((indicator, index) => (
            <motion.div
              key={indicator.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${getStatusBg(indicator.status)}`}>
                    <indicator.icon className={`h-3.5 w-3.5 ${getStatusColor(indicator.status)}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{indicator.name}</span>
                  {indicator.recommendation && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{indicator.recommendation}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{indicator.description}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 ${getStatusColor(indicator.status)} border-current`}
                  >
                    {indicator.score.toFixed(0)}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={indicator.score} 
                className={`h-2 ${getProgressColor(indicator.status)}`}
              />
            </motion.div>
          ))}
        </div>

        {/* Recommendations */}
        {healthData.indicators.some(i => i.recommendation) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/50"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--stats-gold))] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-2">Recomendações</h4>
                <ul className="space-y-1.5">
                  {healthData.indicators
                    .filter(i => i.recommendation)
                    .slice(0, 3)
                    .map((indicator, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {indicator.recommendation}
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
