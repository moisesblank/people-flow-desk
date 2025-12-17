// ============================================
// EMPRESARIAL 2.0 - FINANÇAS EMPRESA
// Multi-CNPJ, Analytics avançado conforme AJUDA5
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, Trash2, Edit2, Phone, TrendingUp, AlertTriangle, PieChart as PieChartIcon, DollarSign, Wallet, Receipt, Sparkles } from "lucide-react";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { CyberBackground } from "@/components/ui/cyber-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/employees/StatCard";
import { MultiCNPJManager } from "@/components/finance/MultiCNPJManager";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from "recharts";

// Dados dos assessores conforme AJUDA5
const ASSESSORS = {
  moises: { name: "Moisés", phone: "5583998920105", whatsapp: "558398920105" },
  bruna: { name: "Bruna", phone: "5583996354090", whatsapp: "558396354090" },
};

interface Expense {
  id: number;
  nome: string;
  valor: number;
  categoria: string;
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
  const [formData, setFormData] = useState({ nome: "", valor: "", categoria: "" });
  const [activeTab, setActiveTab] = useState("overview");

  const fetchExpenses = async () => {
    try {
      const [fixedRes, extraRes] = await Promise.all([
        supabase.from("company_fixed_expenses").select("*").order("nome"),
        supabase.from("company_extra_expenses").select("*").order("created_at", { ascending: false }),
      ]);

      if (fixedRes.error) throw fixedRes.error;
      if (extraRes.error) throw extraRes.error;

      setFixedExpenses(fixedRes.data?.map(e => ({
        id: e.id,
        nome: e.nome,
        valor: e.valor,
        categoria: e.categoria || "",
      })) || []);

      setExtraExpenses(extraRes.data?.map(e => ({
        id: e.id,
        nome: e.nome,
        valor: e.valor,
        categoria: e.categoria || "",
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

  const stats = useMemo(() => {
    const totalFixed = fixedExpenses.reduce((acc, e) => acc + e.valor, 0);
    const totalExtra = extraExpenses.reduce((acc, e) => acc + e.valor, 0);
    
    // Process category data for charts
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

    // Dados mensais simulados para projeção
    const monthlyData = [
      { month: "Jan", fixed: totalFixed * 0.9, extra: totalExtra * 0.8 },
      { month: "Fev", fixed: totalFixed * 0.95, extra: totalExtra * 0.9 },
      { month: "Mar", fixed: totalFixed, extra: totalExtra * 1.1 },
      { month: "Abr", fixed: totalFixed, extra: totalExtra * 0.95 },
      { month: "Mai", fixed: totalFixed, extra: totalExtra },
      { month: "Jun", fixed: totalFixed * 1.05, extra: totalExtra * 1.15 },
    ];
    
    return { totalFixed, totalExtra, total: totalFixed + totalExtra, pieData, monthlyData };
  }, [fixedExpenses, extraExpenses]);

  const openModal = (type: "fixed" | "extra", expense?: Expense) => {
    setModalType(type);
    setEditingExpense(expense || null);
    setFormData(expense 
      ? { nome: expense.nome, valor: String(expense.valor / 100), categoria: expense.categoria }
      : { nome: "", valor: "", categoria: "" }
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
        const { error } = await supabase
          .from(table)
          .update({ nome: formData.nome, valor: valorCents, categoria: formData.categoria })
          .eq("id", editingExpense.id);
        if (error) throw error;
        toast.success("Gasto atualizado!");
      } else {
        const { error } = await supabase.from(table).insert({
          nome: formData.nome,
          valor: valorCents,
          categoria: formData.categoria,
          created_by: user?.id,
        });
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
          {/* Futuristic Header */}
          <FuturisticPageHeader
            title="Finanças Empresa"
            subtitle="Gestão Financeira Inteligente com Multi-CNPJ"
            icon={Building2}
            badge="QUANTUM FINANCE"
            accentColor="green"
            stats={[
              { label: "Gastos Fixos", value: formatCurrency(stats.totalFixed), icon: Wallet },
              { label: "Gastos Extras", value: formatCurrency(stats.totalExtra), icon: Receipt },
              { label: "Total Mensal", value: formatCurrency(stats.total), icon: DollarSign },
            ]}
          />

          {/* Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-end gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => contactAssessor('moises')}
              className="gap-1 border-green-500/30 hover:border-green-500/60 hover:bg-green-500/10"
            >
              <Phone className="h-3 w-3 text-green-400" />
              Moisés
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => contactAssessor('bruna')}
              className="gap-1 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10"
            >
              <Phone className="h-3 w-3 text-emerald-400" />
              Bruna
            </Button>
          </motion.div>

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

            {/* Charts Row */}
            <section className="grid gap-6 lg:grid-cols-2">
              {/* Pie Chart */}
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

              {/* Bar Chart - Fixed vs Extra */}
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
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        width={85}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </section>

            {/* Fixed Expenses */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Gastos Fixos (Funcionários + Serviços)</h2>
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

            {/* Extra Expenses */}
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
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoria</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraExpenses.map((expense) => (
                      <tr key={expense.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
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
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum gasto extra cadastrado</td></tr>
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
            {/* Projeção Mensal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução de Gastos (6 meses)
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyData}>
                    <defs>
                      <linearGradient id="colorFixed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExtra" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$ ${(v/100).toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="fixed" name="Fixos" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorFixed)" />
                    <Area type="monotone" dataKey="extra" name="Extras" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorExtra)" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Alertas Financeiros */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--stats-gold))]" />
                Alertas e Insights
              </h3>
              <div className="space-y-3">
                {stats.total > 5000000 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Gastos elevados</p>
                      <p className="text-sm text-muted-foreground">Os gastos totais ultrapassaram R$ 50.000</p>
                    </div>
                  </div>
                )}
                {stats.totalExtra > stats.totalFixed * 0.5 && (
                  <div className="p-3 rounded-lg bg-[hsl(var(--stats-gold))]/10 border border-[hsl(var(--stats-gold))]/20 flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-[hsl(var(--stats-gold))]" />
                    <div>
                      <p className="font-medium text-[hsl(var(--stats-gold))]">Gastos extras altos</p>
                      <p className="text-sm text-muted-foreground">Gastos extras representam mais de 50% dos fixos</p>
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-[hsl(var(--stats-green))]/10 border border-[hsl(var(--stats-green))]/20 flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[hsl(var(--stats-green))]" />
                  <div>
                    <p className="font-medium text-[hsl(var(--stats-green))]">Dica de economia</p>
                    <p className="text-sm text-muted-foreground">Analise gastos na categoria com maior participação para possíveis reduções</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar" : "Novo"} Gasto {modalType === "fixed" ? "Fixo" : "Extra"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nome</Label>
                <Input 
                  value={formData.nome} 
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Manychat"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input 
                  value={formData.valor} 
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  placeholder="Ex: 750,00"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input 
                  value={formData.categoria} 
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                  placeholder="Ex: Serviços Externos"
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
