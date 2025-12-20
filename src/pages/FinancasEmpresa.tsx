// ============================================
// EMPRESARIAL 2.0 - FINANÇAS EMPRESA
// Multi-CNPJ, Analytics avançado + Histórico
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, Trash2, Edit2, Phone, TrendingUp, AlertTriangle, PieChart as PieChartIcon, DollarSign, Wallet, Receipt, History, RefreshCw, Calendar } from "lucide-react";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { CyberBackground } from "@/components/ui/cyber-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatCard } from "@/components/employees/StatCard";
import { MultiCNPJManager } from "@/components/finance/MultiCNPJManager";
import { FinancialHistoryChart } from "@/components/finance/FinancialHistoryChart";
import { PeriodFilterTabs } from "@/components/finance/PeriodFilterTabs";
import { MonthlySnapshotCard } from "@/components/finance/MonthlySnapshotCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PeriodFilter } from "@/hooks/useFinancialHistory";

const ASSESSORS = {
  moises: { name: "Moisés", phone: "5583998920105", whatsapp: "558398920105" },
  bruna: { name: "Bruna", phone: "5583996354090", whatsapp: "558396354090" },
};

interface Expense {
  id: number;
  nome: string;
  valor: number;
  categoria: string;
  data?: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function FinancasEmpresa() {
  const { user } = useAuth();
  const [fixedExpenses, setFixedExpenses] = useState<Expense[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"fixed" | "extra">("fixed");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({ nome: "", valor: "", categoria: "", data: format(new Date(), "yyyy-MM-dd") });
  const [activeTab, setActiveTab] = useState("overview");
  
  // Controle de período
  const [period, setPeriod] = useState<PeriodFilter>("mensal");
  const [customRange, setCustomRange] = useState({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
  const [monthlySnapshots, setMonthlySnapshots] = useState<any[]>([]);

  const fetchExpenses = async () => {
    try {
      const [fixedRes, extraRes] = await Promise.all([
        supabase.from("company_fixed_expenses").select("*").order("nome"),
        supabase.from("company_extra_expenses").select("*").order("created_at", { ascending: false }),
      ]);

      if (fixedRes.error) throw fixedRes.error;
      if (extraRes.error) throw extraRes.error;

      setFixedExpenses(fixedRes.data?.map((e: any) => ({
        id: e.id,
        nome: e.nome,
        valor: e.valor,
        categoria: e.categoria || "",
        data: e.data || null,
      })) || []);

      setExtraExpenses(extraRes.data?.map((e: any) => ({
        id: e.id,
        nome: e.nome,
        valor: e.valor,
        categoria: e.categoria || "",
        data: e.data || null,
      })) || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Erro ao carregar gastos");
    } finally {
      setIsLoading(false);
    }
  };

  // Gerar snapshots mensais baseados nos dados
  const generateSnapshots = async () => {
    const snapshots = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ano = targetDate.getFullYear();
      const mes = targetDate.getMonth() + 1;
      const periodStart = startOfMonth(targetDate);
      const periodEnd = endOfMonth(targetDate);

      const [fixedRes, extraRes, entradasRes] = await Promise.all([
        supabase.from("company_fixed_expenses").select("valor"),
        supabase
          .from("company_extra_expenses")
          .select("valor")
          .gte("data", format(periodStart, "yyyy-MM-dd"))
          .lte("data", format(periodEnd, "yyyy-MM-dd")),
        supabase
          .from("entradas")
          .select("valor")
          .gte("created_at", periodStart.toISOString())
          .lt("created_at", addMonths(periodStart, 1).toISOString()),
      ]);

      const despesasFixas = (fixedRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);
      const despesasExtras = (extraRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);
      const receitas = (entradasRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);

      if (despesasFixas > 0 || despesasExtras > 0 || receitas > 0) {
        snapshots.push({
          id: `${ano}-${mes}`,
          ano,
          mes,
          receitas_total: receitas,
          despesas_fixas_total: despesasFixas,
          despesas_extras_total: despesasExtras,
          despesas_total: despesasFixas + despesasExtras,
          saldo_periodo: receitas - (despesasFixas + despesasExtras),
          is_fechado: i > 0,
        });
      }
    }

    setMonthlySnapshots(snapshots.reverse());
  };

  useEffect(() => {
    fetchExpenses();
    generateSnapshots();
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('company-finances-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_fixed_expenses' }, () => {
        fetchExpenses();
        generateSnapshots();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_extra_expenses' }, () => {
        fetchExpenses();
        generateSnapshots();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const totalFixed = fixedExpenses.reduce((acc, e) => acc + e.valor, 0);
    const totalExtra = extraExpenses.reduce((acc, e) => acc + e.valor, 0);
    
    const categoryMap: Record<string, number> = {};
    [...fixedExpenses, ...extraExpenses].forEach((expense) => {
      const cat = expense.categoria || "Outros";
      categoryMap[cat] = (categoryMap[cat] || 0) + expense.valor;
    });
    
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];
    
    const pieData = Object.entries(categoryMap)
      .filter(([_, value]) => value > 0)
      .map(([key, value], index) => ({
        name: key,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
    
    return { totalFixed, totalExtra, total: totalFixed + totalExtra, pieData };
  }, [fixedExpenses, extraExpenses]);

  // Dados para gráfico de histórico
  const chartData = useMemo(() => {
    return monthlySnapshots.map(s => ({
      label: `${String(s.mes).padStart(2, "0")}/${s.ano}`,
      receitas: (s.receitas_total || 0) / 100,
      despesas: (s.despesas_total || 0) / 100,
      saldo: (s.saldo_periodo || 0) / 100,
    }));
  }, [monthlySnapshots]);

  // Calcular tendência
  const historyStats = useMemo(() => {
    let tendencia: "up" | "down" | "stable" = "stable";
    let variacaoPercent = 0;

    if (monthlySnapshots.length >= 2) {
      const current = monthlySnapshots[monthlySnapshots.length - 1]?.despesas_total || 0;
      const previous = monthlySnapshots[monthlySnapshots.length - 2]?.despesas_total || 0;
      
      if (previous > 0) {
        variacaoPercent = ((current - previous) / previous) * 100;
        tendencia = variacaoPercent > 5 ? "up" : variacaoPercent < -5 ? "down" : "stable";
      }
    }

    return { tendencia, variacaoPercent };
  }, [monthlySnapshots]);

  const openModal = (type: "fixed" | "extra", expense?: Expense) => {
    setModalType(type);
    setEditingExpense(expense || null);
    setFormData(expense 
      ? { nome: expense.nome, valor: String(expense.valor / 100), categoria: expense.categoria, data: expense.data || format(new Date(), "yyyy-MM-dd") }
      : { nome: "", valor: "", categoria: "", data: format(new Date(), "yyyy-MM-dd") }
    );
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.valor) {
      toast.error("Preencha todos os campos");
      return;
    }

    const valorCents = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);
    const table = modalType === "fixed" ? "company_fixed_expenses" : "company_extra_expenses";

    try {
      if (editingExpense) {
        const updateData: any = { nome: formData.nome, valor: valorCents, categoria: formData.categoria };
        if (modalType === "extra") {
          updateData.data = formData.data;
        }
        const { error } = await supabase
          .from(table)
          .update(updateData)
          .eq("id", editingExpense.id);
        if (error) throw error;
        toast.success("Gasto atualizado!");
      } else {
        const insertData: any = {
          nome: formData.nome,
          valor: valorCents,
          categoria: formData.categoria,
          created_by: user?.id,
        };
        if (modalType === "extra") {
          insertData.data = formData.data;
        }
        const { error } = await supabase.from(table).insert(insertData);
        if (error) throw error;
        toast.success("Gasto adicionado!");
      }

      await fetchExpenses();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving expense:", error);
      toast.error(error.message || "Erro ao salvar gasto");
    }
  };

  const handleDelete = async (type: "fixed" | "extra", id: number) => {
    const table = type === "fixed" ? "company_fixed_expenses" : "company_extra_expenses";
    
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast.success("Gasto removido!");
      await fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Erro ao remover gasto");
    }
  };

  const contactAssessor = (assessor: 'moises' | 'bruna') => {
    const data = ASSESSORS[assessor];
    window.open(`https://wa.me/${data.whatsapp}?text=Olá ${data.name}, preciso de ajuda com as finanças da empresa!`, '_blank');
  };

  return (
    <div className="relative min-h-screen">
      <CyberBackground variant="particles" />
      
      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <FuturisticPageHeader
            title="Finanças Empresa"
            subtitle="Gestão Financeira Inteligente • Histórico de 50+ Anos"
            icon={Building2}
            badge="QUANTUM FINANCE"
            accentColor="green"
            stats={[
              { label: "Gastos Fixos", value: formatCurrency(stats.totalFixed), icon: Wallet },
              { label: "Gastos Extras", value: formatCurrency(stats.totalExtra), icon: Receipt },
              { label: "Total Mensal", value: formatCurrency(stats.total), icon: DollarSign },
            ]}
          />

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-2"
          >
            <PeriodFilterTabs
              period={period}
              onPeriodChange={setPeriod}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { fetchExpenses(); generateSnapshots(); }} className="gap-1">
                <RefreshCw className="h-3 w-3" />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => contactAssessor('moises')}
                className="gap-1 border-green-500/30 hover:border-green-500/60"
              >
                <Phone className="h-3 w-3 text-green-400" />
                Moisés
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => contactAssessor('bruna')}
                className="gap-1 border-emerald-500/30 hover:border-emerald-500/60"
              >
                <Phone className="h-3 w-3 text-emerald-400" />
                Bruna
              </Button>
            </div>
          </motion.div>

          {/* Gráfico de Evolução Histórica */}
          <FinancialHistoryChart
            data={chartData}
            period={period}
            tendencia={historyStats.tendencia}
            variacaoPercent={historyStats.variacaoPercent}
          />

          {/* Snapshots Mensais */}
          {monthlySnapshots.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Balanços Mensais da Empresa
                </h2>
              </div>
              
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {monthlySnapshots.slice(-12).map((snapshot) => (
                    <MonthlySnapshotCard
                      key={`${snapshot.ano}-${snapshot.mes}`}
                      ano={snapshot.ano}
                      mes={snapshot.mes}
                      receitas={snapshot.receitas_total}
                      despesas={snapshot.despesas_total}
                      saldo={snapshot.saldo_periodo}
                      isFechado={snapshot.is_fechado}
                      compact
                    />
                  ))}
                </div>
              </ScrollArea>
            </section>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="multicnpj">Multi-CNPJ</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats */}
              <section className="grid gap-4 sm:grid-cols-3">
                <StatCard title="Gastos Fixos" value={stats.totalFixed} formatFn={formatCurrency} icon={Building2} variant="red" delay={0} />
                <StatCard title="Gastos Extras" value={stats.totalExtra} formatFn={formatCurrency} icon={Building2} variant="purple" delay={1} />
                <StatCard title="Total Mensal" value={stats.total} formatFn={formatCurrency} icon={Building2} variant="blue" delay={2} />
              </section>

              {/* Charts */}
              <section className="grid gap-6 lg:grid-cols-2">
                {stats.pieData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-2xl p-6"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-primary" />
                      Distribuição por Categoria
                    </h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {stats.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            itemStyle={{ color: "#ffffff", fontWeight: "bold" }}
                            labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '12px' }}
                            formatter={(value) => <span className="text-white font-bold text-xs">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Fixos vs Extras
                  </h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { name: "Gastos Fixos", value: stats.totalFixed, fill: "hsl(var(--destructive))" },
                          { name: "Gastos Extras", value: stats.totalExtra, fill: "hsl(var(--primary))" },
                        ]}
                        layout="vertical"
                        margin={{ left: 90, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          type="number" 
                          stroke="#ffffff"
                          tick={{ fill: "#ffffff", fontWeight: "bold" }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="#ffffff"
                          tick={{ fill: "#ffffff", fontWeight: "bold" }}
                          width={85}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          itemStyle={{ color: "#ffffff", fontWeight: "bold" }}
                          labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </section>

              {/* Tabelas de Gastos */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Gastos Fixos</h2>
                  <Button onClick={() => openModal("fixed")} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Adicionar
                  </Button>
                </div>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoria</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixedExpenses.map((expense) => (
                        <tr key={expense.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="p-4 text-foreground">{expense.nome}</td>
                          <td className="p-4 text-muted-foreground">{expense.categoria || "-"}</td>
                          <td className="p-4 text-right text-foreground font-medium">{formatCurrency(expense.valor)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openModal("fixed", expense)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete("fixed", expense.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {fixedExpenses.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum gasto fixo cadastrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Gastos Extras</h2>
                  <Button onClick={() => openModal("extra")} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Adicionar
                  </Button>
                </div>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoria</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extraExpenses.map((expense) => (
                        <tr key={expense.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="p-4 text-muted-foreground text-sm">
                            {expense.data ? format(new Date(expense.data), "dd/MM/yyyy") : "-"}
                          </td>
                          <td className="p-4 text-foreground">{expense.nome}</td>
                          <td className="p-4 text-muted-foreground">{expense.categoria || "-"}</td>
                          <td className="p-4 text-right text-foreground font-medium">{formatCurrency(expense.valor)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openModal("extra", expense)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete("extra", expense.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {extraExpenses.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum gasto extra cadastrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="multicnpj">
              <MultiCNPJManager />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Análise Avançada</h3>
                <p className="text-muted-foreground">
                  Os dados históricos são armazenados automaticamente e podem ser consultados por qualquer período.
                  O sistema mantém registros de até 50+ anos para análise de tendências de longo prazo.
                </p>
                
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-muted-foreground">Meses Registrados</p>
                    <p className="text-2xl font-bold text-green-500">{monthlySnapshots.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-muted-foreground">Anos de Dados</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {new Set(monthlySnapshots.map(s => s.ano)).size}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-xs text-muted-foreground">Capacidade</p>
                    <p className="text-2xl font-bold text-purple-500">50+ Anos</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingExpense ? "Editar" : "Novo"} Gasto {modalType === "fixed" ? "Fixo" : "Extra"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {modalType === "extra" && (
                  <div>
                    <Label>Data</Label>
                    <Input 
                      type="date"
                      value={formData.data} 
                      onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                )}
                <div>
                  <Label>Nome</Label>
                  <Input 
                    value={formData.nome} 
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Aluguel do escritório"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input 
                    value={formData.valor} 
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="Ex: 1500,00"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input 
                    value={formData.categoria} 
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                    placeholder="Ex: Infraestrutura"
                    className="mt-1.5"
                  />
                </div>
                <Button onClick={handleSave} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
