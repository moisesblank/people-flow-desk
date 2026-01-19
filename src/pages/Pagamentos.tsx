// ============================================
// MOISÉS MEDEIROS v15.0 - ENTERPRISE PAYMENT VAULT
// Sistema de Pagamentos de Multinacional - Ano 2300
// Central de Pagamentos Futurística com IA
// ============================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  CreditCard, Sparkles, Plus, Check, Clock, AlertCircle, Trash2, Edit2,
  Filter, Calendar, Paperclip, FileText, Download, Eye, Receipt, Wallet,
  TrendingDown, TrendingUp, DollarSign, Building2, User, ChevronDown,
  ChevronUp, ChevronLeft, ChevronRight, Search, MoreVertical, Upload,
  FolderOpen, FolderClosed, Lock, Unlock, Archive, RefreshCw, CalendarDays,
  CalendarRange, History, BarChart3, X, ArrowLeft, Zap, Shield, Activity,
  PieChart, Target, Gauge, Home, List, Grid3X3, Banknote, ArrowUpRight,
  ArrowDownRight, Brain, Bot, Star, Bookmark, Copy, Info, CircleDollarSign,
  Layers, Database, Globe, Command, Cpu, Settings2, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ResizableDialog,
  ResizableDialogContent,
  ResizableDialogHeader,
  ResizableDialogBody,
  ResizableDialogFooter,
  ResizableDialogTitle,
} from "@/components/ui/resizable-dialog";
import { MinimizableSection, useMinimizable, MinimizeButton } from "@/components/ui/minimizable-section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatError } from "@/lib/utils/formatError";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  { value: "all", label: "Todos", icon: Wallet, color: "from-primary/20 to-primary/5" },
  { value: "curso", label: "Curso", icon: Building2, color: "from-green-500/20 to-green-500/5" },
  { value: "pessoal_moises", label: "Moisés", icon: User, color: "from-blue-500/20 to-blue-500/5" },
  { value: "pessoal_bruna", label: "Bruna", icon: User, color: "from-purple-500/20 to-purple-500/5" },
  { value: "funcionario", label: "Funcionário", icon: User, color: "from-yellow-500/20 to-yellow-500/5" },
  { value: "fornecedor", label: "Fornecedor", icon: Building2, color: "from-orange-500/20 to-orange-500/5" },
  { value: "imposto", label: "Imposto", icon: Receipt, color: "from-red-500/20 to-red-500/5" },
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
  { value: "all", label: "Todos", icon: Wallet, color: "bg-muted text-muted-foreground" },
  { value: "pendente", label: "Pendente", icon: Clock, color: "bg-yellow-500/20 text-yellow-500" },
  { value: "pago", label: "Pago", icon: Check, color: "bg-green-500/20 text-green-500" },
  { value: "atrasado", label: "Atrasado", icon: AlertCircle, color: "bg-red-500/20 text-red-500" },
  { value: "cancelado", label: "Cancelado", icon: XCircle, color: "bg-muted text-muted-foreground" },
];

const PERIOD_OPTIONS = [
  { value: "diario", label: "Hoje", icon: Clock },
  { value: "semanal", label: "Semana", icon: CalendarDays },
  { value: "mensal", label: "Mês", icon: Calendar },
  { value: "anual", label: "Ano", icon: CalendarRange },
  { value: "10anos", label: "10 Anos", icon: History },
  { value: "50anos", label: "50 Anos", icon: Archive },
];

type ViewMode = "dashboard" | "payments" | "months" | "years";

export default function Pagamentos() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    period, setPeriod,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    isLoading,
    payments,
    monthlyClosures,
    yearlyClosures,
    stats,
    availableYears,
    yearsWithData,
    getMonthsWithData,
    closeMonth, closeYear,
    isMonthClosed, isYearClosed,
    getMonthClosure, getYearClosure,
    refresh,
  } = usePaymentsHistory();

  // Estado local
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState<"grid" | "list">("list");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [attachmentCounts, setAttachmentCounts] = useState<AttachmentCount>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<Payment | null>(null);
  const [sortBy, setSortBy] = useState<"data" | "valor" | "descricao">("data");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
    let filtered = payments.filter(p => {
      if (activeTab !== "all" && p.tipo !== activeTab) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (searchTerm && !p.descricao.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "data") {
        comparison = a.data_vencimento.localeCompare(b.data_vencimento);
      } else if (sortBy === "valor") {
        comparison = a.valor - b.valor;
      } else if (sortBy === "descricao") {
        comparison = a.descricao.localeCompare(b.descricao);
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });
  }, [payments, activeTab, filterStatus, searchTerm, sortBy, sortOrder]);

  // Stats calculados
  const calculatedStats = useMemo(() => {
    const totalPago = payments.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.valor, 0);
    const totalPendente = payments.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.valor, 0);
    const totalAtrasado = payments.filter(p => p.status === 'atrasado').reduce((sum, p) => sum + p.valor, 0);
    const totalCancelado = payments.filter(p => p.status === 'cancelado').reduce((sum, p) => sum + p.valor, 0);
    const total = totalPago + totalPendente + totalAtrasado;
    const percentPago = total > 0 ? (totalPago / total) * 100 : 0;
    
    return {
      totalPago, totalPendente, totalAtrasado, totalCancelado, total, percentPago,
      countTotal: payments.length,
      countPago: payments.filter(p => p.status === 'pago').length,
      countPendente: payments.filter(p => p.status === 'pendente').length,
      countAtrasado: payments.filter(p => p.status === 'atrasado').length,
      countCancelado: payments.filter(p => p.status === 'cancelado').length,
    };
  }, [payments]);

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
        toast({ title: "Pagamento criado!" });
      }

      await refresh();
      setIsModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: formatError(error), variant: "destructive" });
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

  const markAsPending = async (payment: Payment) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ status: "pendente", data_pagamento: null })
        .eq("id", payment.id);

      if (error) throw error;
      toast({ title: "Marcado como pendente" });
      await refresh();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deletePayment = async (payment: Payment) => {
    try {
      await supabase
        .from("universal_attachments")
        .delete()
        .eq("entity_type", "payment")
        .eq("entity_id", payment.id);

      const { error } = await supabase.from("payments").delete().eq("id", payment.id);
      if (error) throw error;
      toast({ title: "Pagamento excluído" });
      setDeleteDialogOpen(null);
      await refresh();
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return opt?.color || "bg-muted text-muted-foreground";
  };

  const getTypeColor = (tipo: string) => {
    const opt = PAYMENT_TYPES.find(t => t.value === tipo);
    return opt?.color || "from-muted to-muted";
  };

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Geral", value: calculatedStats.total, icon: Wallet, color: "from-primary to-primary/50", count: calculatedStats.countTotal },
          { label: "Pagos", value: calculatedStats.totalPago, icon: CheckCircle2, color: "from-green-500 to-green-500/50", count: calculatedStats.countPago },
          { label: "Pendentes", value: calculatedStats.totalPendente, icon: Clock, color: "from-yellow-500 to-yellow-500/50", count: calculatedStats.countPendente },
          { label: "Atrasados", value: calculatedStats.totalAtrasado, icon: AlertCircle, color: "from-red-500 to-red-500/50", count: calculatedStats.countAtrasado },
          { label: "Cancelados", value: calculatedStats.totalCancelado, icon: XCircle, color: "from-gray-500 to-gray-500/50", count: calculatedStats.countCancelado },
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
                <p className="text-2xl font-bold">{formatPaymentCurrency(stat.value)}</p>
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
                {calculatedStats.countPago} de {calculatedStats.countTotal} pagamentos realizados
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
          { label: "Novo Pagamento", icon: Plus, color: "text-primary", action: () => openModal() },
          { label: "Ver Pagamentos", icon: List, color: "text-blue-500", action: () => setViewMode("payments") },
          { label: "Ver Meses", icon: Calendar, color: "text-purple-500", action: () => setViewMode("months") },
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

      {/* Por Tipo */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-5 w-5 text-primary" />
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PAYMENT_TYPES.filter(t => t.value !== 'all').map(type => {
              const count = payments.filter(p => p.tipo === type.value).length;
              const value = payments.filter(p => p.tipo === type.value).reduce((sum, p) => sum + p.valor, 0);
              return (
                <Card key={type.value} className={cn("relative overflow-hidden", `bg-gradient-to-br ${type.color}`)}>
                  <CardContent className="p-3">
                    <type.icon className="h-4 w-4 mb-2 text-muted-foreground" />
                    <p className="font-semibold text-sm">{formatPaymentCurrency(value)}</p>
                    <p className="text-xs text-muted-foreground">{type.label} ({count})</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Pagamentos Recentes
            </span>
            <Button variant="ghost" size="sm" onClick={() => setViewMode("payments")}>
              Ver Todos <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredPayments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", getTypeColor(payment.tipo))}>
                    {PAYMENT_TYPES.find(t => t.value === payment.tipo)?.icon && (
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{payment.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.tipo} • {format(new Date(payment.data_vencimento), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPaymentCurrency(payment.valor)}</p>
                  <Badge variant="secondary" className={cn("text-xs", getStatusColor(payment.status))}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Payments List
  const renderPayments = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pagamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <opt.icon className="h-3 w-3" /> {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="data">Por Data</SelectItem>
            <SelectItem value="valor">Por Valor</SelectItem>
            <SelectItem value="descricao">Por Descrição</SelectItem>
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

      {/* Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          {PAYMENT_TYPES.map(type => (
            <TabsTrigger key={type.value} value={type.value} className="gap-1">
              <type.icon className="h-4 w-4" />
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Payments Grid/List */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPayments.map((payment, i) => (
              <motion.div
                key={payment.id}
                data-entity-type="payment"
                data-entity-id={payment.id}
                data-table="payments"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="relative overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                  <div className={cn("absolute top-0 left-0 w-1 h-full bg-gradient-to-b", getTypeColor(payment.tipo))} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", getTypeColor(payment.tipo))}>
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openModal(payment)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => markAsPaid(payment)}>
                            <Check className="h-4 w-4 mr-2 text-green-500" /> Marcar Pago
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => markAsPending(payment)}>
                            <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Marcar Pendente
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteDialogOpen(payment)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h4 className="font-semibold truncate mb-1">{payment.descricao}</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {payment.tipo} • {format(new Date(payment.data_vencimento), 'dd/MM/yyyy')}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold">{formatPaymentCurrency(payment.valor)}</p>
                      <Badge className={cn("text-xs", getStatusColor(payment.status))}>
                        {payment.status}
                      </Badge>
                    </div>
                    {attachmentCounts[payment.id] > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        {attachmentCounts[payment.id]} anexo(s)
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
              {filteredPayments.map((payment, i) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group"
                >
                  <div
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => toggleRow(payment.id)}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br", getTypeColor(payment.tipo))}>
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{payment.descricao}</p>
                        {attachmentCounts[payment.id] > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Paperclip className="h-3 w-3" /> {attachmentCounts[payment.id]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {PAYMENT_TYPES.find(t => t.value === payment.tipo)?.label || payment.tipo} • {format(new Date(payment.data_vencimento), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{formatPaymentCurrency(payment.valor)}</p>
                      <Badge className={cn("text-xs", getStatusColor(payment.status))}>
                        {payment.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openModal(payment)}>
                          <Edit2 className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => markAsPaid(payment)}>
                          <Check className="h-4 w-4 mr-2 text-green-500" /> Marcar Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => markAsPending(payment)}>
                          <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Marcar Pendente
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteDialogOpen(payment)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Expanded Row with Attachments */}
                  <AnimatePresence>
                    {expandedRows.has(payment.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/50 bg-muted/20"
                      >
                        <div className="p-4">
                          <UniversalAttachments
                            entityType="payment"
                            entityId={payment.id}
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
                    <p className="text-2xl font-bold text-primary">
                      {formatPaymentCurrency(closure.total_valor_pago || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {closure.total_pago || 0} pagos de {closure.total_pagamentos || 0}
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
                  <p className="text-xl font-semibold text-primary">
                    {formatPaymentCurrency(closure.total_valor_pago)}
                  </p>
                  <p className="text-xs text-muted-foreground">{closure.total_meses_fechados || 0} meses fechados</p>
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-500/50 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                    <Zap className="h-2 w-2 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Enterprise Payment Vault
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Central de Pagamentos com IA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Atualizar
                </Button>
                <Button size="sm" className="gap-2" onClick={() => openModal()}>
                  <Plus className="h-4 w-4" />
                  Novo Pagamento
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
              {[
                { value: "dashboard", label: "Dashboard", icon: Home },
                { value: "payments", label: "Pagamentos", icon: List },
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
                  onClick={() => setPeriod(opt.value as PaymentPeriodFilter)}
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
                <p className="text-muted-foreground">Carregando pagamentos...</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'dashboard' && renderDashboard()}
              {viewMode === 'payments' && renderPayments()}
              {viewMode === 'months' && renderMonths()}
              {viewMode === 'years' && renderYears()}
            </>
          )}
        </div>

        {/* Modal Redimensionável */}
        <ResizableDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <ResizableDialogContent 
            showMaximize 
            defaultSize={{ width: 580, height: 620 }}
            minSize={{ width: 420, height: 450 }}
            maxSize={{ width: 850, height: 850 }}
          >
            <ResizableDialogHeader>
              <ResizableDialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-500" />
                {editingPayment ? 'Editar' : 'Novo'} Pagamento
              </ResizableDialogTitle>
            </ResizableDialogHeader>
            <ResizableDialogBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {PAYMENT_TYPES.filter(t => t.value !== 'all').map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <type.icon className="h-3 w-3" />
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                </div>
                <div>
                  <Label>Descrição *</Label>
                  <Input
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descrição do pagamento"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vencimento</Label>
                    <Input
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Método</Label>
                    <Select value={formData.metodo_pagamento} onValueChange={(v) => setFormData(prev => ({ ...prev, metodo_pagamento: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {PAYMENT_METHODS.map(method => (
                          <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Seção de Observações Minimizável */}
                <MinimizableSection
                  title="Observações"
                  icon={<FileText className="h-4 w-4" />}
                  variant="card"
                  storageKey="payment-observations"
                  defaultMinimized={!formData.observacoes}
                >
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais..."
                    rows={3}
                    className="resize-y min-h-[60px]"
                  />
                </MinimizableSection>
                
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <Switch
                    checked={formData.recorrente}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, recorrente: v }))}
                  />
                  <Label className="cursor-pointer">Pagamento recorrente</Label>
                </div>
                
                {/* Seção de Anexos Minimizável */}
                <MinimizableSection
                  title="Comprovantes e Anexos"
                  icon={<Paperclip className="h-4 w-4" />}
                  variant="card"
                  storageKey="payment-attachments"
                  badge={
                    editingPayment && attachmentCounts[editingPayment.id] > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {attachmentCounts[editingPayment.id]}
                      </Badge>
                    )
                  }
                >
                  {editingPayment && (
                    <UniversalAttachments
                      entityType="payment"
                      entityId={editingPayment.id}
                    />
                  )}
                  {!editingPayment && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Salve o pagamento primeiro para adicionar anexos
                    </p>
                  )}
                </MinimizableSection>
              </div>
            </ResizableDialogBody>
            <ResizableDialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                <Check className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </ResizableDialogFooter>
          </ResizableDialogContent>
        </ResizableDialog>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Pagamento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deleteDialogOpen?.descricao}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteDialogOpen && deletePayment(deleteDialogOpen)} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
