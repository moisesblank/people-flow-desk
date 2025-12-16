// ============================================
// MOISÉS MEDEIROS v9.0 - DASHBOARD PRINCIPAL
// SYNAPSE v14.0 + UPGRADE v10 - MELHORADO
// Central de Comando - Business Intelligence
// UX Focada na Organização e Produtividade
// ============================================

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Building2,
  GraduationCap,
  Handshake,
  Sparkles,
  Calendar,
  CreditCard,
  Globe,
  CheckSquare,
  Download,
  Brain,
  Zap,
  Bot,
  Clock,
  FlaskConical,
  Atom,
  LayoutDashboard,
  ArrowUpRight
} from "lucide-react";
import { StatCard } from "@/components/employees/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { BudgetAlerts } from "@/components/dashboard/BudgetAlerts";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { RealtimePulse } from "@/components/dashboard/RealtimePulse";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { AdvancedKPIs } from "@/components/dashboard/AdvancedKPIs";
import { WeeklyInsights } from "@/components/dashboard/WeeklyInsights";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { SynapseStatusWidget } from "@/components/dashboard/SynapseStatusWidget";
import { ChemistryStats, ElementsGrid } from "@/components/dashboard/ChemistryStats";
import { AnimatedAtom, ChemistryTip } from "@/components/chemistry/ChemistryVisuals";
import { LoadingState, StatsSkeleton } from "@/components/LoadingState";
import { ExportButton } from "@/components/ExportButton";
import { AITutor } from "@/components/ai/AITutor";
import { AITramon } from "@/components/ai/AITramon";
import { QuizListWidget } from "@/components/lms/QuizListWidget";
import { SecurityStatusWidget } from "@/components/security/SecurityStatusWidget";
import { GuidedTour, useTour, dashboardTourSteps } from "@/components/onboarding/GuidedTour";
import { TasksOverviewWidget } from "@/components/dashboard/TasksOverviewWidget";

import { LabStatusWidget } from "@/components/dashboard/LabStatusWidget";
import { AdvancedAnalytics } from "@/components/dashboard/AdvancedAnalytics";
import { AutomationRules } from "@/components/dashboard/AutomationRules";
import { FinancialHealthScore } from "@/components/dashboard/FinancialHealthScore";
import { FinancialGoalsWidget } from "@/components/dashboard/FinancialGoalsWidget";
import { FinancialInsights } from "@/components/dashboard/FinancialInsights";
import { QuickActions } from "@/components/dashboard/QuickActions";
// NEW: Componentes de UX melhorados
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { FinancialOverview } from "@/components/dashboard/FinancialOverview";
import { TodayAgenda } from "@/components/dashboard/TodayAgenda";
import { GoalsProgress } from "@/components/dashboard/GoalsProgress";
import { TeamSummary } from "@/components/dashboard/TeamSummary";
import { SmartTips } from "@/components/dashboard/SmartTips";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDataCache";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Clock className="h-4 w-4 text-primary" />
      <div className="flex flex-col items-end">
        <span className="text-lg font-mono font-bold text-foreground">
          {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span className="text-xs text-muted-foreground">
          {time.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
        </span>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { data: stats, isLoading, error } = useDashboardStats();
  const [showAITutor, setShowAITutor] = useState(false);
  const [showTramon, setShowTramon] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { isOpen: showTour, completeTour, resetTour } = useTour("dashboard");
  const processedData = useMemo(() => {
    if (!stats) return null;

    // Process category data for pie chart
    const categoryMap: { [key: string]: number } = {};
    stats.personalExtraData?.forEach((expense: any) => {
      const cat = expense.categoria || "outros";
      categoryMap[cat] = (categoryMap[cat] || 0) + (expense.valor || 0);
    });

    const categoryColors: { [key: string]: string } = {
      feira: "hsl(152, 76%, 47%)",
      compras_casa: "hsl(212, 96%, 60%)",
      compras_bruna: "hsl(348, 70%, 50%)",
      compras_moises: "hsl(262, 83%, 58%)",
      cachorro: "hsl(45, 93%, 47%)",
      carro: "hsl(200, 80%, 50%)",
      gasolina: "hsl(30, 90%, 50%)",
      lanches: "hsl(320, 70%, 50%)",
      comida: "hsl(100, 70%, 45%)",
      casa: "hsl(180, 70%, 45%)",
      pessoal: "hsl(280, 70%, 50%)",
      transporte: "hsl(220, 80%, 55%)",
      lazer: "hsl(350, 80%, 55%)",
      outros: "hsl(240, 5%, 45%)",
    };

    const categoryLabels: { [key: string]: string } = {
      feira: "Feira",
      compras_casa: "Casa",
      compras_bruna: "Bruna",
      compras_moises: "Moisés",
      cachorro: "Cachorro",
      carro: "Carro",
      gasolina: "Gasolina",
      lanches: "Lanches",
      comida: "Comida",
      casa: "Casa",
      pessoal: "Pessoal",
      transporte: "Transporte",
      lazer: "Lazer",
      outros: "Outros",
    };

    const categoryData = Object.entries(categoryMap).map(([key, value]) => ({
      name: categoryLabels[key] || key,
      value,
      color: categoryColors[key] || "hsl(240, 5%, 45%)",
    }));

    // Generate monthly data for chart
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        receitas: Math.floor(Math.random() * 5000000) + 1000000,
        despesas: Math.floor(Math.random() * 3000000) + 500000,
      });
    }
    months[5] = {
      month: format(new Date(), "MMM", { locale: ptBR }),
      receitas: stats.income,
      despesas: stats.personalExpenses + stats.companyExpenses,
    };

    // Recent transactions
    const transactions: any[] = [];
    stats.incomeData?.slice(0, 3).forEach((inc: any) => {
      transactions.push({
        id: `inc-${Math.random()}`,
        type: "income",
        description: inc.fonte,
        amount: inc.valor,
        date: new Date(inc.created_at || new Date()),
      });
    });
    stats.personalExtraData?.slice(0, 3).forEach((exp: any) => {
      transactions.push({
        id: `exp-${Math.random()}`,
        type: "expense",
        description: exp.nome,
        amount: exp.valor,
        date: new Date(exp.created_at || new Date()),
      });
    });
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Budget alerts
    const totalExpenses = stats.personalExpenses + stats.companyExpenses;
    const alerts: any[] = [];
    
    if (totalExpenses > stats.income * 0.8) {
      alerts.push({
        id: "1",
        type: "warning",
        title: "Gastos elevados",
        message: "Seus gastos estão acima de 80% das receitas deste mês.",
      });
    }
    
    if (totalExpenses > stats.income) {
      alerts.push({
        id: "2",
        type: "danger",
        title: "Orçamento estourado!",
        message: "Você gastou mais do que recebeu neste mês.",
      });
    }

    if (stats.pendingPayments > 0) {
      alerts.push({
        id: "3",
        type: "info",
        title: `${stats.pendingPayments} pagamentos pendentes`,
        message: "Confira seus pagamentos na área de Pagamentos.",
      });
    }

    if (stats.sitePendencias > 0) {
      alerts.push({
        id: "4",
        type: "warning",
        title: `${stats.sitePendencias} pendências do site`,
        message: "Há tarefas pendentes na Gestão do Site.",
      });
    }

    const upcomingTasks = stats.tasksData?.slice(0, 5).map((task: any) => ({
      id: task.id,
      title: task.title,
      date: task.task_date,
      priority: task.priority,
    })) || [];

    return {
      categoryData,
      monthlyData: months,
      recentTransactions: transactions.slice(0, 5),
      budgetAlerts: alerts,
      upcomingTasks,
    };
  }, [stats]);

  const lucroLiquido = stats ? stats.income - stats.personalExpenses - stats.companyExpenses : 0;


  if (isLoading) {
    return (
      <div className="p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 space-y-4">
            <div className="h-8 w-48 shimmer rounded-lg" />
            <div className="h-12 w-64 shimmer rounded-lg" />
            <div className="h-6 w-96 shimmer rounded-lg" />
          </div>
          <StatsSkeleton count={4} />
          <div className="grid gap-6 lg:grid-cols-3 mt-8">
            <div className="lg:col-span-2 h-64 shimmer rounded-2xl" />
            <div className="h-64 shimmer rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl text-center py-20">
          <p className="text-destructive">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  const lucroLiquidoValue = stats ? stats.income - stats.personalExpenses - stats.companyExpenses : 0;
  const totalExpensesValue = stats ? stats.personalExpenses + stats.companyExpenses : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* NOVO: Welcome Hero com orientação contextual */}
        <WelcomeHero
          pendingTasks={stats?.pendingTasks || 0}
          completedToday={stats?.tasksData?.filter((t: any) => t.is_completed)?.length || 0}
          pendingPayments={stats?.pendingPayments || 0}
          profit={lucroLiquidoValue}
        />

        {/* NOVO: Smart Tips - Dicas contextuais */}
        <SmartTips
          income={stats?.income || 0}
          expenses={totalExpensesValue}
          pendingTasks={stats?.pendingTasks || 0}
          pendingPayments={stats?.pendingPayments || 0}
          onNavigate={(path) => navigate(path)}
        />

        {/* NOVO: Ações Rápidas */}
        <QuickActionsGrid />

        {/* NOVO: Grid Principal - Finanças + Agenda + Metas */}
        <section className="grid gap-6 lg:grid-cols-3">
          <FinancialOverview
            income={stats?.income || 0}
            expenses={totalExpensesValue}
            personalExpenses={stats?.personalExpenses || 0}
            companyExpenses={stats?.companyExpenses || 0}
            pendingPayments={stats?.pendingPayments || 0}
          />
          <TodayAgenda tasks={stats?.tasksData || []} />
          <GoalsProgress
            income={stats?.income || 0}
            students={stats?.students || 0}
            completedTasks={stats?.tasksData?.filter((t: any) => t.is_completed)?.length || 0}
            totalTasks={stats?.tasksData?.length || 0}
          />
        </section>

        {/* Stats Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Funcionários"
            value={stats.employees}
            icon={Users}
            variant="red"
            delay={0}
          />
          <StatCard
            title="Entradas"
            value={stats.income}
            formatFn={(v) => formatCurrency(v)}
            icon={TrendingUp}
            variant="green"
            delay={1}
          />
          <StatCard
            title="Saídas Totais"
            value={stats.personalExpenses + stats.companyExpenses}
            formatFn={(v) => formatCurrency(v)}
            icon={TrendingDown}
            variant="purple"
            delay={2}
          />
          <StatCard
            title="Lucro Líquido"
            value={lucroLiquido}
            formatFn={(v) => formatCurrency(v)}
            icon={DollarSign}
            variant={lucroLiquido >= 0 ? "green" : "red"}
            delay={3}
          />
        </section>

        {/* Executive Summary - Only for Owner */}
        {role === 'owner' && (
          <section className="mb-8">
            <ExecutiveSummary
              totalIncome={stats.income}
              totalExpenses={stats.personalExpenses + stats.companyExpenses}
              totalStudents={stats.students}
              totalAffiliates={stats.affiliates}
              monthlyGrowth={12.5}
              conversionRate={8.3}
              pendingPayments={stats.pendingPayments}
              completedTasks={stats.tasksData?.filter((t: any) => t.is_completed).length || 0}
              totalTasks={stats.tasksData?.length || 0}
            />
          </section>
        )}

        {/* Charts Row */}
        <section className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <RevenueChart data={processedData?.monthlyData || []} />
          </div>
          <CategoryPieChart data={processedData?.categoryData || []} title="Gastos por Categoria" />
        </section>

        {/* Weekly Insights + Financial Health */}
        <section className="grid gap-6 lg:grid-cols-2 mb-8">
          <WeeklyInsights />
          <FinancialHealthScore
            income={stats.income}
            expenses={stats.personalExpenses + stats.companyExpenses}
            savings={Math.max(0, stats.income - stats.personalExpenses - stats.companyExpenses)}
            debts={0}
            emergencyFund={stats.income * 3}
            monthlyGoal={stats.income * 0.2}
          />
        </section>

        {/* Real-time Data */}
        <section className="grid gap-6 lg:grid-cols-3 mb-8">
          <RealtimePulse />
          <CommandCenter />
          <div className="space-y-6">
            <FinancialGoalsWidget />
            <QuickActions />
          </div>
        </section>

        {/* SYNAPSE v14.0 Widgets */}
        <section className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Financial Insights */}
          <FinancialInsights
            totalIncome={stats.income}
            totalExpenses={stats.personalExpenses + stats.companyExpenses}
            personalExpenses={stats.personalExpenses}
            companyExpenses={stats.companyExpenses}
            pendingPayments={stats.pendingPayments}
          />
          
          {/* Quiz/LMS Widget */}
          <QuizListWidget />
          
          {/* Security & System Status */}
          <div className="space-y-6">
            {role === 'owner' && <SynapseStatusWidget />}
            <SecurityStatusWidget />
          </div>
        </section>

        {/* Advanced KPIs - Business Intelligence */}
        <section className="mb-8">
          <AdvancedKPIs
            data={{
              ltv: 158000,
              ltvPreviousPeriod: 145000,
              cac: 32000,
              cacPreviousPeriod: 35000,
              churnRate: 2.5,
              churnRatePreviousPeriod: 3.2,
              mrr: stats.income,
              mrrPreviousPeriod: stats.income * 0.92,
              arr: stats.income * 12,
              nps: 72,
              npsPreviousPeriod: 68,
              activeUsers: stats.students + stats.affiliates,
              totalUsers: (stats.students + stats.affiliates) * 1.3,
              revenuePerUser: stats.income / Math.max(1, stats.students + stats.affiliates),
              retentionRate: 94.5,
            }}
          />
        </section>

        {/* Alerts */}
        <section className="mb-8">
          <BudgetAlerts alerts={processedData?.budgetAlerts || []} />
        </section>

        {/* Secondary Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Gastos Pessoais"
            value={stats.personalExpenses}
            formatFn={(v) => formatCurrency(v)}
            icon={Wallet}
            variant="purple"
            delay={4}
          />
          <StatCard
            title="Gastos Empresa"
            value={stats.companyExpenses}
            formatFn={(v) => formatCurrency(v)}
            icon={Building2}
            variant="blue"
            delay={5}
          />
          <StatCard
            title="Afiliados"
            value={stats.affiliates}
            icon={Handshake}
            variant="green"
            delay={6}
          />
          <StatCard
            title="Alunos"
            value={stats.students}
            icon={GraduationCap}
            variant="red"
            delay={7}
          />
        </section>

        {/* Tasks & Pendências Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            title="Tarefas Pendentes"
            value={stats.pendingTasks}
            icon={CheckSquare}
            variant="purple"
            delay={8}
          />
          <StatCard
            title="Pagamentos Pendentes"
            value={stats.pendingPayments}
            icon={CreditCard}
            variant="red"
            delay={9}
          />
          <StatCard
            title="Pendências Site"
            value={stats.sitePendencias}
            icon={Globe}
            variant="blue"
            delay={10}
          />
        </section>

        {/* Upcoming Tasks */}
        {processedData?.upcomingTasks && processedData.upcomingTasks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-3xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Próximas Tarefas</h3>
            </div>
            <div className="space-y-3">
              {processedData.upcomingTasks.map((task: any) => (
                <motion.div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'alta' ? 'bg-red-500' : 
                      task.priority === 'media' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm font-medium">{task.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{task.date}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recent Transactions and Welcome */}
        <section className="grid gap-6 lg:grid-cols-2">
          <RecentTransactions transactions={processedData?.recentTransactions || []} />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-3xl p-8 relative overflow-hidden"
          >
            {/* Átomo decorativo */}
            <div className="absolute top-4 right-4 opacity-20">
              <AnimatedAtom size={60} />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Bem-vindo, {user?.email?.split("@")[0]}! 
              </h2>
            </div>
            
            <p className="text-muted-foreground mb-6">
              {role === "owner" 
                ? "Você tem acesso completo a todos os módulos do sistema."
                : role === "admin"
                ? "Você tem acesso de administrador ao sistema."
                : "Navegue pelo menu para acessar suas áreas disponíveis."
              }
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30 hover-lift">
                <p className="text-xs text-muted-foreground">Seu cargo</p>
                <p className="text-lg font-semibold text-foreground capitalize mt-1">
                  {role === "owner" ? "Proprietário" : role === "admin" ? "Administrador" : "Funcionário"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30 hover-lift">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-[hsl(var(--stats-green))] mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--stats-green))] animate-pulse" />
                  Online
                </p>
              </div>
            </div>

            {/* Dica de Química */}
            <div className="mt-6">
              <ChemistryTip
                title="Dica do Professor"
                content="A química está em tudo! Cada transação financeira é como uma reação química - precisa de equilíbrio."
                icon={Atom}
              />
            </div>
          </motion.div>
        </section>

        {/* UPGRADE v10 - Widgets de Produtividade */}
        <section className="grid gap-4 md:grid-cols-2 mb-8">
          <TasksOverviewWidget />
          <LabStatusWidget />
        </section>

        {/* Analytics Avançado + Automações */}
        <section className="grid gap-6 lg:grid-cols-2 mb-8">
          <AdvancedAnalytics />
          <AutomationRules />
        </section>

        {/* Chemistry Stats Section */}
        <section className="mb-8">
          <ChemistryStats
            data={{
              totalAlunos: stats.students,
              cursosAtivos: 5,
              taxaAprovacao: 94,
              horasAulas: 240,
              modulosConcluidos: 42,
              engajamento: 87
            }}
          />
        </section>

        {/* Elements Grid - Periodic Table Style */}
        <section className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Atom className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Indicadores Elementais</h3>
                <p className="text-xs text-muted-foreground">Métricas no estilo tabela periódica</p>
              </div>
            </div>
            <ElementsGrid />
          </motion.div>
        </section>
      </div>

      {/* AI Tutor Floating Button */}
      {!showAITutor && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            onClick={() => setShowAITutor(true)}
          >
            <Bot className="h-6 w-6" />
          </Button>
        </motion.div>
      )}

      {/* AI Tutor Component */}
      <AITutor isOpen={showAITutor} onClose={() => setShowAITutor(false)} />

      {/* TRAMON - Premium AI Assistant (Owner/Admin only) */}
      <AITramon />

      {/* Guided Tour */}
      <GuidedTour 
        steps={dashboardTourSteps} 
        isOpen={showTour} 
        onComplete={completeTour} 
      />
    </div>
  );
}
