// ============================================
// GRÁFICO DE HISTÓRICO FINANCEIRO
// Balanço visual por período (50+ anos)
// ============================================

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PeriodFilter } from "@/hooks/useFinancialHistory";

interface ChartDataPoint {
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface FinancialHistoryChartProps {
  data: ChartDataPoint[];
  period: PeriodFilter;
  tendencia: "up" | "down" | "stable";
  variacaoPercent: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getPeriodLabel(period: PeriodFilter): string {
  switch (period) {
    case "diario": return "Hoje";
    case "semanal": return "Esta Semana";
    case "mensal": return "Este Mês";
    case "anual": return "Este Ano";
    case "10anos": return "Últimos 10 Anos";
    default: return "Período";
  }
}

export function FinancialHistoryChart({ data, period, tendencia, variacaoPercent }: FinancialHistoryChartProps) {
  const TrendIcon = tendencia === "up" ? TrendingUp : tendencia === "down" ? TrendingDown : Minus;
  const trendColor = tendencia === "up" ? "text-destructive" : tendencia === "down" ? "text-green-500" : "text-muted-foreground";

  // Calcular totais do período
  const totals = useMemo(() => {
    const receitas = data.reduce((acc, d) => acc + d.receitas, 0);
    const despesas = data.reduce((acc, d) => acc + d.despesas, 0);
    const saldo = receitas - despesas;
    return { receitas, despesas, saldo };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          Sem dados para exibir neste período
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Evolução Financeira - {getPeriodLabel(period)}
            </CardTitle>
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {variacaoPercent > 0 ? "+" : ""}{variacaoPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* Mini resumo do período */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-2 rounded-lg bg-green-500/10">
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="text-sm font-bold text-green-500">{formatCurrency(totals.receitas)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-destructive/10">
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="text-sm font-bold text-destructive">{formatCurrency(totals.despesas)}</p>
            </div>
            <div className={`text-center p-2 rounded-lg ${totals.saldo >= 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-sm font-bold ${totals.saldo >= 0 ? "text-green-500" : "text-destructive"}`}>
                {formatCurrency(totals.saldo)}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <Tabs defaultValue="area" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="area">Área</TabsTrigger>
              <TabsTrigger value="bars">Barras</TabsTrigger>
            </TabsList>
            
            <TabsContent value="area">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#ffffff" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: "#ffffff", fontWeight: "bold" }}
                    />
                    <YAxis 
                      stroke="#ffffff" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fill: "#ffffff", fontWeight: "bold" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                        color: "#ffffff",
                        fontWeight: "bold",
                      }}
                      labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "receitas" ? "Receitas" : name === "despesas" ? "Despesas" : "Saldo"
                      ]}
                    />
                    <Legend 
                      formatter={(value) => (
                        <span className="text-white font-bold text-xs">
                          {value === "receitas" ? "Receitas" : value === "despesas" ? "Despesas" : "Saldo"}
                        </span>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="receitas"
                      stroke="hsl(152, 76%, 47%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReceitas)"
                    />
                    <Area
                      type="monotone"
                      dataKey="despesas"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorDespesas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="bars">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#ffffff" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: "#ffffff", fontWeight: "bold" }}
                    />
                    <YAxis 
                      stroke="#ffffff" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fill: "#ffffff", fontWeight: "bold" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        color: "#ffffff",
                        fontWeight: "bold",
                      }}
                      labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "receitas" ? "Receitas" : name === "despesas" ? "Despesas" : "Saldo"
                      ]}
                    />
                    <Legend 
                      formatter={(value) => (
                        <span className="text-white font-bold text-xs">
                          {value === "receitas" ? "Receitas" : value === "despesas" ? "Despesas" : "Saldo"}
                        </span>
                      )}
                    />
                    <Bar dataKey="receitas" fill="hsl(152, 76%, 47%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
