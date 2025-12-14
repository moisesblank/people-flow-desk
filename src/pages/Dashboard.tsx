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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
          supabase.from("personal_extra_expenses").select("valor"),
          supabase.from("company_fixed_expenses").select("valor"),
          supabase.from("company_extra_expenses").select("valor"),
          supabase.from("income").select("valor"),
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
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const lucroLiquido = stats.income - stats.personalExpenses - stats.companyExpenses;

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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
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
            variant="blue"
            delay={3}
          />
        </section>

        {/* Secondary Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 glass-card rounded-3xl p-8"
        >
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Bem-vindo, {user?.email?.split("@")[0]}! 👋
          </h2>
          <p className="text-muted-foreground">
            {role === "owner" 
              ? "Você tem acesso completo a todos os módulos do sistema."
              : role === "admin"
              ? "Você tem acesso de administrador ao sistema."
              : "Navegue pelo menu para acessar suas áreas disponíveis."
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
}
