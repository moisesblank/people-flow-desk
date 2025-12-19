// ============================================
// RESUMO ANUAL DE BALANÇO
// Consolidação de todos os meses do ano
// ============================================

import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Calendar, BarChart3, 
  Award, AlertTriangle, PiggyBank 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getMonthName } from "@/hooks/useFinancialHistory";
import { cn } from "@/lib/utils";

interface YearlySummary {
  ano: number;
  receitas_total: number;
  despesas_total: number;
  saldo_anual: number;
  media_receitas_mensal: number;
  media_despesas_mensal: number;
  melhor_mes: number;
  melhor_mes_valor: number;
  pior_mes: number;
  pior_mes_valor: number;
  meses_fechados: number;
}

interface MonthlySnapshot {
  ano: number;
  mes: number;
  receitas_total: number;
  despesas_total: number;
  saldo_periodo: number;
}

interface YearlyBalanceSummaryProps {
  snapshots: MonthlySnapshot[];
  currentYear?: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function YearlyBalanceSummary({ snapshots, currentYear = new Date().getFullYear() }: YearlyBalanceSummaryProps) {
  // Agrupar snapshots por ano
  const yearlyData: Record<number, YearlySummary> = {};

  snapshots.forEach((s) => {
    if (!yearlyData[s.ano]) {
      yearlyData[s.ano] = {
        ano: s.ano,
        receitas_total: 0,
        despesas_total: 0,
        saldo_anual: 0,
        media_receitas_mensal: 0,
        media_despesas_mensal: 0,
        melhor_mes: 0,
        melhor_mes_valor: -Infinity,
        pior_mes: 0,
        pior_mes_valor: Infinity,
        meses_fechados: 0,
      };
    }

    yearlyData[s.ano].receitas_total += s.receitas_total;
    yearlyData[s.ano].despesas_total += s.despesas_total;
    yearlyData[s.ano].saldo_anual += s.saldo_periodo;
    yearlyData[s.ano].meses_fechados += 1;

    if (s.saldo_periodo > yearlyData[s.ano].melhor_mes_valor) {
      yearlyData[s.ano].melhor_mes_valor = s.saldo_periodo;
      yearlyData[s.ano].melhor_mes = s.mes;
    }
    if (s.saldo_periodo < yearlyData[s.ano].pior_mes_valor) {
      yearlyData[s.ano].pior_mes_valor = s.saldo_periodo;
      yearlyData[s.ano].pior_mes = s.mes;
    }
  });

  // Calcular médias
  Object.values(yearlyData).forEach((y) => {
    if (y.meses_fechados > 0) {
      y.media_receitas_mensal = y.receitas_total / y.meses_fechados;
      y.media_despesas_mensal = y.despesas_total / y.meses_fechados;
    }
  });

  const sortedYears = Object.values(yearlyData).sort((a, b) => b.ano - a.ano);

  if (sortedYears.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum balanço anual disponível</p>
          <p className="text-sm mt-1">Os dados aparecerão conforme os meses forem registrados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedYears.map((year, index) => {
        const isPositive = year.saldo_anual >= 0;
        const percentUsed = year.receitas_total > 0 
          ? Math.min((year.despesas_total / year.receitas_total) * 100, 100) 
          : 0;

        return (
          <motion.div
            key={year.ano}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "glass-card overflow-hidden",
              year.ano === currentYear && "ring-2 ring-primary/50"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Balanço Anual {year.ano}
                    {year.ano === currentYear && (
                      <Badge variant="default" className="text-xs">Atual</Badge>
                    )}
                  </CardTitle>
                  <div className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold",
                    isPositive ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                  )}>
                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {formatCurrency(year.saldo_anual)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Grid de Valores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-500/10">
                    <p className="text-xs text-muted-foreground">Receitas</p>
                    <p className="text-lg font-bold text-green-500">{formatCurrency(year.receitas_total)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-destructive/10">
                    <p className="text-xs text-muted-foreground">Despesas</p>
                    <p className="text-lg font-bold text-destructive">{formatCurrency(year.despesas_total)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/10">
                    <p className="text-xs text-muted-foreground">Média/Mês (Receita)</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(year.media_receitas_mensal)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Média/Mês (Despesa)</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(year.media_despesas_mensal)}</p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Utilização das Receitas</span>
                    <span>{percentUsed.toFixed(1)}%</span>
                  </div>
                  <Progress value={percentUsed} className="h-2" />
                </div>

                {/* Melhor e Pior Mês */}
                <div className="grid grid-cols-2 gap-4">
                  {year.melhor_mes > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <Award className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Melhor Mês</p>
                        <p className="font-medium">{getMonthName(year.melhor_mes)}</p>
                        <p className="text-sm text-green-500 font-bold">
                          {formatCurrency(year.melhor_mes_valor)}
                        </p>
                      </div>
                    </div>
                  )}
                  {year.pior_mes > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pior Mês</p>
                        <p className="font-medium">{getMonthName(year.pior_mes)}</p>
                        <p className="text-sm text-destructive font-bold">
                          {formatCurrency(year.pior_mes_valor)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Meses Registrados */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <PiggyBank className="h-4 w-4" />
                  <span>{year.meses_fechados} meses registrados</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
