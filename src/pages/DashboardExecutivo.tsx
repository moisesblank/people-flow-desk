// ============================================
// MOISÉS MEDEIROS v5.0 - Dashboard Executivo
// Curso de Química - Business Intelligence
// Design Futurista Cyber
// ============================================

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Award,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Settings,
  Brain,
  Sparkles,
  Cpu,
  Wifi,
  Shield,
  Clock,
  Eye,
  Globe,
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
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useDashboardStats } from "@/hooks/useDataCache";
import { useReactiveStore } from "@/stores/reactiveStore";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CashFlowForecast } from "@/components/finance/CashFlowForecast";
import { WordPressSiteMonitor } from "@/components/dashboard/WordPressSiteMonitor";

// Cores do design system CYBER
const COLORS = {
  primary: "hsl(348, 75%, 42%)",
  green: "hsl(145, 85%, 45%)",
  blue: "hsl(200, 100%, 55%)",
  gold: "hsl(50, 100%, 55%)",
  purple: "hsl(270, 80%, 55%)",
  red: "hsl(0, 80%, 50%)",
  cyan: "hsl(180, 100%, 50%)",
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

// Componente de KPI Card Avançado
function AdvancedKPICard({
  title,
  value,
  previousValue,
  format: formatFn = (v: number) => v.toString(),
  icon: Icon,
  color,
  trend,
  target,
  description,
}: {
  title: string;
  value: number;
  previousValue?: number;
  format?: (v: number) => string;
  icon: React.ElementType;
  color: string;
  trend?: "up" | "down" | "neutral";
  target?: number;
  description?: string;
}) {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const progress = target ? (value / target) * 100 : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="cyber-card p-6 relative overflow-hidden group"
    >
      {/* Neon border glow on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ 
          boxShadow: `inset 0 0 30px ${color}20, 0 0 20px ${color}10`,
        }}
      />
      
      {/* Scan line effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/10 to-transparent animate-pulse" />
      </div>

      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border border-border/50"
            style={{ backgroundColor: `${color}15`, boxShadow: `0 0 20px ${color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          {previousValue && (
            <Badge
              variant="outline"
              className={`${
                change >= 0 ? "text-stats-green border-stats-green/50 bg-stats-green/10" : "text-destructive border-destructive/50 bg-destructive/10"
              } font-mono`}
            >
              {change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {formatPercent(change)}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-1 font-medium tracking-wide uppercase">{title}</p>
        <p className="text-3xl font-bold text-foreground mb-2 font-cyber tracking-wider">{formatFn(value)}</p>

        {description && <p className="text-xs text-muted-foreground mb-3">{description}</p>}

        {progress !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Meta</span>
              <span className="font-medium font-mono">{progress.toFixed(0)}%</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        )}
      </div>
      
      {/* Corner decorations */}
      <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-accent/30" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-accent/30" />
    </motion.div>
  );
}

// Componente de Gauge Chart
function GaugeChart({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="80" viewBox="0 0 120 80">
        <path
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <motion.path
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference * 0.75}
          initial={{ strokeDashoffset: circumference * 0.75 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <text x="60" y="55" textAnchor="middle" className="text-2xl font-bold fill-foreground">
          {value}
        </text>
        <text x="60" y="70" textAnchor="middle" className="text-xs fill-muted-foreground">
          {label}
        </text>
      </svg>
    </div>
  );
}

export default function DashboardExecutivo() {
  const { data: stats, isLoading, refetch } = useDashboardStats();
  const [period, setPeriod] = useState("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Dados simulados para gráficos
  const revenueData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return {
        month: format(date, "MMM", { locale: ptBR }),
        receita: Math.floor(Math.random() * 5000000) + 2000000,
        despesas: Math.floor(Math.random() * 3000000) + 1000000,
        lucro: Math.floor(Math.random() * 2000000) + 500000,
      };
    });
  }, []);

  const funnelData = [
    { name: "Visitantes", value: 10000, color: COLORS.blue },
    { name: "Leads", value: 3500, color: COLORS.purple },
    { name: "Oportunidades", value: 1200, color: COLORS.gold },
    { name: "Vendas", value: 450, color: COLORS.green },
  ];

  const channelData = [
    { name: "Hotmart", value: 45, color: COLORS.primary },
    { name: "Direto", value: 25, color: COLORS.green },
    { name: "Afiliados", value: 20, color: COLORS.blue },
    { name: "Outros", value: 10, color: COLORS.gold },
  ];

  // Dados reativos do store central
  const reactiveData = useReactiveStore(s => s.data);

  const performanceData = [
    { subject: "Vendas", A: Math.min(100, (reactiveData.vendas_mes / Math.max(1, reactiveData.meta_vendas_mes)) * 100) || 85, fullMark: 100 },
    { subject: "Engajamento", A: 72, fullMark: 100 },
    { subject: "Retenção", A: reactiveData.taxa_retencao || 90, fullMark: 100 },
    { subject: "NPS", A: reactiveData.nps || 78, fullMark: 100 },
    { subject: "ROI", A: Math.min(100, reactiveData.roi) || 65, fullMark: 100 },
    { subject: "Crescimento", A: reactiveData.taxa_crescimento_receita || 82, fullMark: 100 },
  ];

  if (isLoading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 text-primary mx-auto" />
          </motion.div>
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const lucroLiquido = stats.income - stats.personalExpenses - stats.companyExpenses;
  const margemLucro = stats.income > 0 ? (lucroLiquido / stats.income) * 100 : 0;

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-8 gradient-mesh min-h-screen">
      {/* Cyber Grid Overlay */}
      <div className="fixed inset-0 cyber-grid pointer-events-none opacity-30" />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30"
              animate={{
                boxShadow: [
                  "0 0 10px hsl(var(--accent) / 0.2)",
                  "0 0 30px hsl(var(--accent) / 0.4)",
                  "0 0 10px hsl(var(--accent) / 0.2)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Cpu className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold text-accent tracking-widest uppercase">CURSO DE QUÍMICA</span>
            </motion.div>
            
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stats-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-stats-green" />
              </span>
              <span className="text-xs text-stats-green font-medium uppercase tracking-widest">Live</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display tracking-tight">
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Análise avançada de performance e KPIs estratégicos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] bg-card/50 border-border/50 backdrop-blur-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="border-border/50 hover:border-accent hover:text-accent">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button className="cyber-button bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </motion.header>

      {/* KPIs Principais */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdvancedKPICard
          title="Receita Total"
          value={stats.income}
          previousValue={stats.income * 0.92}
          format={formatCurrency}
          icon={DollarSign}
          color={COLORS.green}
          target={stats.income * 1.2}
          description="MRR acumulado do período"
        />
        <AdvancedKPICard
          title="Lucro Líquido"
          value={lucroLiquido}
          previousValue={lucroLiquido * 0.88}
          format={formatCurrency}
          icon={TrendingUp}
          color={lucroLiquido >= 0 ? COLORS.green : COLORS.red}
          description={`Margem: ${margemLucro.toFixed(1)}%`}
        />
        <AdvancedKPICard
          title="Alunos Ativos"
          value={stats.students}
          previousValue={Math.floor(stats.students * 0.95)}
          icon={Users}
          color={COLORS.blue}
          target={stats.students * 1.15}
          description="Base de alunos matriculados"
        />
        <AdvancedKPICard
          title="Afiliados"
          value={stats.affiliates}
          previousValue={Math.floor(stats.affiliates * 0.9)}
          icon={Award}
          color={COLORS.purple}
          description="Rede de parceiros ativos"
        />
      </section>

      {/* Gráficos Principais */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico de Receita */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Evolução Financeira
              </CardTitle>
              <Badge variant="outline" className="text-stats-green border-stats-green/30">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% MoM
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="#ffffff" fontSize={12} tick={{ fill: "#ffffff", fontWeight: "bold" }} />
                <YAxis
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: "#ffffff", fontWeight: "bold" }}
                  tickFormatter={(v) => `${(v / 100000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontWeight: "bold",
                  }}
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke={COLORS.green}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                  name="Receita"
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke={COLORS.red}
                  fillOpacity={1}
                  fill="url(#colorDespesas)"
                  name="Despesas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Performance Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={performanceData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funil e Canais */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funil de Vendas */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnelData.map((item, index) => {
              const prevValue = index > 0 ? funnelData[index - 1].value : item.value;
              const conversionRate = index > 0 ? ((item.value / prevValue) * 100).toFixed(1) : "100";
              const widthPercent = (item.value / funnelData[0].value) * 100;

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{item.value.toLocaleString()}</span>
                      {index > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {conversionRate}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-8 bg-secondary/30 rounded-lg overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-lg"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* Canais de Aquisição */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Canais de Aquisição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={200}>
                <RechartsPie>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {channelData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm flex-1">{item.name}</span>
                    <span className="text-sm font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meu Site - WordPress em Tempo Real */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Meu Site</h2>
            <p className="text-sm text-muted-foreground">Monitoramento em tempo real do WordPress</p>
          </div>
        </div>
        <WordPressSiteMonitor />
      </motion.section>

      {/* Cash Flow Forecast */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowForecast />
        
        {/* Métricas de Saúde */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Métricas de Saúde do Negócio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* KPIs calculados com base nos dados reais do dashboard */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <GaugeChart value={reactiveData.nps || 72} max={100} label="NPS Score" color={COLORS.green} />
              <GaugeChart value={reactiveData.taxa_retencao || 94} max={100} label="Retenção %" color={COLORS.blue} />
              <GaugeChart value={reactiveData.taxa_churn || 6} max={20} label="Churn %" color={COLORS.gold} />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 mt-6">
              <GaugeChart value={Math.round((reactiveData.ltv || 158000) / 10000)} max={200} label="LTV (R$k)" color={COLORS.purple} />
              <GaugeChart value={Math.round((reactiveData.cac || 32000) / 10000)} max={50} label="CAC (R$k)" color={COLORS.primary} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
