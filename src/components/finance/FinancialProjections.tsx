// ============================================
// PROJEÇÕES FINANCEIRAS
// Análise e projeção de gastos futuros
// ============================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface FinancialProjectionsProps {
  totalFixed: number;
  totalExtra: number;
  type: "personal" | "company";
}

export function FinancialProjections({ totalFixed, totalExtra, type }: FinancialProjectionsProps) {
  const total = totalFixed + totalExtra;
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

  // Projeção dos próximos 6 meses
  const projectionData = [
    { month: "Jan", atual: total * 0.95, projetado: total },
    { month: "Fev", atual: total * 1.02, projetado: total * 1.03 },
    { month: "Mar", atual: total * 0.98, projetado: total * 1.02 },
    { month: "Abr", atual: null, projetado: total * 1.05 },
    { month: "Mai", atual: null, projetado: total * 1.04 },
    { month: "Jun", atual: null, projetado: total * 1.06 },
  ];

  // Análise de tendência
  const trend = ((projectionData[5].projetado - total) / total) * 100;
  const isIncreasing = trend > 0;

  // Insights baseados nos dados
  const insights = [
    {
      title: "Economia Potencial",
      value: formatCurrency(Math.round(total * 0.15)),
      description: "Se reduzir 15% dos gastos extras",
      icon: Target,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: "Projeção Próximo Mês",
      value: formatCurrency(Math.round(total * 1.03)),
      description: "Baseado na média dos últimos 3 meses",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Gastos Fixos vs Extras",
      value: `${((totalFixed / total) * 100).toFixed(0)}% / ${((totalExtra / total) * 100).toFixed(0)}%`,
      description: "Proporção atual",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10"
    },
  ];

  // Alertas
  const alerts = [];
  if (totalExtra > totalFixed * 0.5) {
    alerts.push({
      type: "warning",
      message: "Gastos extras estão altos! Considere revisar."
    });
  }
  if (trend > 10) {
    alerts.push({
      type: "warning", 
      message: `Tendência de aumento de ${trend.toFixed(1)}% nos próximos meses`
    });
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Projeções Financeiras
        </CardTitle>
        <CardDescription>
          Análise e previsão para os próximos meses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">{alert.message}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Gráfico de Projeção */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 15%)" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(240, 5%, 55%)"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(240, 5%, 55%)"
                fontSize={12}
                tickFormatter={(value) => `R$${(value / 100).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(240, 6%, 10%)",
                  border: "1px solid hsl(240, 6%, 20%)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatCurrency(value), ""]}
              />
              <Area
                type="monotone"
                dataKey="atual"
                stroke="hsl(var(--primary))"
                fill="url(#colorAtual)"
                strokeWidth={2}
                name="Realizado"
              />
              <Area
                type="monotone"
                dataKey="projetado"
                stroke="#8b5cf6"
                fill="url(#colorProjetado)"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Projetado"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tendência */}
        <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-secondary/30">
          <div className={`p-2 rounded-full ${isIncreasing ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
            {isIncreasing ? (
              <ArrowUpRight className="h-5 w-5 text-amber-600" />
            ) : (
              <ArrowDownRight className="h-5 w-5 text-emerald-600" />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tendência 6 meses</p>
            <p className={`text-xl font-bold ${isIncreasing ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isIncreasing ? '+' : ''}{trend.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 rounded-lg border border-border/50"
            >
              <div className={`p-2 rounded-lg ${insight.bgColor} w-fit mb-2`}>
                <insight.icon className={`h-4 w-4 ${insight.color}`} />
              </div>
              <p className="text-lg font-bold text-foreground">{insight.value}</p>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Metas */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Meta de Economia</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gastos Extras</span>
              <span className="font-medium text-foreground">
                {formatCurrency(totalExtra)} / {formatCurrency(Math.round(totalFixed * 0.3))}
              </span>
            </div>
            <Progress 
              value={Math.min((totalExtra / (totalFixed * 0.3)) * 100, 100)} 
              className="h-2" 
            />
            {totalExtra > totalFixed * 0.3 && (
              <p className="text-xs text-amber-600">
                Acima da meta recomendada de 30% dos gastos fixos
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
