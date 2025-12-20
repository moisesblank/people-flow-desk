// ============================================
// MOISÉS MEDEIROS v15.0 - ENTERPRISE FINANCE VAULT
// Sistema Financeiro de Multinacional - Ano 2300
// Central Financeira Futurística com IA
// ============================================

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Plus, Check, Clock, AlertCircle, Trash2, Edit2,
  Filter, Calendar, Paperclip, Receipt, Wallet, DollarSign,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search,
  MoreVertical, FolderOpen, FolderClosed, Lock, Archive, RefreshCw,
  CalendarDays, CalendarRange, History, BarChart3, Sparkles, TrendingUp,
  CircleDollarSign, AlertTriangle, CheckCircle2, XCircle, Bell,
  Brain, Zap, Shield, Activity, PieChart, TrendingDown, CreditCard,
  Banknote, ArrowUpRight, ArrowDownRight, Target, Gauge, Eye,
  Download, Upload, Settings2, LayoutGrid, LayoutList, Grid3X3, List,
  Layers, Database, Globe, Command, Cpu, Home, FileText, FileSpreadsheet,
  Bot, Star, Bookmark, Info, Copy
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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UniversalAttachments } from "@/components/attachments/UniversalAttachments";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCompanyFinanceHistory, formatCompanyCurrency, type CompanyPeriodFilter, type CompanyExpense, type PaymentStatus } from "@/hooks/useCompanyFinanceHistory";

interface AttachmentCount {
  [key: string]: number;
}

const EXPENSE_TYPES = [
  { value: "all", label: "Todos", icon: Wallet, color: "from-primary/20 to-primary/5" },
  { value: "fixed", label: "Fixos", icon: Building2, color: "from-red-500/20 to-red-500/5" },
  { value: "extra", label: "Extras", icon: Receipt, color: "from-blue-500/20 to-blue-500/5" },
];

const CATEGORIAS = [
  "Folha de Pagamento", "Aluguel", "Energia", "Internet", "Telefone",
  "Marketing", "Software/SaaS", "Impostos", "Contador", "Material de Escritório",
  "Equipamentos", "Manutenção", "Viagens", "Alimentação", "Transporte",
  "Funcionário", "Site", "NOTA FISCAL", "Outros"
];

const PERIOD_OPTIONS = [
  { value: "hoje", label: "Hoje", icon: Clock },
  { value: "semana", label: "Semana", icon: CalendarDays },
  { value: "mes", label: "Mês", icon: Calendar },
  { value: "ano", label: "Ano", icon: CalendarRange },
  { value: "10anos", label: "10 Anos", icon: History },
  { value: "50anos", label: "50 Anos", icon: Archive },
];

type ViewMode = "dashboard" | "expenses" | "months" | "years";

const STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string; icon: typeof Check }> = {
  pendente: { bg: "bg-yellow-500/20", text: "text-yellow-500", icon: Clock },
  pago: { bg: "bg-green-500/20", text: "text-green-500", icon: Check },
  atrasado: { bg: "bg-red-500/20", text: "text-red-500", icon: AlertCircle },
};

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
    getMonthName,
    updatePaymentStatus
  } = useCompanyFinanceHistory();

  // Estado local
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"fixed" | "extra">("extra");
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState<"grid" | "list">("list");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [attachmentCounts, setAttachmentCounts] = useState<AttachmentCount>({});
  const [closeMonthDialogOpen, setCloseMonthDialogOpen] = useState(false);
  const [closeYearDialogOpen, setCloseYearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<CompanyExpense | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"data" | "valor" | "nome">("data");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    categoria: "",
    data: format(new Date(), "yyyy-MM-dd"),
    data_vencimento: "",
    status_pagamento: "pendente" as PaymentStatus,
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
      let comparison = 0;
      if (sortBy === "data") {
        const dateA = a.data || a.created_at || '';
        const dateB = b.data || b.created_at || '';
        comparison = dateA.localeCompare(dateB);
      } else if (sortBy === "valor") {
        comparison = a.valor - b.valor;
      } else if (sortBy === "nome") {
        comparison = a.nome.localeCompare(b.nome);
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });
  }, [fixedExpenses, extraExpenses, searchTerm, activeTab, sortBy, sortOrder]);

  // Stats calculados
  const calculatedStats = useMemo(() => {
    const totalFixo = fixedExpenses.reduce((sum, e) => sum + e.valor, 0);
    const totalExtra = extraExpenses.reduce((sum, e) => sum + e.valor, 0);
    const totalPago = allExpenses.filter(e => e.status_pagamento === 'pago').reduce((sum, e) => sum + e.valor, 0);
    const totalPendente = allExpenses.filter(e => e.status_pagamento === 'pendente').reduce((sum, e) => sum + e.valor, 0);
    const totalAtrasado = allExpenses.filter(e => e.status_pagamento === 'atrasado').reduce((sum, e) => sum + e.valor, 0);
    const percentPago = (totalFixo + totalExtra) > 0 ? (totalPago / (totalFixo + totalExtra)) * 100 : 0;
    
    return {
      totalFixo, totalExtra, totalPago, totalPendente, totalAtrasado,
      total: totalFixo + totalExtra,
      percentPago,
      countFixo: fixedExpenses.length,
      countExtra: extraExpenses.length,
      countPago: allExpenses.filter(e => e.status_pagamento === 'pago').length,
      countPendente: allExpenses.filter(e => e.status_pagamento === 'pendente').length,
      countAtrasado: allExpenses.filter(e => e.status_pagamento === 'atrasado').length,
    };
  }, [fixedExpenses, extraExpenses, allExpenses]);

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
        data_vencimento: expense.data_vencimento || "",
        status_pagamento: expense.status_pagamento || "pendente",
      });
    } else {
      setEditingExpense(null);
      setFormData({
        nome: "",
        valor: "",
        categoria: "",
        data: format(new Date(), "yyyy-MM-dd"),
        data_vencimento: "",
        status_pagamento: "pendente",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.valor) {
      toast.error("Preencha nome e valor");
      return;
    }

    const valorCentavos = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);
    const dataRef = new Date(formData.data || new Date());
    const table = modalType === "fixed" ? "company_fixed_expenses" : "company_extra_expenses";

    const payload = {
      nome: formData.nome,
      valor: valorCentavos,
      categoria: formData.categoria || null,
      data: formData.data || null,
      data_vencimento: formData.data_vencimento || null,
      status_pagamento: formData.status_pagamento,
      mes: dataRef.getMonth() + 1,
      ano: dataRef.getFullYear(),
      dia: dataRef.getDate(),
      semana: Math.ceil(dataRef.getDate() / 7),
    };

    try {
      if (editingExpense) {
        await supabase.from(table).update(payload).eq("id", editingExpense.id);
        toast.success("Gasto atualizado!");
      } else {
        await supabase.from(table).insert(payload);
        toast.success("Gasto criado!");
      }
      setIsModalOpen(false);
      refresh();
    } catch (error) {
      toast.error("Erro ao salvar");
    }
  };

  const handleDelete = async (expense: CompanyExpense) => {
    const table = expense.type === "fixed" ? "company_fixed_expenses" : "company_extra_expenses";
    await supabase.from(table).delete().eq("id", expense.id);
    toast.success("Gasto excluído!");
    setDeleteDialogOpen(null);
    refresh();
  };

  const handleStatusChange = async (expense: CompanyExpense, newStatus: PaymentStatus) => {
    await updatePaymentStatus(expense, newStatus);
    toast.success(`Status atualizado para ${newStatus}`);
  };

  const toggleExpenseSelection = (id: string) => {
    setSelectedExpenses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Render Dashboard Stats
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Gastos", value: calculatedStats.total, icon: Wallet, color: "from-primary to-primary/50", count: allExpenses.length },
          { label: "Gastos Fixos", value: calculatedStats.totalFixo, icon: Building2, color: "from-red-500 to-red-500/50", count: calculatedStats.countFixo },
          { label: "Gastos Extras", value: calculatedStats.totalExtra, icon: Receipt, color: "from-blue-500 to-blue-500/50", count: calculatedStats.countExtra },
          { label: "Pagos", value: calculatedStats.totalPago, icon: CheckCircle2, color: "from-green-500 to-green-500/50", count: calculatedStats.countPago },
          { label: "Pendentes", value: calculatedStats.totalPendente, icon: Clock, color: "from-yellow-500 to-yellow-500/50", count: calculatedStats.countPendente },
          { label: "Atrasados", value: calculatedStats.totalAtrasado, icon: AlertTriangle, color: "from-red-600 to-red-600/50", count: calculatedStats.countAtrasado },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-primary/30 transition-all group">
              <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", stat.color)} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <Badge variant="secondary" className="text-xs">{stat.count}</Badge>
                </div>
                <p className="text-2xl font-bold">{formatCompanyCurrency(stat.value)}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress Ring */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Progresso de Pagamentos
              </h3>
              <p className="text-sm text-muted-foreground">
                {calculatedStats.countPago} de {allExpenses.length} gastos pagos
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{calculatedStats.percentPago.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">concluído</p>
            </div>
          </div>
          <Progress value={calculatedStats.percentPago} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Pagos
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" /> Pendentes
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Atrasados
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Novo Gasto Fixo", icon: Building2, color: "text-red-500", action: () => openModal("fixed") },
          { label: "Novo Gasto Extra", icon: Receipt, color: "text-blue-500", action: () => openModal("extra") },
          { label: "Ver Gastos", icon: List, color: "text-primary", action: () => setViewMode("expenses") },
          { label: "Atualizar", icon: RefreshCw, color: "text-green-500", action: refresh },
        ].map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Button
              variant="outline"
              className="w-full h-20 flex-col gap-2 hover:border-primary/50"
              onClick={action.action}
            >
              <action.icon className={cn("h-6 w-6", action.color)} />
              <span className="text-xs">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Recent Expenses */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Gastos Recentes
            </span>
            <Button variant="ghost" size="sm" onClick={() => setViewMode("expenses")}>
              Ver Todos <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allExpenses.slice(0, 5).map((expense) => (
              <div
                key={`${expense.type}-${expense.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    expense.type === 'fixed' ? "bg-red-500/20" : "bg-blue-500/20"
                  )}>
                    {expense.type === 'fixed' ? (
                      <Building2 className="h-5 w-5 text-red-500" />
                    ) : (
                      <Receipt className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{expense.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {expense.categoria || 'Sem categoria'} • {expense.data ? format(new Date(expense.data), 'dd/MM/yyyy') : '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCompanyCurrency(expense.valor)}</p>
                  <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[expense.status_pagamento || 'pendente'].bg, STATUS_COLORS[expense.status_pagamento || 'pendente'].text)}>
                    {expense.status_pagamento || 'pendente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Expenses List
  const renderExpenses = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar gastos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            {EXPENSE_TYPES.map(type => (
              <TabsTrigger key={type.value} value={type.value} className="gap-1">
                <type.icon className="h-4 w-4" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="data">Por Data</SelectItem>
            <SelectItem value="valor">Por Valor</SelectItem>
            <SelectItem value="nome">Por Nome</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
          {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>

        <div className="flex border rounded-md">
          <Button variant={viewType === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewType('list')}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant={viewType === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewType('grid')}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expenses Grid/List */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {allExpenses.map((expense, i) => (
              <motion.div
                key={`${expense.type}-${expense.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className={cn(
                  "relative overflow-hidden hover:shadow-lg transition-all cursor-pointer group",
                  selectedExpenses.has(String(expense.id)) && "ring-2 ring-primary"
                )}>
                  <div className={cn(
                    "absolute top-0 left-0 w-1 h-full",
                    expense.type === 'fixed' ? "bg-red-500" : "bg-blue-500"
                  )} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        expense.type === 'fixed' ? "bg-red-500/20" : "bg-blue-500/20"
                      )}>
                        {expense.type === 'fixed' ? (
                          <Building2 className="h-5 w-5 text-red-500" />
                        ) : (
                          <Receipt className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openModal(expense.type, expense)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(expense, 'pago')}>
                            <Check className="h-4 w-4 mr-2 text-green-500" /> Marcar Pago
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(expense, 'pendente')}>
                            <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Marcar Pendente
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteDialogOpen(expense)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h4 className="font-semibold truncate mb-1">{expense.nome}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{expense.categoria || 'Sem categoria'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold">{formatCompanyCurrency(expense.valor)}</p>
                      <Badge className={cn("text-xs", STATUS_COLORS[expense.status_pagamento || 'pendente'].bg, STATUS_COLORS[expense.status_pagamento || 'pendente'].text)}>
                        {expense.status_pagamento || 'pendente'}
                      </Badge>
                    </div>
                    {getAttachmentCount(expense) > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        {getAttachmentCount(expense)} anexo(s)
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="border-border/50">
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-border">
              {allExpenses.map((expense, i) => (
                <motion.div
                  key={`${expense.type}-${expense.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group"
                >
                  <div
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => toggleRow(`${expense.type}-${expense.id}`)}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      expense.type === 'fixed' ? "bg-red-500/20" : "bg-blue-500/20"
                    )}>
                      {expense.type === 'fixed' ? (
                        <Building2 className="h-5 w-5 text-red-500" />
                      ) : (
                        <Receipt className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{expense.nome}</p>
                        {getAttachmentCount(expense) > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Paperclip className="h-3 w-3" /> {getAttachmentCount(expense)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {expense.categoria || 'Sem categoria'} • {expense.data ? format(new Date(expense.data), 'dd/MM/yyyy') : '-'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{formatCompanyCurrency(expense.valor)}</p>
                      <Badge className={cn("text-xs", STATUS_COLORS[expense.status_pagamento || 'pendente'].bg, STATUS_COLORS[expense.status_pagamento || 'pendente'].text)}>
                        {expense.status_pagamento || 'pendente'}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openModal(expense.type, expense)}>
                          <Edit2 className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(expense, 'pago')}>
                          <Check className="h-4 w-4 mr-2 text-green-500" /> Marcar Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(expense, 'pendente')}>
                          <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Marcar Pendente
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteDialogOpen(expense)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Expanded Row with Attachments */}
                  <AnimatePresence>
                    {expandedRows.has(`${expense.type}-${expense.id}`) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/50 bg-muted/20"
                      >
                        <div className="p-4">
                          <UniversalAttachments
                            entityType={expense.type === 'fixed' ? 'company_expense_fixed' : 'company_expense_extra'}
                            entityId={String(expense.id)}
                            title="Comprovantes"
                            showAIExtraction
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );

  // Render Months View
  const renderMonths = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearsWithData.map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
          const closure = getMonthClosure(selectedYear, month);
          const isClosed = isMonthClosed(selectedYear, month);
          return (
            <Card key={month} className={cn(
              "relative overflow-hidden transition-all hover:shadow-lg",
              isClosed ? "border-green-500/50" : "border-border/50"
            )}>
              {isClosed && (
                <div className="absolute top-2 right-2">
                  <Lock className="h-4 w-4 text-green-500" />
                </div>
              )}
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">{getMonthName(month)}</h4>
                {closure ? (
                  <>
                    <p className="text-2xl font-bold text-destructive">
                      {formatCompanyCurrency((closure.total_gastos_fixos || 0) + (closure.total_gastos_extras || 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fixos: {formatCompanyCurrency(closure.total_gastos_fixos || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Extras: {formatCompanyCurrency(closure.total_gastos_extras || 0)}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Sem dados</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Render Years View
  const renderYears = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {yearsWithData.map(year => {
        const closure = getYearClosure(year);
        const isClosed = isYearClosed(year);
        return (
          <Card key={year} className={cn(
            "relative overflow-hidden transition-all hover:shadow-lg cursor-pointer",
            isClosed ? "border-green-500/50" : "border-border/50"
          )} onClick={() => { setSelectedYear(year); setViewMode('months'); }}>
            {isClosed && (
              <div className="absolute top-2 right-2">
                <Lock className="h-4 w-4 text-green-500" />
              </div>
            )}
            <CardContent className="p-4">
              <h4 className="text-2xl font-bold mb-2">{year}</h4>
              {closure ? (
                <>
                  <p className="text-xl font-semibold text-destructive">
                    {formatCompanyCurrency(closure.total_gastos_fixos + closure.total_gastos_extras)}
                  </p>
                  <p className="text-xs text-muted-foreground">{closure.meses_fechados || 0} meses fechados</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Em andamento</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                    <CircleDollarSign className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                    <Zap className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Enterprise Finance Vault
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Central Financeira Empresarial com IA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Atualizar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Gasto
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => openModal("fixed")}>
                      <Building2 className="h-4 w-4 mr-2 text-red-500" />
                      Gasto Fixo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openModal("extra")}>
                      <Receipt className="h-4 w-4 mr-2 text-blue-500" />
                      Gasto Extra
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
              {[
                { value: "dashboard", label: "Dashboard", icon: Home },
                { value: "expenses", label: "Gastos", icon: List },
                { value: "months", label: "Meses", icon: Calendar },
                { value: "years", label: "Anos", icon: Archive },
              ].map(nav => (
                <Button
                  key={nav.value}
                  variant={viewMode === nav.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(nav.value as ViewMode)}
                  className="gap-2"
                >
                  <nav.icon className="h-4 w-4" />
                  {nav.label}
                </Button>
              ))}

              <Separator orientation="vertical" className="h-6 mx-2" />

              {PERIOD_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={period === opt.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(opt.value as CompanyPeriodFilter)}
                  className="gap-1"
                >
                  <opt.icon className="h-3 w-3" />
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Carregando dados financeiros...</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'dashboard' && renderDashboard()}
              {viewMode === 'expenses' && renderExpenses()}
              {viewMode === 'months' && renderMonths()}
              {viewMode === 'years' && renderYears()}
            </>
          )}
        </div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {modalType === 'fixed' ? (
                  <Building2 className="h-5 w-5 text-red-500" />
                ) : (
                  <Receipt className="h-5 w-5 text-blue-500" />
                )}
                {editingExpense ? 'Editar' : 'Novo'} Gasto {modalType === 'fixed' ? 'Fixo' : 'Extra'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do gasto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status_pagamento} onValueChange={(v: PaymentStatus) => setFormData(prev => ({ ...prev, status_pagamento: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Gasto</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deleteDialogOpen?.nome}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
