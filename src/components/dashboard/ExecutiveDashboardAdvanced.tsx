// ============================================
// EMPRESARIAL 2.0 - DASHBOARD EXECUTIVO AVANÇADO
// Métricas preditivas e inteligência de negócios
// Conforme documento AJUDA5
// ============================================

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Brain,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  GraduationCap,
  CreditCard,
  Wallet,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

interface KPIMetric {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  format: "currency" | "number" | "percentage";
  icon: typeof TrendingUp;
  color: string;
  trend: "up" | "down" | "stable";
  target?: number;
  prediction?: number;
}

interface PredictiveInsight {
  id: string;
  type: "opportunity" | "risk" | "trend";
  title: string;
  description: string;
  impact: string;
  confidence: number;
  actionable: boolean;
}

const mockKPIs: KPIMetric[] = [
  {
    id: "revenue",
    title: "Receita Total",
    value: 8500000, // centavos
    previousValue: 7200000,
    format: "currency",
    icon: DollarSign,
    color: "hsl(var(--stats-green))",
    trend: "up",
    target: 10000000,
    prediction: 9200000,
  },
  {
    id: "students",
    title: "Alunos Ativos",
    value: 127,
    previousValue: 98,
    format: "number",
    icon: GraduationCap,
    color: "hsl(var(--stats-blue))",
    trend: "up",
    target: 150,
    prediction: 145,
  },
  {
    id: "profit_margin",
    title: "Margem de Lucro",
    value: 62,
    previousValue: 55,
    format: "percentage",
    icon: Target,
    color: "hsl(var(--stats-purple))",
    trend: "up",
    target: 70,
    prediction: 65,
  },
  {
    id: "conversion",
    title: "Taxa de Conversão",
    value: 8.3,
    previousValue: 6.1,
    format: "percentage",
    icon: Activity,
    color: "hsl(var(--stats-gold))",
    trend: "up",
    target: 10,
    prediction: 9.5,
  },
];

const mockInsights: PredictiveInsight[] = [
  {
    id: "1",
    type: "opportunity",
    title: "Potencial de crescimento detectado",
    description: "Baseado nos padrões de matrícula, o próximo mês terá 23% mais alunos novos.",
    impact: "Aumento de R$ 12.000 em receita",
    confidence: 87,
    actionable: true,
  },
  {
    id: "2",
    type: "risk",
    title: "Despesas acima do esperado",
    description: "As despesas operacionais estão 15% acima da média dos últimos 3 meses.",
    impact: "Redução de R$ 3.500 no lucro",
    confidence: 92,
    actionable: true,
  },
  {
    id: "3",
    type: "trend",
    title: "Engajamento em alta",
    description: "O tempo médio de estudo dos alunos aumentou 40% este mês.",
    impact: "Melhora na retenção e NPS",
    confidence: 78,
    actionable: false,
  },
];

const monthlyData = [
  { month: "Jan", receita: 45000, despesas: 25000, lucro: 20000, alunos: 85 },
  { month: "Fev", receita: 52000, despesas: 28000, lucro: 24000, alunos: 92 },
  { month: "Mar", receita: 48000, despesas: 26000, lucro: 22000, alunos: 89 },
  { month: "Abr", receita: 61000, despesas: 30000, lucro: 31000, alunos: 105 },
  { month: "Mai", receita: 72000, despesas: 32000, lucro: 40000, alunos: 118 },
  { month: "Jun", receita: 85000, despesas: 35000, lucro: 50000, alunos: 127 },
];

const performanceData = [
  { name: "Química Geral", value: 85, fill: "hsl(var(--stats-green))" },
  { name: "Química Orgânica", value: 72, fill: "hsl(var(--stats-blue))" },
  { name: "Físico-Química", value: 68, fill: "hsl(var(--stats-purple))" },
  { name: "Química Analítica", value: 91, fill: "hsl(var(--stats-gold))" },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatValue(value: number, format: KPIMetric["format"]): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percentage":
      return `${value.toFixed(1)}%`;
    default:
      return value.toLocaleString("pt-BR");
  }
}

export function ExecutiveDashboardAdvanced() {
  const [showValues, setShowValues] = useState(true);
  const [period, setPeriod] = useState("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Dashboard Executivo
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão 360° do seu negócio com inteligência preditiva
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowValues(!showValues)}
          >
            {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Button variant="outline" size="sm" className="h-9">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockKPIs.map((kpi, index) => {
          const Icon = kpi.icon;
          const change = ((kpi.value - kpi.previousValue) / kpi.previousValue) * 100;
          const targetProgress = kpi.target ? (kpi.value / kpi.target) * 100 : 0;

          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${kpi.color}20` }}>
                      <Icon className="h-5 w-5" style={{ color: kpi.color }} />
                    </div>
                    <Badge
                      className={`text-xs ${
                        kpi.trend === "up"
                          ? "bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]"
                          : kpi.trend === "down"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {kpi.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      )}
                      {Math.abs(change).toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold" style={{ color: kpi.color }}>
                      {showValues ? formatValue(kpi.value, kpi.format) : "•••••"}
                    </p>
                  </div>

                  {kpi.target && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Meta: {formatValue(kpi.target, kpi.format)}</span>
                        <span>{targetProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(targetProgress, 100)} className="h-1.5" />
                    </div>
                  )}

                  {kpi.prediction && (
                    <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-1 text-xs">
                        <Brain className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">Previsão:</span>
                        <span className="font-medium" style={{ color: kpi.color }}>
                          {showValues ? formatValue(kpi.prediction, kpi.format) : "•••"}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Evolução Financeira
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1 text-primary" />
                Com previsão
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--stats-green))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--stats-green))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--stats-blue))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--stats-blue))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value * 100),
                      "",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="hsl(var(--stats-green))"
                    fillOpacity={1}
                    fill="url(#colorReceita)"
                    name="Receita"
                  />
                  <Area
                    type="monotone"
                    dataKey="lucro"
                    stroke="hsl(var(--stats-blue))"
                    fillOpacity={1}
                    fill="url(#colorLucro)"
                    name="Lucro"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Insights IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3 pr-2">
                {mockInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-xl border ${
                      insight.type === "opportunity"
                        ? "bg-[hsl(var(--stats-green))]/10 border-[hsl(var(--stats-green))]/30"
                        : insight.type === "risk"
                        ? "bg-destructive/10 border-destructive/30"
                        : "bg-[hsl(var(--stats-blue))]/10 border-[hsl(var(--stats-blue))]/30"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          insight.type === "opportunity"
                            ? "bg-[hsl(var(--stats-green))]/20"
                            : insight.type === "risk"
                            ? "bg-destructive/20"
                            : "bg-[hsl(var(--stats-blue))]/20"
                        }`}
                      >
                        {insight.type === "opportunity" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--stats-green))]" />
                        ) : insight.type === "risk" ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <Activity className="h-3.5 w-3.5 text-[hsl(var(--stats-blue))]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-primary">
                            {insight.impact}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-4">
                            {insight.confidence}% confiança
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Performance by Course */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Performance por Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {performanceData.map((course, index) => (
              <motion.div
                key={course.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border border-border/50 bg-muted/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium truncate">{course.name}</span>
                  <Badge
                    className="text-xs"
                    style={{
                      backgroundColor: `${course.fill}20`,
                      color: course.fill,
                    }}
                  >
                    {course.value}%
                  </Badge>
                </div>
                <Progress
                  value={course.value}
                  className="h-2"
                  style={
                    {
                      "--progress-foreground": course.fill,
                    } as React.CSSProperties
                  }
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
