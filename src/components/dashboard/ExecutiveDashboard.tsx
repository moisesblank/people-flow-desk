// ============================================
// MOISÉS MEDEIROS v10.0 - DASHBOARD EXECUTIVO
// Visão geral de todas as métricas do sistema
// Exclusivo para Owner: moisesblank@gmail.com
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  TrendingUp,
  BookOpen,
  Trophy,
  Clock,
  Target,
  Zap,
  Crown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Bell,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubspaceQuery, SUBSPACE_CACHE_PROFILES } from "@/hooks/useSubspaceCommunication";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function MetricCard({ title, value, change, icon: Icon, color, subtitle }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn("relative overflow-hidden border-0 shadow-lg", color)}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {change !== undefined && (
                <Badge variant={change >= 0 ? "default" : "destructive"} className="text-xs">
                  {change >= 0 ? "+" : ""}{change}% vs mês anterior
                </Badge>
              )}
            </div>
            <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg", color)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ExecutiveDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all metrics - MIGRADO PARA useSubspaceQuery
  const { data: metrics, isLoading } = useSubspaceQuery(
    ["executive-metrics"],
    async () => {
      // Fetch multiple metrics in parallel
      const [
        studentsResult,
        employeesResult,
        incomeResult,
        coursesResult,
        tasksResult,
        enrollmentsResult,
      ] = await Promise.all([
        supabase.from("students").select("id, status", { count: "exact" }),
        supabase.from("employees").select("id, status", { count: "exact" }),
        supabase.from("income").select("valor"),
        supabase.from("courses").select("id, is_published", { count: "exact" }),
        supabase.from("calendar_tasks").select("id, is_completed", { count: "exact" }),
        supabase.from("enrollments").select("id, status", { count: "exact" }),
      ]);

      const totalIncome = incomeResult.data?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;
      const activeStudents = studentsResult.data?.filter(s => s.status === "ativo").length || 0;
      const activeEmployees = employeesResult.data?.filter(e => e.status === "ativo").length || 0;
      const publishedCourses = coursesResult.data?.filter(c => c.is_published).length || 0;
      const completedTasks = tasksResult.data?.filter(t => t.is_completed).length || 0;

      return {
        totalStudents: studentsResult.count || 0,
        activeStudents,
        totalEmployees: employeesResult.count || 0,
        activeEmployees,
        totalIncome,
        totalCourses: coursesResult.count || 0,
        publishedCourses,
        totalTasks: tasksResult.count || 0,
        completedTasks,
        totalEnrollments: enrollmentsResult.count || 0,
        taskCompletionRate: tasksResult.count 
          ? Math.round((completedTasks / tasksResult.count) * 100) 
          : 0,
      };
    },
    {
      profile: 'dashboard',
      persistKey: 'executive_metrics_v1',
    }
  );

  // Quick stats for the header
  const quickStats = [
    { label: "Receita Total", value: `R$ ${(metrics?.totalIncome || 0).toLocaleString("pt-BR")}` },
    { label: "Alunos Ativos", value: metrics?.activeStudents || 0 },
    { label: "Cursos Publicados", value: metrics?.publishedCourses || 0 },
    { label: "Matrículas", value: metrics?.totalEnrollments || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg animate-god-pulse">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold brand-text">Dashboard Executivo</h1>
              <p className="text-sm text-muted-foreground">
                MODO MASTER • Visão completa do sistema
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">
              {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <p className="text-2xl font-bold">
              {format(currentTime, "HH:mm")}
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2">
            <Shield className="h-4 w-4 mr-2" />
            Owner Access
          </Badge>
        </div>
      </motion.div>

      {/* Quick Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {quickStats.map((stat, index) => (
          <Card key={index} className="bg-gradient-to-br from-card to-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Receita Total"
          value={`R$ ${(metrics?.totalIncome || 0).toLocaleString("pt-BR")}`}
          change={12}
          icon={DollarSign}
          color="from-stats-green/20 to-emerald-500/20"
          subtitle="Todas as entradas"
        />
        <MetricCard
          title="Total de Alunos"
          value={metrics?.totalStudents || 0}
          change={8}
          icon={Users}
          color="from-stats-blue/20 to-blue-500/20"
          subtitle={`${metrics?.activeStudents || 0} ativos`}
        />
        <MetricCard
          title="Cursos"
          value={metrics?.totalCourses || 0}
          icon={BookOpen}
          color="from-stats-purple/20 to-purple-500/20"
          subtitle={`${metrics?.publishedCourses || 0} publicados`}
        />
        <MetricCard
          title="Matrículas"
          value={metrics?.totalEnrollments || 0}
          change={15}
          icon={Trophy}
          color="from-stats-gold/20 to-amber-500/20"
          subtitle="Total de inscrições"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Equipe"
          value={metrics?.totalEmployees || 0}
          icon={Users}
          color="from-primary/20 to-secondary/20"
          subtitle={`${metrics?.activeEmployees || 0} ativos`}
        />
        <MetricCard
          title="Tarefas"
          value={metrics?.totalTasks || 0}
          icon={Target}
          color="from-stats-cyan/20 to-cyan-500/20"
          subtitle={`${metrics?.completedTasks || 0} concluídas`}
        />
        <MetricCard
          title="Taxa de Conclusão"
          value={`${metrics?.taskCompletionRate || 0}%`}
          icon={Activity}
          color="from-stats-wine/20 to-pink-500/20"
          subtitle="Tarefas concluídas"
        />
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Progresso de Tarefas
            </CardTitle>
            <CardDescription>Taxa de conclusão das tarefas do calendário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Concluídas</span>
                <span className="font-medium">{metrics?.taskCompletionRate || 0}%</span>
              </div>
              <Progress value={metrics?.taskCompletionRate || 0} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{metrics?.completedTasks || 0} de {metrics?.totalTasks || 0}</span>
                <span>{(metrics?.totalTasks || 0) - (metrics?.completedTasks || 0)} pendentes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Status dos Cursos
            </CardTitle>
            <CardDescription>Cursos publicados vs em desenvolvimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Publicados</span>
                <span className="font-medium">
                  {metrics?.totalCourses 
                    ? Math.round((metrics.publishedCourses / metrics.totalCourses) * 100) 
                    : 0}%
                </span>
              </div>
              <Progress 
                value={metrics?.totalCourses 
                  ? (metrics.publishedCourses / metrics.totalCourses) * 100 
                  : 0} 
                className="h-3" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{metrics?.publishedCourses || 0} publicados</span>
                <span>{(metrics?.totalCourses || 0) - (metrics?.publishedCourses || 0)} em desenvolvimento</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-stats-gold" />
            Resumo de Atividades
          </CardTitle>
          <CardDescription>Visão geral das operações do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{metrics?.activeStudents || 0}</p>
              <p className="text-xs text-muted-foreground">Alunos Ativos</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-stats-blue" />
              <p className="text-2xl font-bold">{metrics?.publishedCourses || 0}</p>
              <p className="text-xs text-muted-foreground">Cursos Online</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-stats-gold" />
              <p className="text-2xl font-bold">{metrics?.totalEnrollments || 0}</p>
              <p className="text-xs text-muted-foreground">Matrículas</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-stats-green" />
              <p className="text-2xl font-bold">{metrics?.taskCompletionRate || 0}%</p>
              <p className="text-xs text-muted-foreground">Produtividade</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutiveDashboard;
