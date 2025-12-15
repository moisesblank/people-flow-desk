// ============================================
// MOISÉS MEDEIROS v7.0 - RELATÓRIOS
// Spider-Man Theme - Business Intelligence
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Sparkles, 
  Download, 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp,
  Users,
  Wallet,
  Building2,
  Calendar,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend, AreaChart, Area } from "recharts";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function Relatorios() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [reportData, setReportData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: ptBR }),
    };
  });

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

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
        supabase.from("employees").select("*"),
        supabase.from("personal_fixed_expenses").select("*"),
        supabase.from("personal_extra_expenses").select("*"),
        supabase.from("company_fixed_expenses").select("*"),
        supabase.from("company_extra_expenses").select("*"),
        supabase.from("income").select("*"),
        supabase.from("affiliates").select("*"),
        supabase.from("students").select("*"),
      ]);

      const personalFixed = personalFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
      const personalExtra = personalExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
      const companyFixed = companyFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
      const companyExtra = companyExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
      const totalIncome = incomeRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;

      // Process category data
      const categoryMap: { [key: string]: number } = {};
      personalExtraRes.data?.forEach((expense) => {
        const cat = expense.categoria || "outros";
        categoryMap[cat] = (categoryMap[cat] || 0) + (expense.valor || 0);
      });

      const categoryLabels: { [key: string]: string } = {
        feira: "🛒 Feira",
        compras_casa: "🏠 Casa",
        compras_bruna: "👩 Bruna",
        compras_moises: "👨 Moisés",
        cachorro: "🐕 Cachorro",
        carro: "🚗 Carro",
        gasolina: "⛽ Gasolina",
        lanches: "🍔 Lanches",
        comida: "🍽️ Comida",
        pessoal: "👤 Pessoal",
        transporte: "🚌 Transporte",
        lazer: "🎮 Lazer",
        outros: "📦 Outros",
      };

      const catData = Object.entries(categoryMap)
        .map(([key, value]) => ({
          name: categoryLabels[key] || key,
          value,
        }))
        .sort((a, b) => b.value - a.value);

      setCategoryData(catData);

      setReportData({
        employees: employeesRes.data || [],
        personalExpenses: personalFixed + personalExtra,
        companyExpenses: companyFixed + companyExtra,
        income: totalIncome,
        affiliates: affiliatesRes.data || [],
        students: studentsRes.data || [],
        personalFixed,
        personalExtra,
        companyFixed,
        companyExtra,
        lucroLiquido: totalIncome - (personalFixed + personalExtra + companyFixed + companyExtra),
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do relatório.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = (type: "financeiro" | "funcionarios" | "vendas") => {
    if (!reportData) return;

    let csvContent = "";
    let filename = "";

    if (type === "financeiro") {
      filename = `relatorio-financeiro-${selectedMonth}.csv`;
      csvContent = "Categoria,Valor\n";
      csvContent += `Receitas,${formatCurrency(reportData.income)}\n`;
      csvContent += `Gastos Pessoais Fixos,${formatCurrency(reportData.personalFixed)}\n`;
      csvContent += `Gastos Pessoais Extras,${formatCurrency(reportData.personalExtra)}\n`;
      csvContent += `Gastos Empresa Fixos,${formatCurrency(reportData.companyFixed)}\n`;
      csvContent += `Gastos Empresa Extras,${formatCurrency(reportData.companyExtra)}\n`;
      csvContent += `Lucro Líquido,${formatCurrency(reportData.lucroLiquido)}\n`;
    } else if (type === "funcionarios") {
      filename = `relatorio-funcionarios-${selectedMonth}.csv`;
      csvContent = "Nome,Função,Setor,Status,Salário\n";
      reportData.employees.forEach((emp: any) => {
        csvContent += `${emp.nome},${emp.funcao},${emp.setor || "N/A"},${emp.status || "N/A"},${formatCurrency(emp.salario)}\n`;
      });
    } else {
      filename = `relatorio-afiliados-${selectedMonth}.csv`;
      csvContent = "Nome,Email,Total Vendas,Comissão Total\n";
      reportData.affiliates.forEach((aff: any) => {
        csvContent += `${aff.nome},${aff.email || "N/A"},${aff.total_vendas || 0},${formatCurrency(aff.comissao_total || 0)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado!",
      description: `Relatório ${type} exportado com sucesso.`,
    });
  };

  const reports = [
    { 
      title: "Relatório Financeiro", 
      description: "Receitas, despesas e lucro líquido", 
      icon: BarChart3,
      type: "financeiro" as const,
      color: "text-[hsl(var(--stats-green))]",
      bg: "bg-[hsl(var(--stats-green))]/10",
    },
    { 
      title: "Relatório de Funcionários", 
      description: "Lista completa da equipe", 
      icon: Users,
      type: "funcionarios" as const,
      color: "text-[hsl(var(--stats-blue))]",
      bg: "bg-[hsl(var(--stats-blue))]/10",
    },
    { 
      title: "Relatório de Afiliados", 
      description: "Vendas e comissões", 
      icon: TrendingUp,
      type: "vendas" as const,
      color: "text-[hsl(var(--stats-purple))]",
      bg: "bg-[hsl(var(--stats-purple))]/10",
    },
  ];

  const barColors = [
    "hsl(152, 76%, 47%)",
    "hsl(212, 96%, 60%)",
    "hsl(348, 70%, 50%)",
    "hsl(262, 83%, 58%)",
    "hsl(45, 93%, 47%)",
    "hsl(200, 80%, 50%)",
    "hsl(30, 90%, 50%)",
    "hsl(320, 70%, 50%)",
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
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Análises</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Relatórios
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Exporte relatórios e visualize análises do seu negócio.
            </p>
          </div>
        </motion.header>

        {/* Month Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex items-center gap-4"
        >
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-64 bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </motion.div>

        {/* Summary Cards */}
        {reportData && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          >
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--stats-green))]/10">
                  <TrendingUp className="h-5 w-5 text-[hsl(var(--stats-green))]" />
                </div>
                <span className="text-sm text-muted-foreground">Receitas</span>
              </div>
              <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">
                {formatCurrency(reportData.income)}
              </p>
            </div>
            
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--stats-red))]/10">
                  <Wallet className="h-5 w-5 text-[hsl(var(--stats-red))]" />
                </div>
                <span className="text-sm text-muted-foreground">Despesas Pessoais</span>
              </div>
              <p className="text-2xl font-bold text-[hsl(var(--stats-red))]">
                {formatCurrency(reportData.personalExpenses)}
              </p>
            </div>
            
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--stats-purple))]/10">
                  <Building2 className="h-5 w-5 text-[hsl(var(--stats-purple))]" />
                </div>
                <span className="text-sm text-muted-foreground">Despesas Empresa</span>
              </div>
              <p className="text-2xl font-bold text-[hsl(var(--stats-purple))]">
                {formatCurrency(reportData.companyExpenses)}
              </p>
            </div>
            
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${reportData.lucroLiquido >= 0 ? "bg-[hsl(var(--stats-green))]/10" : "bg-destructive/10"}`}>
                  <PieChartIcon className={`h-5 w-5 ${reportData.lucroLiquido >= 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"}`} />
                </div>
                <span className="text-sm text-muted-foreground">Lucro Líquido</span>
              </div>
              <p className={`text-2xl font-bold ${reportData.lucroLiquido >= 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"}`}>
                {formatCurrency(reportData.lucroLiquido)}
              </p>
            </div>
          </motion.section>
        )}

        {/* Charts Section */}
        <section className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Category Bar Chart */}
          {categoryData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Gastos por Categoria</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 15%)" />
                    <XAxis 
                      type="number" 
                      stroke="hsl(240, 5%, 55%)"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(240, 5%, 55%)"
                      width={75}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(240, 6%, 8%)",
                        border: "1px solid hsl(240, 6%, 15%)",
                        borderRadius: "12px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Pie Chart - Expense Distribution */}
          {reportData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Distribuição de Despesas</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Pessoais Fixas", value: reportData.personalFixed, color: "#ef4444" },
                        { name: "Pessoais Extras", value: reportData.personalExtra, color: "#f97316" },
                        { name: "Empresa Fixas", value: reportData.companyFixed, color: "#8b5cf6" },
                        { name: "Empresa Extras", value: reportData.companyExtra, color: "#3b82f6" },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {[
                        { name: "Pessoais Fixas", value: reportData.personalFixed, color: "#ef4444" },
                        { name: "Pessoais Extras", value: reportData.personalExtra, color: "#f97316" },
                        { name: "Empresa Fixas", value: reportData.companyFixed, color: "#8b5cf6" },
                        { name: "Empresa Extras", value: reportData.companyExtra, color: "#3b82f6" },
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(240, 6%, 8%)",
                        border: "1px solid hsl(240, 6%, 15%)",
                        borderRadius: "12px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </section>

        {/* Financial Health Indicator */}
        {reportData && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Saúde Financeira</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Taxa de Economia</p>
                <p className={`text-2xl font-bold ${reportData.lucroLiquido > 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"}`}>
                  {reportData.income > 0 ? ((reportData.lucroLiquido / reportData.income) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Gastos Pessoais</p>
                <p className="text-2xl font-bold text-[hsl(var(--stats-red))]">
                  {reportData.income > 0 ? ((reportData.personalExpenses / reportData.income) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Gastos Empresa</p>
                <p className="text-2xl font-bold text-[hsl(var(--stats-purple))]">
                  {reportData.income > 0 ? ((reportData.companyExpenses / reportData.income) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Funcionários</p>
                <p className="text-2xl font-bold text-[hsl(var(--stats-blue))]">
                  {reportData.employees.length}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Reports Grid */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {reports.map((report, index) => (
            <motion.div
              key={report.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${report.bg}`}>
                  <report.icon className={`h-6 w-6 ${report.color}`} />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{report.description}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => exportToCSV(report.type)}
                disabled={!reportData}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar CSV
              </Button>
            </motion.div>
          ))}
        </section>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card rounded-3xl p-8"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Como usar os relatórios
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">1. Selecione o mês:</strong> Use o seletor acima para escolher o período do relatório.
                </p>
                <p>
                  <strong className="text-foreground">2. Analise os gráficos:</strong> Visualize seus gastos por categoria no gráfico de barras.
                </p>
                <p>
                  <strong className="text-foreground">3. Exporte os dados:</strong> Clique em "Exportar CSV" para baixar o relatório e abrir no Excel.
                </p>
                <p>
                  <strong className="text-foreground">4. Compare períodos:</strong> Mude o mês para comparar a evolução dos seus indicadores.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
