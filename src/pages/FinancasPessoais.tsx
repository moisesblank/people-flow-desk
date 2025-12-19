// ============================================
// MOISÉS MEDEIROS v8.0 - FINANÇAS PESSOAIS
// Spider-Man Theme - Gestão Financeira Pessoal
// HISTÓRICO DE LONGO PRAZO (50+ ANOS)
// Controle: Diário, Semanal, Mensal, Anual, 10 Anos
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wallet, Trash2, Edit2, TrendingUp, TrendingDown, Target, PiggyBank, FlaskConical, Atom, RefreshCw, Calendar, History, Lock, Unlock, BarChart3, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatCard } from "@/components/employees/StatCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChemistryTip, AnimatedAtom } from "@/components/chemistry/ChemistryVisuals";
import { FinancialProjections } from "@/components/finance/FinancialProjections";
import { SpendingAnalytics } from "@/components/finance/SpendingAnalytics";
import { AttachmentButton } from "@/components/attachments/AutoAttachmentWrapper";
import { FinancialHistoryChart } from "@/components/finance/FinancialHistoryChart";
import { PeriodFilterTabs } from "@/components/finance/PeriodFilterTabs";
import { MonthlySnapshotCard } from "@/components/finance/MonthlySnapshotCard";
import { useFinancialHistory, getMonthName } from "@/hooks/useFinancialHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import financeHeroImage from "@/assets/finance-chemistry-hero.jpg";

interface Expense {
  id: number;
  nome: string;
  valor: number;
  categoria: string;
  data?: string;
}

const EXPENSE_CATEGORIES = [
  { value: "feira", label: "🛒 Feira" },
  { value: "compras_casa", label: "🏠 Compras para Casa" },
  { value: "compras_bruna", label: "👩 Compras Bruna" },
  { value: "compras_moises", label: "👨 Compras Moisés" },
  { value: "cachorro", label: "🐕 Cachorro" },
  { value: "carro", label: "🚗 Carro" },
  { value: "gasolina", label: "⛽ Gasolina" },
  { value: "lanches", label: "🍔 Lanches" },
  { value: "comida", label: "🍽️ Comida" },
  { value: "casa", label: "🏡 Casa" },
  { value: "pessoal", label: "👤 Pessoal" },
  { value: "transporte", label: "🚌 Transporte" },
  { value: "lazer", label: "🎮 Lazer" },
  { value: "outros", label: "📦 Outros" },
];

const getCategoryLabel = (value: string) => {
  const cat = EXPENSE_CATEGORIES.find(c => c.value === value);
  return cat?.label || value;
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

// Componente de Lucro Líquido Empresarial - vinculado em tempo real
function LucroLiquidoCard() {
  const { data: lucroData } = useQuery({
    queryKey: ["lucro-liquido-empresa"],
    queryFn: async () => {
      const [entradas, gastosFixos, gastosExtras] = await Promise.all([
        supabase.from("entradas").select("valor"),
        supabase.from("company_fixed_expenses").select("valor"),
        supabase.from("company_extra_expenses").select("valor"),
      ]);
      
      const receitas = entradas.data?.reduce((acc, e) => acc + Number(e.valor || 0), 0) || 0;
      const fixos = gastosFixos.data?.reduce((acc, g) => acc + Number(g.valor || 0), 0) || 0;
      const extras = gastosExtras.data?.reduce((acc, g) => acc + Number(g.valor || 0), 0) || 0;
      
      return { lucro: receitas - fixos - extras, receitas, despesas: fixos + extras };
    },
    refetchInterval: 30000,
  });

  const formatReal = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const lucro = lucroData?.lucro || 0;
  const isPositive = lucro >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`glass-card rounded-2xl p-5 border-2 ${isPositive ? 'border-green-500/30' : 'border-red-500/30'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Lucro Líquido Empresa</span>
        <Banknote className={`h-5 w-5 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
      </div>
      <p className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {formatReal(lucro)}
      </p>
      <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas Empresa</p>
    </motion.div>
  );
}

export default function FinancasPessoais() {
  const { user } = useAuth();
  const [fixedExpenses, setFixedExpenses] = useState<Expense[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"fixed" | "extra">("fixed");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({ nome: "", valor: "", categoria: "feira", data: format(new Date(), "yyyy-MM-dd") });

  // Hook de histórico financeiro
  const {
    period,
    setPeriod,
    customRange,
    setCustomRange,
    dateRange,
    snapshots,
    stats: historyStats,
    chartData,
    refresh: refreshHistory,
    closeMonth,
    consolidateYear,
  } = useFinancialHistory();

  const fetchExpenses = async () => {
    try {
      const [fixedRes, extraRes] = await Promise.all([
        supabase.from("personal_fixed_expenses").select("*").order("nome"),
        supabase.from("personal_extra_expenses").select("*").order("created_at", { ascending: false }),
      ]);

      if (fixedRes.error) throw fixedRes.error;
      if (extraRes.error) throw extraRes.error;

      setFixedExpenses(fixedRes.data?.map((e: any) => ({
        id: e.id,
        nome: e.nome,
        valor: e.valor,
        categoria: e.categoria || "outros",
        data: e.data || null,
      })) || []);

      setExtraExpenses(extraRes.data?.map((e: any) => ({
        id: e.id,
        nome: e.nome,
        valor: e.valor,
        categoria: e.categoria || "outros",
        data: e.data || null,
      })) || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Erro ao carregar gastos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('personal-finances-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_fixed_expenses' }, () => {
        fetchExpenses();
        refreshHistory();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_extra_expenses' }, () => {
        fetchExpenses();
        refreshHistory();
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
      const cat = expense.categoria || "outros";
      categoryMap[cat] = (categoryMap[cat] || 0) + expense.valor;
    });
    
    const categoryColors: Record<string, string> = {
      feira: "#22c55e",
      compras_casa: "#3b82f6",
      compras_bruna: "#ec4899",
      compras_moises: "#8b5cf6",
      cachorro: "#eab308",
      carro: "#06b6d4",
      gasolina: "#f97316",
      lanches: "#ef4444",
      comida: "#84cc16",
      casa: "#14b8a6",
      pessoal: "#a855f7",
      transporte: "#0ea5e9",
      lazer: "#f43f5e",
      outros: "#6b7280",
    };
    
    const pieData = Object.entries(categoryMap)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: getCategoryLabel(key),
        value,
        color: categoryColors[key] || "#6b7280",
      }))
      .sort((a, b) => b.value - a.value);
    
    return { totalFixed, totalExtra, total: totalFixed + totalExtra, pieData };
  }, [fixedExpenses, extraExpenses]);

  const openModal = (type: "fixed" | "extra", expense?: Expense) => {
    setModalType(type);
    setEditingExpense(expense || null);
    setFormData(expense 
      ? { nome: expense.nome, valor: String(expense.valor / 100), categoria: expense.categoria, data: expense.data || format(new Date(), "yyyy-MM-dd") }
      : { nome: "", valor: "", categoria: "feira", data: format(new Date(), "yyyy-MM-dd") }
    );
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.valor) {
      toast.error("Preencha todos os campos");
      return;
    }

    const valorCents = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);
    const table = modalType === "fixed" ? "personal_fixed_expenses" : "personal_extra_expenses";

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
          user_id: user?.id,
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
    const table = type === "fixed" ? "personal_fixed_expenses" : "personal_extra_expenses";
    
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

  // Agrupar snapshots por ano para exibição
  const snapshotsByYear = useMemo(() => {
    const grouped: Record<number, typeof snapshots> = {};
    snapshots.forEach(s => {
      if (!grouped[s.ano]) grouped[s.ano] = [];
      grouped[s.ano].push(s);
    });
    return Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a));
  }, [snapshots]);

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full h-48 md:h-56 rounded-2xl overflow-hidden mb-8"
        >
          <img 
            src={financeHeroImage} 
            alt="Finanças Pessoais - Química do Dinheiro" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-between p-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Controle Pessoal</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Finanças Pessoais</h1>
              <p className="text-muted-foreground max-w-md">
                Histórico de 50+ anos • Controle diário a decenal
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={refreshHistory} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <AnimatedAtom size={80} />
            </div>
          </div>
        </motion.div>

        {/* Filtros de Período */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Período de Análise
            </h2>
            <Badge variant="outline" className="text-xs">
              {format(dateRange.start, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.end, "dd/MM/yyyy", { locale: ptBR })}
            </Badge>
          </div>
          <PeriodFilterTabs
            period={period}
            onPeriodChange={setPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </section>

        {/* Stats Cards */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Gastos Fixos" value={stats.totalFixed} formatFn={formatCurrency} icon={Wallet} variant="red" delay={0} />
          <StatCard title="Gastos Extras" value={stats.totalExtra} formatFn={formatCurrency} icon={TrendingDown} variant="purple" delay={1} />
          <StatCard title="Gasto Total/Mês" value={stats.total} formatFn={formatCurrency} icon={Target} variant="blue" delay={2} />
          <LucroLiquidoCard />
          <StatCard 
            title="Economia Potencial" 
            value={Math.round(stats.total * 0.15)} 
            formatFn={formatCurrency} 
            icon={PiggyBank} 
            variant="green" 
            delay={4} 
          />
        </section>

        {/* Gráfico de Evolução Histórica - DESTAQUE */}
        <section className="mb-8">
          <FinancialHistoryChart
            data={chartData}
            period={period}
            tendencia={historyStats.tendencia}
            variacaoPercent={historyStats.variacaoPercent}
          />
        </section>

        {/* Snapshots Mensais - Balanço Visual */}
        {snapshots.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Balanços Mensais
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => consolidateYear(new Date().getFullYear())}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Consolidar Ano
              </Button>
            </div>
            
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {snapshots.slice(0, 12).map((snapshot) => (
                  <MonthlySnapshotCard
                    key={`${snapshot.ano}-${snapshot.mes}`}
                    ano={snapshot.ano}
                    mes={snapshot.mes}
                    receitas={snapshot.receitas_total}
                    despesas={snapshot.despesas_total}
                    saldo={snapshot.saldo_periodo}
                    isFechado={snapshot.is_fechado}
                    onClose={() => closeMonth(snapshot.ano, snapshot.mes)}
                    compact
                  />
                ))}
              </div>
            </ScrollArea>
          </section>
        )}

        {/* Grid Principal */}
        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Pie Chart */}
          {stats.pieData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Gastos por Categoria</h3>
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
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Tabela de Gastos Fixos */}
          <div className={stats.pieData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
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
                  <AnimatePresence>
                    {fixedExpenses.map((expense) => (
                      <motion.tr 
                        key={expense.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-t border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="p-4 text-foreground">{expense.nome}</td>
                        <td className="p-4 text-muted-foreground">{getCategoryLabel(expense.categoria)}</td>
                        <td className="p-4 text-right text-foreground font-medium">{formatCurrency(expense.valor)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <AttachmentButton
                              entityType="expense"
                              entityId={expense.id}
                              entityLabel={expense.nome}
                              variant="ghost"
                              size="icon"
                            />
                            <Button variant="ghost" size="icon" onClick={() => openModal("fixed", expense)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete("fixed", expense.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {fixedExpenses.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum gasto fixo cadastrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Projeções e Analytics */}
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <FinancialProjections 
            totalFixed={stats.totalFixed} 
            totalExtra={stats.totalExtra} 
            type="personal" 
          />
          <SpendingAnalytics 
            categories={stats.pieData} 
            total={stats.total} 
          />
        </section>

        {/* Gastos Extras */}
        <section className="mb-8">
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
                <AnimatePresence>
                  {extraExpenses.map((expense) => (
                    <motion.tr 
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4 text-muted-foreground text-sm">
                        {expense.data ? format(new Date(expense.data), "dd/MM/yyyy") : "-"}
                      </td>
                      <td className="p-4 text-foreground">{expense.nome}</td>
                      <td className="p-4 text-muted-foreground">{getCategoryLabel(expense.categoria)}</td>
                      <td className="p-4 text-right text-foreground font-medium">{formatCurrency(expense.valor)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <AttachmentButton
                            entityType="expense"
                            entityId={expense.id}
                            entityLabel={expense.nome}
                            variant="ghost"
                            size="icon"
                          />
                          <Button variant="ghost" size="icon" onClick={() => openModal("extra", expense)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete("extra", expense.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {extraExpenses.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum gasto extra cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal de Adicionar/Editar */}
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
                  placeholder="Ex: Academia"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input 
                  value={formData.valor} 
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  placeholder="Ex: 100,00"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
