// ============================================
// PLANILHA VIVA - WIDGET DE KPIs REATIVOS
// KPIs com atualização em tempo real
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Percent,
  Users,
  ShoppingCart,
  CheckSquare,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  useReactiveFinance, 
  useReactiveKPIs, 
  useReactiveContadores 
} from "@/contexts/ReactiveFinanceContext";
import { ReactiveConnectionIndicator } from "./ReactiveConnectionIndicator";
import { cn } from "@/lib/utils";

export function ReactiveKPIsWidget() {
  const { formatCurrency, formatPercent } = useReactiveFinance();
  const kpis = useReactiveKPIs();
  const contadores = useReactiveContadores();

  const kpiItems = [
    {
      label: "Taxa de Economia",
      value: kpis.taxaEconomia,
      displayValue: kpis.taxaEconomiaFormatada,
      icon: Percent,
      color: kpis.taxaEconomia > 20 ? "green" : kpis.taxaEconomia > 0 ? "gold" : "red",
      progress: Math.min(Math.max(kpis.taxaEconomia, 0), 100),
    },
    {
      label: "Margem de Lucro",
      value: kpis.margemLucro,
      displayValue: kpis.margemLucroFormatada,
      icon: TrendingUp,
      color: kpis.margemLucro > 0 ? "green" : "red",
      progress: Math.min(Math.max(kpis.margemLucro + 50, 0), 100), // Normalizado
    },
    {
      label: "Progresso da Meta",
      value: kpis.progressoMeta,
      displayValue: kpis.progressoMetaFormatado,
      icon: Target,
      color: kpis.progressoMeta >= 100 ? "green" : kpis.progressoMeta >= 70 ? "gold" : "red",
      progress: kpis.progressoMeta,
    },
  ];

  const colorClasses: Record<string, { text: string; bg: string; border: string }> = {
    green: {
      text: "text-[hsl(var(--stats-green))]",
      bg: "bg-[hsl(var(--stats-green))]/10",
      border: "border-[hsl(var(--stats-green))]/20",
    },
    gold: {
      text: "text-[hsl(var(--stats-gold))]",
      bg: "bg-[hsl(var(--stats-gold))]/10",
      border: "border-[hsl(var(--stats-gold))]/20",
    },
    red: {
      text: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            KPIs em Tempo Real
          </CardTitle>
          <ReactiveConnectionIndicator size="sm" showLabel={false} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* KPI Cards */}
        {kpiItems.map((kpi, index) => {
          const colors = colorClasses[kpi.color];
          const Icon = kpi.icon;

          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-lg border",
                colors.bg,
                colors.border
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", colors.text)} />
                  <span className="text-sm font-medium">{kpi.label}</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={kpi.value}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className={cn("text-lg font-bold", colors.text)}
                  >
                    {kpi.displayValue}
                  </motion.span>
                </AnimatePresence>
              </div>
              <Progress 
                value={kpi.progress} 
                className="h-1.5"
              />
            </motion.div>
          );
        })}

        {/* Contadores Rápidos */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <Users className="h-4 w-4 mx-auto text-[hsl(var(--stats-blue))] mb-1" />
            <AnimatePresence mode="wait">
              <motion.p 
                key={contadores.alunos}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold"
              >
                {contadores.alunos}
              </motion.p>
            </AnimatePresence>
            <p className="text-[10px] text-muted-foreground">Alunos</p>
          </div>
          
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <ShoppingCart className="h-4 w-4 mx-auto text-[hsl(var(--stats-gold))] mb-1" />
            <AnimatePresence mode="wait">
              <motion.p 
                key={contadores.vendas}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold"
              >
                {contadores.vendas}
              </motion.p>
            </AnimatePresence>
            <p className="text-[10px] text-muted-foreground">Vendas</p>
          </div>
          
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <CheckSquare className="h-4 w-4 mx-auto text-[hsl(var(--stats-purple))] mb-1" />
            <AnimatePresence mode="wait">
              <motion.p 
                key={contadores.tarefasPendentes}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold"
              >
                {contadores.tarefasPendentes}
              </motion.p>
            </AnimatePresence>
            <p className="text-[10px] text-muted-foreground">Tarefas</p>
          </div>
        </div>

        {/* Meta Info */}
        {kpis.faltaParaMeta > 0 && (
          <motion.div 
            className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs text-muted-foreground">Falta para a meta mensal</p>
            <AnimatePresence mode="wait">
              <motion.p 
                key={kpis.faltaParaMeta}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-lg font-bold text-primary"
              >
                {kpis.faltaParaMetaFormatada}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
