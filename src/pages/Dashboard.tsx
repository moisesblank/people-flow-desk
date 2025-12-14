import { useMemo, useEffect, useState } from "react";
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
  Sparkles
} from "lucide-react";
import { StatCard } from "@/components/employees/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { FinancialGoals } from "@/components/dashboard/FinancialGoals";
import { BudgetAlerts } from "@/components/dashboard/BudgetAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function Dashboard() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState({
    employees: 0,
    personalExpenses: 0,
    companyExpenses: 0,
    income: 0,
    affiliates: 0,
    students: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          employeesRes,
          personalFixedRes,
          personalExtraRes,
          companyFixedRes,
          companyExtraRes,
          incomeRes,
          affiliatesRes,
          studentsRes
        ] = await Promise.all([
          supabase.from("employees").select("id", { count: "exact", head: true }),
          supabase.from("personal_fixed_expenses").select("valor"),
          supabase.from("personal_extra_expenses").select("valor, categoria, nome, created_at"),
          supabase.from("company_fixed_expenses").select("valor"),
          supabase.from("company_extra_expenses").select("valor, nome, created_at"),
          supabase.from("income").select("valor, fonte, created_at"),
          supabase.from("affiliates").select("id", { count: "exact", head: true }),
          supabase.from("students").select("id", { count: "exact", head: true }),
        ]);

        const personalFixed = personalFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
        const personalExtra = personalExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
        const companyFixed = companyFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
        const companyExtra = companyExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
        const totalIncome = incomeRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;

        setStats({
          employees: employeesRes.count || 0,
          personalExpenses: personalFixed + personalExtra,
          companyExpenses: companyFixed + companyExtra,
          income: totalIncome,
          affiliates: affiliatesRes.count || 0,
          students: studentsRes.count || 0,
        });

        // Process category data for pie chart
        const categoryMap: { [key: string]: number } = {};
        personalExtraRes.data?.forEach((expense) => {
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

        const pieData = Object.entries(categoryMap).map(([key, value]) => ({
          name: categoryLabels[key] || key,
          value,
          color: categoryColors[key] || "hsl(240, 5%, 45%)",
        }));
        setCategoryData(pieData);

        // Generate monthly data for chart (last 6 months)
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          months.push({
            month: format(date, "MMM", { locale: ptBR }),
            receitas: Math.floor(Math.random() * 5000000) + 1000000,
            despesas: Math.floor(Math.random() * 3000000) + 500000,
          });
        }
        // Add current month real data
        months[5] = {
          month: format(new Date(), "MMM", { locale: ptBR }),
          receitas: totalIncome,
          despesas: personalFixed + personalExtra + companyFixed + companyExtra,
        };
        setMonthlyData(months);

        // Recent transactions
        const transactions: any[] = [];
        
        incomeRes.data?.slice(0, 3).forEach((inc) => {
          transactions.push({
            id: `inc-${Math.random()}`,
            type: "income",
            description: inc.fonte,
            amount: inc.valor,
            date: new Date(inc.created_at || new Date()),
          });
        });

        personalExtraRes.data?.slice(0, 3).forEach((exp) => {
          transactions.push({
            id: `exp-${Math.random()}`,
            type: "expense",
            description: exp.nome,
            amount: exp.valor,
            date: new Date(exp.created_at || new Date()),
          });
        });

        transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
        setRecentTransactions(transactions.slice(0, 5));

        // Budget alerts
        const totalExpenses = personalFixed + personalExtra + companyFixed + companyExtra;
        const alerts: any[] = [];
        
        if (totalExpenses > totalIncome * 0.8) {
          alerts.push({
            id: "1",
            type: "warning",
            title: "Gastos elevados",
            message: "Seus gastos estão acima de 80% das receitas deste mês.",
          });
        }
        
        if (totalExpenses > totalIncome) {
          alerts.push({
            id: "2",
            type: "danger",
            title: "Orçamento estourado!",
            message: "Você gastou mais do que recebeu neste mês.",
          });
        }

        setBudgetAlerts(alerts);

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const lucroLiquido = stats.income - stats.personalExpenses - stats.companyExpenses;

  const financialGoals = [
    { id: "1", name: "Meta de Receita Mensal", current: stats.income, target: 10000000, type: "save" as const },
    { id: "2", name: "Limite de Gastos Pessoais", current: stats.personalExpenses, target: 3000000, type: "limit" as const },
    { id: "3", name: "Limite Gastos Empresa", current: stats.companyExpenses, target: 5000000, type: "limit" as const },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
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
            <RevenueChart data={monthlyData} />
          </div>
          <CategoryPieChart data={categoryData} title="Gastos por Categoria" />
        </section>

        {/* Goals and Alerts */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <FinancialGoals goals={financialGoals} />
          <BudgetAlerts alerts={budgetAlerts} />
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

        {/* Recent Transactions and Welcome */}
        <section className="grid gap-6 lg:grid-cols-2">
          <RecentTransactions transactions={recentTransactions} />
          
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
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-xs text-muted-foreground">Seu cargo</p>
                <p className="text-lg font-semibold text-foreground capitalize mt-1">
                  {role === "owner" ? "Proprietário" : role === "admin" ? "Administrador" : "Funcionário"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
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
