// ============================================
// MOISÉS MEDEIROS v9.0 - CENTRAL DE PAGAMENTOS
// Sistema Completo Estilo Softcom
// Fechamento Mês/Ano com Histórico 50 Anos
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Sparkles, 
  Plus,
  Check,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  Filter,
  Calendar,
  Paperclip,
  FileText,
  Download,
  Eye,
  Receipt,
  Wallet,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Building2,
  User,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Upload,
  FolderOpen,
  FolderClosed,
  Lock,
  Unlock,
  Archive,
  RefreshCw,
  CalendarDays,
  CalendarRange,
  History,
  BarChart3,
  X,
  ArrowLeft
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast, isToday, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UniversalAttachments } from "@/components/attachments/UniversalAttachments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { 
  usePaymentsHistory, 
  formatPaymentCurrency, 
  getMonthName,
  type Payment,
  type MonthlyPaymentClosure,
  type YearlyPaymentClosure,
  type PaymentPeriodFilter
} from "@/hooks/usePaymentsHistory";

interface AttachmentCount {
  [key: string]: number;
}

const PAYMENT_TYPES = [
  { value: "curso", label: "💰 Curso", icon: Building2, color: "bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]" },
  { value: "pessoal_moises", label: "👨 Moisés", icon: User, color: "bg-[hsl(var(--stats-blue))]/20 text-[hsl(var(--stats-blue))]" },
  { value: "pessoal_bruna", label: "👩 Bruna", icon: User, color: "bg-[hsl(var(--stats-purple))]/20 text-[hsl(var(--stats-purple))]" },
  { value: "funcionario", label: "👥 Funcionário", icon: User, color: "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]" },
  { value: "fornecedor", label: "🏢 Fornecedor", icon: Building2, color: "bg-orange-500/20 text-orange-500" },
  { value: "imposto", label: "📋 Imposto", icon: Receipt, color: "bg-red-500/20 text-red-500" },
];

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "transferencia", label: "Transferência" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cheque", label: "Cheque" },
];

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente", icon: Clock, color: "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]" },
  { value: "pago", label: "Pago", icon: Check, color: "bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]" },
  { value: "atrasado", label: "Atrasado", icon: AlertCircle, color: "bg-destructive/20 text-destructive" },
  { value: "cancelado", label: "Cancelado", icon: Trash2, color: "bg-muted text-muted-foreground" },
];

const PERIOD_OPTIONS = [
  { value: "diario", label: "Hoje", icon: Clock },
  { value: "semanal", label: "Semana", icon: CalendarDays },
  { value: "mensal", label: "Mês", icon: Calendar },
  { value: "anual", label: "Ano", icon: CalendarRange },
  { value: "10anos", label: "10 Anos", icon: History },
  { value: "50anos", label: "50 Anos", icon: Archive },
];

type ViewMode = "payments" | "months" | "years" | "history";

export default function Pagamentos() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Hook de histórico
  const {
    period,
    setPeriod,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    isLoading,
    payments,
    monthlyClosures,
    yearlyClosures,
    stats,
    availableYears,
    yearsWithData,
    getMonthsWithData,
    closeMonth,
    closeYear,
    isMonthClosed,
    isYearClosed,
    getMonthClosure,
    getYearClosure,
    refresh,
  } = usePaymentsHistory();

  // Estado local
  const [viewMode, setViewMode] = useState<ViewMode>("payments");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [attachmentCounts, setAttachmentCounts] = useState<AttachmentCount>({});
  const [closeMonthDialogOpen, setCloseMonthDialogOpen] = useState(false);
  const [closeYearDialogOpen, setCloseYearDialogOpen] = useState(false);
  const [selectedClosureMonth, setSelectedClosureMonth] = useState<{ano: number, mes: number} | null>(null);
  const [selectedClosureYear, setSelectedClosureYear] = useState<number | null>(null);
  const [viewingClosure, setViewingClosure] = useState<MonthlyPaymentClosure | null>(null);
  const [viewingYearClosure, setViewingYearClosure] = useState<YearlyPaymentClosure | null>(null);

  const [formData, setFormData] = useState({
    tipo: "curso",
    descricao: "",
    valor: "",
    data_vencimento: format(new Date(), "yyyy-MM-dd"),
    metodo_pagamento: "",
    categoria: "",
    observacoes: "",
    recorrente: false,
  });

  // Buscar contagem de anexos
  useEffect(() => {
    const fetchAttachmentCounts = async () => {
      const paymentIds = payments.map(p => p.id);
      if (paymentIds.length > 0) {
        const { data: attachments } = await supabase
          .from("universal_attachments")
          .select("entity_id")
          .eq("entity_type", "payment")
          .in("entity_id", paymentIds);

        const counts: AttachmentCount = {};
        (attachments || []).forEach(a => {
          counts[a.entity_id] = (counts[a.entity_id] || 0) + 1;
        });
        setAttachmentCounts(counts);
      }
    };
    fetchAttachmentCounts();
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (activeTab !== "all" && p.tipo !== activeTab) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (searchTerm && !p.descricao.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [payments, activeTab, filterStatus, searchTerm]);

  const openModal = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        tipo: payment.tipo,
        descricao: payment.descricao,
        valor: String(payment.valor / 100),
        data_vencimento: payment.data_vencimento,
        metodo_pagamento: payment.metodo_pagamento || "",
        categoria: payment.categoria || "",
        observacoes: payment.observacoes || "",
        recorrente: payment.recorrente,
      });
    } else {
      setEditingPayment(null);
      setFormData({
        tipo: activeTab === "all" ? "curso" : activeTab,
        descricao: "",
        valor: "",
        data_vencimento: format(new Date(), "yyyy-MM-dd"),
        metodo_pagamento: "",
        categoria: "",
        observacoes: "",
        recorrente: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.descricao.trim() || !formData.valor) {
      toast({ title: "Erro", description: "Preencha descrição e valor", variant: "destructive" });
      return;
    }

    const valorCents = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);

    try {
      if (editingPayment) {
        const { error } = await supabase
          .from("payments")
          .update({
            tipo: formData.tipo,
            descricao: formData.descricao,
            valor: valorCents,
            data_vencimento: formData.data_vencimento,
            metodo_pagamento: formData.metodo_pagamento || null,
            categoria: formData.categoria || null,
            observacoes: formData.observacoes || null,
            recorrente: formData.recorrente,
          })
          .eq("id", editingPayment.id);

        if (error) throw error;
        toast({ title: "Pagamento atualizado!" });
      } else {
        const { error } = await supabase.from("payments").insert({
          user_id: user?.id,
          tipo: formData.tipo,
          descricao: formData.descricao,
          valor: valorCents,
          data_vencimento: formData.data_vencimento,
          metodo_pagamento: formData.metodo_pagamento || null,
          categoria: formData.categoria || null,
          observacoes: formData.observacoes || null,
          recorrente: formData.recorrente,
          created_by: user?.id,
        });

        if (error) throw error;
        toast({ title: "Pagamento adicionado!" });
      }

      await refresh();
      setIsModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const markAsPaid = async (payment: Payment) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ 
          status: "pago", 
          data_pagamento: format(new Date(), "yyyy-MM-dd") 
        })
        .eq("id", payment.id);

      if (error) throw error;
      toast({ title: "Marcado como pago! ✓" });
      await refresh();
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await supabase
        .from("universal_attachments")
        .delete()
        .eq("entity_type", "payment")
        .eq("entity_id", id);

      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Pagamento removido" });
      await refresh();
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <Badge className={cn("gap-1", option.color)}>
        <Icon className="h-3 w-3" />
        {option.label}
      </Badge>
    );
  };

  const getTypeBadge = (tipo: string) => {
    const option = PAYMENT_TYPES.find(t => t.value === tipo);
    return option ? <Badge className={option.color}>{option.label}</Badge> : null;
  };

  const handleAttachmentChange = (paymentId: string, count: number) => {
    setAttachmentCounts(prev => ({ ...prev, [paymentId]: count }));
  };

  const handleCloseMonth = async () => {
    if (selectedClosureMonth) {
      await closeMonth(selectedClosureMonth.ano, selectedClosureMonth.mes);
      setCloseMonthDialogOpen(false);
      setSelectedClosureMonth(null);
    }
  };

  const handleCloseYear = async () => {
    if (selectedClosureYear) {
      await closeYear(selectedClosureYear);
      setCloseYearDialogOpen(false);
      setSelectedClosureYear(null);
    }
  };

  const openMonthFolder = (ano: number, mes: number) => {
    const closure = getMonthClosure(ano, mes);
    if (closure?.is_fechado) {
      setViewingClosure(closure);
    } else {
      setSelectedYear(ano);
      setSelectedMonth(mes);
      setPeriod("mensal");
      setViewMode("payments");
    }
  };

  const openYearFolder = (ano: number) => {
    const closure = getYearClosure(ano);
    if (closure?.is_fechado) {
      setViewingYearClosure(closure);
    } else {
      setSelectedYear(ano);
      setViewMode("months");
    }
  };

  // Renderizar Cards de Estatísticas
  const renderStatsCards = () => (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8"
    >
      <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-gold))]">
        <div className="flex items-center justify-between mb-3">
          <Clock className="h-6 w-6 text-[hsl(var(--stats-gold))]" />
          <Badge variant="outline" className="text-xs">{stats.totalPendente}</Badge>
        </div>
        <p className="text-2xl font-bold text-foreground">{formatPaymentCurrency(stats.valorPendente)}</p>
        <p className="text-sm text-muted-foreground">Pendentes</p>
      </div>
      
      <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-green))]">
        <div className="flex items-center justify-between mb-3">
          <Check className="h-6 w-6 text-[hsl(var(--stats-green))]" />
          <Badge variant="outline" className="text-xs">{stats.totalPago}</Badge>
        </div>
        <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">{formatPaymentCurrency(stats.valorPago)}</p>
        <p className="text-sm text-muted-foreground">Pagos</p>
      </div>

      <div className="glass-card rounded-2xl p-5 border-l-4 border-destructive">
        <div className="flex items-center justify-between mb-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <Badge variant="destructive" className="text-xs">{stats.totalAtrasado}</Badge>
        </div>
        <p className="text-2xl font-bold text-destructive">{formatPaymentCurrency(stats.valorAtrasado)}</p>
        <p className="text-sm text-muted-foreground">Atrasados</p>
      </div>
      
      <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-blue))]">
        <div className="flex items-center justify-between mb-3">
          <BarChart3 className="h-6 w-6 text-[hsl(var(--stats-blue))]" />
          <Badge variant="outline" className="text-xs">{stats.countTotal}</Badge>
        </div>
        <p className="text-2xl font-bold text-[hsl(var(--stats-blue))]">
          {formatPaymentCurrency(stats.valorPago + stats.valorPendente + stats.valorAtrasado)}
        </p>
        <p className="text-sm text-muted-foreground">Total Período</p>
      </div>
      
      <div className="glass-card rounded-2xl p-5 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <Button onClick={() => openModal()} className="gap-2 w-full">
          <Plus className="h-4 w-4" /> Novo Pagamento
        </Button>
      </div>
    </motion.section>
  );

  // Renderizar Navegação de Período
  const renderPeriodNavigation = () => (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Botões de Período */}
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = period === opt.value;
          return (
            <Button
              key={opt.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(opt.value as PaymentPeriodFilter)}
              className={cn("gap-2", isActive && "shadow-lg shadow-primary/25")}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{opt.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Seletor de Ano/Mês */}
      {(period === "mensal" || period === "anual") && (
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
          {period === "mensal" && (
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

      {/* Botões de Visualização */}
      <div className="flex gap-2 ml-auto">
        <Button
          variant={viewMode === "payments" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("payments")}
          className="gap-2"
        >
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">Pagamentos</span>
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

  // Renderizar Pastas de Meses
  const renderMonthFolders = () => {
    const months = getMonthsWithData(selectedYear);
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-primary" />
            Meses de {selectedYear}
          </h2>
          {!isYearClosed(selectedYear) && monthlyClosures.filter(c => c.ano === selectedYear).length >= 12 && (
            <Button
              onClick={() => {
                setSelectedClosureYear(selectedYear);
                setCloseYearDialogOpen(true);
              }}
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              Fechar Ano {selectedYear}
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
                onClick={() => openMonthFolder(selectedYear, mes)}
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
                    {closure.total_pagamentos} pagamentos
                  </p>
                )}
                {hasData && !isClosed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClosureMonth({ ano: selectedYear, mes });
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

  // Renderizar Pastas de Anos
  const renderYearFolders = () => {
    const currentYear = new Date().getFullYear();
    const yearsToShow = Array.from({ length: 61 }, (_, i) => currentYear - 10 + i);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
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
                onClick={() => openYearFolder(ano)}
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
                <p className={cn(
                  "font-bold text-lg",
                  ano === currentYear && "text-primary"
                )}>
                  {ano}
                </p>
                {closure && (
                  <p className="text-xs text-muted-foreground">
                    {formatPaymentCurrency(closure.total_valor_pago)}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Renderizar Lista de Pagamentos
  const renderPaymentsList = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar pagamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs and List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="gap-1">
            <Wallet className="h-4 w-4" /> Todos
          </TabsTrigger>
          {PAYMENT_TYPES.map(type => (
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
                    <th className="text-left p-4 text-sm font-bold text-white">Vencimento</th>
                    <th className="text-right p-4 text-sm font-bold text-white">Valor</th>
                    <th className="text-center p-4 text-sm font-bold text-white">Status</th>
                    <th className="text-center p-4 text-sm font-bold text-white">Anexos</th>
                    <th className="text-right p-4 text-sm font-bold text-white">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <>
                      <tr 
                        key={payment.id} 
                        className={cn(
                          "border-t border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer",
                          expandedRows.has(payment.id) && "bg-secondary/20",
                          payment.fechado && "opacity-60"
                        )}
                        onClick={() => toggleRowExpand(payment.id)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {expandedRows.has(payment.id) ? 
                              <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            }
                            <div>
                              <p className="font-medium text-foreground">{payment.descricao}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {payment.recorrente && (
                                  <span className="text-xs text-muted-foreground">🔄 Recorrente</span>
                                )}
                                {payment.fechado && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Lock className="h-3 w-3" /> Fechado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{getTypeBadge(payment.tipo)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {format(new Date(payment.data_vencimento), "dd/MM/yyyy")}
                            </span>
                          </div>
                          {payment.data_pagamento && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Pago em {format(new Date(payment.data_pagamento), "dd/MM/yyyy")}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-right font-semibold text-foreground">
                          {formatPaymentCurrency(payment.valor)}
                        </td>
                        <td className="p-4 text-center">{getStatusBadge(payment.status)}</td>
                        <td className="p-4 text-center">
                          <Badge 
                            variant={attachmentCounts[payment.id] > 0 ? "default" : "outline"}
                            className="gap-1"
                          >
                            <Paperclip className="h-3 w-3" />
                            {attachmentCounts[payment.id] || 0}
                          </Badge>
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {payment.status !== "pago" && !payment.fechado && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-[hsl(var(--stats-green))]"
                                onClick={() => markAsPaid(payment)}
                                title="Marcar como pago"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {!payment.fechado && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(payment)}>
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
                                <DropdownMenuItem onClick={() => toggleRowExpand(payment.id)}>
                                  <Paperclip className="h-4 w-4 mr-2" />
                                  {expandedRows.has(payment.id) ? "Fechar Anexos" : "Ver Anexos"}
                                </DropdownMenuItem>
                                {!payment.fechado && (
                                  <DropdownMenuItem 
                                    onClick={() => deletePayment(payment.id)}
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
                        {expandedRows.has(payment.id) && (
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
                                      Detalhes do Pagamento
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Valor</p>
                                        <p className="font-medium text-foreground">{formatPaymentCurrency(payment.valor)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Vencimento</p>
                                        <p className="font-medium text-foreground">
                                          {format(new Date(payment.data_vencimento), "dd/MM/yyyy")}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Método</p>
                                        <p className="font-medium text-foreground">
                                          {PAYMENT_METHODS.find(m => m.value === payment.metodo_pagamento)?.label || "Não informado"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Status</p>
                                        {getStatusBadge(payment.status)}
                                      </div>
                                    </div>
                                    {payment.observacoes && (
                                      <div>
                                        <p className="text-muted-foreground text-sm">Observações</p>
                                        <p className="text-sm text-foreground mt-1">{payment.observacoes}</p>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <UniversalAttachments
                                      entityType="payment"
                                      entityId={payment.id}
                                      title="Comprovantes e Anexos"
                                      maxFiles={20}
                                      showAIExtraction={true}
                                      onAttachmentChange={(count) => handleAttachmentChange(payment.id, count)}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Receipt className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                          <Button onClick={() => openModal()} variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" /> Adicionar Pagamento
                          </Button>
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
              Central de Pagamentos
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

        {/* Content based on view mode */}
        {viewMode === "payments" && renderPaymentsList()}
        {viewMode === "months" && renderMonthFolders()}
        {viewMode === "years" && renderYearFolders()}

        {/* Modal de Novo/Editar Pagamento */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {editingPayment ? "Editar" : "Novo"} Pagamento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="font-bold text-white">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-bold text-white">Descrição *</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Mensalidade, Aluguel, Internet..."
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
                  <Label className="font-bold text-white">Vencimento *</Label>
                  <Input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="font-bold text-white">Método de Pagamento</Label>
                <Select 
                  value={formData.metodo_pagamento} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, metodo_pagamento: v }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione o método..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <Label className="font-bold text-white">Pagamento Recorrente</Label>
                  <p className="text-xs text-muted-foreground">Marcar como pagamento mensal/recorrente</p>
                </div>
                <Switch
                  checked={formData.recorrente}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recorrente: checked }))}
                />
              </div>

              <div>
                <Label className="font-bold text-white">Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Notas adicionais..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              {editingPayment && (
                <div className="border-t pt-4">
                  <UniversalAttachments
                    entityType="payment"
                    entityId={editingPayment.id}
                    title="Comprovantes e Anexos"
                    maxFiles={20}
                    showAIExtraction={true}
                    onAttachmentChange={(count) => handleAttachmentChange(editingPayment.id, count)}
                  />
                </div>
              )}

              <Button onClick={handleSave} className="w-full gap-2">
                <Check className="h-4 w-4" />
                {editingPayment ? "Salvar Alterações" : "Adicionar Pagamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Fechamento de Mês */}
        <AlertDialog open={closeMonthDialogOpen} onOpenChange={setCloseMonthDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Fechar Mês
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a fechar o mês de{" "}
                <strong>{selectedClosureMonth && getMonthName(selectedClosureMonth.mes)}/{selectedClosureMonth?.ano}</strong>.
                <br /><br />
                Isso irá:
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Consolidar todos os pagamentos do mês</li>
                  <li>Bloquear edições nos pagamentos deste período</li>
                  <li>Criar um snapshot permanente para histórico</li>
                </ul>
                <br />
                <strong>Esta ação não pode ser desfeita.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCloseMonth} className="gap-2">
                <Lock className="h-4 w-4" />
                Confirmar Fechamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Fechamento de Ano */}
        <AlertDialog open={closeYearDialogOpen} onOpenChange={setCloseYearDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-primary" />
                Consolidar Ano
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a consolidar o ano de <strong>{selectedClosureYear}</strong>.
                <br /><br />
                Isso irá criar um resumo anual com todos os meses fechados.
                <br /><br />
                <strong>Esta ação não pode ser desfeita.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCloseYear} className="gap-2">
                <Archive className="h-4 w-4" />
                Confirmar Consolidação
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Visualização de Fechamento Mensal */}
        <Dialog open={!!viewingClosure} onOpenChange={() => setViewingClosure(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderClosed className="h-5 w-5 text-[hsl(var(--stats-green))]" />
                {viewingClosure && `${getMonthName(viewingClosure.mes)} ${viewingClosure.ano}`}
                <Badge className="ml-2 gap-1 bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]">
                  <Lock className="h-3 w-3" /> Fechado
                </Badge>
              </DialogTitle>
            </DialogHeader>
            {viewingClosure && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Total Pagamentos</p>
                    <p className="text-2xl font-bold">{viewingClosure.total_pagamentos}</p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Valor Pago</p>
                    <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">
                      {formatPaymentCurrency(viewingClosure.total_valor_pago)}
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-2xl font-bold text-[hsl(var(--stats-gold))]">
                      {formatPaymentCurrency(viewingClosure.total_valor_pendente)}
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Atrasado</p>
                    <p className="text-2xl font-bold text-destructive">
                      {formatPaymentCurrency(viewingClosure.total_valor_atrasado)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <p className="text-lg font-bold text-[hsl(var(--stats-green))]">{viewingClosure.total_pago}</p>
                    <p className="text-xs text-muted-foreground">Pagos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <p className="text-lg font-bold text-[hsl(var(--stats-gold))]">{viewingClosure.total_pendente}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <p className="text-lg font-bold text-destructive">{viewingClosure.total_atrasado}</p>
                    <p className="text-xs text-muted-foreground">Atrasados</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <p className="text-lg font-bold text-muted-foreground">{viewingClosure.total_cancelado}</p>
                    <p className="text-xs text-muted-foreground">Cancelados</p>
                  </div>
                </div>

                {viewingClosure.fechado_em && (
                  <p className="text-xs text-muted-foreground text-center">
                    Fechado em {format(new Date(viewingClosure.fechado_em), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Visualização de Fechamento Anual */}
        <Dialog open={!!viewingYearClosure} onOpenChange={() => setViewingYearClosure(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-[hsl(var(--stats-green))]" />
                Ano {viewingYearClosure?.ano}
                <Badge className="ml-2 gap-1 bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]">
                  <Lock className="h-3 w-3" /> Consolidado
                </Badge>
              </DialogTitle>
            </DialogHeader>
            {viewingYearClosure && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Meses Fechados</p>
                    <p className="text-2xl font-bold">{viewingYearClosure.total_meses_fechados}/12</p>
                    <Progress value={(viewingYearClosure.total_meses_fechados / 12) * 100} className="mt-2" />
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Total Pagamentos</p>
                    <p className="text-2xl font-bold">{viewingYearClosure.total_pagamentos}</p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Total Pago</p>
                    <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">
                      {formatPaymentCurrency(viewingYearClosure.total_valor_pago)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Média Mensal</p>
                    <p className="text-xl font-bold">{formatPaymentCurrency(viewingYearClosure.media_mensal)}</p>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Total Geral</p>
                    <p className="text-xl font-bold">{formatPaymentCurrency(viewingYearClosure.total_valor_geral)}</p>
                  </div>
                </div>

                {viewingYearClosure.melhor_mes && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-[hsl(var(--stats-green))]/10 border border-[hsl(var(--stats-green))]/30">
                      <p className="text-sm text-muted-foreground">Melhor Mês</p>
                      <p className="font-bold text-[hsl(var(--stats-green))]">
                        {getMonthName(viewingYearClosure.melhor_mes)} - {formatPaymentCurrency(viewingYearClosure.melhor_mes_valor)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-sm text-muted-foreground">Pior Mês</p>
                      <p className="font-bold text-destructive">
                        {viewingYearClosure.pior_mes && getMonthName(viewingYearClosure.pior_mes)} - {formatPaymentCurrency(viewingYearClosure.pior_mes_valor)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
