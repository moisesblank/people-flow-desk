import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  metodo_pagamento: string | null;
  observacoes: string | null;
  recorrente: boolean;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const PAYMENT_TYPES = [
  { value: "curso", label: "💰 Curso", color: "bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]" },
  { value: "pessoal_moises", label: "👨 Moisés", color: "bg-[hsl(var(--stats-blue))]/20 text-[hsl(var(--stats-blue))]" },
  { value: "pessoal_bruna", label: "👩 Bruna", color: "bg-[hsl(var(--stats-purple))]/20 text-[hsl(var(--stats-purple))]" },
];

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente", color: "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]" },
  { value: "pago", label: "Pago", color: "bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]" },
  { value: "atrasado", label: "Atrasado", color: "bg-destructive/20 text-destructive" },
  { value: "cancelado", label: "Cancelado", color: "bg-muted text-muted-foreground" },
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

  const [formData, setFormData] = useState({
    tipo: "curso",
    descricao: "",
    valor: "",
    data_vencimento: format(new Date(), "yyyy-MM-dd"),
    metodo_pagamento: "",
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
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      
      // Auto-update overdue payments
      const updated = (data || []).map(p => {
        if (p.status === "pendente" && isPast(new Date(p.data_vencimento)) && !isToday(new Date(p.data_vencimento))) {
          return { ...p, status: "atrasado" };
        }
        return p;
      });
      
      setPayments(updated);
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
      return true;
    });
  }, [payments, activeTab, filterStatus]);

  const stats = useMemo(() => {
    const pending = payments.filter(p => p.status === "pendente" || p.status === "atrasado");
    const paid = payments.filter(p => p.status === "pago");
    const overdue = payments.filter(p => p.status === "atrasado");
    
    return {
      totalPending: pending.reduce((acc, p) => acc + p.valor, 0),
      totalPaid: paid.reduce((acc, p) => acc + p.valor, 0),
      countOverdue: overdue.length,
      countPending: pending.length,
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
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Pagamento removido" });
      await fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option ? <Badge className={option.color}>{option.label}</Badge> : null;
  };

  const getTypeBadge = (tipo: string) => {
    const option = PAYMENT_TYPES.find(t => t.value === tipo);
    return option ? <Badge className={option.color}>{option.label}</Badge> : null;
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
              <span className="text-sm font-medium tracking-wide uppercase">Financeiro</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Pagamentos
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Controle de pagamentos do curso, Moisés e Bruna.
            </p>
          </div>
        </motion.header>

        {/* Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-[hsl(var(--stats-gold))]" />
              <span className="text-sm text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.countPending}</p>
            <p className="text-sm text-muted-foreground">{formatCurrency(stats.totalPending)}</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Check className="h-5 w-5 text-[hsl(var(--stats-green))]" />
              <span className="text-sm text-muted-foreground">Pagos</span>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">{formatCurrency(stats.totalPaid)}</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-sm text-muted-foreground">Atrasados</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.countOverdue}</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6 flex items-center justify-center">
            <Button onClick={() => openModal()} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Pagamento
            </Button>
          </div>
        </motion.section>

        {/* Tabs and List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="curso">💰 Curso</TabsTrigger>
              <TabsTrigger value="pessoal_moises">👨 Moisés</TabsTrigger>
              <TabsTrigger value="pessoal_bruna">👩 Bruna</TabsTrigger>
            </TabsList>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-foreground">{payment.descricao}</p>
                        {payment.recorrente && (
                          <span className="text-xs text-muted-foreground">🔄 Recorrente</span>
                        )}
                      </td>
                      <td className="p-4">{getTypeBadge(payment.tipo)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {format(new Date(payment.data_vencimento), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold text-foreground">
                        {formatCurrency(payment.valor)}
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(payment.status)}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deletePayment(payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhum pagamento encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPayment ? "Editar" : "Novo"} Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Tipo *</Label>
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
                <Label>Descrição *</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Mensalidade, Aluguel, Internet..."
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor (R$) *</Label>
                  <Input
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0,00"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Vencimento *</Label>
                  <Input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label>Método de Pagamento</Label>
                <Input
                  value={formData.metodo_pagamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, metodo_pagamento: e.target.value }))}
                  placeholder="Ex: Pix, Boleto, Cartão..."
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Notas adicionais..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingPayment ? "Salvar Alterações" : "Adicionar Pagamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
