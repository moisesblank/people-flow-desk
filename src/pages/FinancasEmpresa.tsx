// ============================================
// CENTRAL FINANÇAS EMPRESA - ESTILO SOFTCOM
// Multi-CNPJ, Histórico 50+ anos, Anexos
// ============================================

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Building2, Trash2, Edit2, Phone, TrendingUp, TrendingDown,
  PieChart as PieChartIcon, DollarSign, Wallet, Receipt, History, 
  RefreshCw, Calendar, ChevronDown, ChevronRight, Lock, Unlock,
  FolderOpen, Folder, CheckCircle, AlertCircle, FileText, Search,
  Download, Upload, Paperclip, Eye, EyeOff
} from "lucide-react";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { CyberBackground } from "@/components/ui/cyber-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/employees/StatCard";
import { MultiCNPJManager } from "@/components/finance/MultiCNPJManager";
import { FinancialHistoryChart } from "@/components/finance/FinancialHistoryChart";
import { MonthlySnapshotCard } from "@/components/finance/MonthlySnapshotCard";
import { UniversalAttachments } from "@/components/attachments/UniversalAttachments";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyFinanceHistory, formatCompanyCurrency, type CompanyPeriodFilter, type CompanyExpense } from "@/hooks/useCompanyFinanceHistory";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ASSESSORS = {
  moises: { name: "Moisés", phone: "5583998920105", whatsapp: "558398920105" },
  bruna: { name: "Bruna", phone: "5583996354090", whatsapp: "558396354090" },
};

const CATEGORIAS = [
  "Folha de Pagamento",
  "Aluguel",
  "Energia",
  "Internet",
  "Telefone",
  "Marketing",
  "Software/SaaS",
  "Impostos",
  "Contador",
  "Material de Escritório",
  "Equipamentos",
  "Manutenção",
  "Viagens",
  "Alimentação",
  "Transporte",
  "Outros"
];

export default function FinancasEmpresa() {
  const { user } = useAuth();
  const {
    period, setPeriod,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    isLoading,
    fixedExpenses, extraExpenses, entradas,
    monthlyClosures, yearlyClosures,
    stats, chartData, availableYears,
    closeMonth, closeYear, refresh,
    isMonthClosed, isYearClosed,
    getMonthClosure, getYearClosure,
    yearsWithData, getMonthsWithData,
    getMonthName
  } = useCompanyFinanceHistory();

  // Estados locais
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"fixed" | "extra">("fixed");
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null);
  const [formData, setFormData] = useState({ nome: "", valor: "", categoria: "", data: format(new Date(), "yyyy-MM-dd") });
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedExpense, setExpandedExpense] = useState<number | null>(null);
  const [showCloseMonthDialog, setShowCloseMonthDialog] = useState(false);
  const [showCloseYearDialog, setShowCloseYearDialog] = useState(false);
  const [viewClosureDialog, setViewClosureDialog] = useState<{ type: 'month' | 'year', ano: number, mes?: number } | null>(null);
  const [expandedYear, setExpandedYear] = useState<number | null>(new Date().getFullYear());
  const [showYearFolders, setShowYearFolders] = useState(false);
  const [showMonthFolders, setShowMonthFolders] = useState(true);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});

  // Combinar gastos para listagem
  const allExpenses = useMemo(() => {
    const combined = [
      ...fixedExpenses.map(e => ({ ...e, type: 'fixed' as const })),
      ...extraExpenses.map(e => ({ ...e, type: 'extra' as const }))
    ];
    
    if (searchTerm) {
      return combined.filter(e => 
        e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return combined.sort((a, b) => {
      const dateA = a.data || a.created_at || '';
      const dateB = b.data || b.created_at || '';
      return dateB.localeCompare(dateA);
    });
  }, [fixedExpenses, extraExpenses, searchTerm]);

  // Dados para gráfico de pizza
  const pieData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    allExpenses.forEach((expense) => {
      const cat = expense.categoria || "Outros";
      categoryMap[cat] = (categoryMap[cat] || 0) + expense.valor;
    });
    
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f43f5e"];
    
    return Object.entries(categoryMap)
      .filter(([_, value]) => value > 0)
      .map(([key, value], index) => ({
        name: key,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [allExpenses]);

  // Modal handlers
  const openModal = (type: "fixed" | "extra", expense?: CompanyExpense) => {
    setModalType(type);
    setEditingExpense(expense || null);
    setFormData(expense 
      ? { nome: expense.nome, valor: String(expense.valor / 100), categoria: expense.categoria || "", data: expense.data || format(new Date(), "yyyy-MM-dd") }
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
    const dataRef = modalType === "extra" ? new Date(formData.data) : new Date();

    try {
      const baseData = {
        nome: formData.nome,
        valor: valorCents,
        categoria: formData.categoria,
        ano: dataRef.getFullYear(),
        mes: dataRef.getMonth() + 1,
        semana: Math.ceil(dataRef.getDate() / 7),
        dia: dataRef.getDate()
      };

      if (editingExpense) {
        const updateData: any = { ...baseData };
        if (modalType === "extra") {
          updateData.data = formData.data;
        }
        const { error } = await supabase.from(table).update(updateData).eq("id", editingExpense.id);
        if (error) throw error;
        toast.success("Gasto atualizado!");
      } else {
        const insertData: any = {
          ...baseData,
          created_by: user?.id,
        };
        if (modalType === "extra") {
          insertData.data = formData.data;
        }
        const { error } = await supabase.from(table).insert(insertData);
        if (error) throw error;
        toast.success("Gasto adicionado!");
      }

      await refresh();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving expense:", error);
      toast.error(error.message || "Erro ao salvar gasto");
    }
  };

  const handleDelete = async (expense: CompanyExpense) => {
    const table = expense.type === "fixed" ? "company_fixed_expenses" : "company_extra_expenses";
    
    try {
      const { error } = await supabase.from(table).delete().eq("id", expense.id);
      if (error) throw error;
      toast.success("Gasto removido!");
      await refresh();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Erro ao remover gasto");
    }
  };

  const contactAssessor = (assessor: 'moises' | 'bruna') => {
    const data = ASSESSORS[assessor];
    window.open(`https://wa.me/${data.whatsapp}?text=Olá ${data.name}, preciso de ajuda com as finanças da empresa!`, '_blank');
  };

  const handleCloseMonth = async () => {
    await closeMonth(selectedYear, selectedMonth);
    setShowCloseMonthDialog(false);
  };

  const handleCloseYear = async () => {
    await closeYear(selectedYear);
    setShowCloseYearDialog(false);
  };

  // Tendência
  const tendencia = useMemo(() => {
    if (chartData.length < 2) return { direction: "stable" as const, percent: 0 };
    const current = chartData[chartData.length - 1]?.despesas || 0;
    const previous = chartData[chartData.length - 2]?.despesas || 0;
    if (previous === 0) return { direction: "stable" as const, percent: 0 };
    const percent = ((current - previous) / previous) * 100;
    return {
      direction: percent > 5 ? "up" as const : percent < -5 ? "down" as const : "stable" as const,
      percent
    };
  }, [chartData]);

  return (
    <div className="relative min-h-screen">
      <CyberBackground variant="particles" />
      
      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <FuturisticPageHeader
            title="Finanças Empresa"
            subtitle="Central Financeira Empresarial • Histórico de 50+ Anos"
            icon={Building2}
            badge="QUANTUM FINANCE"
            accentColor="green"
            stats={[
              { label: "Gastos Fixos", value: formatCompanyCurrency(stats.totalGastosFixos), icon: Wallet },
              { label: "Gastos Extras", value: formatCompanyCurrency(stats.totalGastosExtras), icon: Receipt },
              { label: "Total Gastos", value: formatCompanyCurrency(stats.totalGastos), icon: DollarSign },
              { label: "Receitas", value: formatCompanyCurrency(stats.totalReceitas), icon: TrendingUp },
            ]}
          />

          {/* Controles de Período */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Botões de período */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "hoje", label: "Hoje" },
                  { key: "semana", label: "Semana" },
                  { key: "mes", label: "Mês" },
                  { key: "ano", label: "Ano" },
                  { key: "10anos", label: "10 Anos" },
                  { key: "50anos", label: "50 Anos" }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={period === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPeriod(key as CompanyPeriodFilter)}
                    className={period === key ? "bg-primary" : ""}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Seletores de ano/mês */}
              <div className="flex items-center gap-2">
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.filter(y => y >= 2020 && y <= 2075).map((year) => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {getMonthName(i + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={refresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Ações de fechamento */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCloseMonthDialog(true)}
                  disabled={isMonthClosed(selectedYear, selectedMonth)}
                  className="gap-1"
                >
                  {isMonthClosed(selectedYear, selectedMonth) ? (
                    <><Lock className="h-3 w-3" /> Mês Fechado</>
                  ) : (
                    <><Unlock className="h-3 w-3" /> Fechar Mês</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCloseYearDialog(true)}
                  disabled={isYearClosed(selectedYear)}
                  className="gap-1"
                >
                  {isYearClosed(selectedYear) ? (
                    <><Lock className="h-3 w-3" /> Ano Fechado</>
                  ) : (
                    <><Unlock className="h-3 w-3" /> Fechar Ano</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Gráfico de Evolução */}
          <FinancialHistoryChart
            data={chartData}
            period={period === "mes" ? "mensal" : period === "ano" ? "anual" : "mensal"}
            tendencia={tendencia.direction}
            variacaoPercent={tendencia.percent}
          />

          {/* Pastas de Anos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Histórico por Ano
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowYearFolders(!showYearFolders)}>
                {showYearFolders ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {showYearFolders && (
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-4">
                  {yearsWithData.slice(0, 20).map((ano) => {
                    const closure = getYearClosure(ano);
                    const monthsCount = getMonthsWithData(ano).length;
                    
                    return (
                      <motion.div
                        key={ano}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedYear(ano);
                          setExpandedYear(expandedYear === ano ? null : ano);
                        }}
                        className={`flex-shrink-0 cursor-pointer rounded-xl p-4 border transition-all ${
                          expandedYear === ano 
                            ? "border-primary bg-primary/10" 
                            : "border-border/50 hover:border-primary/50 bg-card/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {closure ? (
                            <Lock className="h-4 w-4 text-green-500" />
                          ) : (
                            <Folder className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="font-bold">{ano}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{monthsCount} meses</p>
                        {closure && (
                          <p className="text-xs text-green-500 mt-1">
                            {formatCompanyCurrency(Number(closure.saldo_ano))}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </motion.div>

          {/* Pastas de Meses do Ano Selecionado */}
          <AnimatePresence>
            {showMonthFolders && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Meses de {selectedYear}
                  </h3>
                </div>

                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-4">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                      const closure = getMonthClosure(selectedYear, mes);
                      const isClosed = isMonthClosed(selectedYear, mes);
                      
                      return (
                        <motion.div
                          key={mes}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedMonth(mes);
                            if (closure) {
                              setViewClosureDialog({ type: 'month', ano: selectedYear, mes });
                            }
                          }}
                          className={`flex-shrink-0 cursor-pointer rounded-xl p-4 border transition-all min-w-[120px] ${
                            selectedMonth === mes 
                              ? "border-primary bg-primary/10" 
                              : "border-border/50 hover:border-primary/50 bg-card/50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {isClosed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="font-medium text-sm">{getMonthName(mes)}</span>
                          </div>
                          {closure && (
                            <>
                              <p className="text-xs text-muted-foreground">
                                {closure.qtd_gastos_fixos + closure.qtd_gastos_extras} gastos
                              </p>
                              <p className={`text-xs mt-1 ${Number(closure.saldo_periodo) >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {formatCompanyCurrency(Number(closure.saldo_periodo))}
                              </p>
                            </>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-lg">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="gastos">Gastos</TabsTrigger>
              <TabsTrigger value="multicnpj">Multi-CNPJ</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Tab Overview */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Gastos Fixos" value={stats.totalGastosFixos} formatFn={formatCompanyCurrency} icon={Wallet} variant="red" delay={0} />
                <StatCard title="Gastos Extras" value={stats.totalGastosExtras} formatFn={formatCompanyCurrency} icon={Receipt} variant="purple" delay={1} />
                <StatCard title="Receitas" value={stats.totalReceitas} formatFn={formatCompanyCurrency} icon={TrendingUp} variant="green" delay={2} />
                <StatCard title="Saldo" value={stats.saldo} formatFn={formatCompanyCurrency} icon={DollarSign} variant={stats.saldo >= 0 ? "green" : "red"} delay={3} />
              </section>

              {/* Charts */}
              <section className="grid gap-6 lg:grid-cols-2">
                {pieData.length > 0 && (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5 text-primary" />
                        Distribuição por Categoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                              formatter={(value: number) => formatCompanyCurrency(value)}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comparativo Fixos vs Extras */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-primary" />
                      Fixos vs Extras
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: "Fixos", valor: stats.totalGastosFixos / 100, fill: "#ef4444" },
                          { name: "Extras", valor: stats.totalGastosExtras / 100, fill: "#8b5cf6" }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                          <YAxis stroke="hsl(var(--foreground))" tickFormatter={(v) => `R$ ${v.toLocaleString()}`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`R$ ${value.toLocaleString()}`, "Valor"]}
                          />
                          <Bar dataKey="valor" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Snapshots Mensais */}
              {monthlyClosures.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Balanços Mensais Fechados
                  </h3>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-4">
                      {monthlyClosures.slice(0, 12).map((closure) => (
                        <MonthlySnapshotCard
                          key={`${closure.ano}-${closure.mes}`}
                          ano={closure.ano}
                          mes={closure.mes}
                          receitas={Number(closure.total_receitas)}
                          despesas={Number(closure.total_gastos_fixos) + Number(closure.total_gastos_extras)}
                          saldo={Number(closure.saldo_periodo)}
                          isFechado={true}
                          compact
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </section>
              )}
            </TabsContent>

            {/* Tab Gastos */}
            <TabsContent value="gastos" className="space-y-6">
              {/* Ações */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar gastos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => openModal("fixed")} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Gasto Fixo
                  </Button>
                  <Button onClick={() => openModal("extra")} variant="secondary" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Gasto Extra
                  </Button>
                </div>
              </div>

              {/* Tabela de Gastos */}
              <Card className="glass-card">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-10">Anexos</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : allExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Nenhum gasto encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        allExpenses.map((expense) => (
                          <Collapsible key={`${expense.type}-${expense.id}`} open={expandedExpense === expense.id}>
                            <TableRow className="group hover:bg-muted/50">
                              <TableCell>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setExpandedExpense(expandedExpense === expense.id ? null : expense.id)}
                                  >
                                    {expandedExpense === expense.id ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              </TableCell>
                              <TableCell className="font-medium">{expense.nome}</TableCell>
                              <TableCell>
                                <Badge variant={expense.type === "fixed" ? "destructive" : "secondary"}>
                                  {expense.type === "fixed" ? "Fixo" : "Extra"}
                                </Badge>
                              </TableCell>
                              <TableCell>{expense.categoria || "-"}</TableCell>
                              <TableCell>
                                {expense.data 
                                  ? format(new Date(expense.data), "dd/MM/yyyy")
                                  : expense.created_at 
                                    ? format(new Date(expense.created_at), "dd/MM/yyyy")
                                    : "-"
                                }
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-red-500">
                                {formatCompanyCurrency(expense.valor)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="gap-1">
                                  <Paperclip className="h-3 w-3" />
                                  {getAttachmentCount(`company_expense_${expense.type}`, String(expense.id))}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openModal(expense.type, expense)}
                                    disabled={expense.fechado}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => handleDelete(expense)}
                                    disabled={expense.fechado}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            <CollapsibleContent asChild>
                              <TableRow>
                                <TableCell colSpan={8} className="bg-muted/30 p-4">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Ano</p>
                                        <p className="font-medium">{expense.ano}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Mês</p>
                                        <p className="font-medium">{expense.mes ? getMonthName(expense.mes) : "-"}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Semana</p>
                                        <p className="font-medium">{expense.semana || "-"}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <Badge variant={expense.fechado ? "default" : "secondary"}>
                                          {expense.fechado ? "Fechado" : "Aberto"}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-2">Anexos e Comprovantes</p>
                                      <UniversalAttachments
                                        entityType={`company_expense_${expense.type}`}
                                        entityId={String(expense.id)}
                                        allowUpload={!expense.fechado}
                                        maxFiles={10}
                                        compact
                                      />
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleContent>
                          </Collapsible>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Multi-CNPJ */}
            <TabsContent value="multicnpj">
              <MultiCNPJManager />
            </TabsContent>

            {/* Tab Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Analytics Avançado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">Média Mensal de Gastos</p>
                      <p className="text-2xl font-bold">
                        {formatCompanyCurrency(monthlyClosures.length > 0 
                          ? monthlyClosures.reduce((acc, c) => acc + Number(c.total_gastos_fixos) + Number(c.total_gastos_extras), 0) / monthlyClosures.length
                          : 0
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">Meses Fechados</p>
                      <p className="text-2xl font-bold">{monthlyClosures.length}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">Anos com Dados</p>
                      <p className="text-2xl font-bold">{yearsWithData.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Contatos */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => contactAssessor('moises')} className="gap-2">
              <Phone className="h-4 w-4 text-green-400" />
              Moisés
            </Button>
            <Button variant="outline" onClick={() => contactAssessor('bruna')} className="gap-2">
              <Phone className="h-4 w-4 text-emerald-400" />
              Bruna
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Gasto */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Editar" : "Novo"} Gasto {modalType === "fixed" ? "Fixo" : "Extra"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Aluguel do escritório"
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                type="text"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {modalType === "extra" && (
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Fechar Mês */}
      <Dialog open={showCloseMonthDialog} onOpenChange={setShowCloseMonthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Mês</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Você está prestes a fechar o mês de <strong>{getMonthName(selectedMonth)}/{selectedYear}</strong>.
          </p>
          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <p>Gastos Fixos: <strong className="text-red-500">{formatCompanyCurrency(stats.totalGastosFixos)}</strong></p>
            <p>Gastos Extras: <strong className="text-purple-500">{formatCompanyCurrency(stats.totalGastosExtras)}</strong></p>
            <p>Total Gastos: <strong>{formatCompanyCurrency(stats.totalGastos)}</strong></p>
            <p>Receitas: <strong className="text-green-500">{formatCompanyCurrency(stats.totalReceitas)}</strong></p>
            <p>Saldo: <strong className={stats.saldo >= 0 ? "text-green-500" : "text-red-500"}>{formatCompanyCurrency(stats.saldo)}</strong></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseMonthDialog(false)}>Cancelar</Button>
            <Button onClick={handleCloseMonth}>Confirmar Fechamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Fechar Ano */}
      <Dialog open={showCloseYearDialog} onOpenChange={setShowCloseYearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Consolidar Ano</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Você está prestes a consolidar o ano de <strong>{selectedYear}</strong>.
          </p>
          <p className="text-sm text-yellow-500">
            ⚠️ Certifique-se de que todos os meses foram fechados antes de consolidar o ano.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseYearDialog(false)}>Cancelar</Button>
            <Button onClick={handleCloseYear}>Confirmar Consolidação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Fechamento */}
      <Dialog open={!!viewClosureDialog} onOpenChange={() => setViewClosureDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewClosureDialog?.type === 'month' 
                ? `Fechamento ${getMonthName(viewClosureDialog?.mes || 1)}/${viewClosureDialog?.ano}`
                : `Consolidação ${viewClosureDialog?.ano}`
              }
            </DialogTitle>
          </DialogHeader>
          {viewClosureDialog?.type === 'month' && viewClosureDialog.mes && (
            (() => {
              const closure = getMonthClosure(viewClosureDialog.ano, viewClosureDialog.mes);
              if (!closure) return null;
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-red-500/10">
                      <p className="text-xs text-muted-foreground">Gastos Fixos</p>
                      <p className="text-lg font-bold text-red-500">{formatCompanyCurrency(Number(closure.total_gastos_fixos))}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <p className="text-xs text-muted-foreground">Gastos Extras</p>
                      <p className="text-lg font-bold text-purple-500">{formatCompanyCurrency(Number(closure.total_gastos_extras))}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <p className="text-xs text-muted-foreground">Receitas</p>
                      <p className="text-lg font-bold text-green-500">{formatCompanyCurrency(Number(closure.total_receitas))}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${Number(closure.saldo_periodo) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className={`text-lg font-bold ${Number(closure.saldo_periodo) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCompanyCurrency(Number(closure.saldo_periodo))}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fechado em: {format(new Date(closure.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              );
            })()
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}