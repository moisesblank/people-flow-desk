import { useMemo } from "react";
import { motion } from "framer-motion";
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
  Download
} from "lucide-react";
import { StatCard } from "@/components/employees/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { FinancialGoals } from "@/components/dashboard/FinancialGoals";
import { BudgetAlerts } from "@/components/dashboard/BudgetAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { LoadingState, StatsSkeleton } from "@/components/LoadingState";
import { ExportButton } from "@/components/ExportButton";
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

export default function Dashboard() {
  const { user, role } = useAuth();
  const { data: stats, isLoading, error } = useDashboardStats();

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

  const financialGoals = stats ? [
    { id: "1", name: "Meta de Receita Mensal", current: stats.income, target: 10000000, type: "save" as const },
    { id: "2", name: "Limite de Gastos Pessoais", current: stats.personalExpenses, target: 3000000, type: "limit" as const },
    { id: "3", name: "Limite Gastos Empresa", current: stats.companyExpenses, target: 5000000, type: "limit" as const },
  ] : [];

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

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 text-primary"
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium tracking-wide uppercase">Visão Geral</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Dashboard
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Acompanhe todos os indicadores da sua empresa em tempo real.
              </p>
            </div>
            <ExportButton
              label="Exportar Dados"
              options={[
                { label: "Resumo Geral (CSV)", action: () => console.log("Export summary") },
              ]}
            />
          </div>
        </motion.header>

        {/* Stats Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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

        {/* Charts Row */}
        <section className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <RevenueChart data={processedData?.monthlyData || []} />
          </div>
          <CategoryPieChart data={processedData?.categoryData || []} title="Gastos por Categoria" />
        </section>

        {/* Goals and Alerts */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <FinancialGoals goals={financialGoals} />
          <BudgetAlerts alerts={processedData?.budgetAlerts || []} />
          <QuickActions />
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
            className="glass-card rounded-3xl p-8"
          >
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Bem-vindo, {user?.email?.split("@")[0]}! 👋
            </h2>
            <p className="text-muted-foreground mb-6">
              {role === "owner" 
                ? "Você tem acesso completo a todos os módulos do sistema."
                : role === "admin"
                ? "Você tem acesso de administrador ao sistema."
                : "Navegue pelo menu para acessar suas áreas disponíveis."
              }
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-secondary/30 hover-lift">
                <p className="text-xs text-muted-foreground">Seu cargo</p>
                <p className="text-lg font-semibold text-foreground capitalize mt-1">
                  {role === "owner" ? "Proprietário" : role === "admin" ? "Administrador" : "Funcionário"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30 hover-lift">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-[hsl(var(--stats-green))] mt-1">
                  Online
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
