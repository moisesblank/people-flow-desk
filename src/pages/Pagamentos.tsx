// ============================================
// MOISÉS MEDEIROS v8.0 - CENTRAL DE PAGAMENTOS
// Sistema Completo com Anexos Funcionais
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
  Search,
  MoreVertical,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Payment {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  metodo_pagamento: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  recorrente: boolean;
  created_at: string;
}

interface AttachmentCount {
  [key: string]: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
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

const CATEGORIES = [
  "Aluguel", "Água", "Luz", "Internet", "Telefone", "Software", 
  "Equipamento", "Material", "Salário", "Comissão", "Imposto", 
  "Marketing", "Manutenção", "Transporte", "Alimentação", "Outros"
];

export default function Pagamentos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [attachmentCounts, setAttachmentCounts] = useState<AttachmentCount>({});
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("data_vencimento", { ascending: false });

      if (error) throw error;
      
      // Auto-update overdue payments
      const updated = (data || []).map(p => {
        if (p.status === "pendente" && isPast(new Date(p.data_vencimento)) && !isToday(new Date(p.data_vencimento))) {
          return { ...p, status: "atrasado" };
        }
        return p;
      });
      
      setPayments(updated);

      // Fetch attachment counts for all payments
      const paymentIds = updated.map(p => p.id);
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
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (activeTab !== "all" && p.tipo !== activeTab) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (searchTerm && !p.descricao.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [payments, activeTab, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const pending = payments.filter(p => p.status === "pendente" || p.status === "atrasado");
    const paid = payments.filter(p => p.status === "pago");
    const overdue = payments.filter(p => p.status === "atrasado");
    
    const paidThisMonth = payments.filter(p => 
      p.status === "pago" && 
      p.data_pagamento && 
      isWithinInterval(parseISO(p.data_pagamento), { start: monthStart, end: monthEnd })
    );

    const pendingThisMonth = pending.filter(p => 
      isWithinInterval(parseISO(p.data_vencimento), { start: monthStart, end: monthEnd })
    );

    return {
      totalPending: pending.reduce((acc, p) => acc + p.valor, 0),
      totalPaid: paid.reduce((acc, p) => acc + p.valor, 0),
      totalPaidMonth: paidThisMonth.reduce((acc, p) => acc + p.valor, 0),
      totalPendingMonth: pendingThisMonth.reduce((acc, p) => acc + p.valor, 0),
      countOverdue: overdue.length,
      countPending: pending.length,
      countPaid: paid.length,
      totalOverdue: overdue.reduce((acc, p) => acc + p.valor, 0),
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
        categoria: "",
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
          observacoes: formData.observacoes || null,
          recorrente: formData.recorrente,
          created_by: user?.id,
        });

        if (error) throw error;
        toast({ title: "Pagamento adicionado!" });
      }

      await fetchPayments();
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
      await fetchPayments();
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const deletePayment = async (id: string) => {
    try {
      // Delete attachments first
      await supabase
        .from("universal_attachments")
        .delete()
        .eq("entity_type", "payment")
        .eq("entity_id", id);

      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Pagamento removido" });
      await fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
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
              Controle completo de pagamentos com anexos, comprovantes e gestão por categoria.
            </p>
          </div>
        </motion.header>

        {/* Stats Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8"
        >
          {/* Pendentes */}
          <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-gold))]">
            <div className="flex items-center justify-between mb-3">
              <Clock className="h-6 w-6 text-[hsl(var(--stats-gold))]" />
              <Badge variant="outline" className="text-xs">{stats.countPending}</Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalPending)}</p>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </div>
          
          {/* Pagos Total */}
          <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-green))]">
            <div className="flex items-center justify-between mb-3">
              <Check className="h-6 w-6 text-[hsl(var(--stats-green))]" />
              <Badge variant="outline" className="text-xs">{stats.countPaid}</Badge>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-sm text-muted-foreground">Pagos (Total)</p>
          </div>

          {/* Pagos Este Mês */}
          <div className="glass-card rounded-2xl p-5 border-l-4 border-[hsl(var(--stats-blue))]">
            <div className="flex items-center justify-between mb-3">
              <TrendingDown className="h-6 w-6 text-[hsl(var(--stats-blue))]" />
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--stats-blue))]">{formatCurrency(stats.totalPaidMonth)}</p>
            <p className="text-sm text-muted-foreground">Pagos (Mês)</p>
          </div>
          
          {/* Atrasados */}
          <div className="glass-card rounded-2xl p-5 border-l-4 border-destructive">
            <div className="flex items-center justify-between mb-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <Badge variant="destructive" className="text-xs">{stats.countOverdue}</Badge>
            </div>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(stats.totalOverdue)}</p>
            <p className="text-sm text-muted-foreground">Atrasados</p>
          </div>
          
          {/* Novo Pagamento */}
          <div className="glass-card rounded-2xl p-5 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <Button onClick={() => openModal()} className="gap-2 w-full">
              <Plus className="h-4 w-4" /> Novo Pagamento
            </Button>
          </div>
        </motion.section>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
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
        </div>

        {/* Tabs and List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
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
                            expandedRows.has(payment.id) && "bg-secondary/20"
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
                                  {payment.metodo_pagamento && (
                                    <Badge variant="outline" className="text-xs">
                                      {PAYMENT_METHODS.find(m => m.value === payment.metodo_pagamento)?.label || payment.metodo_pagamento}
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
                            {formatCurrency(payment.valor)}
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
                              {payment.status !== "pago" && (
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
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(payment)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
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
                                  <DropdownMenuItem 
                                    onClick={() => deletePayment(payment.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Row - Attachments */}
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
                                    {/* Detalhes do Pagamento */}
                                    <div className="space-y-4">
                                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        Detalhes do Pagamento
                                      </h3>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <p className="text-muted-foreground">Valor</p>
                                          <p className="font-medium text-foreground">{formatCurrency(payment.valor)}</p>
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

                                    {/* Anexos */}
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
            </motion.div>
          </TabsContent>
        </Tabs>

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
              {/* Tipo */}
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

              {/* Descrição */}
              <div>
                <Label className="font-bold text-white">Descrição *</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Mensalidade, Aluguel, Internet..."
                  className="mt-1.5"
                />
              </div>

              {/* Valor e Vencimento */}
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

              {/* Método de Pagamento */}
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

              {/* Recorrente */}
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

              {/* Observações */}
              <div>
                <Label className="font-bold text-white">Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Notas adicionais, informações do fornecedor, etc..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              {/* Anexos (apenas ao editar) */}
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

              {/* Botão Salvar */}
              <Button onClick={handleSave} className="w-full gap-2">
                <Check className="h-4 w-4" />
                {editingPayment ? "Salvar Alterações" : "Adicionar Pagamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
