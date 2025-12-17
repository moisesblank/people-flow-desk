// ============================================
// MOISÉS MEDEIROS v15.0 - AFILIADOS PRO
// Sistema Completo de Gestão de Afiliados
// Integração Total com Hotmart
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { 
  Plus, 
  Handshake, 
  Sparkles, 
  Trash2, 
  Edit2, 
  DollarSign,
  TrendingUp,
  Users,
  Link2,
  Copy,
  Check,
  Mail,
  Phone,
  Shield,
  Key,
  ExternalLink,
  BarChart3,
  Percent,
  Zap,
  Wallet,
  Building2,
  CreditCard,
  QrCode,
  Tag,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Award,
  Search,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Banknote,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HotmartSyncWidget } from "@/components/affiliates/HotmartSyncWidget";
import { AffiliateEmailComposer } from "@/components/affiliates/AffiliateEmailComposer";

interface Affiliate {
  id: number;
  nome: string;
  email: string;
  hotmart_id: string;
  total_vendas: number;
  comissao_total: number;
  telefone?: string;
  whatsapp?: string;
  status?: string;
  taxa_comissao?: number;
  percentual_comissao?: number;
  link_afiliado?: string;
  user_id?: string;
  created_at?: string;
  cupom?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;
  parceiro_aluno?: boolean;
}

interface Commission {
  id: string;
  afiliado_id: number;
  valor: number;
  data: string;
  status: string;
  descricao?: string;
  pago_em?: string;
  aluno_id?: string;
  transaction_id?: string;
}

const BRAZILIAN_BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "260", name: "Nubank" },
  { code: "077", name: "Inter" },
  { code: "336", name: "C6 Bank" },
  { code: "212", name: "Banco Original" },
  { code: "756", name: "Sicoob" },
  { code: "748", name: "Sicredi" },
  { code: "422", name: "Safra" },
  { code: "070", name: "BRB" },
  { code: "085", name: "Via Credi" },
  { code: "290", name: "PagSeguro" },
  { code: "380", name: "PicPay" },
  { code: "000", name: "Outro" },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export default function Afiliados() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Affiliate | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sortBy, setSortBy] = useState<"nome" | "vendas" | "comissao">("vendas");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSelectedAffiliate, setEmailSelectedAffiliate] = useState<Affiliate | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    hotmart_id: "",
    telefone: "",
    whatsapp: "",
    taxa_comissao: "30",
    percentual_comissao: "20",
    link_afiliado: "",
    cupom: "",
    banco: "",
    agencia: "",
    conta: "",
    pix: "",
    status: "ativo",
    parceiro_aluno: false,
  });

  const [newCommission, setNewCommission] = useState({
    valor: "",
    descricao: "",
    status: "pendente",
  });

  const fetchData = async () => {
    try {
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (affiliatesError) throw affiliatesError;
      
      setAffiliates(affiliatesData?.map(a => ({
        id: a.id,
        nome: a.nome,
        email: a.email || "",
        hotmart_id: a.hotmart_id || "",
        total_vendas: a.total_vendas || 0,
        comissao_total: a.comissao_total || 0,
        telefone: a.telefone || "",
        whatsapp: a.whatsapp || "",
        status: a.status || "ativo",
        taxa_comissao: a.taxa_comissao || 30,
        percentual_comissao: a.percentual_comissao || 20,
        link_afiliado: a.link_afiliado || "",
        user_id: a.user_id || null,
        created_at: a.created_at || null,
        cupom: a.cupom || "",
        banco: a.banco || "",
        agencia: a.agencia || "",
        conta: a.conta || "",
        pix: a.pix || "",
        parceiro_aluno: a.parceiro_aluno || false,
      })) || []);

      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from("comissoes")
        .select("*")
        .order("data", { ascending: false });
      
      setCommissions(commissionsData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Estatísticas
  const totalVendas = affiliates.reduce((acc, a) => acc + a.total_vendas, 0);
  const totalComissoes = affiliates.reduce((acc, a) => acc + a.comissao_total, 0);
  const activeAffiliates = affiliates.filter(a => a.status === "ativo").length;
  const pendingCommissions = commissions.filter(c => c.status === "pendente").reduce((acc, c) => acc + c.valor, 0);
  const paidCommissions = commissions.filter(c => c.status === "pago").reduce((acc, c) => acc + c.valor, 0);
  const affiliatesWithBank = affiliates.filter(a => a.pix || (a.banco && a.conta)).length;

  // Filtrar e ordenar afiliados
  const filteredAffiliates = affiliates
    .filter(a => {
      const matchesSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.cupom?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "nome") comparison = a.nome.localeCompare(b.nome);
      if (sortBy === "vendas") comparison = a.total_vendas - b.total_vendas;
      if (sortBy === "comissao") comparison = a.comissao_total - b.comissao_total;
      return sortOrder === "desc" ? -comparison : comparison;
    });

  const openModal = (affiliate?: Affiliate) => {
    setEditingItem(affiliate || null);
    setFormData(affiliate ? {
      nome: affiliate.nome,
      email: affiliate.email,
      hotmart_id: affiliate.hotmart_id,
      telefone: affiliate.telefone || "",
      whatsapp: affiliate.whatsapp || "",
      taxa_comissao: (affiliate.taxa_comissao || 30).toString(),
      percentual_comissao: (affiliate.percentual_comissao || 20).toString(),
      link_afiliado: affiliate.link_afiliado || "",
      cupom: affiliate.cupom || "",
      banco: affiliate.banco || "",
      agencia: affiliate.agencia || "",
      conta: affiliate.conta || "",
      pix: affiliate.pix || "",
      status: affiliate.status || "ativo",
      parceiro_aluno: affiliate.parceiro_aluno || false,
    } : {
      nome: "",
      email: "",
      hotmart_id: "",
      telefone: "",
      whatsapp: "",
      taxa_comissao: "30",
      percentual_comissao: "20",
      link_afiliado: "",
      cupom: "",
      banco: "",
      agencia: "",
      conta: "",
      pix: "",
      status: "ativo",
      parceiro_aluno: false,
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setIsDetailModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Preencha o nome do afiliado");
      return;
    }

    try {
      const payload = {
        nome: formData.nome,
        email: formData.email || null,
        hotmart_id: formData.hotmart_id || null,
        telefone: formData.telefone || null,
        whatsapp: formData.whatsapp || null,
        taxa_comissao: parseInt(formData.taxa_comissao) || 30,
        percentual_comissao: parseFloat(formData.percentual_comissao) || 20,
        link_afiliado: formData.link_afiliado || null,
        cupom: formData.cupom?.toUpperCase() || null,
        banco: formData.banco || null,
        agencia: formData.agencia || null,
        conta: formData.conta || null,
        pix: formData.pix || null,
        status: formData.status,
        parceiro_aluno: formData.parceiro_aluno,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("affiliates")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Afiliado atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("affiliates").insert(payload);
        if (error) throw error;
        toast.success("Afiliado cadastrado com sucesso!");
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving affiliate:", error);
      toast.error(error.message || "Erro ao salvar afiliado");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este afiliado?")) return;
    
    try {
      const { error } = await supabase.from("affiliates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Afiliado removido!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting affiliate:", error);
      toast.error("Erro ao remover");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      toast.success(`${label} copiado!`);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleAddCommission = async () => {
    if (!selectedAffiliate || !newCommission.valor) {
      toast.error("Preencha o valor da comissão");
      return;
    }

    try {
      const { error } = await supabase.from("comissoes").insert({
        afiliado_id: selectedAffiliate.id,
        valor: parseFloat(newCommission.valor) * 100,
        descricao: newCommission.descricao || `Comissão manual para ${selectedAffiliate.nome}`,
        status: newCommission.status,
        data: new Date().toISOString(),
      });

      if (error) throw error;
      
      toast.success("Comissão adicionada!");
      setNewCommission({ valor: "", descricao: "", status: "pendente" });
      setIsCommissionModalOpen(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar comissão");
    }
  };

  const markCommissionAsPaid = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from("comissoes")
        .update({ status: "pago", pago_em: new Date().toISOString() })
        .eq("id", commissionId);

      if (error) throw error;
      toast.success("Comissão marcada como paga!");
      await fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar comissão");
    }
  };

  const getAffiliateCommissions = (affiliateId: number) => {
    return commissions.filter(c => c.afiliado_id === affiliateId);
  };

  const getBankName = (code: string) => {
    return BRAZILIAN_BANKS.find(b => b.code === code)?.name || code;
  };

  return (
    <>
      <Helmet>
        <title>Afiliados | Moisés Medeiros</title>
        <meta name="description" content="Sistema completo de gestão de afiliados com integração Hotmart" />
      </Helmet>

      <div className="p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <motion.div className="flex items-center gap-2 text-orange-500">
                  <Zap className="h-5 w-5" />
                  <span className="text-sm font-medium tracking-wide uppercase">Hotmart Integration</span>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                  Afiliados
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Sistema completo de gestão de parceiros, comissões e pagamentos.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEmailSelectedAffiliate(null);
                    setIsEmailModalOpen(true);
                  }} 
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" /> Enviar Email
                </Button>
                <Button onClick={() => openModal()} size="lg" className="gap-2">
                  <Plus className="h-5 w-5" /> Novo Afiliado
                </Button>
              </div>
            </div>
          </motion.header>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Afiliados</p>
                      <p className="text-3xl font-bold">{affiliates.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeAffiliates} ativos
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-[hsl(var(--stats-green))]/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Vendas</p>
                      <p className="text-3xl font-bold">{totalVendas}</p>
                      <p className="text-xs text-[hsl(var(--stats-green))] mt-1 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        via afiliados
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[hsl(var(--stats-green))]/10">
                      <TrendingUp className="h-6 w-6 text-[hsl(var(--stats-green))]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-[hsl(var(--stats-purple))]/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                      <p className="text-3xl font-bold text-[hsl(var(--stats-green))]">
                        {formatCurrency(paidCommissions)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        total histórico
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[hsl(var(--stats-green))]/10">
                      <BadgeCheck className="h-6 w-6 text-[hsl(var(--stats-green))]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-[hsl(var(--stats-gold))]/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Comissões Pendentes</p>
                      <p className="text-3xl font-bold text-[hsl(var(--stats-gold))]">
                        {formatCurrency(pendingCommissions)}
                      </p>
                      <p className="text-xs text-[hsl(var(--stats-gold))] mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        aguardando pagamento
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[hsl(var(--stats-gold))]/10">
                      <PiggyBank className="h-6 w-6 text-[hsl(var(--stats-gold))]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-[hsl(var(--stats-blue))]/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Dados Bancários</p>
                      <p className="text-3xl font-bold">{affiliatesWithBank}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        de {affiliates.length} cadastrados
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[hsl(var(--stats-blue))]/10">
                      <Building2 className="h-6 w-6 text-[hsl(var(--stats-blue))]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Affiliates List */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="lista" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="lista" className="gap-2 text-xs sm:text-sm">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Lista</span>
                  </TabsTrigger>
                  <TabsTrigger value="comissoes" className="gap-2 text-xs sm:text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Comissões</span>
                  </TabsTrigger>
                  <TabsTrigger value="cupons" className="gap-2 text-xs sm:text-sm">
                    <Tag className="h-4 w-4" />
                    <span className="hidden sm:inline">Cupons</span>
                  </TabsTrigger>
                  <TabsTrigger value="hotmart" className="gap-2 text-xs sm:text-sm">
                    <Zap className="h-4 w-4" />
                    <span className="hidden sm:inline">Hotmart</span>
                  </TabsTrigger>
                </TabsList>

                {/* Lista de Afiliados */}
                <TabsContent value="lista" className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, email ou cupom..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativos</SelectItem>
                        <SelectItem value="inativo">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Afiliado</th>
                              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Cupom</th>
                              <th className="text-center p-4 text-sm font-medium text-muted-foreground">Comissão</th>
                              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Vendas</th>
                              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Total</th>
                              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAffiliates.map((affiliate, index) => (
                              <motion.tr 
                                key={affiliate.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="border-t border-border/50 hover:bg-muted/30 transition-colors"
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {affiliate.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-foreground">{affiliate.nome}</p>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={affiliate.status === "ativo" ? "default" : "secondary"} className="text-[10px]">
                                          {affiliate.status}
                                        </Badge>
                                        {affiliate.pix && (
                                          <Badge variant="outline" className="text-[10px] gap-1">
                                            <QrCode className="h-2.5 w-2.5" />
                                            PIX
                                          </Badge>
                                        )}
                                        {affiliate.parceiro_aluno && (
                                          <Badge variant="outline" className="text-[10px] gap-1 border-[hsl(var(--stats-gold))] text-[hsl(var(--stats-gold))]">
                                            <Award className="h-2.5 w-2.5" />
                                            Aluno
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 hidden lg:table-cell">
                                  {affiliate.cupom ? (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono bg-[hsl(var(--stats-purple))]/10 border-[hsl(var(--stats-purple))]/30">
                                        {affiliate.cupom}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(affiliate.cupom!, "Cupom")}
                                      >
                                        {copiedLink === affiliate.cupom ? (
                                          <Check className="h-3 w-3 text-[hsl(var(--stats-green))]" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <Badge variant="outline" className="gap-1">
                                    <Percent className="h-3 w-3" />
                                    {affiliate.percentual_comissao || affiliate.taxa_comissao || 30}%
                                  </Badge>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold">{affiliate.total_vendas}</span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold text-[hsl(var(--stats-green))]">
                                    {formatCurrency(affiliate.comissao_total)}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openDetailModal(affiliate)} title="Ver Detalhes">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {affiliate.email && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => {
                                          setEmailSelectedAffiliate(affiliate);
                                          setIsEmailModalOpen(true);
                                        }} 
                                        title="Enviar Email"
                                        className="text-primary hover:text-primary"
                                      >
                                        <Mail className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => openModal(affiliate)} title="Editar">
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDelete(affiliate.id)} 
                                      className="text-destructive hover:text-destructive"
                                      title="Excluir"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                            {filteredAffiliates.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-12 text-center">
                                  <Handshake className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                  <p className="text-muted-foreground">Nenhum afiliado encontrado</p>
                                  <Button variant="outline" className="mt-4 gap-2" onClick={() => openModal()}>
                                    <Plus className="h-4 w-4" />
                                    Adicionar primeiro afiliado
                                  </Button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Comissões */}
                <TabsContent value="comissoes">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-[hsl(var(--stats-green))]" />
                            Histórico de Comissões
                          </CardTitle>
                          <CardDescription>
                            Todas as comissões registradas
                          </CardDescription>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => fetchData()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Atualizar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {commissions.length === 0 ? (
                          <div className="text-center py-12">
                            <DollarSign className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhuma comissão registrada</p>
                          </div>
                        ) : (
                          commissions.slice(0, 20).map((commission) => {
                            const affiliate = affiliates.find(a => a.id === commission.afiliado_id);
                            return (
                              <motion.div
                                key={commission.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    commission.status === "pago" 
                                      ? "bg-[hsl(var(--stats-green))]/10" 
                                      : "bg-[hsl(var(--stats-gold))]/10"
                                  }`}>
                                    {commission.status === "pago" ? (
                                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                                    ) : (
                                      <Clock className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{affiliate?.nome || "Afiliado"}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {commission.descricao || "Comissão de venda"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(commission.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold ${
                                    commission.status === "pago" 
                                      ? "text-[hsl(var(--stats-green))]" 
                                      : "text-[hsl(var(--stats-gold))]"
                                  }`}>
                                    {formatCurrency(commission.valor)}
                                  </p>
                                  <Badge variant={commission.status === "pago" ? "default" : "secondary"}>
                                    {commission.status === "pago" ? "Pago" : "Pendente"}
                                  </Badge>
                                  {commission.status !== "pago" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-2"
                                      onClick={() => markCommissionAsPaid(commission.id)}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Pagar
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Cupons */}
                <TabsContent value="cupons">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-[hsl(var(--stats-purple))]" />
                        Cupons de Afiliados
                      </CardTitle>
                      <CardDescription>
                        Cupons de desconto vinculados a cada afiliado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {affiliates.filter(a => a.cupom).map((affiliate) => (
                          <motion.div
                            key={affiliate.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-xl border border-[hsl(var(--stats-purple))]/20 bg-[hsl(var(--stats-purple))]/5"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {affiliate.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{affiliate.nome}</span>
                              </div>
                              <Badge variant={affiliate.status === "ativo" ? "default" : "secondary"}>
                                {affiliate.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-3 py-2 rounded-lg bg-background font-mono text-lg font-bold text-center">
                                {affiliate.cupom}
                              </code>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(affiliate.cupom!, "Cupom")}
                              >
                                {copiedLink === affiliate.cupom ? (
                                  <Check className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{affiliate.total_vendas} vendas</span>
                              <span className="text-[hsl(var(--stats-green))]">{formatCurrency(affiliate.comissao_total)}</span>
                            </div>
                          </motion.div>
                        ))}
                        {affiliates.filter(a => a.cupom).length === 0 && (
                          <div className="col-span-2 text-center py-12">
                            <Tag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhum cupom cadastrado</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Adicione cupons ao editar os afiliados
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Hotmart Integration */}
                <TabsContent value="hotmart">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-orange-500" />
                          Configuração do Webhook
                        </CardTitle>
                        <CardDescription>
                          Configure a integração com a Hotmart para receber dados automaticamente
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted/50">
                          <Label className="text-xs text-muted-foreground">URL do Webhook</Label>
                          <code className="block mt-2 text-sm break-all text-primary font-mono">
                            {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-curso-quimica?source=hotmart`}
                          </code>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 w-full gap-2"
                            onClick={() => copyToClipboard(
                              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-curso-quimica?source=hotmart`,
                              "URL do Webhook"
                            )}
                          >
                            <Copy className="h-4 w-4" />
                            Copiar URL
                          </Button>
                        </div>

                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                          <h4 className="font-medium text-foreground mb-2">Eventos suportados:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-[hsl(var(--stats-green))]" />
                              PURCHASE_APPROVED - Compra aprovada
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-[hsl(var(--stats-green))]" />
                              PURCHASE_COMPLETE - Compra completa
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-[hsl(var(--stats-green))]" />
                              PURCHASE_REFUNDED - Reembolso processado
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-[hsl(var(--stats-green))]" />
                              AFFILIATE_COMMISSION - Comissão de afiliado
                            </li>
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                          <p className="text-sm text-muted-foreground">
                            <strong>Dica:</strong> Configure o HOTTOK nas variáveis de ambiente para validar a autenticidade dos webhooks. Isso garante que apenas eventos legítimos da Hotmart sejam processados.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Hotmart Widget */}
            <div className="space-y-6">
              <HotmartSyncWidget />

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Award className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
                    Top Afiliados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {affiliates
                    .sort((a, b) => b.total_vendas - a.total_vendas)
                    .slice(0, 5)
                    .map((affiliate, index) => (
                      <div key={affiliate.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]" :
                          index === 1 ? "bg-slate-400/20 text-slate-400" :
                          index === 2 ? "bg-orange-700/20 text-orange-700" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{affiliate.nome}</p>
                          <p className="text-xs text-muted-foreground">{affiliate.total_vendas} vendas</p>
                        </div>
                        <p className="text-sm font-bold text-[hsl(var(--stats-green))]">
                          {formatCurrency(affiliate.comissao_total)}
                        </p>
                      </div>
                    ))}
                  {affiliates.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum afiliado
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Pagamentos Pendentes */}
              <Card className="border-[hsl(var(--stats-gold))]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
                    Pagamentos Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {commissions.filter(c => c.status === "pendente").length > 0 ? (
                    <div className="space-y-3">
                      {commissions
                        .filter(c => c.status === "pendente")
                        .slice(0, 5)
                        .map((commission) => {
                          const affiliate = affiliates.find(a => a.id === commission.afiliado_id);
                          return (
                            <div key={commission.id} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{affiliate?.nome || "—"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(commission.data), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                              </div>
                              <p className="text-sm font-bold text-[hsl(var(--stats-gold))]">
                                {formatCurrency(commission.valor)}
                              </p>
                            </div>
                          );
                        })}
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Pendente</span>
                        <span className="text-lg font-bold text-[hsl(var(--stats-gold))]">
                          {formatCurrency(pendingCommissions)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle2 className="h-8 w-8 text-[hsl(var(--stats-green))] mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Tudo pago!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cadastro/Edição Completo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              {editingItem ? "Editar Afiliado" : "Novo Afiliado"}
            </DialogTitle>
            <DialogDescription>
              Preencha todas as informações do afiliado
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="bank">Dados Bancários</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input 
                    value={formData.nome} 
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} 
                    placeholder="Nome completo do afiliado" 
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                    placeholder="email@exemplo.com" 
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input 
                    value={formData.telefone} 
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))} 
                    placeholder="(11) 99999-9999" 
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input 
                    value={formData.whatsapp} 
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))} 
                    placeholder="(11) 99999-9999" 
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>ID Hotmart</Label>
                  <Input 
                    value={formData.hotmart_id} 
                    onChange={(e) => setFormData(prev => ({ ...prev, hotmart_id: e.target.value }))} 
                    placeholder="ID do afiliado na Hotmart" 
                    className="mt-1.5" 
                  />
                </div>
                <div className="col-span-2">
                  <Label>Link de Afiliado</Label>
                  <Input 
                    value={formData.link_afiliado} 
                    onChange={(e) => setFormData(prev => ({ ...prev, link_afiliado: e.target.value }))} 
                    placeholder="https://hotmart.com/..." 
                    className="mt-1.5" 
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4 pt-4">
              <div className="p-4 rounded-xl bg-[hsl(var(--stats-blue))]/10 border border-[hsl(var(--stats-blue))]/20 mb-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-[hsl(var(--stats-blue))] mt-0.5" />
                  <div>
                    <h4 className="font-medium">Dados para Pagamento</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Informe os dados bancários para pagamento de comissões. O PIX é preferencial.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                    Chave PIX (Preferencial)
                  </Label>
                  <Input 
                    value={formData.pix} 
                    onChange={(e) => setFormData(prev => ({ ...prev, pix: e.target.value }))} 
                    placeholder="CPF, Email, Telefone ou Chave Aleatória" 
                    className="mt-1.5" 
                  />
                </div>

                <Separator className="col-span-2" />

                <div>
                  <Label>Banco</Label>
                  <Select 
                    value={formData.banco} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, banco: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.code !== "000" ? `${bank.code} - ` : ""}{bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Agência</Label>
                  <Input 
                    value={formData.agencia} 
                    onChange={(e) => setFormData(prev => ({ ...prev, agencia: e.target.value }))} 
                    placeholder="0000" 
                    className="mt-1.5" 
                  />
                </div>
                <div className="col-span-2">
                  <Label>Conta (com dígito)</Label>
                  <Input 
                    value={formData.conta} 
                    onChange={(e) => setFormData(prev => ({ ...prev, conta: e.target.value }))} 
                    placeholder="00000-0" 
                    className="mt-1.5" 
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[hsl(var(--stats-purple))]" />
                    Cupom de Desconto
                  </Label>
                  <Input 
                    value={formData.cupom} 
                    onChange={(e) => setFormData(prev => ({ ...prev, cupom: e.target.value.toUpperCase() }))} 
                    placeholder="CUPOM10" 
                    className="mt-1.5 font-mono uppercase" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cupom único vinculado a este afiliado
                  </p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Taxa de Comissão (%)
                  </Label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentual_comissao} 
                    onChange={(e) => setFormData(prev => ({ ...prev, percentual_comissao: e.target.value }))} 
                    placeholder="20" 
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--stats-gold))]/10 border border-[hsl(var(--stats-gold))]/20 w-full">
                    <Switch
                      id="parceiro_aluno"
                      checked={formData.parceiro_aluno}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, parceiro_aluno: checked }))}
                    />
                    <Label htmlFor="parceiro_aluno" className="cursor-pointer flex items-center gap-2">
                      <Award className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
                      É aluno parceiro
                    </Label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 gap-2">
              {editingItem ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingItem ? "Salvar Alterações" : "Cadastrar Afiliado"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes do Afiliado */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Detalhes do Afiliado
            </DialogTitle>
          </DialogHeader>

          {selectedAffiliate && (
            <div className="space-y-6 pt-4">
              {/* Header do Afiliado */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {selectedAffiliate.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedAffiliate.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedAffiliate.status === "ativo" ? "default" : "secondary"}>
                      {selectedAffiliate.status}
                    </Badge>
                    {selectedAffiliate.parceiro_aluno && (
                      <Badge variant="outline" className="border-[hsl(var(--stats-gold))] text-[hsl(var(--stats-gold))]">
                        <Award className="h-3 w-3 mr-1" />
                        Aluno Parceiro
                      </Badge>
                    )}
                  </div>
                  {selectedAffiliate.email && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedAffiliate.email}
                    </p>
                  )}
                  {(selectedAffiliate.telefone || selectedAffiliate.whatsapp) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatPhone(selectedAffiliate.whatsapp || selectedAffiliate.telefone || "")}
                    </p>
                  )}
                  {selectedAffiliate.email && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 gap-2"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setEmailSelectedAffiliate(selectedAffiliate);
                        setIsEmailModalOpen(true);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      Enviar Email
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[hsl(var(--stats-green))]/10 text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">{selectedAffiliate.total_vendas}</p>
                  <p className="text-xs text-muted-foreground">Vendas</p>
                </div>
                <div className="p-4 rounded-xl bg-[hsl(var(--stats-purple))]/10 text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--stats-purple))]">{selectedAffiliate.percentual_comissao || selectedAffiliate.taxa_comissao}%</p>
                  <p className="text-xs text-muted-foreground">Comissão</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedAffiliate.comissao_total)}</p>
                  <p className="text-xs text-muted-foreground">Total Ganho</p>
                </div>
              </div>

              {/* Cupom */}
              {selectedAffiliate.cupom && (
                <div className="p-4 rounded-xl border border-[hsl(var(--stats-purple))]/20 bg-[hsl(var(--stats-purple))]/5">
                  <Label className="text-xs text-muted-foreground">Cupom do Afiliado</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 px-4 py-2 rounded-lg bg-background font-mono text-xl font-bold text-center">
                      {selectedAffiliate.cupom}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(selectedAffiliate.cupom!, "Cupom")}
                    >
                      {copiedLink === selectedAffiliate.cupom ? (
                        <Check className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Dados Bancários */}
              <div className="p-4 rounded-xl border border-[hsl(var(--stats-blue))]/20 bg-[hsl(var(--stats-blue))]/5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
                  <Label className="font-medium">Dados Bancários</Label>
                </div>
                
                {selectedAffiliate.pix ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                        PIX
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm">{selectedAffiliate.pix}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedAffiliate.pix!, "PIX")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : selectedAffiliate.banco ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-background">
                      <p className="text-xs text-muted-foreground">Banco</p>
                      <p className="font-medium">{getBankName(selectedAffiliate.banco)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background">
                      <p className="text-xs text-muted-foreground">Agência</p>
                      <p className="font-mono">{selectedAffiliate.agencia || "—"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background">
                      <p className="text-xs text-muted-foreground">Conta</p>
                      <p className="font-mono">{selectedAffiliate.conta || "—"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Dados bancários não cadastrados
                  </p>
                )}
              </div>

              {/* Histórico de Comissões */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-medium flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Histórico de Comissões
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCommissionModalOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {getAffiliateCommissions(selectedAffiliate.id).length > 0 ? (
                      getAffiliateCommissions(selectedAffiliate.id).map((commission) => (
                        <div
                          key={commission.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            {commission.status === "pago" ? (
                              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                            ) : (
                              <Clock className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
                            )}
                            <div>
                              <p className="text-sm">{commission.descricao || "Comissão"}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(commission.data), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <p className={`font-bold ${
                            commission.status === "pago" 
                              ? "text-[hsl(var(--stats-green))]" 
                              : "text-[hsl(var(--stats-gold))]"
                          }`}>
                            {formatCurrency(commission.valor)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma comissão registrada
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)} className="flex-1">
                  Fechar
                </Button>
                <Button onClick={() => { setIsDetailModalOpen(false); openModal(selectedAffiliate); }} className="flex-1 gap-2">
                  <Edit2 className="h-4 w-4" />
                  Editar Afiliado
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Comissão */}
      <Dialog open={isCommissionModalOpen} onOpenChange={setIsCommissionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[hsl(var(--stats-green))]" />
              Nova Comissão - {selectedAffiliate?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newCommission.valor}
                onChange={(e) => setNewCommission(prev => ({ ...prev, valor: e.target.value }))}
                placeholder="100.00"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={newCommission.descricao}
                onChange={(e) => setNewCommission(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição da comissão..."
                className="mt-1.5"
                rows={2}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={newCommission.status}
                onValueChange={(value) => setNewCommission(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddCommission} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Comissão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Email para Afiliados */}
      <AffiliateEmailComposer
        affiliates={affiliates}
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setEmailSelectedAffiliate(null);
        }}
        preselectedAffiliate={emailSelectedAffiliate}
      />
    </>
  );
}
