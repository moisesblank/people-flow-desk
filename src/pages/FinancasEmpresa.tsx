// ============================================
// MOISÉS MEDEIROS v15.0 - CENTRAL FINANCEIRA EMPRESARIAL
// Sistema Completo de Finanças: Gastos + Pagamentos + Gráficos + Relatórios
// Tudo unificado em um único lugar
// ============================================

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Bot, Star, Bookmark, Info, Copy, Landmark, Users, CircleOff, BadgeDollarSign
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, isPast, isToday, startOfMonth, endOfMonth, differenceInDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UniversalAttachments } from "@/components/attachments/UniversalAttachments";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCompanyFinanceHistory, formatCompanyCurrency, type CompanyPeriodFilter, type CompanyExpense, type PaymentStatus } from "@/hooks/useCompanyFinanceHistory";
import { usePaymentsHistory, formatPaymentCurrency, type Payment } from "@/hooks/usePaymentsHistory";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart as RechartPieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip } from "recharts";

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

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

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof Check }> = {
  pendente: { bg: "bg-yellow-500/20", text: "text-yellow-500", icon: Clock },
  pago: { bg: "bg-green-500/20", text: "text-green-500", icon: Check },
  atrasado: { bg: "bg-red-500/20", text: "text-red-500", icon: AlertCircle },
  cancelado: { bg: "bg-muted", text: "text-muted-foreground", icon: XCircle },
};

const CHART_COLORS = ['#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#F97316'];

type ViewMode = "dashboard" | "gastos" | "pagamentos" | "relatorios" | "meses" | "anos";
type ExpenseType = "fixed" | "extra";
type ItemType = "gasto_fixo" | "gasto_extra" | "pagamento";

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function FinancasEmpresa() {
  const { user } = useAuth();
  
  // Hooks de dados
  const companyFinance = useCompanyFinanceHistory();
  const paymentsHistory = usePaymentsHistory();

  // Estado local
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItemType, setModalItemType] = useState<ItemType>("gasto_fixo");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<any>(null);
  const [sortBy, setSortBy] = useState<"vencimento" | "data" | "valor" | "nome">("vencimento");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    valor: "",
    categoria: "",
    data: format(new Date(), "yyyy-MM-dd"),
    data_vencimento: "",
    status_pagamento: "pendente" as PaymentStatus,
    tipo: "curso",
    metodo_pagamento: "",
    observacoes: "",
    recorrente: false,
  });

  // ═══════════════════════════════════════════════════════════════
  // DADOS COMBINADOS
  // ═══════════════════════════════════════════════════════════════

  const allItems = useMemo(() => {
    const gastos = [
      ...companyFinance.fixedExpenses.map(e => ({ 
        ...e, 
        itemType: 'gasto_fixo' as ItemType,
        label: e.nome,
        statusKey: e.status_pagamento || 'pendente'
      })),
      ...companyFinance.extraExpenses.map(e => ({ 
        ...e, 
        itemType: 'gasto_extra' as ItemType,
        label: e.nome,
        statusKey: e.status_pagamento || 'pendente'
      })),
    ];

    const pagamentos = paymentsHistory.payments.map(p => ({
      ...p,
      itemType: 'pagamento' as ItemType,
      label: p.descricao,
      nome: p.descricao,
      statusKey: p.status,
      data: p.data_vencimento,
    }));

    let combined = [...gastos, ...pagamentos];

    // Filtro por tab
    if (activeTab === "fixos") {
      combined = combined.filter(i => i.itemType === 'gasto_fixo');
    } else if (activeTab === "extras") {
      combined = combined.filter(i => i.itemType === 'gasto_extra');
    } else if (activeTab === "pagamentos") {
      combined = combined.filter(i => i.itemType === 'pagamento');
    }

    // Filtro por busca
    if (searchTerm) {
      combined = combined.filter(i =>
        i.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenação por vencimento (mais próximo primeiro) como padrão
    return combined.sort((a, b) => {
      let comparison = 0;
      const today = new Date();
      
      if (sortBy === "vencimento") {
        // Ordenar por data de vencimento mais próxima
        const dateA = a.data_vencimento || a.data || a.created_at || '9999-12-31';
        const dateB = b.data_vencimento || b.data || b.created_at || '9999-12-31';
        const dA = new Date(dateA);
        const dB = new Date(dateB);
        
        // Priorizar itens pendentes/atrasados e com vencimento próximo
        const isPendingA = a.statusKey === 'pendente' || a.statusKey === 'atrasado';
        const isPendingB = b.statusKey === 'pendente' || b.statusKey === 'atrasado';
        
        if (isPendingA && !isPendingB) return -1;
        if (!isPendingA && isPendingB) return 1;
        
        // Ordenar por proximidade do vencimento
        const diffA = Math.abs(dA.getTime() - today.getTime());
        const diffB = Math.abs(dB.getTime() - today.getTime());
        comparison = diffA - diffB;
      } else if (sortBy === "data") {
        const dateA = a.data || a.created_at || '';
        const dateB = b.data || b.created_at || '';
        comparison = dateA.localeCompare(dateB);
      } else if (sortBy === "valor") {
        comparison = (a.valor || 0) - (b.valor || 0);
      } else if (sortBy === "nome") {
        comparison = (a.label || '').localeCompare(b.label || '');
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });
  }, [companyFinance.fixedExpenses, companyFinance.extraExpenses, paymentsHistory.payments, activeTab, searchTerm, sortBy, sortOrder]);

  // ═══════════════════════════════════════════════════════════════
  // ESTATÍSTICAS UNIFICADAS
  // ═══════════════════════════════════════════════════════════════

  const unifiedStats = useMemo(() => {
    const gastosFixos = companyFinance.fixedExpenses.reduce((sum, e) => sum + e.valor, 0);
    const gastosExtras = companyFinance.extraExpenses.reduce((sum, e) => sum + e.valor, 0);
    const totalGastos = gastosFixos + gastosExtras;
    const receitas = companyFinance.entradas.reduce((sum, e) => sum + (e.valor || 0), 0);

    const pagamentosTotal = paymentsHistory.payments.reduce((sum, p) => sum + p.valor, 0);
    const pagamentosPagos = paymentsHistory.payments.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.valor, 0);
    const pagamentosPendentes = paymentsHistory.payments.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.valor, 0);
    const pagamentosAtrasados = paymentsHistory.payments.filter(p => p.status === 'atrasado').reduce((sum, p) => sum + p.valor, 0);

    // Gastos por status
    const gastosPagos = allItems.filter(i => i.itemType !== 'pagamento' && i.statusKey === 'pago').reduce((sum, i) => sum + i.valor, 0);
    const gastosPendentes = allItems.filter(i => i.itemType !== 'pagamento' && i.statusKey === 'pendente').reduce((sum, i) => sum + i.valor, 0);
    const gastosAtrasados = allItems.filter(i => i.itemType !== 'pagamento' && i.statusKey === 'atrasado').reduce((sum, i) => sum + i.valor, 0);

    const totalPago = gastosPagos + pagamentosPagos;
    const totalPendente = gastosPendentes + pagamentosPendentes;
    const totalAtrasado = gastosAtrasados + pagamentosAtrasados;
    const totalGeral = totalGastos + pagamentosTotal;

    const percentPago = totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0;
    const saldo = receitas - totalGastos;

    return {
      gastosFixos,
      gastosExtras,
      totalGastos,
      receitas,
      pagamentosTotal,
      pagamentosPagos,
      pagamentosPendentes,
      pagamentosAtrasados,
      totalPago,
      totalPendente,
      totalAtrasado,
      totalGeral,
      percentPago,
      saldo,
      countGastosFixos: companyFinance.fixedExpenses.length,
      countGastosExtras: companyFinance.extraExpenses.length,
      countPagamentos: paymentsHistory.payments.length,
      countReceitas: companyFinance.entradas.length,
      countPago: allItems.filter(i => i.statusKey === 'pago').length,
      countPendente: allItems.filter(i => i.statusKey === 'pendente').length,
      countAtrasado: allItems.filter(i => i.statusKey === 'atrasado').length,
    };
  }, [companyFinance, paymentsHistory, allItems]);

  // ═══════════════════════════════════════════════════════════════
  // DADOS PARA GRÁFICOS
  // ═══════════════════════════════════════════════════════════════

  const chartData = useMemo(() => {
    // Dados por categoria
    const byCategory: Record<string, number> = {};
    allItems.forEach(item => {
      const cat = item.categoria || 'Outros';
      byCategory[cat] = (byCategory[cat] || 0) + item.valor;
    });
    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value: value / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Dados por tipo
    const typeData = [
      { name: 'Gastos Fixos', value: unifiedStats.gastosFixos / 100, color: '#EF4444' },
      { name: 'Gastos Extras', value: unifiedStats.gastosExtras / 100, color: '#3B82F6' },
      { name: 'Pagamentos', value: unifiedStats.pagamentosTotal / 100, color: '#8B5CF6' },
    ];

    // Dados por status
    const statusData = [
      { name: 'Pagos', value: unifiedStats.totalPago / 100, color: '#10B981' },
      { name: 'Pendentes', value: unifiedStats.totalPendente / 100, color: '#F59E0B' },
      { name: 'Atrasados', value: unifiedStats.totalAtrasado / 100, color: '#EF4444' },
    ];

    // Últimos 6 meses
    const monthlyData: { month: string; gastos: number; receitas: number; pagamentos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthNum = date.getMonth() + 1;
      const yearNum = date.getFullYear();
      
      const gastosMes = [...companyFinance.fixedExpenses, ...companyFinance.extraExpenses]
        .filter(e => e.mes === monthNum && e.ano === yearNum)
        .reduce((sum, e) => sum + e.valor, 0);

      const pagamentosMes = paymentsHistory.payments
        .filter(p => {
          const d = parseISO(p.data_vencimento);
          return d.getMonth() + 1 === monthNum && d.getFullYear() === yearNum;
        })
        .reduce((sum, p) => sum + p.valor, 0);

      const receitasMes = companyFinance.entradas
        .filter(e => {
          const d = e.created_at ? parseISO(e.created_at) : new Date();
          return d.getMonth() + 1 === monthNum && d.getFullYear() === yearNum;
        })
        .reduce((sum, e) => sum + (e.valor || 0), 0);

      monthlyData.push({
        month: format(date, 'MMM', { locale: ptBR }),
        gastos: gastosMes / 100,
        pagamentos: pagamentosMes / 100,
        receitas: receitasMes / 100,
      });
    }

    return { categoryData, typeData, statusData, monthlyData };
  }, [allItems, unifiedStats, companyFinance, paymentsHistory]);

  // ═══════════════════════════════════════════════════════════════
  // PRÓXIMOS VENCIMENTOS (ordenados por proximidade)
  // ═══════════════════════════════════════════════════════════════

  const proximosVencimentos = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filtrar apenas itens pendentes/atrasados com data de vencimento
    const itensComVencimento = allItems.filter(item => {
      const hasVencimento = item.data_vencimento || item.data;
      const isPending = item.statusKey === 'pendente' || item.statusKey === 'atrasado';
      return hasVencimento && isPending;
    });

    // Calcular dias até vencimento e ordenar
    const comDias = itensComVencimento.map(item => {
      const dataVenc = new Date(item.data_vencimento || item.data);
      dataVenc.setHours(0, 0, 0, 0);
      const diasAte = Math.floor((dataVenc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...item,
        diasAteVencimento: diasAte,
        dataVencimento: dataVenc,
        isVencidoHoje: diasAte === 0,
        isAtrasado: diasAte < 0,
        isProximo: diasAte > 0 && diasAte <= 7,
      };
    });

    // Ordenar: atrasados primeiro, depois por proximidade
    return comDias.sort((a, b) => {
      // Atrasados vêm primeiro
      if (a.isAtrasado && !b.isAtrasado) return -1;
      if (!a.isAtrasado && b.isAtrasado) return 1;
      // Vencendo hoje segundo
      if (a.isVencidoHoje && !b.isVencidoHoje) return -1;
      if (!a.isVencidoHoje && b.isVencidoHoje) return 1;
      // Depois por dias até vencimento (mais próximo primeiro)
      return a.diasAteVencimento - b.diasAteVencimento;
    });
  }, [allItems]);

  // Verificar vencimentos ao carregar e notificar
  useEffect(() => {
    const verificarVencimentos = async () => {
      const atrasados = proximosVencimentos.filter(v => v.isAtrasado);
      const vencendoHoje = proximosVencimentos.filter(v => v.isVencidoHoje);
      
      if (atrasados.length > 0 || vencendoHoje.length > 0) {
        const totalAtrasado = atrasados.reduce((sum, v) => sum + v.valor, 0);
        const totalHoje = vencendoHoje.reduce((sum, v) => sum + v.valor, 0);
        
        if (atrasados.length > 0) {
          toast.warning(
            `⚠️ ${atrasados.length} gasto(s) atrasado(s)! Total: ${formatCompanyCurrency(totalAtrasado)}`,
            { duration: 8000 }
          );
        }
        if (vencendoHoje.length > 0) {
          toast.info(
            `📅 ${vencendoHoje.length} gasto(s) vencem HOJE! Total: ${formatCompanyCurrency(totalHoje)}`,
            { duration: 8000 }
          );
        }

        // Chamar edge function para enviar email ao owner (se ainda não enviado hoje)
        try {
          const response = await supabase.functions.invoke('check-vencimentos');
          if (response.data?.success) {
            console.log('[Vencimentos] Edge function executada:', response.data);
          }
        } catch (error) {
          console.error('[Vencimentos] Erro ao verificar:', error);
        }
      }
    };

    if (proximosVencimentos.length > 0) {
      verificarVencimentos();
    }
  }, [proximosVencimentos]);

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const openModal = (type: ItemType, item?: any) => {
    setModalItemType(type);
    if (item) {
      setEditingItem(item);
      setFormData({
        nome: item.nome || item.descricao || "",
        descricao: item.descricao || item.nome || "",
        valor: String((item.valor || 0) / 100),
        categoria: item.categoria || "",
        data: item.data || format(new Date(), "yyyy-MM-dd"),
        data_vencimento: item.data_vencimento || "",
        status_pagamento: item.status_pagamento || item.status || "pendente",
        tipo: item.tipo || "curso",
        metodo_pagamento: item.metodo_pagamento || "",
        observacoes: item.observacoes || "",
        recorrente: item.recorrente || false,
      });
    } else {
      setEditingItem(null);
      setFormData({
        nome: "",
        descricao: "",
        valor: "",
        categoria: "",
        data: format(new Date(), "yyyy-MM-dd"),
        data_vencimento: format(new Date(), "yyyy-MM-dd"),
        status_pagamento: "pendente",
        tipo: "curso",
        metodo_pagamento: "",
        observacoes: "",
        recorrente: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome && !formData.descricao) {
      toast.error("Preencha nome/descrição");
      return;
    }
    if (!formData.valor) {
      toast.error("Preencha o valor");
      return;
    }

    const valorCentavos = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);
    const dataRef = new Date(formData.data || new Date());

    try {
      if (modalItemType === "gasto_fixo" || modalItemType === "gasto_extra") {
        const table = modalItemType === "gasto_fixo" ? "company_fixed_expenses" : "company_extra_expenses";
        const payload = {
          nome: formData.nome || formData.descricao,
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

        if (editingItem) {
          await supabase.from(table).update(payload).eq("id", editingItem.id);
          toast.success("Gasto atualizado!");
        } else {
          await supabase.from(table).insert(payload);
          toast.success("Gasto criado!");
        }
        companyFinance.refresh();
      } else {
        // Pagamento
        const payload = {
          tipo: formData.tipo,
          descricao: formData.descricao || formData.nome,
          valor: valorCentavos,
          data_vencimento: formData.data_vencimento || formData.data,
          metodo_pagamento: formData.metodo_pagamento || null,
          categoria: formData.categoria || null,
          observacoes: formData.observacoes || null,
          recorrente: formData.recorrente,
        };

        if (editingItem) {
          await supabase.from("payments").update(payload).eq("id", editingItem.id);
          toast.success("Pagamento atualizado!");
        } else {
          await supabase.from("payments").insert({
            ...payload,
            user_id: user?.id,
            created_by: user?.id,
          });
          toast.success("Pagamento criado!");
        }
        paymentsHistory.refresh();
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar");
    }
  };

  const handleDelete = async (item: any) => {
    try {
      if (item.itemType === "gasto_fixo") {
        await supabase.from("company_fixed_expenses").delete().eq("id", item.id);
        companyFinance.refresh();
      } else if (item.itemType === "gasto_extra") {
        await supabase.from("company_extra_expenses").delete().eq("id", item.id);
        companyFinance.refresh();
      } else {
        await supabase.from("payments").delete().eq("id", item.id);
        paymentsHistory.refresh();
      }
      toast.success("Excluído com sucesso!");
      setDeleteDialogOpen(null);
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const handleStatusChange = async (item: any, newStatus: string) => {
    try {
      if (item.itemType === "gasto_fixo") {
        await supabase.from("company_fixed_expenses").update({ status_pagamento: newStatus }).eq("id", item.id);
        companyFinance.refresh();
      } else if (item.itemType === "gasto_extra") {
        await supabase.from("company_extra_expenses").update({ status_pagamento: newStatus }).eq("id", item.id);
        companyFinance.refresh();
      } else {
        await supabase.from("payments").update({ 
          status: newStatus,
          data_pagamento: newStatus === 'pago' ? format(new Date(), "yyyy-MM-dd") : null
        }).eq("id", item.id);
        paymentsHistory.refresh();
      }
      toast.success(`Marcado como ${newStatus}`);
    } catch (error) {
      toast.error("Erro ao atualizar status");
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

  const refresh = () => {
    companyFinance.refresh();
    paymentsHistory.refresh();
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER DASHBOARD
  // ═══════════════════════════════════════════════════════════════

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "Gastos Fixos", value: unifiedStats.gastosFixos, icon: Building2, color: "from-red-500 to-red-500/50", count: unifiedStats.countGastosFixos },
          { label: "Gastos Extras", value: unifiedStats.gastosExtras, icon: Receipt, color: "from-blue-500 to-blue-500/50", count: unifiedStats.countGastosExtras },
          { label: "Total Gastos", value: unifiedStats.totalGastos, icon: Wallet, color: "from-primary to-primary/50", count: unifiedStats.countGastosFixos + unifiedStats.countGastosExtras },
          { label: "Receitas", value: unifiedStats.receitas, icon: TrendingUp, color: "from-emerald-500 to-emerald-500/50", count: unifiedStats.countReceitas },
          { label: "Pagos", value: unifiedStats.totalPago, icon: CheckCircle2, color: "from-green-500 to-green-500/50", count: unifiedStats.countPago },
          { label: "Pendentes", value: unifiedStats.totalPendente, icon: Clock, color: "from-yellow-500 to-yellow-500/50", count: unifiedStats.countPendente },
          { label: "Atrasados", value: unifiedStats.totalAtrasado, icon: AlertTriangle, color: "from-red-600 to-red-600/50", count: unifiedStats.countAtrasado },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-primary/30 transition-all group">
              <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", stat.color)} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <Badge variant="secondary" className="text-xs">{stat.count}</Badge>
                </div>
                <p className="text-xl font-bold">{formatCompanyCurrency(stat.value)}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress + Saldo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Progresso de Pagamentos
                </h3>
                <p className="text-sm text-muted-foreground">
                  {unifiedStats.countPago} de {allItems.length} itens pagos
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{unifiedStats.percentPago.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">concluído</p>
              </div>
            </div>
            <Progress value={unifiedStats.percentPago} className="h-3" />
            <div className="flex justify-between mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Pagos</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Pendentes</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Atrasados</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-border/50 bg-gradient-to-br",
          unifiedStats.saldo >= 0 ? "from-green-500/10 to-green-500/5" : "from-red-500/10 to-red-500/5"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {unifiedStats.saldo >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  Saldo do Período
                </h3>
                <p className="text-sm text-muted-foreground">Receitas - Gastos</p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-4xl font-bold",
                  unifiedStats.saldo >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {formatCompanyCurrency(unifiedStats.saldo)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════
          SEÇÃO: PRÓXIMOS VENCIMENTOS (ALERTA VISUAL)
          ════════════════════════════════════════════════════════════ */}
      {proximosVencimentos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className={cn(
            "border-2 overflow-hidden",
            proximosVencimentos.some(v => v.isAtrasado) 
              ? "border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-900/5" 
              : proximosVencimentos.some(v => v.isVencidoHoje)
              ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-yellow-900/5"
              : "border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-orange-900/5"
          )}>
            {/* Pulse animation para alertas urgentes */}
            {(proximosVencimentos.some(v => v.isAtrasado || v.isVencidoHoje)) && (
              <div className="absolute top-0 right-0 p-4">
                <span className="relative flex h-4 w-4">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    proximosVencimentos.some(v => v.isAtrasado) ? "bg-red-400" : "bg-yellow-400"
                  )}></span>
                  <span className={cn(
                    "relative inline-flex rounded-full h-4 w-4",
                    proximosVencimentos.some(v => v.isAtrasado) ? "bg-red-500" : "bg-yellow-500"
                  )}></span>
                </span>
              </div>
            )}
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className={cn(
                  "h-5 w-5",
                  proximosVencimentos.some(v => v.isAtrasado) ? "text-red-500 animate-pulse" : "text-yellow-500"
                )} />
                <span>Próximos Vencimentos</span>
                <Badge variant="outline" className={cn(
                  "ml-auto",
                  proximosVencimentos.some(v => v.isAtrasado) 
                    ? "bg-red-500/20 text-red-400 border-red-500/30" 
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                )}>
                  {proximosVencimentos.length} pendente{proximosVencimentos.length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription>
                {proximosVencimentos.filter(v => v.isAtrasado).length > 0 && (
                  <span className="text-red-400 font-semibold">
                    🚨 {proximosVencimentos.filter(v => v.isAtrasado).length} atrasado(s)! 
                  </span>
                )}
                {proximosVencimentos.filter(v => v.isVencidoHoje).length > 0 && (
                  <span className="text-yellow-400 font-semibold ml-2">
                    📅 {proximosVencimentos.filter(v => v.isVencidoHoje).length} vence(m) hoje! 
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {proximosVencimentos.slice(0, 8).map((item, index) => {
                  const statusConfig = STATUS_COLORS[item.statusKey] || STATUS_COLORS.pendente;
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <motion.div
                      key={`venc-${item.itemType}-${item.id}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01]",
                        item.isAtrasado 
                          ? "bg-red-500/10 border border-red-500/30 hover:bg-red-500/20" 
                          : item.isVencidoHoje
                          ? "bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20"
                          : item.isProximo
                          ? "bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10"
                          : "bg-muted/30 border border-border/30 hover:bg-muted/50"
                      )}
                      onClick={() => openModal(item.itemType, item)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          item.isAtrasado ? "bg-red-500/20" : item.isVencidoHoje ? "bg-yellow-500/20" : "bg-muted"
                        )}>
                          {item.itemType === 'gasto_fixo' ? <Building2 className="h-5 w-5 text-red-400" /> :
                           item.itemType === 'gasto_extra' ? <Receipt className="h-5 w-5 text-blue-400" /> :
                           <CreditCard className="h-5 w-5 text-purple-400" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{item.label}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {item.dataVencimento ? format(item.dataVencimento, "dd/MM/yyyy", { locale: ptBR }) : '--'}
                            </span>
                            <span className={cn(
                              "font-semibold",
                              item.isAtrasado ? "text-red-400" : item.isVencidoHoje ? "text-yellow-400" : "text-muted-foreground"
                            )}>
                              {item.isAtrasado 
                                ? `${Math.abs(item.diasAteVencimento)} dia(s) atrasado` 
                                : item.isVencidoHoje 
                                ? "VENCE HOJE!" 
                                : `em ${item.diasAteVencimento} dia(s)`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary text-base">
                          {formatCompanyCurrency(item.valor)}
                        </span>
                        
                        {/* Status clicável */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all hover:opacity-80",
                                statusConfig.bg, 
                                statusConfig.text
                              )}>
                                <StatusIcon className="h-3 w-3" />
                                <span className="capitalize">{item.statusKey}</span>
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[140px]">
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(item, 'pago')}
                                className="gap-2 cursor-pointer"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Marcar Pago</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(item, 'pendente')}
                                className="gap-2 cursor-pointer"
                              >
                                <Clock className="h-4 w-4 text-yellow-500" />
                                <span>Pendente</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(item, 'atrasado')}
                                className="gap-2 cursor-pointer"
                              >
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span>Atrasado</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {proximosVencimentos.length > 8 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    + {proximosVencimentos.length - 8} outros vencimentos...
                  </p>
                )}
              </div>
              
              {/* Resumo total */}
              <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total pendente:</span>
                <span className="font-bold text-xl text-primary">
                  {formatCompanyCurrency(proximosVencimentos.reduce((sum, v) => sum + v.valor, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.monthlyData}>
                  <defs>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                  />
                  <Area type="monotone" dataKey="gastos" stroke="#EF4444" fill="url(#colorGastos)" name="Gastos" />
                  <Area type="monotone" dataKey="receitas" stroke="#10B981" fill="url(#colorReceitas)" name="Receitas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Status */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Status dos Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: R$${value.toLocaleString('pt-BR')}`}
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                  />
                </RechartPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "+ Gasto Fixo", icon: Building2, color: "text-red-500 border-red-500/30 hover:bg-red-500/10", action: () => openModal("gasto_fixo") },
          { label: "+ Gasto Extra", icon: Receipt, color: "text-blue-500 border-blue-500/30 hover:bg-blue-500/10", action: () => openModal("gasto_extra") },
          { label: "+ Pagamento", icon: CreditCard, color: "text-purple-500 border-purple-500/30 hover:bg-purple-500/10", action: () => openModal("pagamento") },
          { label: "Ver Todos", icon: List, color: "text-primary border-primary/30 hover:bg-primary/10", action: () => setViewMode("gastos") },
        ].map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Button 
              variant="outline"
              className={cn("w-full h-16 flex flex-col gap-1", action.color)}
              onClick={action.action}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Lista Recente - Estilo Multinacional */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30 bg-gradient-to-r from-secondary/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Lançamentos Recentes</CardTitle>
              <p className="text-xs text-muted-foreground">Últimas movimentações financeiras</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setViewMode("gastos")}>
            Ver todos <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header da Tabela */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/30 border-b border-border/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4 md:col-span-4">Descrição</div>
            <div className="col-span-2 md:col-span-2">Categoria</div>
            <div className="col-span-2 md:col-span-2 text-center">Data</div>
            <div className="col-span-2 md:col-span-2 text-right">Valor</div>
            <div className="col-span-2 md:col-span-2 text-center">Status</div>
          </div>

          {/* Lista de Items */}
          <div className="divide-y divide-border/20">
            {allItems.slice(0, 10).map((item, index) => {
              const statusConfig = STATUS_COLORS[item.statusKey] || STATUS_COLORS.pendente;
              const StatusIcon = statusConfig.icon;
              const itemDate = item.data ? parseISO(item.data) : null;
              const daysDiff = itemDate ? differenceInDays(new Date(), itemDate) : null;
              
              // Determinar texto relativo de tempo
              let timeRelative = '--';
              if (itemDate) {
                if (isToday(itemDate)) {
                  timeRelative = 'Hoje';
                } else if (daysDiff === 1) {
                  timeRelative = 'Ontem';
                } else if (daysDiff !== null && daysDiff > 0 && daysDiff <= 7) {
                  timeRelative = `${daysDiff} dias atrás`;
                } else if (daysDiff !== null && daysDiff > 7 && daysDiff <= 30) {
                  timeRelative = `${Math.floor(daysDiff / 7)} sem. atrás`;
                } else {
                  timeRelative = format(itemDate, "dd/MM/yy");
                }
              }

              return (
                <motion.div
                  key={`${item.itemType}-${item.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-secondary/30 transition-all cursor-pointer group"
                  onClick={() => openModal(item.itemType, item)}
                >
                  {/* Descrição com Ícone */}
                  <div className="col-span-4 md:col-span-4 flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                      item.itemType === 'gasto_fixo' ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20" :
                      item.itemType === 'gasto_extra' ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20" : 
                      "bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20"
                    )}>
                      {item.itemType === 'gasto_fixo' ? <Building2 className="h-5 w-5 text-red-500" /> :
                       item.itemType === 'gasto_extra' ? <Receipt className="h-5 w-5 text-blue-500" /> :
                       <CreditCard className="h-5 w-5 text-purple-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{item.label}</p>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={cn(
                          "text-[10px] h-5 px-1.5",
                          item.itemType === 'gasto_fixo' ? "border-red-500/30 text-red-400" :
                          item.itemType === 'gasto_extra' ? "border-blue-500/30 text-blue-400" : 
                          "border-purple-500/30 text-purple-400"
                        )}>
                          {item.itemType === 'gasto_fixo' ? 'Fixo' :
                           item.itemType === 'gasto_extra' ? 'Extra' : 'Pagamento'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Categoria */}
                  <div className="col-span-2 md:col-span-2 flex items-center">
                    <span className="text-sm text-muted-foreground truncate">{item.categoria || 'Outros'}</span>
                  </div>

                  {/* Data Completa */}
                  <div className="col-span-2 md:col-span-2 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-foreground">
                      {itemDate ? format(itemDate, "dd MMM", { locale: ptBR }) : '--'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {timeRelative}
                    </span>
                  </div>

                  {/* Valor */}
                  <div className="col-span-2 md:col-span-2 flex items-center justify-end">
                    <span className="font-bold text-primary text-base tabular-nums">
                      {formatCompanyCurrency(item.valor)}
                    </span>
                  </div>

                  {/* Status - Clicável para mudar */}
                  <div 
                    className="col-span-2 md:col-span-2 flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all hover:opacity-80 hover:scale-105",
                          statusConfig.bg, 
                          statusConfig.text
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          <span className="capitalize">{item.statusKey}</span>
                          <ChevronDown className="h-3 w-3 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="min-w-[140px]">
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(item, 'pago')}
                          className="gap-2 cursor-pointer"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Pago</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(item, 'pendente')}
                          className="gap-2 cursor-pointer"
                        >
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span>Pendente</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(item, 'atrasado')}
                          className="gap-2 cursor-pointer"
                        >
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>Atrasado</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer com Total */}
          {allItems.length > 0 && (
            <div className="px-4 py-3 bg-muted/30 border-t border-border/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Mostrando {Math.min(10, allItems.length)} de {allItems.length} lançamentos
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Total visível:</span>
                  <span className="font-bold text-primary">
                    {formatCompanyCurrency(allItems.slice(0, 10).reduce((sum, i) => sum + i.valor, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {allItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">Nenhum lançamento encontrado</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Adicione seu primeiro lançamento acima</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER LISTA DE GASTOS/PAGAMENTOS
  // ═══════════════════════════════════════════════════════════════

  const renderGastosList = () => (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar gastos e pagamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="todos" className="gap-1"><Wallet className="h-4 w-4" /> Todos</TabsTrigger>
                <TabsTrigger value="fixos" className="gap-1"><Building2 className="h-4 w-4" /> Fixos</TabsTrigger>
                <TabsTrigger value="extras" className="gap-1"><Receipt className="h-4 w-4" /> Extras</TabsTrigger>
                <TabsTrigger value="pagamentos" className="gap-1"><CreditCard className="h-4 w-4" /> Pagamentos</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button variant="outline" size="icon" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Descrição</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Tipo</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Categoria</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Data</th>
                  <th className="text-right p-4 font-medium text-sm text-muted-foreground">Valor</th>
                  <th className="text-center p-4 font-medium text-sm text-muted-foreground">Status</th>
                  <th className="text-center p-4 font-medium text-sm text-muted-foreground">Anexos</th>
                  <th className="text-center p-4 font-medium text-sm text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item) => {
                  const statusConfig = STATUS_COLORS[item.statusKey] || STATUS_COLORS.pendente;
                  const StatusIcon = statusConfig.icon;
                  const isExpanded = expandedRows.has(`${item.itemType}-${item.id}`);

                  return (
                    <>
                      <tr 
                        key={`${item.itemType}-${item.id}`}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => toggleRow(`${item.itemType}-${item.id}`)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={cn(
                            item.itemType === 'gasto_fixo' ? "border-red-500/50 text-red-500" :
                            item.itemType === 'gasto_extra' ? "border-blue-500/50 text-blue-500" :
                            "border-purple-500/50 text-purple-500"
                          )}>
                            {item.itemType === 'gasto_fixo' ? 'Fixo' :
                             item.itemType === 'gasto_extra' ? 'Extra' : 'Pagamento'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{item.categoria || '--'}</td>
                        <td className="p-4 text-sm">
                          {item.data ? format(parseISO(item.data), 'dd/MM/yyyy') : '--'}
                        </td>
                        <td className="p-4 text-right font-bold text-primary">
                          {formatCompanyCurrency(item.valor)}
                        </td>
                        <td className="p-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className={cn("gap-1", statusConfig.bg, statusConfig.text)}>
                                <StatusIcon className="h-3 w-3" />
                                {item.statusKey}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(item, 'pago'); }}>
                                <Check className="h-4 w-4 mr-2 text-green-500" /> Marcar Pago
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(item, 'pendente'); }}>
                                <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Marcar Pendente
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(item, 'atrasado'); }}>
                                <AlertCircle className="h-4 w-4 mr-2 text-red-500" /> Marcar Atrasado
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="secondary" className="text-xs">
                            <Paperclip className="h-3 w-3 mr-1" />
                            0
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(item.itemType, item)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400" onClick={() => setDeleteDialogOpen(item)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-muted/20 border-b border-border/30"
                              >
                                <div className="p-6">
                                  <MinimizableSection 
                                    title="Comprovantes e Anexos"
                                    storageKey={`attachments-${item.itemType}-${item.id}`}
                                  >
                                    <UniversalAttachments
                                      entityType={item.itemType === 'pagamento' ? 'payment' : item.itemType === 'gasto_fixo' ? 'company_expense_fixed' : 'company_expense_extra'}
                                      entityId={String(item.id)}
                                    />
                                  </MinimizableSection>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
              </tbody>
            </table>

            {allItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nenhum item encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER RELATÓRIOS
  // ═══════════════════════════════════════════════════════════════

  const renderRelatorios = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Categoria */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Gastos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} />
                  <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Por Tipo */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPieChart>
                  <Pie
                    data={chartData.typeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                  />
                </RechartPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendência */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendência Mensal (Gastos vs Receitas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `R$${v}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Legend />
                <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} name="Gastos" />
                <Line type="monotone" dataKey="pagamentos" stroke="#8B5CF6" strokeWidth={2} name="Pagamentos" />
                <Line type="monotone" dataKey="receitas" stroke="#10B981" strokeWidth={2} name="Receitas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 text-primary mb-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wider">Central Financeira</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Finanças Empresa
            </h1>
            <p className="text-muted-foreground mt-1">
              Gastos, pagamentos, gráficos e relatórios em um único lugar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period Filter */}
            <div className="flex items-center gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={companyFinance.period === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => companyFinance.setPeriod(opt.value as CompanyPeriodFilter)}
                  className="gap-1"
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </Button>
              ))}
            </div>

            <Button onClick={refresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openModal("gasto_fixo")}>
                  <Building2 className="h-4 w-4 mr-2 text-red-500" /> Gasto Fixo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModal("gasto_extra")}>
                  <Receipt className="h-4 w-4 mr-2 text-blue-500" /> Gasto Extra
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openModal("pagamento")}>
                  <CreditCard className="h-4 w-4 mr-2 text-purple-500" /> Pagamento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="mb-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Home className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="gastos" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <List className="h-4 w-4" /> Gastos & Pagamentos
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4" /> Relatórios
          </TabsTrigger>
          <TabsTrigger value="meses" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CalendarDays className="h-4 w-4" /> Meses
          </TabsTrigger>
          <TabsTrigger value="anos" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CalendarRange className="h-4 w-4" /> Anos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {viewMode === "dashboard" && renderDashboard()}
          {viewMode === "gastos" && renderGastosList()}
          {viewMode === "relatorios" && renderRelatorios()}
          {viewMode === "meses" && (
            <Card className="border-border/50 p-8 text-center">
              <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fechamento Mensal</h3>
              <p className="text-muted-foreground">
                Histórico de fechamentos mensais com resumo de gastos, receitas e saldo.
              </p>
            </Card>
          )}
          {viewMode === "anos" && (
            <Card className="border-border/50 p-8 text-center">
              <CalendarRange className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fechamento Anual</h3>
              <p className="text-muted-foreground">
                Histórico de fechamentos anuais com comparativos e análises.
              </p>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal Criar/Editar */}
      <ResizableDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ResizableDialogContent className="sm:max-w-[600px]">
          <ResizableDialogHeader>
            <ResizableDialogTitle className="flex items-center gap-2">
              {modalItemType === "gasto_fixo" ? <Building2 className="h-5 w-5 text-red-500" /> :
               modalItemType === "gasto_extra" ? <Receipt className="h-5 w-5 text-blue-500" /> :
               <CreditCard className="h-5 w-5 text-purple-500" />}
              {editingItem ? "Editar" : "Novo"} {
                modalItemType === "gasto_fixo" ? "Gasto Fixo" :
                modalItemType === "gasto_extra" ? "Gasto Extra" : "Pagamento"
              }
            </ResizableDialogTitle>
          </ResizableDialogHeader>
          <ResizableDialogBody>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{modalItemType === "pagamento" ? "Descrição" : "Nome"}</Label>
                  <Input
                    value={modalItemType === "pagamento" ? formData.descricao : formData.nome}
                    onChange={(e) => setFormData(prev => modalItemType === "pagamento" 
                      ? { ...prev, descricao: e.target.value }
                      : { ...prev, nome: e.target.value }
                    )}
                    placeholder={modalItemType === "pagamento" ? "Descrição do pagamento..." : "Nome do gasto..."}
                  />
                </div>

                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="text"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

                <div>
                  <Label>Status</Label>
                  <Select value={formData.status_pagamento} onValueChange={(v) => setFormData(prev => ({ ...prev, status_pagamento: v as PaymentStatus }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {modalItemType === "pagamento" && (
                  <div>
                    <Label>Método de Pagamento</Label>
                    <Select value={formData.metodo_pagamento} onValueChange={(v) => setFormData(prev => ({ ...prev, metodo_pagamento: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <MinimizableSection 
                title="Observações"
                storageKey="modal-observacoes"
              >
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </MinimizableSection>

              {editingItem && (
                <MinimizableSection
                  title="Comprovantes e Anexos"
                  storageKey="modal-anexos"
                >
                  <UniversalAttachments
                    entityType={modalItemType === 'pagamento' ? 'payment' : modalItemType === 'gasto_fixo' ? 'company_expense_fixed' : 'company_expense_extra'}
                    entityId={String(editingItem.id)}
                  />
                </MinimizableSection>
              )}
            </div>
          </ResizableDialogBody>
          <ResizableDialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gap-2">
              <Check className="h-4 w-4" />
              {editingItem ? "Salvar" : "Criar"}
            </Button>
          </ResizableDialogFooter>
        </ResizableDialogContent>
      </ResizableDialog>

      {/* Dialog Excluir */}
      <AlertDialog open={!!deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteDialogOpen?.label}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialogOpen)} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
