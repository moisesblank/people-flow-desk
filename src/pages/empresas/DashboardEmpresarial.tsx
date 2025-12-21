// ============================================
// DASHBOARD EMPRESARIAL - ERP COMPLETO
// Visão 360º das Empresas com KPIs e Gráficos
// DESPESAS = GASTOS FIXOS + GASTOS EXTRAS (SINCRONIZADO COM FINANÇAS EMPRESA)
// LUCRO LÍQUIDO EM TEMPO REAL
// ============================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyFinanceHistory } from "@/hooks/useCompanyFinanceHistory";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, 
  Building2, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  RefreshCw, Download, Calendar, Target, Wallet, CreditCard, Banknote
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "framer-motion";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#f59e0b', '#ef4444'];

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  color?: string;
}

function MetricCard({ title, value, change, icon: Icon, description, color = "primary" }: MetricCardProps) {
  const isPositive = change && change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <Icon className={`h-4 w-4 text-${color}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {change !== undefined && (
            <p className="text-xs flex items-center gap-1 mt-1">
              {isPositive ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{change}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{change}%</span>
                </>
              )}
              <span className="text-muted-foreground ml-1">vs mês anterior</span>
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardEmpresarial() {
  const [periodo, setPeriodo] = useState("mes");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ============================================
  // USAR O MESMO HOOK DE FINANÇAS EMPRESA
  // SINCRONIZADO COM company_fixed_expenses + company_extra_expenses
  // INCLUI PROJEÇÕES AUTOMÁTICAS DE GASTOS RECORRENTES
  // ============================================
  const { 
    stats, 
    fixedExpenses, 
    extraExpenses, 
    entradas,
    period,
    setPeriod,
    isLoading: isLoadingFinance
  } = useCompanyFinanceHistory();

  // Sincronizar período do dashboard com o hook
  useEffect(() => {
    if (periodo === "semana") setPeriod("semana");
    else if (periodo === "mes") setPeriod("mes");
    else if (periodo === "ano") setPeriod("ano");
  }, [periodo, setPeriod]);

  // ============================================
  // BUSCAR DADOS COMPLEMENTARES (funcionários, alunos, evolução)
  // ============================================
  const { data: dadosComplementares, refetch: refetchComplementares } = useQuery({
    queryKey: ["dashboard-empresarial-complementar", periodo],
    queryFn: async () => {
      // Funcionários ativos
      const { count: funcionarios } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");

      // Alunos ativos
      const { count: alunos } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");

      // Buscar fechamentos mensais para evolução
      const anoAtual = new Date().getFullYear();
      const mesAtual = new Date().getMonth();
      
      const { data: fechamentosMensais } = await supabase
        .from("company_monthly_closures")
        .select("*")
        .eq("ano", anoAtual)
        .order("mes", { ascending: true });

      // Construir evolução mensal
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const evolucaoMensal = meses.slice(0, mesAtual + 1).map((mes, index) => {
        const fechamento = fechamentosMensais?.find(f => f.mes === index + 1);
        
        if (fechamento) {
          return {
            mes,
            receitas: Number(fechamento.total_receitas || 0) / 100,
            despesas: (Number(fechamento.total_gastos_fixos || 0) + Number(fechamento.total_gastos_extras || 0)) / 100,
            lucro: Number(fechamento.saldo_periodo || 0) / 100
          };
        }
        
        // Mês atual - usar stats do hook
        if (index === mesAtual) {
          return {
            mes,
            receitas: stats.totalReceitas / 100,
            despesas: stats.totalGastos / 100,
            lucro: stats.saldo / 100
          };
        }
        
        return { mes, receitas: 0, despesas: 0, lucro: 0 };
      }).filter(m => m.receitas > 0 || m.despesas > 0);

      // Calcular crescimento
      let crescimentoReceita = 0;
      let crescimentoDespesas = 0;
      
      if (fechamentosMensais && fechamentosMensais.length > 0) {
        const mesAnterior = fechamentosMensais.find(f => f.mes === mesAtual);
        if (mesAnterior && stats.totalReceitas > 0) {
          const receitaAnterior = Number(mesAnterior.total_receitas || 0);
          const despesaAnterior = Number(mesAnterior.total_gastos_fixos || 0) + Number(mesAnterior.total_gastos_extras || 0);
          
          if (receitaAnterior > 0) {
            crescimentoReceita = ((stats.totalReceitas - receitaAnterior) / receitaAnterior) * 100;
          }
          if (despesaAnterior > 0) {
            crescimentoDespesas = ((stats.totalGastos - despesaAnterior) / despesaAnterior) * 100;
          }
        }
      }

      return {
        funcionarios: funcionarios || 0,
        alunos: alunos || 0,
        evolucaoMensal,
        crescimentoReceita,
        crescimentoDespesas,
      };
    },
    refetchInterval: 10000,
  });

  // Agrupar gastos por categoria (do hook)
  const gastosPorCategoria = [...fixedExpenses, ...extraExpenses].reduce((acc, g) => {
    const cat = g.categoria || (g.type === 'fixed' ? 'Fixos' : 'Extras');
    const existing = acc.find(c => c.name === cat);
    if (existing) {
      existing.value += Number(g.valor || 0);
    } else {
      acc.push({ name: cat, value: Number(g.valor || 0) });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Alertas baseados nos stats do hook
  const alertas = [
    ...(stats.saldo < 0 ? [{ titulo: "Lucro Negativo", descricao: "As despesas superaram as receitas este mês" }] : []),
    ...(stats.totalAtrasado > 0 ? [{ titulo: "Pagamentos Atrasados", descricao: `R$ ${(stats.totalAtrasado / 100).toLocaleString('pt-BR')} em despesas atrasadas` }] : [])
  ];

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-empresarial-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, () => refetchComplementares())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_fixed_expenses' }, () => refetchComplementares())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_extra_expenses' }, () => refetchComplementares())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchComplementares]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchComplementares();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100); // Dividir por 100 pois valores estão em centavos
  };

  // Margem de lucro
  const margem = stats.totalReceitas > 0 
    ? ((stats.saldo / stats.totalReceitas) * 100).toFixed(1) 
    : "0";

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Dashboard Empresarial
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão 360º • 2 CNPJs ativos • Tempo Real • Sincronizado com Finanças Empresa
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-500">
            ● Sincronizado
          </Badge>
          
          <Tabs value={periodo} onValueChange={setPeriodo}>
            <TabsList>
              <TabsTrigger value="semana">Semana</TabsTrigger>
              <TabsTrigger value="mes">Mês</TabsTrigger>
              <TabsTrigger value="ano">Ano</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principais - USANDO STATS DO HOOK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(stats.totalReceitas)}
          change={dadosComplementares?.crescimentoReceita}
          icon={DollarSign}
          color="primary"
        />
        <MetricCard
          title="Despesas Totais"
          value={formatCurrency(stats.totalGastos)}
          change={dadosComplementares?.crescimentoDespesas}
          icon={CreditCard}
          description={`Fixos: ${formatCurrency(stats.totalGastosFixos)} | Extras: ${formatCurrency(stats.totalGastosExtras)}`}
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(stats.saldo)}
          icon={Banknote}
          description={`Margem: ${margem}%`}
          color={stats.saldo >= 0 ? "green" : "red"}
        />
        <MetricCard
          title="Funcionários Ativos"
          value={String(dadosComplementares?.funcionarios || 0)}
          icon={Users}
          description={`${dadosComplementares?.alunos || 0} alunos ativos`}
        />
      </div>

      {/* Detalhamento de Despesas - USANDO STATS DO HOOK */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Composição das Despesas (Sincronizado com Finanças Empresa)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-sm text-muted-foreground">Gastos Fixos</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(stats.totalGastosFixos)}</p>
              <p className="text-xs text-muted-foreground">{stats.qtdGastosFixos} itens</p>
            </div>
            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <p className="text-sm text-muted-foreground">Gastos Extras</p>
              <p className="text-xl font-bold text-orange-500">{formatCurrency(stats.totalGastosExtras)}</p>
              <p className="text-xs text-muted-foreground">{stats.qtdGastosExtras} itens</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm text-muted-foreground">✅ Pagos</p>
              <p className="text-xl font-bold text-green-500">{formatCurrency(stats.totalPago)}</p>
              <p className="text-xs text-muted-foreground">{stats.qtdPago} itens</p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-muted-foreground">⏳ Pendentes</p>
              <p className="text-xl font-bold text-yellow-500">{formatCurrency(stats.totalPendente)}</p>
              <p className="text-xs text-muted-foreground">{stats.qtdPendente} itens</p>
            </div>
          </div>
          {stats.totalAtrasado > 0 && (
            <div className="mt-4 p-4 bg-red-500/20 rounded-lg border border-red-500/50 animate-pulse">
              <p className="text-sm font-medium text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Despesas Atrasadas: <span className="text-red-500 font-bold">{formatCurrency(stats.totalAtrasado)}</span>
                ({stats.qtdAtrasado} itens)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertCircle className="h-5 w-5" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertas.map((alerta, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{alerta.titulo}</p>
                    <p className="text-sm text-muted-foreground">{alerta.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Evolução Financeira
            </CardTitle>
            <CardDescription>Receitas vs Despesas nos últimos meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosComplementares?.evolucaoMensal || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="#ffffff" tick={{ fill: "#ffffff", fontWeight: "bold" }} />
                <YAxis stroke="#ffffff" tick={{ fill: "#ffffff", fontWeight: "bold" }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontWeight: "bold",
                  }} 
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                  formatter={(value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}
                />
                <Legend formatter={(value) => <span className="text-white font-bold">{value}</span>} />
                <Area type="monotone" dataKey="receitas" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Receitas" />
                <Area type="monotone" dataKey="despesas" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Despesas" />
                <Line type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={2} name="Lucro" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gastos por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>Distribuição das despesas empresariais</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={gastosPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gastosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  itemStyle={{ color: "#ffffff", fontWeight: "bold" }}
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cards CNPJs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">MM CURSO DE QUÍMICA LTDA</CardTitle>
                <CardDescription>53.829.761/0001-17</CardDescription>
              </div>
              <Badge className="bg-green-500/10 text-green-500">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Receita</span>
                <span className="font-medium text-green-500">{formatCurrency(stats.totalReceitas * 0.65)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Despesas</span>
                <span className="font-medium text-red-500">{formatCurrency(stats.totalGastos * 0.6)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="font-medium">Lucro Líquido</span>
                <span className="font-bold text-primary">
                  {formatCurrency((stats.totalReceitas * 0.65) - (stats.totalGastos * 0.6))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">CURSO QUÍMICA MOISES MEDEIROS</CardTitle>
                <CardDescription>44.979.308/0001-04</CardDescription>
              </div>
              <Badge className="bg-green-500/10 text-green-500">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Receita</span>
                <span className="font-medium text-green-500">{formatCurrency(stats.totalReceitas * 0.35)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Despesas</span>
                <span className="font-medium text-red-500">{formatCurrency(stats.totalGastos * 0.4)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="font-medium">Lucro Líquido</span>
                <span className="font-bold text-purple-500">
                  {formatCurrency((stats.totalReceitas * 0.35) - (stats.totalGastos * 0.4))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => window.location.href = "/entradas"}>
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Nova Receita</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => window.location.href = "/financas-empresa"}>
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span>Nova Despesa</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => window.location.href = "/funcionarios"}>
              <Users className="h-5 w-5 text-blue-500" />
              <span>Funcionários</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => window.location.href = "/relatorios"}>
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span>Relatórios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
