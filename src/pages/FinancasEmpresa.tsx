// ============================================
// CENTRAL FINANÇAS EMPRESA v2.0
// Estilo Softcom - Igual à Central de Pagamentos
// Multi-CNPJ, Histórico 50 Anos, Anexos Funcionais
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, Check, Clock, AlertCircle, Trash2, Edit2,
  Filter, Calendar, Paperclip, Receipt, Wallet, DollarSign,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search,
  MoreVertical, FolderOpen, FolderClosed, Lock, Archive, RefreshCw,
  CalendarDays, CalendarRange, History, BarChart3, Sparkles, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UniversalAttachments } from "@/components/attachments/UniversalAttachments";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCompanyFinanceHistory, formatCompanyCurrency, type CompanyPeriodFilter, type CompanyExpense } from "@/hooks/useCompanyFinanceHistory";

interface AttachmentCount {
  [key: string]: number;
}

const EXPENSE_TYPES = [
  { value: "all", label: "📊 Todos", icon: Wallet, color: "bg-primary/20 text-primary" },
  { value: "fixed", label: "📌 Fixo", icon: Building2, color: "bg-red-500/20 text-red-500" },
  { value: "extra", label: "📋 Extra", icon: Receipt, color: "bg-blue-500/20 text-blue-500" },
];

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
  "Funcionário",
  "Site",
  "NOTA FISCAL",
  "Outros"
];

const PERIOD_OPTIONS = [
  { value: "hoje", label: "Hoje", icon: Clock },
  { value: "semana", label: "Semana", icon: CalendarDays },
  { value: "mes", label: "Mês", icon: Calendar },
  { value: "ano", label: "Ano", icon: CalendarRange },
  { value: "10anos", label: "10 Anos", icon: History },
  { value: "50anos", label: "50 Anos", icon: Archive },
];

type ViewMode = "expenses" | "months" | "years";

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

  // Estado local
  const [viewMode, setViewMode] = useState<ViewMode>("expenses");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"fixed" | "extra">("extra");
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [attachmentCounts, setAttachmentCounts] = useState<AttachmentCount>({});
  const [closeMonthDialogOpen, setCloseMonthDialogOpen] = useState(false);
  const [closeYearDialogOpen, setCloseYearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<CompanyExpense | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    categoria: "",
    data: format(new Date(), "yyyy-MM-dd"),
  });

  // Combinar todos os gastos
  const allExpenses = useMemo(() => {
    const combined = [
      ...fixedExpenses.map(e => ({ ...e, type: 'fixed' as const })),
      ...extraExpenses.map(e => ({ ...e, type: 'extra' as const }))
    ];

    let filtered = combined;
    if (activeTab !== "all") {
      filtered = combined.filter(e => e.type === activeTab);
    }
    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const dateA = a.data || a.created_at || '';
      const dateB = b.data || b.created_at || '';
      return dateB.localeCompare(dateA);
    });
  }, [fixedExpenses, extraExpenses, searchTerm, activeTab]);

  // Buscar contagem de anexos
  useEffect(() => {
    const fetchAttachmentCounts = async () => {
      const fixedIds = fixedExpenses.map(e => String(e.id));
      const extraIds = extraExpenses.map(e => String(e.id));
      
      const counts: AttachmentCount = {};
      
      if (fixedIds.length > 0) {
        const { data } = await supabase
          .from("universal_attachments")
          .select("entity_id")
          .eq("entity_type", "company_expense_fixed")
          .in("entity_id", fixedIds);
        (data || []).forEach(a => {
          counts[`fixed_${a.entity_id}`] = (counts[`fixed_${a.entity_id}`] || 0) + 1;
        });
      }
      
      if (extraIds.length > 0) {
        const { data } = await supabase
          .from("universal_attachments")
          .select("entity_id")
          .eq("entity_type", "company_expense_extra")
          .in("entity_id", extraIds);
        (data || []).forEach(a => {
          counts[`extra_${a.entity_id}`] = (counts[`extra_${a.entity_id}`] || 0) + 1;
        });
      }
      
      setAttachmentCounts(counts);
    };
    fetchAttachmentCounts();
  }, [fixedExpenses, extraExpenses]);

  const getAttachmentCount = (expense: CompanyExpense) => {
    return attachmentCounts[`${expense.type}_${expense.id}`] || 0;
  };

  const openModal = (type: "fixed" | "extra", expense?: CompanyExpense) => {
    setModalType(type);
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        nome: expense.nome,
        valor: String(expense.valor / 100),
        categoria: expense.categoria || "",
        data: expense.data || format(new Date(), "yyyy-MM-dd"),
      });
    } else {
      setEditingExpense(null);
      setFormData({
        nome: "",
        valor: "",
        categoria: "",
        data: format(new Date(), "yyyy-MM-dd"),
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.valor) {
      toast.error("Preencha nome e valor");
      return;
    }

    const valorCents = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);
    const table = modalType === "fixed" ? "company_fixed_expenses" : "company_extra_expenses";
    const dataRef = new Date(formData.data);

    try {
      const baseData = {
        nome: formData.nome,
        valor: valorCents,
        categoria: formData.categoria,
        ano: dataRef.getFullYear(),
        mes: dataRef.getMonth() + 1,
        semana: Math.ceil(dataRef.getDate() / 7),
        dia: dataRef.getDate(),
      };

      if (editingExpense) {
        const updateData: any = { ...baseData };
        if (modalType === "extra") updateData.data = formData.data;
        const { error } = await supabase.from(table).update(updateData).eq("id", editingExpense.id);
        if (error) throw error;
        toast.success("Gasto atualizado!");
      } else {
        const insertData: any = { ...baseData, created_by: user?.id };
        if (modalType === "extra") insertData.data = formData.data;
        const { error } = await supabase.from(table).insert(insertData);
        if (error) throw error;
        toast.success("Gasto adicionado!");
      }

      await refresh();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar gasto");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogOpen) return;
    const table = deleteDialogOpen.type === "fixed" ? "company_fixed_expenses" : "company_extra_expenses";
    
    try {
      // Deletar anexos primeiro
      await supabase
        .from("universal_attachments")
        .delete()
        .eq("entity_type", deleteDialogOpen.type === "fixed" ? "company_expense_fixed" : "company_expense_extra")
        .eq("entity_id", String(deleteDialogOpen.id));
      
      const { error } = await supabase.from(table).delete().eq("id", deleteDialogOpen.id);
      if (error) throw error;
      toast.success("Gasto removido!");
      await refresh();
    } catch (error) {
      toast.error("Erro ao remover gasto");
    }
    setDeleteDialogOpen(null);
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const getTypeBadge = (type: 'fixed' | 'extra') => {
    const t = EXPENSE_TYPES.find(x => x.value === type);
    return t ? <Badge className={cn("gap-1", t.color)}>{t.label}</Badge> : null;
  };

  const handleCloseMonth = async () => {
    await closeMonth(selectedYear, selectedMonth);
    setCloseMonthDialogOpen(false);
  };

  const handleCloseYear = async () => {
    await closeYear(selectedYear);
    setCloseYearDialogOpen(false);
  };

  const handleAttachmentChange = (expense: CompanyExpense, count: number) => {
    setAttachmentCounts(prev => ({ ...prev, [`${expense.type}_${expense.id}`]: count }));
  };

  // ================== RENDER STATS ==================
  const renderStatsCards = () => (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8"
    >
      <div className="glass-card rounded-2xl p-5 border-l-4 border-red-500">
        <div className="flex items-center justify-between mb-3">
          <Building2 className="h-6 w-6 text-red-500" />
          <Badge variant="outline" className="text-xs">{fixedExpenses.length}</Badge>
        </div>
        <p className="text-2xl font-bold text-red-400">{formatCompanyCurrency(stats.totalGastosFixos)}</p>
        <p className="text-sm text-muted-foreground">Gastos Fixos</p>
      </div>
      
      <div className="glass-card rounded-2xl p-5 border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-3">
          <Receipt className="h-6 w-6 text-blue-500" />
          <Badge variant="outline" className="text-xs">{extraExpenses.length}</Badge>
        </div>
        <p className="text-2xl font-bold text-blue-400">{formatCompanyCurrency(stats.totalGastosExtras)}</p>
        <p className="text-sm text-muted-foreground">Gastos Extras</p>
      </div>

      <div className="glass-card rounded-2xl p-5 border-l-4 border-purple-500">
        <div className="flex items-center justify-between mb-3">
          <DollarSign className="h-6 w-6 text-purple-500" />
          <Badge variant="outline" className="text-xs">{allExpenses.length}</Badge>
        </div>
        <p className="text-2xl font-bold text-purple-400">{formatCompanyCurrency(stats.totalGastos)}</p>
        <p className="text-sm text-muted-foreground">Total Gastos</p>
      </div>

      <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-green))]">
        <div className="flex items-center justify-between mb-3">
          <TrendingUp className="h-6 w-6 text-[hsl(var(--stats-green))]" />
          <Badge variant="outline" className="text-xs">{entradas.length}</Badge>
        </div>
        <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">{formatCompanyCurrency(stats.totalReceitas)}</p>
        <p className="text-sm text-muted-foreground">Receitas</p>
      </div>

      <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 gap-2">
        <Button onClick={() => openModal('fixed')} className="gap-2 w-full" variant="outline">
          <Plus className="h-4 w-4" /> Gasto Fixo
        </Button>
        <Button onClick={() => openModal('extra')} className="gap-2 w-full">
          <Plus className="h-4 w-4" /> Gasto Extra
        </Button>
      </div>
    </motion.section>
  );

  // ================== RENDER PERIOD NAV ==================
  const renderPeriodNavigation = () => (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = period === opt.value;
          return (
            <Button
              key={opt.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(opt.value as CompanyPeriodFilter)}
              className={cn("gap-2", isActive && "shadow-lg shadow-primary/25")}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{opt.label}</span>
            </Button>
          );
        })}
      </div>

      {(period === "mes" || period === "ano") && (
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {availableYears.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {period === "mes" && (
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{getMonthName(i + 1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2 ml-auto">
        <Button
          variant={viewMode === "expenses" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("expenses")}
          className="gap-2"
        >
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">Gastos</span>
        </Button>
        <Button
          variant={viewMode === "months" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("months")}
          className="gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Meses</span>
        </Button>
        <Button
          variant={viewMode === "years" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("years")}
          className="gap-2"
        >
          <Archive className="h-4 w-4" />
          <span className="hidden sm:inline">Anos</span>
        </Button>
      </div>
    </div>
  );

  // ================== RENDER MONTHS ==================
  const renderMonthFolders = () => {
    const months = getMonthsWithData(selectedYear);
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-primary" />
            Meses de {selectedYear}
          </h2>
          {!isYearClosed(selectedYear) && (
            <Button onClick={() => setCloseYearDialogOpen(true)} className="gap-2">
              <Lock className="h-4 w-4" /> Fechar Ano {selectedYear}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {allMonths.map((mes) => {
            const isClosed = isMonthClosed(selectedYear, mes);
            const hasData = months.includes(mes);
            const closure = getMonthClosure(selectedYear, mes);

            return (
              <motion.div
                key={mes}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedMonth(mes);
                  setPeriod("mes");
                  setViewMode("expenses");
                }}
                className={cn(
                  "glass-card rounded-xl p-4 cursor-pointer transition-all border-2",
                  isClosed
                    ? "border-[hsl(var(--stats-green))]/50 bg-[hsl(var(--stats-green))]/5"
                    : hasData
                      ? "border-primary/30 hover:border-primary/60"
                      : "border-border/30 opacity-60 hover:opacity-100"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  {isClosed ? (
                    <FolderClosed className="h-8 w-8 text-[hsl(var(--stats-green))]" />
                  ) : hasData ? (
                    <FolderOpen className="h-8 w-8 text-primary" />
                  ) : (
                    <FolderClosed className="h-8 w-8 text-muted-foreground" />
                  )}
                  {isClosed && <Lock className="h-4 w-4 text-[hsl(var(--stats-green))]" />}
                </div>
                <p className="font-semibold text-foreground">{getMonthName(mes)}</p>
                {closure && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCompanyCurrency(Number(closure.total_gastos_fixos || 0) + Number(closure.total_gastos_extras || 0))}
                  </p>
                )}
                {hasData && !isClosed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCloseMonthDialogOpen(true);
                    }}
                  >
                    <Lock className="h-3 w-3" /> Fechar
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // ================== RENDER YEARS ==================
  const renderYearFolders = () => {
    const currentYear = new Date().getFullYear();
    const yearsToShow = Array.from({ length: 61 }, (_, i) => currentYear - 10 + i);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Archive className="h-6 w-6 text-primary" />
          Arquivo de Anos (50 anos)
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {yearsToShow.map((ano) => {
            const isClosed = isYearClosed(ano);
            const hasData = yearsWithData.includes(ano);
            const closure = getYearClosure(ano);

            return (
              <motion.div
                key={ano}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedYear(ano);
                  setViewMode("months");
                }}
                className={cn(
                  "glass-card rounded-xl p-3 cursor-pointer transition-all border-2 text-center",
                  isClosed
                    ? "border-[hsl(var(--stats-green))]/50 bg-[hsl(var(--stats-green))]/5"
                    : hasData
                      ? "border-primary/30 hover:border-primary/60"
                      : "border-border/20 opacity-40 hover:opacity-70"
                )}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {isClosed ? (
                    <Lock className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                  ) : hasData ? (
                    <FolderOpen className="h-4 w-4 text-primary" />
                  ) : null}
                </div>
                <p className={cn("font-bold text-lg", ano === currentYear && "text-primary")}>{ano}</p>
                {closure && (
                  <p className="text-xs text-muted-foreground">
                    {formatCompanyCurrency(Number(closure.saldo_ano || 0))}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // ================== RENDER EXPENSES LIST ==================
  const renderExpensesList = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar gastos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
          {EXPENSE_TYPES.map(type => (
            <TabsTrigger key={type.value} value={type.value} className="gap-1">
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-bold text-white">Descrição</th>
                    <th className="text-left p-4 text-sm font-bold text-white">Tipo</th>
                    <th className="text-left p-4 text-sm font-bold text-white">Categoria</th>
                    <th className="text-left p-4 text-sm font-bold text-white">Data</th>
                    <th className="text-right p-4 text-sm font-bold text-white">Valor</th>
                    <th className="text-center p-4 text-sm font-bold text-white">Anexos</th>
                    <th className="text-right p-4 text-sm font-bold text-white">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {allExpenses.map((expense) => {
                    const rowKey = `${expense.type}_${expense.id}`;
                    const expenseDate = expense.data || expense.created_at || '';
                    
                    return (
                      <>
                        <tr
                          key={rowKey}
                          className={cn(
                            "border-t border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer",
                            expandedRows.has(rowKey) && "bg-secondary/20",
                            expense.fechado && "opacity-60"
                          )}
                          onClick={() => toggleRowExpand(rowKey)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {expandedRows.has(rowKey) ?
                                <ChevronUp className="h-4 w-4 text-muted-foreground" /> :
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              }
                              <div>
                                <p className="font-medium text-foreground">{expense.nome}</p>
                                {expense.fechado && (
                                  <Badge variant="outline" className="text-xs gap-1 mt-1">
                                    <Lock className="h-3 w-3" /> Fechado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{getTypeBadge(expense.type)}</td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">{expense.categoria || '-'}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">
                                {expenseDate ? format(new Date(expenseDate), "dd/MM/yyyy") : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-semibold text-red-400">
                            {formatCompanyCurrency(expense.valor)}
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant={getAttachmentCount(expense) > 0 ? "default" : "outline"}
                              className="gap-1"
                            >
                              <Paperclip className="h-3 w-3" />
                              {getAttachmentCount(expense)}
                            </Badge>
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              {!expense.fechado && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(expense.type, expense)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => toggleRowExpand(rowKey)}>
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    {expandedRows.has(rowKey) ? "Fechar Anexos" : "Ver Anexos"}
                                  </DropdownMenuItem>
                                  {!expense.fechado && (
                                    <DropdownMenuItem
                                      onClick={() => setDeleteDialogOpen(expense)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Row */}
                        <AnimatePresence>
                          {expandedRows.has(rowKey) && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <td colSpan={7} className="p-0 bg-secondary/10">
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="p-6 border-t border-border/30"
                                >
                                  <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        Detalhes do Gasto
                                      </h3>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <p className="text-muted-foreground">Valor</p>
                                          <p className="font-medium text-foreground">{formatCompanyCurrency(expense.valor)}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Tipo</p>
                                          <p className="font-medium text-foreground">{expense.type === 'fixed' ? 'Fixo' : 'Extra'}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Categoria</p>
                                          <p className="font-medium text-foreground">{expense.categoria || 'Não informada'}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Data</p>
                                          <p className="font-medium text-foreground">
                                            {expenseDate ? format(new Date(expenseDate), "dd/MM/yyyy") : '-'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <UniversalAttachments
                                        entityType={expense.type === 'fixed' ? 'company_expense_fixed' : 'company_expense_extra'}
                                        entityId={String(expense.id)}
                                        title="Comprovantes e Anexos"
                                        maxFiles={20}
                                        showAIExtraction={true}
                                        onAttachmentChange={(count) => handleAttachmentChange(expense, count)}
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </>
                    );
                  })}
                  {allExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Receipt className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">Nenhum gasto encontrado</p>
                          <div className="flex gap-2">
                            <Button onClick={() => openModal('fixed')} variant="outline" className="gap-2">
                              <Plus className="h-4 w-4" /> Gasto Fixo
                            </Button>
                            <Button onClick={() => openModal('extra')} className="gap-2">
                              <Plus className="h-4 w-4" /> Gasto Extra
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="space-y-2">
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Central Financeira</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Finanças Empresa
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Sistema completo estilo Softcom com fechamento de mês/ano e histórico de 50 anos.
            </p>
          </div>
        </motion.header>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Period Navigation */}
        {renderPeriodNavigation()}

        {/* Content */}
        {viewMode === "expenses" && renderExpensesList()}
        {viewMode === "months" && renderMonthFolders()}
        {viewMode === "years" && renderYearFolders()}

        {/* Modal de Novo/Editar Gasto */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {modalType === 'fixed' ? <Building2 className="h-5 w-5 text-red-500" /> : <Receipt className="h-5 w-5 text-blue-500" />}
                {editingExpense ? "Editar" : "Novo"} Gasto {modalType === 'fixed' ? 'Fixo' : 'Extra'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="font-bold text-white">Descrição *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Aluguel, Internet, Software..."
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bold text-white">Valor (R$) *</Label>
                  <Input
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0,00"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="font-bold text-white">Data</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="font-bold text-white">Categoria</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingExpense && (
                <div className="border-t pt-4">
                  <UniversalAttachments
                    entityType={editingExpense.type === 'fixed' ? 'company_expense_fixed' : 'company_expense_extra'}
                    entityId={String(editingExpense.id)}
                    title="Comprovantes e Anexos"
                    maxFiles={20}
                    showAIExtraction={true}
                    onAttachmentChange={(count) => handleAttachmentChange(editingExpense, count)}
                  />
                </div>
              )}

              <Button onClick={handleSave} className="w-full gap-2">
                <Check className="h-4 w-4" />
                {editingExpense ? "Salvar Alterações" : "Adicionar Gasto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Fechar Mês */}
        <AlertDialog open={closeMonthDialogOpen} onOpenChange={setCloseMonthDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fechar Mês</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a fechar {getMonthName(selectedMonth)} de {selectedYear}. 
                Após o fechamento, os gastos deste período não poderão mais ser editados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCloseMonth}>
                <Lock className="h-4 w-4 mr-2" /> Fechar Mês
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog Fechar Ano */}
        <AlertDialog open={closeYearDialogOpen} onOpenChange={setCloseYearDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fechar Ano</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a fechar o ano de {selectedYear}. 
                Após o fechamento, nenhum gasto deste ano poderá ser editado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCloseYear}>
                <Lock className="h-4 w-4 mr-2" /> Fechar Ano
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog Confirmar Exclusão */}
        <AlertDialog open={!!deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Excluir Gasto</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deleteDialogOpen?.nome}"? 
                Esta ação não pode ser desfeita e todos os anexos serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
