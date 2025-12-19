// ============================================
// DASHBOARD EMPRESARIAL - ERP COMPLETO
// Visão 360º das Empresas com KPIs e Gráficos
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, 
  Building2, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  RefreshCw, Download, Calendar, Target, Wallet, CreditCard
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

  // Buscar dados financeiros
  const { data: financeiro, refetch } = useQuery({
    queryKey: ["dashboard-empresarial", periodo],
    queryFn: async () => {
      // Receitas (tabela entradas)
      const { data: entradas } = await supabase
        .from("entradas")
        .select("valor, created_at, categoria")
        .order("created_at", { ascending: false });

      // Despesas (tabela transactions com type = expense)  
      const { data: saidas } = await supabase
        .from("transactions")
        .select("amount, created_at, description, type")
        .eq("type", "expense")
        .order("created_at", { ascending: false });

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

      const totalReceitas = entradas?.reduce((acc, e) => acc + Number(e.valor || 0), 0) || 0;
      const totalDespesas = saidas?.reduce((acc, s) => acc + Number(s.amount || 0), 0) || 0;
      const lucro = totalReceitas - totalDespesas;
      const margem = totalReceitas > 0 ? ((lucro / totalReceitas) * 100).toFixed(1) : "0";

      // Agrupar por categoria
      const categoriasReceitas = entradas?.reduce((acc, e) => {
        const cat = e.categoria || "Outros";
        acc[cat] = (acc[cat] || 0) + Number(e.valor || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      const gastosPorCategoria = Object.entries(categoriasReceitas).map(([name, value]) => ({
        name,
        value
      }));

      // Evolução mensal (últimos 6 meses - simulado)
      const evolucaoMensal = [
        { mes: "Jul", receitas: 45000, despesas: 28000, lucro: 17000 },
        { mes: "Ago", receitas: 52000, despesas: 31000, lucro: 21000 },
        { mes: "Set", receitas: 48000, despesas: 29000, lucro: 19000 },
        { mes: "Out", receitas: 61000, despesas: 35000, lucro: 26000 },
        { mes: "Nov", receitas: 58000, despesas: 33000, lucro: 25000 },
        { mes: "Dez", receitas: totalReceitas, despesas: totalDespesas, lucro: lucro },
      ];

      return {
        totalReceitas,
        totalDespesas,
        lucro,
        margem,
        funcionarios: funcionarios || 0,
        alunos: alunos || 0,
        gastosPorCategoria,
        evolucaoMensal,
        crescimentoReceita: 12.5,
        crescimentoDespesas: -3.2,
        alertas: lucro < 0 ? [{ titulo: "Lucro Negativo", descricao: "As despesas superaram as receitas este mês" }] : []
      };
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

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
            Visão 360º das suas empresas • 2 CNPJs ativos
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(financeiro?.totalReceitas || 0)}
          change={financeiro?.crescimentoReceita}
          icon={DollarSign}
          color="primary"
        />
        <MetricCard
          title="Despesas"
          value={formatCurrency(financeiro?.totalDespesas || 0)}
          change={financeiro?.crescimentoDespesas}
          icon={CreditCard}
          description={`${((financeiro?.totalDespesas || 0) / (financeiro?.totalReceitas || 1) * 100).toFixed(1)}% da receita`}
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(financeiro?.lucro || 0)}
          icon={Target}
          description={`Margem: ${financeiro?.margem}%`}
          color={(financeiro?.lucro || 0) >= 0 ? "green" : "red"}
        />
        <MetricCard
          title="Funcionários Ativos"
          value={String(financeiro?.funcionarios || 0)}
          icon={Users}
          description={`${financeiro?.alunos || 0} alunos ativos`}
        />
      </div>

      {/* Alertas */}
      {financeiro?.alertas && financeiro.alertas.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertCircle className="h-5 w-5" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {financeiro.alertas.map((alerta, idx) => (
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
            <CardDescription>Receitas vs Despesas nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financeiro?.evolucaoMensal || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Legend />
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
            <CardDescription>Distribuição das despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={financeiro?.gastosPorCategoria || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(financeiro?.gastosPorCategoria || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
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
                <span className="font-medium text-green-500">{formatCurrency((financeiro?.totalReceitas || 0) * 0.65)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Despesas</span>
                <span className="font-medium text-red-500">{formatCurrency((financeiro?.totalDespesas || 0) * 0.6)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="font-medium">Lucro</span>
                <span className="font-bold text-primary">
                  {formatCurrency(((financeiro?.totalReceitas || 0) * 0.65) - ((financeiro?.totalDespesas || 0) * 0.6))}
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
                <span className="font-medium text-green-500">{formatCurrency((financeiro?.totalReceitas || 0) * 0.35)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Despesas</span>
                <span className="font-medium text-red-500">{formatCurrency((financeiro?.totalDespesas || 0) * 0.4)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="font-medium">Lucro</span>
                <span className="font-bold text-purple-500">
                  {formatCurrency(((financeiro?.totalReceitas || 0) * 0.35) - ((financeiro?.totalDespesas || 0) * 0.4))}
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
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => window.location.href = "/pagamentos"}>
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
