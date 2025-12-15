// ============================================
// MOISÉS MEDEIROS v7.0 - AFILIADOS
// Spider-Man Theme - Gestão Completa de Parceiros
// Sistema de Acesso e Comissões
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Handshake, 
  Sparkles, 
  Trash2, 
  Edit2, 
  Eye,
  EyeOff,
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
  UserPlus,
  ExternalLink,
  BarChart3,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StatCard } from "@/components/employees/StatCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Affiliate {
  id: number;
  nome: string;
  email: string;
  hotmart_id: string;
  total_vendas: number;
  comissao_total: number;
  telefone?: string;
  status?: string;
  taxa_comissao?: number;
  link_afiliado?: string;
  user_id?: string;
  created_at?: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Affiliate | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [formData, setFormData] = useState({ 
    nome: "", 
    email: "", 
    hotmart_id: "",
    telefone: "",
    taxa_comissao: "30",
    link_afiliado: ""
  });
  const [accessData, setAccessData] = useState({
    createAccess: false,
    canViewSales: true,
    canViewCommissions: true,
    canViewReports: false
  });

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from("affiliates").select("*").order("nome");
      if (error) throw error;
      setAffiliates(data?.map(a => ({
        id: a.id,
        nome: a.nome,
        email: a.email || "",
        hotmart_id: a.hotmart_id || "",
        total_vendas: a.total_vendas || 0,
        comissao_total: a.comissao_total || 0,
        telefone: (a as any).telefone || "",
        status: (a as any).status || "ativo",
        taxa_comissao: (a as any).taxa_comissao || 30,
        link_afiliado: (a as any).link_afiliado || "",
        user_id: (a as any).user_id || null,
        created_at: a.created_at || null,
      })) || []);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      toast.error("Erro ao carregar afiliados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalVendas = affiliates.reduce((acc, a) => acc + a.total_vendas, 0);
  const totalComissoes = affiliates.reduce((acc, a) => acc + a.comissao_total, 0);
  const activeAffiliates = affiliates.filter(a => a.status === "ativo").length;
  const avgCommission = affiliates.length > 0 
    ? affiliates.reduce((acc, a) => acc + (a.taxa_comissao || 30), 0) / affiliates.length 
    : 30;

  const openModal = (affiliate?: Affiliate) => {
    setEditingItem(affiliate || null);
    setFormData(affiliate 
      ? { 
          nome: affiliate.nome, 
          email: affiliate.email, 
          hotmart_id: affiliate.hotmart_id,
          telefone: affiliate.telefone || "",
          taxa_comissao: (affiliate.taxa_comissao || 30).toString(),
          link_afiliado: affiliate.link_afiliado || ""
        }
      : { nome: "", email: "", hotmart_id: "", telefone: "", taxa_comissao: "30", link_afiliado: "" }
    );
    setIsModalOpen(true);
  };

  const openAccessModal = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setAccessData({
      createAccess: !!affiliate.user_id,
      canViewSales: true,
      canViewCommissions: true,
      canViewReports: false
    });
    setIsAccessModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Preencha o nome");
      return;
    }

    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        hotmart_id: formData.hotmart_id,
        telefone: formData.telefone,
        taxa_comissao: parseFloat(formData.taxa_comissao) || 30,
        link_afiliado: formData.link_afiliado
      };

      if (editingItem) {
        const { error } = await supabase
          .from("affiliates")
          .update(payload as any)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Afiliado atualizado!");
      } else {
        const { error } = await supabase.from("affiliates").insert(payload as any);
        if (error) throw error;
        toast.success("Afiliado adicionado!");
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving affiliate:", error);
      toast.error(error.message || "Erro ao salvar");
    }
  };

  const handleDelete = async (id: number) => {
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

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <motion.div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium tracking-wide uppercase">Hotmart Integration</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Afiliados
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Gerencie seus afiliados, comissões e acessos ao sistema.
              </p>
            </div>
            <Button onClick={() => openModal()} size="lg" className="gap-2">
              <Plus className="h-5 w-5" /> Novo Afiliado
            </Button>
          </div>
        </motion.header>

        {/* Stats */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Afiliados" value={affiliates.length} icon={Users} variant="blue" delay={0} />
          <StatCard title="Afiliados Ativos" value={activeAffiliates} icon={Handshake} variant="green" delay={1} />
          <StatCard title="Total Vendas" value={totalVendas} icon={TrendingUp} variant="purple" delay={2} />
          <StatCard title="Comissões Pagas" value={totalComissoes} formatFn={formatCurrency} icon={DollarSign} variant="red" delay={3} />
        </section>

        <Tabs defaultValue="lista" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="lista" className="gap-2">
              <Users className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="acessos" className="gap-2">
              <Shield className="h-4 w-4" />
              Acessos
            </TabsTrigger>
          </TabsList>

          {/* Lista de Afiliados */}
          <TabsContent value="lista">
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Afiliado</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Contato</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Comissão</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Vendas</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Total Ganho</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((affiliate, index) => (
                    <motion.tr 
                      key={affiliate.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-spider flex items-center justify-center text-white font-bold text-sm">
                            {affiliate.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{affiliate.nome}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {affiliate.hotmart_id || "Sem ID Hotmart"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="space-y-1">
                          {affiliate.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {affiliate.email}
                            </div>
                          )}
                          {affiliate.telefone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {formatPhone(affiliate.telefone)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="gap-1">
                          <Percent className="h-3 w-3" />
                          {affiliate.taxa_comissao || 30}%
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-semibold text-foreground">{affiliate.total_vendas}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-semibold text-[hsl(var(--stats-green))]">
                          {formatCurrency(affiliate.comissao_total)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openAccessModal(affiliate)} title="Gerenciar Acesso">
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openModal(affiliate)} title="Editar">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(affiliate.id)} className="text-destructive hover:text-destructive" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {affiliates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <Handshake className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum afiliado cadastrado</p>
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
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance">
            <div className="grid gap-6 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Top Afiliados
                </h3>
                <div className="space-y-4">
                  {affiliates
                    .sort((a, b) => b.total_vendas - a.total_vendas)
                    .slice(0, 5)
                    .map((affiliate, index) => (
                      <div key={affiliate.id} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-amber-500/20 text-amber-500' :
                          index === 1 ? 'bg-slate-400/20 text-slate-400' :
                          index === 2 ? 'bg-orange-700/20 text-orange-700' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{affiliate.nome}</p>
                          <p className="text-xs text-muted-foreground">{affiliate.total_vendas} vendas</p>
                        </div>
                        <p className="font-semibold text-[hsl(var(--stats-green))]">
                          {formatCurrency(affiliate.comissao_total)}
                        </p>
                      </div>
                    ))}
                  {affiliates.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum afiliado para exibir
                    </p>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Estatísticas Gerais
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <span className="text-muted-foreground">Ticket Médio por Afiliado</span>
                    <span className="font-bold text-foreground">
                      {affiliates.length > 0 
                        ? formatCurrency(totalComissoes / affiliates.length) 
                        : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <span className="text-muted-foreground">Comissão Média</span>
                    <span className="font-bold text-foreground">{avgCommission.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <span className="text-muted-foreground">Vendas por Afiliado</span>
                    <span className="font-bold text-foreground">
                      {affiliates.length > 0 
                        ? (totalVendas / affiliates.length).toFixed(1) 
                        : 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* Acessos */}
          <TabsContent value="acessos">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Gerenciamento de Acessos
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Como funciona o acesso para afiliados?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cada afiliado pode ter um acesso limitado ao sistema para visualizar suas vendas e comissões. 
                      O acesso é controlado pelo Owner/Admin e pode ser revogado a qualquer momento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {affiliates.map((affiliate) => (
                  <div 
                    key={affiliate.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {affiliate.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{affiliate.nome}</p>
                        <p className="text-xs text-muted-foreground">{affiliate.email || "Sem email"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={affiliate.user_id ? "default" : "secondary"}>
                        {affiliate.user_id ? "Com acesso" : "Sem acesso"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => openAccessModal(affiliate)}
                      >
                        <Key className="h-4 w-4" />
                        Gerenciar
                      </Button>
                    </div>
                  </div>
                ))}
                {affiliates.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum afiliado para gerenciar acessos</p>
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Modal Cadastro/Edição */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                {editingItem ? "Editar" : "Novo"} Afiliado
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nome *</Label>
                <Input 
                  value={formData.nome} 
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} 
                  placeholder="Nome completo do afiliado" 
                  className="mt-1.5" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input 
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID Hotmart</Label>
                  <Input 
                    value={formData.hotmart_id} 
                    onChange={(e) => setFormData(prev => ({ ...prev, hotmart_id: e.target.value }))} 
                    placeholder="ID do afiliado" 
                    className="mt-1.5" 
                  />
                </div>
                <div>
                  <Label>Taxa de Comissão (%)</Label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={formData.taxa_comissao} 
                    onChange={(e) => setFormData(prev => ({ ...prev, taxa_comissao: e.target.value }))} 
                    placeholder="30" 
                    className="mt-1.5" 
                  />
                </div>
              </div>
              <div>
                <Label>Link de Afiliado</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input 
                    value={formData.link_afiliado} 
                    onChange={(e) => setFormData(prev => ({ ...prev, link_afiliado: e.target.value }))} 
                    placeholder="https://hotmart.com/..." 
                  />
                  {formData.link_afiliado && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyLink(formData.link_afiliado)}
                    >
                      {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
              <Button onClick={handleSave} className="w-full gap-2">
                {editingItem ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingItem ? "Salvar Alterações" : "Adicionar Afiliado"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Acesso */}
        <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Gerenciar Acesso - {selectedAffiliate?.nome}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Criar acesso ao sistema</p>
                    <p className="text-xs text-muted-foreground">
                      O afiliado poderá fazer login e ver seus dados
                    </p>
                  </div>
                  <Switch
                    checked={accessData.createAccess}
                    onCheckedChange={(v) => setAccessData(prev => ({ ...prev, createAccess: v }))}
                  />
                </div>
              </div>

              {accessData.createAccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-xl border border-border/50 space-y-4">
                    <h4 className="font-medium text-foreground text-sm">Permissões do afiliado:</h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ver vendas realizadas</span>
                      <Switch
                        checked={accessData.canViewSales}
                        onCheckedChange={(v) => setAccessData(prev => ({ ...prev, canViewSales: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ver comissões</span>
                      <Switch
                        checked={accessData.canViewCommissions}
                        onCheckedChange={(v) => setAccessData(prev => ({ ...prev, canViewCommissions: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ver relatórios detalhados</span>
                      <Switch
                        checked={accessData.canViewReports}
                        onCheckedChange={(v) => setAccessData(prev => ({ ...prev, canViewReports: v }))}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[hsl(var(--stats-gold))]/10 border border-[hsl(var(--stats-gold))]/20">
                    <p className="text-xs text-muted-foreground">
                      <strong>Nota:</strong> Um email será enviado para {selectedAffiliate?.email || "o email cadastrado"} com as instruções de acesso.
                    </p>
                  </div>
                </motion.div>
              )}

              <Button 
                className="w-full gap-2"
                onClick={() => {
                  toast.success("Configurações de acesso salvas!");
                  setIsAccessModalOpen(false);
                }}
              >
                <Shield className="h-4 w-4" />
                Salvar Configurações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
