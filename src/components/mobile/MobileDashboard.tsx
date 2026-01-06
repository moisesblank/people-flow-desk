// ============================================
// SYNAPSE v15.0 - Mobile Dashboard ULTRA
// Dashboard ULTRA otimizado para dispositivos móveis
// ============================================

import { useState, useMemo, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils";
import {
  RefreshCw,
  Plus,
  Bell,
  Search,
  ChevronRight,
  Calendar,
  CheckSquare,
  TrendingUp,
  MessageSquare,
  Users,
  DollarSign,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MobileQuickStats } from "./MobileQuickStats";
import { MobileBottomNav } from "./MobileBottomNav";
import { useDashboardStats } from "@/hooks/useDataCache";
import { useAuth } from "@/hooks/useAuth";
import { usePerformance } from "@/hooks/usePerformance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarTask } from "@/types/calendar";

// formatCurrency importado de @/utils

interface QuickAction {
  icon: React.ElementType;
  label: string;
  path: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { icon: Plus, label: "Nova Tarefa", path: "/tarefas", color: "bg-stats-blue" },
  { icon: DollarSign, label: "Lançamento", path: "/lancamento", color: "bg-stats-green" },
  { icon: Calendar, label: "Agenda", path: "/calendario", color: "bg-stats-purple" },
  { icon: MessageSquare, label: "WhatsApp", path: "/central-whatsapp", color: "bg-green-500" },
  { icon: Users, label: "Alunos", path: "/gestaofc/alunos", color: "bg-amber-500" },
];

// Memoized Quick Action Button
const QuickActionButton = memo(function QuickActionButton({
  action,
  index,
  onClick,
  skipAnimations,
}: {
  action: QuickAction;
  index: number;
  onClick: () => void;
  skipAnimations: boolean;
}) {
  const Icon = action.icon;
  
  if (skipAnimations) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 min-w-[72px] active:scale-95 transition-transform"
      >
        <div className={cn("p-3 rounded-2xl text-white shadow-lg", action.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-center whitespace-normal max-w-[72px]">
          {action.label}
        </span>
      </button>
    );
  }
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 min-w-[72px] gpu-accelerate"
      whileTap={{ scale: 0.95 }}
    >
      <div className={cn("p-3 rounded-2xl text-white shadow-lg", action.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-center whitespace-normal max-w-[72px]">
        {action.label}
      </span>
    </motion.button>
  );
});

// Loading skeleton optimized
const MobileLoadingSkeleton = memo(function MobileLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-muted-foreground text-sm">Carregando...</p>
      </div>
    </div>
  );
});

export function MobileDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stats, isLoading, refetch } = useDashboardStats();
  const { shouldReduceMotion, isLowEndDevice, animationDuration } = usePerformance();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const skipAnimations = shouldReduceMotion || isLowEndDevice;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const userName = useMemo(() => 
    user?.email?.split("@")[0] || "Usuário",
    [user?.email]
  );
  
  const today = useMemo(() => 
    format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR }),
    []
  );

  const todayTasks = useMemo((): CalendarTask[] => {
    if (!stats?.tasksData) return [];
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return (stats.tasksData as CalendarTask[])
      .filter((t) => t.task_date === todayStr && !t.is_completed)
      .slice(0, 3);
  }, [stats?.tasksData]);

  // Memoized navigation handlers
  const handleNavigate = useCallback((path: string) => () => navigate(path), [navigate]);

  if (isLoading || !stats) {
    return <MobileLoadingSkeleton />;
  }

  const profit = stats.income - stats.personalExpenses - stats.companyExpenses;
  const expenses = stats.personalExpenses + stats.companyExpenses;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {userName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground capitalize">{today}</p>
              <h1 className="text-lg font-bold">
                {greeting}, {userName}!
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/configuracoes")}>
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground bg-muted/50"
            onClick={() => {
              // Trigger global search
              const searchBtn = document.querySelector('[data-search-button]') as HTMLButtonElement;
              searchBtn?.click();
            }}
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar...
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-6">
        {/* Quick Stats */}
        <MobileQuickStats
          income={stats.income}
          expenses={expenses}
          profit={profit}
          pendingTasks={stats.pendingTasks}
          pendingPayments={stats.pendingPayments}
          students={stats.students}
        />

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            AÇÕES RÁPIDAS
          </h2>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center gap-2 min-w-[72px]"
                  >
                    <div
                      className={`p-3 rounded-2xl ${action.color} text-white shadow-lg`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-center whitespace-normal max-w-[72px]">
                      {action.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Today's Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground px-1">
              TAREFAS DE HOJE
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => navigate("/tarefas")}
            >
              Ver todas
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {todayTasks.length > 0 ? (
            <div className="space-y-2">
              {todayTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  onClick={() => navigate("/tarefas")}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      task.priority === "alta" || task.priority === "high"
                        ? "bg-destructive/10"
                        : task.priority === "media" || task.priority === "normal"
                        ? "bg-amber-500/10"
                        : "bg-muted"
                    }`}
                  >
                    <CheckSquare
                      className={`h-4 w-4 ${
                        task.priority === "alta" || task.priority === "high"
                          ? "text-destructive"
                          : task.priority === "media" || task.priority === "normal"
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    {task.task_time && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.task_time}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      task.priority === "alta" || task.priority === "high"
                        ? "border-destructive/50 text-destructive"
                        : task.priority === "media" || task.priority === "normal"
                        ? "border-amber-500/50 text-amber-600"
                        : "border-border"
                    }
                  >
                    {task.priority || "normal"}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-muted/30 border border-dashed border-border">
              <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Nenhuma tarefa para hoje!
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate("/tarefas")}
                className="mt-1"
              >
                Criar nova tarefa
              </Button>
            </div>
          )}
        </section>

        {/* Financial Overview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground px-1">
              VISÃO FINANCEIRA
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => navigate("/financas-empresa")}
            >
              Detalhes
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                <p
                  className={`text-2xl font-bold ${
                    profit >= 0 ? "text-stats-green" : "text-destructive"
                  }`}
                >
                  {formatCurrency(profit)}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  profit >= 0 ? "bg-stats-green/20" : "bg-destructive/20"
                }`}
              >
                <TrendingUp
                  className={`h-6 w-6 ${
                    profit >= 0 ? "text-stats-green" : "text-destructive"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Entradas</p>
                <p className="text-sm font-semibold text-stats-green">
                  {formatCurrency(stats.income)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Saídas</p>
                <p className="text-sm font-semibold text-destructive">
                  {formatCurrency(expenses)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/relatorios")}
            className="p-4 rounded-2xl bg-card border border-border text-left"
          >
            <TrendingUp className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-sm">Relatórios</p>
            <p className="text-xs text-muted-foreground">Análises detalhadas</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/dashboard-executivo")}
            className="p-4 rounded-2xl bg-card border border-border text-left"
          >
            <Sparkles className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-sm">Executivo</p>
            <p className="text-xs text-muted-foreground">Dashboard completo</p>
          </motion.button>
        </section>
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
