// =====================================================
// StudentPerformanceAnalytics - Métricas de Desempenho do Aluno
// Gráficos e Tabelas por Macro, Micro e Tema
// Design: Year 2300 Futuristic
// =====================================================

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  useStudentTaxonomyPerformance, 
  useStudentPerformanceStats,
  type TaxonomyNode 
} from "@/hooks/student-performance";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { BarChart3, Target, TrendingUp, Award, Zap, BookOpen } from "lucide-react";

// Cores para os gráficos - palette futurista
const CHART_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#6366f1", // indigo
];

// Função para cor de acurácia
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return "text-emerald-500";
  if (accuracy >= 50) return "text-amber-500";
  return "text-rose-500";
}

function getAccuracyBg(accuracy: number): string {
  if (accuracy >= 70) return "bg-emerald-500";
  if (accuracy >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

// =====================================================
// Cards de Resumo (4 métricas principais)
// =====================================================
interface StatsCardsProps {
  totalQuestions: number;
  totalCorrect: number;
  totalErrors: number;
  overallAccuracy: number;
  isLoading: boolean;
}

function StatsCards({ totalQuestions, totalCorrect, totalErrors, overallAccuracy, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    { 
      label: "Total de Questões", 
      value: totalQuestions, 
      color: "from-blue-500 to-blue-600",
      icon: BookOpen 
    },
    { 
      label: "Total de Acertos", 
      value: totalCorrect, 
      color: "from-emerald-500 to-emerald-600",
      icon: Target 
    },
    { 
      label: "Total de Erros", 
      value: totalErrors, 
      color: "from-rose-500 to-rose-600",
      icon: TrendingUp 
    },
    { 
      label: "% de Acerto Geral", 
      value: `${overallAccuracy.toFixed(1)}%`, 
      color: "from-violet-500 to-purple-600",
      icon: Award 
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={cn(
              "relative overflow-hidden rounded-xl p-4",
              "bg-gradient-to-br",
              card.color,
              "text-white shadow-lg"
            )}
          >
            <div className="absolute top-2 right-2 opacity-20">
              <Icon className="w-10 h-10" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold">
              {typeof card.value === 'number' ? card.value.toLocaleString('pt-BR') : card.value}
            </div>
            <div className="text-xs sm:text-sm opacity-90 mt-1">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// Tabela de Performance por Nível
// =====================================================
interface PerformanceTableProps {
  title: string;
  data: Array<{
    name: string;
    total: number;
    correct: number;
    errors: number;
    accuracy: number;
  }>;
  isLoading: boolean;
}

function PerformanceTable({ title, data, isLoading }: PerformanceTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm py-8">
          Nenhum dado disponível
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-[1fr_60px_60px_70px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/50 bg-muted/30">
          <span>Área</span>
          <span className="text-center">Total</span>
          <span className="text-center">Erros</span>
          <span className="text-right">%</span>
        </div>
        
        {/* Rows */}
        <div className="max-h-[300px] overflow-y-auto">
          {data.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_60px_60px_70px] gap-2 px-4 py-2.5 text-sm border-b border-border/30 hover:bg-muted/30 transition-colors"
            >
              <span className="truncate font-medium">{row.name}</span>
              <span className="text-center">
                <span className="inline-flex items-center justify-center min-w-[32px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                  {row.total}
                </span>
              </span>
              <span className="text-center">
                <span className="inline-flex items-center justify-center min-w-[32px] px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded text-xs font-medium">
                  {row.errors}
                </span>
              </span>
              <span className="text-right flex items-center justify-end gap-1.5">
                <span className={cn("font-bold text-xs", getAccuracyColor(row.accuracy))}>
                  {row.accuracy.toFixed(1)}%
                </span>
                <div className={cn("w-1.5 h-4 rounded-full", getAccuracyBg(row.accuracy))} />
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Gráfico de Barras - Total vs Acertos
// =====================================================
interface BarChartCardProps {
  data: Array<{ name: string; total: number; correct: number }>;
  isLoading: boolean;
}

function BarChartCard({ data, isLoading }: BarChartCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Total vs Acertos por Macro
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm py-8">
          Nenhum dado disponível
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 6).map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
    Total: d.total,
    Acertos: d.correct,
  }));

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Total vs Acertos por Macro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }} 
            />
            <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Acertos" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Gráfico de Pizza - Distribuição de Erros
// =====================================================
interface PieChartCardProps {
  data: Array<{ name: string; errors: number }>;
  isLoading: boolean;
}

function PieChartCard({ data, isLoading }: PieChartCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const pieData = data
    .filter(d => d.errors > 0)
    .slice(0, 6)
    .map(d => ({
      name: d.name.length > 15 ? d.name.slice(0, 15) + '...' : d.name,
      value: d.errors,
    }));

  if (pieData.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Distribuição de Erros
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm py-8">
          Nenhum erro registrado 🎉
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Distribuição de Erros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }} 
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px' }}
              formatter={(value) => <span className="text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Gráfico de Barras Horizontal - Top 10 Rendimento
// =====================================================
interface HorizontalBarChartProps {
  data: Array<{ name: string; accuracy: number }>;
  isLoading: boolean;
}

function HorizontalBarChart({ data, isLoading }: HorizontalBarChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 col-span-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 col-span-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Top 10 - Rendimento por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm py-8">
          Nenhum dado disponível
        </CardContent>
      </Card>
    );
  }

  const top10 = data.slice(0, 10).map(d => ({
    name: d.name.length > 20 ? d.name.slice(0, 20) + '...' : d.name,
    Rendimento: d.accuracy,
  }));

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Top 10 - Rendimento por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={top10} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              width={75}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Rendimento']}
            />
            <Bar 
              dataKey="Rendimento" 
              fill="#3b82f6" 
              radius={[0, 4, 4, 0]}
              label={{ 
                position: 'right', 
                fill: 'hsl(var(--muted-foreground))', 
                fontSize: 10,
                formatter: (v: number) => `${v.toFixed(1)}%`
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Componente Principal
// =====================================================
export function StudentPerformanceAnalytics() {
  const { user } = useAuth();
  
  const { data: taxonomyData, isLoading: taxonomyLoading } = useStudentTaxonomyPerformance(user?.id);
  const { data: stats, isLoading: statsLoading } = useStudentPerformanceStats(user?.id);

  const isLoading = taxonomyLoading || statsLoading;

  // Processar dados para tabelas e gráficos
  const processedData = useMemo(() => {
    if (!taxonomyData?.array) {
      return {
        macroData: [],
        microData: [],
        temaData: [],
        totalQuestions: 0,
        totalCorrect: 0,
        totalErrors: 0,
        overallAccuracy: 0,
      };
    }

    const macroData: Array<{ name: string; total: number; correct: number; errors: number; accuracy: number }> = [];
    const microData: Array<{ name: string; total: number; correct: number; errors: number; accuracy: number }> = [];
    const temaData: Array<{ name: string; total: number; correct: number; errors: number; accuracy: number }> = [];

    let totalQuestions = 0;
    let totalCorrect = 0;

    // Iterar pela árvore de taxonomia
    taxonomyData.array.forEach((macroNode) => {
      totalQuestions += macroNode.totalAttempts;
      totalCorrect += macroNode.correctAttempts;

      macroData.push({
        name: macroNode.name,
        total: macroNode.totalAttempts,
        correct: macroNode.correctAttempts,
        errors: macroNode.totalAttempts - macroNode.correctAttempts,
        accuracy: macroNode.accuracyPercent,
      });

      // Micros
      macroNode.children.forEach((microNode) => {
        microData.push({
          name: microNode.name,
          total: microNode.totalAttempts,
          correct: microNode.correctAttempts,
          errors: microNode.totalAttempts - microNode.correctAttempts,
          accuracy: microNode.accuracyPercent,
        });

        // Temas
        microNode.children.forEach((temaNode) => {
          temaData.push({
            name: temaNode.name,
            total: temaNode.totalAttempts,
            correct: temaNode.correctAttempts,
            errors: temaNode.totalAttempts - temaNode.correctAttempts,
            accuracy: temaNode.accuracyPercent,
          });
        });
      });
    });

    // Ordenar por total (mais respondidas primeiro)
    macroData.sort((a, b) => b.total - a.total);
    microData.sort((a, b) => b.total - a.total);
    temaData.sort((a, b) => b.total - a.total);

    const totalErrors = totalQuestions - totalCorrect;
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return {
      macroData,
      microData,
      temaData,
      totalQuestions,
      totalCorrect,
      totalErrors,
      overallAccuracy,
    };
  }, [taxonomyData]);

  // Se não tem dados e não está carregando, não renderizar
  if (!isLoading && processedData.totalQuestions === 0) {
    return (
      <div className="mt-8 pt-8 border-t border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Análise por Áreas</h2>
            <p className="text-xs text-muted-foreground">
              Onde você mais erra e precisa focar os estudos
            </p>
          </div>
        </div>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Responda questões para ver suas métricas de desempenho aqui
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-8 border-t border-border/50 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Análise por Áreas</h2>
          <p className="text-xs text-muted-foreground">
            Onde você mais erra e precisa focar os estudos
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <StatsCards
        totalQuestions={processedData.totalQuestions}
        totalCorrect={processedData.totalCorrect}
        totalErrors={processedData.totalErrors}
        overallAccuracy={processedData.overallAccuracy}
        isLoading={isLoading}
      />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartCard 
          data={processedData.macroData} 
          isLoading={isLoading} 
        />
        <PieChartCard 
          data={processedData.macroData} 
          isLoading={isLoading} 
        />
      </div>

      {/* Top 10 Rendimento */}
      <HorizontalBarChart 
        data={processedData.macroData} 
        isLoading={isLoading} 
      />

      {/* Tabelas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PerformanceTable
          title="Macro Assuntos"
          data={processedData.macroData}
          isLoading={isLoading}
        />
        <PerformanceTable
          title="Micro Assuntos"
          data={processedData.microData.slice(0, 15)}
          isLoading={isLoading}
        />
        <PerformanceTable
          title="Temas"
          data={processedData.temaData.slice(0, 15)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
