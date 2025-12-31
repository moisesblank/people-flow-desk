// =====================================================
// PerformanceCharts - Gráficos de Performance do Aluno
// Radar, Bar e Line charts com Recharts
// CSS-only animations para performance
// =====================================================

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import type { TaxonomyNode, TrendData } from "@/hooks/student-performance";

interface PerformanceChartsProps {
  taxonomyData: TaxonomyNode[];
  trends: TrendData[];
  isLoading: boolean;
  className?: string;
}

export function PerformanceCharts({
  taxonomyData,
  trends,
  isLoading,
  className,
}: PerformanceChartsProps) {
  // Dados para Radar Chart (performance por macro área)
  const radarData = useMemo(() => {
    return taxonomyData.map((node) => ({
      macro: node.name.length > 12 ? node.name.substring(0, 12) + "..." : node.name,
      fullName: node.name,
      accuracy: Math.round(node.accuracyPercent),
      total: node.totalAttempts,
    }));
  }, [taxonomyData]);

  // Dados para Bar Chart (questões por macro)
  const barData = useMemo(() => {
    return taxonomyData
      .map((node) => ({
        macro: node.name.length > 10 ? node.name.substring(0, 10) + "..." : node.name,
        fullName: node.name,
        corretas: node.correctAttempts,
        erradas: node.totalAttempts - node.correctAttempts,
        total: node.totalAttempts,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [taxonomyData]);

  // Dados para Line Chart (tendências)
  const lineData = useMemo(() => {
    // Agrupa trends mostrando evolução: período anterior vs recente
    return trends
      .filter((t) => t.isStatisticallyValid)
      .map((t) => ({
        macro: t.macro.length > 10 ? t.macro.substring(0, 10) + "..." : t.macro,
        fullName: t.macro,
        anterior: Math.round(t.previousAccuracy),
        recente: Math.round(t.recentAccuracy),
        trend: t.trend,
      }));
  }, [trends]);

  const macroColors = [
    "hsl(var(--primary))",
    "hsl(210, 80%, 60%)",
    "hsl(150, 70%, 50%)",
    "hsl(45, 90%, 55%)",
    "hsl(280, 70%, 60%)",
    "hsl(0, 70%, 60%)",
  ];

  if (isLoading) {
    return (
      <div className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (taxonomyData.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {/* Radar Chart - Visão Geral por Área */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Radar de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="macro"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              />
              <Radar
                name="Acertos %"
                dataKey="accuracy"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, "Acertos"]}
                labelFormatter={(label) => {
                  const item = radarData.find((d) => d.macro === label);
                  return item?.fullName || label;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart - Questões por Área */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Questões por Área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                dataKey="macro"
                type="category"
                width={70}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "corretas" ? "Corretas" : "Erradas",
                ]}
                labelFormatter={(label) => {
                  const item = barData.find((d) => d.macro === label);
                  return item?.fullName || label;
                }}
              />
              <Bar
                dataKey="corretas"
                stackId="a"
                fill="hsl(150, 70%, 50%)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="erradas"
                stackId="a"
                fill="hsl(0, 70%, 60%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Line Chart - Tendências Anterior vs Recente */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Evolução (14 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lineData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={lineData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="macro"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === "anterior" ? "Período Anterior" : "Período Recente",
                    ]}
                    labelFormatter={(label) => {
                      const item = lineData.find((d) => d.macro === label);
                      return item?.fullName || label;
                    }}
                  />
                  <Bar dataKey="anterior" fill="hsl(var(--muted-foreground))" name="anterior" />
                  <Bar dataKey="recente" fill="hsl(var(--primary))" name="recente" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Anterior
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Recente
                </div>
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              Dados insuficientes para análise de tendências
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
