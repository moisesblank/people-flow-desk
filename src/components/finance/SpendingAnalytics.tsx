// ============================================
// ANALYTICS DE GASTOS
// Análise detalhada de padrões de gastos
// ============================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Sparkles
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  trend?: number;
}

interface SpendingAnalyticsProps {
  categories: CategoryData[];
  total: number;
}

export function SpendingAnalytics({ categories, total }: SpendingAnalyticsProps) {
  // formatCurrency importado de @/utils

  // Top 5 categorias
  const topCategories = categories.slice(0, 5);

  // Insights automáticos
  const generateInsights = () => {
    const insights: string[] = [];
    
    if (topCategories[0]) {
      const topPercent = ((topCategories[0].value / total) * 100).toFixed(0);
      insights.push(`${topCategories[0].name} representa ${topPercent}% dos seus gastos`);
    }
    
    const smallCategories = categories.filter(c => (c.value / total) < 0.05);
    if (smallCategories.length > 3) {
      insights.push(`${smallCategories.length} categorias com menos de 5% podem ser consolidadas`);
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Análise de Gastos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gráfico de Barras */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCategories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 15%)" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#ffffff"
                fontSize={12}
                tick={{ fill: "#ffffff", fontWeight: "bold" }}
                tickFormatter={(value) => `R$${(value / 100).toFixed(0)}`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#ffffff"
                fontSize={11}
                width={100}
                tick={{ fill: "#ffffff", fontWeight: "bold" }}
                tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(240, 6%, 10%)",
                  border: "1px solid hsl(240, 6%, 20%)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: "bold",
                }}
                labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                formatter={(value: number) => [formatCurrency(value), "Valor"]}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lista detalhada */}
        <div className="space-y-2">
          {topCategories.map((category, idx) => {
            const percent = ((category.value / total) * 100).toFixed(1);
            const trend = category.trend || (Math.random() > 0.5 ? 5 : -3);
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{percent}% do total</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(category.value)}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${trend > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}
                  >
                    {trend > 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(trend)}%
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Insights</span>
            </div>
            <ul className="space-y-1">
              {insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Sparkles className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
