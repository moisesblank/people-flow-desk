// ============================================
// MOISÉS MEDEIROS v7.0 - CONTABILIDADE
// Spider-Man Theme - Documentos Fiscais
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  Calculator, 
  Sparkles, 
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Target,
  Users,
  Trash2,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/utils/formatError";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";


interface ContabilidadeEntry {
  id: string;
  topico: string;
  subtopico: string | null;
  tipo: string;
  descricao: string;
  valor: number;
  data_referencia: string;
  categoria: string | null;
}

interface MetricaMarketing {
  id: string;
  mes_referencia: string;
  investimento_marketing: number;
  receita_gerada: number;
  novos_clientes: number;
  roi_percentual: number;
  cac: number;
  ltv: number;
}

import { formatCurrency } from "@/utils/format";

const TOPICOS = [
  { value: "receitas", label: "📈 Receitas", subtopicos: ["Vendas Cursos", "Hotmart", "Afiliados", "Consultorias", "Outras"] },
  { value: "despesas_fixas", label: "💰 Despesas Fixas", subtopicos: ["Salários", "Aluguel", "Serviços", "Impostos", "Outras"] },
  { value: "despesas_variaveis", label: "💳 Despesas Variáveis", subtopicos: ["Marketing", "Ferramentas", "Eventos", "Outras"] },
  { value: "investimentos", label: "🚀 Investimentos", subtopicos: ["Marketing", "Equipamentos", "Cursos", "Outros"] },
  { value: "impostos", label: "📋 Impostos", subtopicos: ["DAS", "IRPF", "INSS", "Outros"] },
];

const TIPOS = [
  { value: "receita", label: "Receita", color: "text-[hsl(var(--stats-green))]" },
  { value: "despesa", label: "Despesa", color: "text-destructive" },
  { value: "investimento", label: "Investimento", color: "text-[hsl(var(--stats-blue))]" },
  { value: "imposto", label: "Imposto", color: "text-[hsl(var(--stats-gold))]" },
];

function ContabilidadeContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [entries, setEntries] = useState<ContabilidadeEntry[]>([]);
  const [metricas, setMetricas] = useState<MetricaMarketing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMetricaModalOpen, setIsMetricaModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ContabilidadeEntry | null>(null);
  const [selectedTopico, setSelectedTopico] = useState("");

  const [formData, setFormData] = useState({
    topico: "",
    subtopico: "",
    tipo: "receita",
    descricao: "",
    valor: "",
    data_referencia: format(new Date(), "yyyy-MM-dd"),
    categoria: "",
  });

  const [metricaForm, setMetricaForm] = useState({
    mes_referencia: format(new Date(), "yyyy-MM"),
    investimento_marketing: "",
    receita_gerada: "",
    novos_clientes: "",
    ltv: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, metricasRes] = await Promise.all([
        supabase.from("contabilidade").select("id, descricao, tipo, valor, categoria, topico, subtopico, data_referencia, created_at").order("data_referencia", { ascending: false }).limit(500),
        supabase.from("metricas_marketing").select("id, mes_referencia, investimento_marketing, receita_gerada, novos_clientes, custo_aquisicao, ltv, cac, roi_percentual, created_at").order("mes_referencia", { ascending: false }).limit(100),
      ]);

      if (entriesRes.error) throw entriesRes.error;
      if (metricasRes.error) throw metricasRes.error;

      setEntries(entriesRes.data || []);
      setMetricas(metricasRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const receitas = entries.filter(e => e.tipo === "receita").reduce((acc, e) => acc + e.valor, 0);
    const despesas = entries.filter(e => e.tipo === "despesa").reduce((acc, e) => acc + e.valor, 0);
    const investimentos = entries.filter(e => e.tipo === "investimento").reduce((acc, e) => acc + e.valor, 0);
    const impostos = entries.filter(e => e.tipo === "imposto").reduce((acc, e) => acc + e.valor, 0);
    
    const lucroLiquido = receitas - despesas - impostos;
    const margemLucro = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0;

    // Latest marketing metrics
    const latestMetrica = metricas[0];
    const roi = latestMetrica?.roi_percentual || 0;
    const cac = latestMetrica?.cac || 0;

    return {
      receitas,
      despesas,
      investimentos,
      impostos,
      lucroLiquido,
      margemLucro,
      roi,
      cac,
    };
  }, [entries, metricas]);

  const chartData = useMemo(() => {
    const byMonth: { [key: string]: { receitas: number; despesas: number } } = {};
    
    entries.forEach(e => {
      const month = format(new Date(e.data_referencia), "MMM/yy", { locale: ptBR });
      if (!byMonth[month]) byMonth[month] = { receitas: 0, despesas: 0 };
      if (e.tipo === "receita") byMonth[month].receitas += e.valor;
      else byMonth[month].despesas += e.valor;
    });

    return Object.entries(byMonth).map(([month, data]) => ({
      month,
      ...data,
    })).slice(-6);
  }, [entries]);

  const openModal = (entry?: ContabilidadeEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        topico: entry.topico,
        subtopico: entry.subtopico || "",
        tipo: entry.tipo,
        descricao: entry.descricao,
        valor: String(entry.valor / 100),
        data_referencia: entry.data_referencia,
        categoria: entry.categoria || "",
      });
      setSelectedTopico(entry.topico);
    } else {
      setEditingEntry(null);
      setFormData({
        topico: "",
        subtopico: "",
        tipo: "receita",
        descricao: "",
        valor: "",
        data_referencia: format(new Date(), "yyyy-MM-dd"),
        categoria: "",
      });
      setSelectedTopico("");
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.topico || !formData.descricao || !formData.valor) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const valorCents = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from("contabilidade")
          .update({
            topico: formData.topico,
            subtopico: formData.subtopico || null,
            tipo: formData.tipo,
            descricao: formData.descricao,
            valor: valorCents,
            data_referencia: formData.data_referencia,
            categoria: formData.categoria || null,
          })
          .eq("id", editingEntry.id);

        if (error) throw error;
        toast({ title: "Lançamento atualizado!" });
      } else {
        const { error } = await supabase.from("contabilidade").insert({
          topico: formData.topico,
          subtopico: formData.subtopico || null,
          tipo: formData.tipo,
          descricao: formData.descricao,
          valor: valorCents,
          data_referencia: formData.data_referencia,
          categoria: formData.categoria || null,
          created_by: user?.id,
        });

        if (error) throw error;
        toast({ title: "Lançamento adicionado!" });
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: formatError(error), variant: "destructive" });
    }
  };

  const handleSaveMetrica = async () => {
    const investimento = Math.round(parseFloat(metricaForm.investimento_marketing.replace(",", ".")) * 100) || 0;
    const receita = Math.round(parseFloat(metricaForm.receita_gerada.replace(",", ".")) * 100) || 0;
    const clientes = parseInt(metricaForm.novos_clientes) || 0;
    const ltv = Math.round(parseFloat(metricaForm.ltv.replace(",", ".")) * 100) || 0;

    const roi = investimento > 0 ? ((receita - investimento) / investimento) * 100 : 0;
    const cac = clientes > 0 ? investimento / clientes / 100 : 0;

    try {
      const { error } = await supabase.from("metricas_marketing").insert({
        mes_referencia: `${metricaForm.mes_referencia}-01`,
        investimento_marketing: investimento,
        receita_gerada: receita,
        novos_clientes: clientes,
        roi_percentual: roi,
        cac: cac,
        ltv: ltv,
        created_by: user?.id,
      });

      if (error) throw error;
      toast({ title: "Métricas salvas!" });
      await fetchData();
      setIsMetricaModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: formatError(error), variant: "destructive" });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from("contabilidade").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Lançamento removido" });
      await fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header - GPU optimized */}
        <motion.header 
          {...gpuAnimationProps.fadeUp}
          className="mb-8 will-change-transform transform-gpu"
        >
          <div className="space-y-2">
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Gestão Financeira</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Contabilidade
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              ROI, CAC, LTV e controle financeiro completo em tempo real.
            </p>
          </div>
        </motion.header>

        {/* Main Stats - GPU optimized */}
        <motion.section
          {...gpuAnimationProps.fadeUp}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8 will-change-transform transform-gpu"
        >
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-[hsl(var(--stats-green))]" />
              <span className="text-sm text-muted-foreground">Receitas</span>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">{formatCurrency(stats.receitas)}</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <span className="text-sm text-muted-foreground">Despesas</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(stats.despesas)}</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className={`h-5 w-5 ${stats.lucroLiquido >= 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"}`} />
              <span className="text-sm text-muted-foreground">Lucro Líquido</span>
            </div>
            <p className={`text-2xl font-bold ${stats.lucroLiquido >= 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"}`}>
              {formatCurrency(stats.lucroLiquido)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Margem: {stats.margemLucro.toFixed(1)}%
            </p>
          </div>
          
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <PieChart className="h-5 w-5 text-[hsl(var(--stats-gold))]" />
              <span className="text-sm text-muted-foreground">Impostos</span>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--stats-gold))]">{formatCurrency(stats.impostos)}</p>
          </div>
        </motion.section>

        {/* ROI / CAC Section - GPU optimized */}
        <motion.section
          {...gpuAnimationProps.fadeUp}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:grid-cols-3 mb-8 will-change-transform transform-gpu"
        >
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-[hsl(var(--stats-green))]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">ROI (Retorno sobre Investimento)</span>
              <Target className="h-5 w-5 text-[hsl(var(--stats-green))]" />
            </div>
            <p className={`text-3xl font-bold ${stats.roi >= 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"}`}>
              {stats.roi.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Quanto você ganha para cada R$1 investido em marketing
            </p>
          </div>
          
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-[hsl(var(--stats-blue))]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">CAC (Custo Aquisição Cliente)</span>
              <Users className="h-5 w-5 text-[hsl(var(--stats-blue))]" />
            </div>
            <p className="text-3xl font-bold text-[hsl(var(--stats-blue))]">
              {formatCurrency(stats.cac * 100)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Quanto custa para adquirir um novo cliente
            </p>
          </div>
          
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center">
            <Button onClick={() => setIsMetricaModalOpen(true)} className="gap-2">
              <BarChart3 className="h-4 w-4" /> Atualizar Métricas
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Registre investimento e resultados mensais
            </p>
          </div>
        </motion.section>

        {/* Chart - GPU optimized */}
        {chartData.length > 0 && (
          <motion.section
            {...gpuAnimationProps.fadeUp}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6 mb-8 will-change-transform transform-gpu"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Evolução Financeira</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 15%)" />
                  <XAxis dataKey="month" stroke="#ffffff" fontSize={12} tick={{ fill: "#ffffff", fontWeight: "bold" }} />
                  <YAxis stroke="#ffffff" fontSize={12} tick={{ fill: "#ffffff", fontWeight: "bold" }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240, 6%, 8%)",
                      border: "1px solid hsl(240, 6%, 15%)",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ color: "#ffffff", fontWeight: "bold" }}
                    labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="receitas" stroke="hsl(152, 76%, 47%)" fillOpacity={1} fill="url(#colorReceitas)" name="Receitas" />
                  <Area type="monotone" dataKey="despesas" stroke="hsl(0, 72%, 51%)" fillOpacity={1} fill="url(#colorDespesas)" name="Despesas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>
        )}

        {/* Entries by Topic */}
        <Tabs defaultValue="receitas" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList className="bg-secondary/50 flex-wrap">
              {TOPICOS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
            <Button onClick={() => openModal()} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Lançamento
            </Button>
          </div>

          {TOPICOS.map((topico) => (
            <TabsContent key={topico.value} value={topico.value}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Descrição</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Subtópico</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.filter(e => e.topico === topico.value).map((entry) => (
                      <tr key={entry.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-4 font-medium text-foreground">{entry.descricao}</td>
                        <td className="p-4 text-muted-foreground">{entry.subtopico || "-"}</td>
                        <td className="p-4 text-muted-foreground">{format(new Date(entry.data_referencia), "dd/MM/yyyy")}</td>
                        <td className={`p-4 text-right font-semibold ${TIPOS.find(t => t.value === entry.tipo)?.color}`}>
                          {formatCurrency(entry.valor)}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(entry)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEntry(entry.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {entries.filter(e => e.topico === topico.value).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Nenhum lançamento neste tópico
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Entry Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Editar" : "Novo"} Lançamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tópico *</Label>
                  <Select 
                    value={formData.topico} 
                    onValueChange={(v) => {
                      setFormData(prev => ({ ...prev, topico: v, subtopico: "" }));
                      setSelectedTopico(v);
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPICOS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subtópico</Label>
                  <Select 
                    value={formData.subtopico} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, subtopico: v }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPICOS.find(t => t.value === selectedTopico)?.subtopicos.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
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
                  placeholder="Descrição do lançamento"
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
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.data_referencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_referencia: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingEntry ? "Salvar Alterações" : "Adicionar Lançamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Metricas Modal */}
        <Dialog open={isMetricaModalOpen} onOpenChange={setIsMetricaModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Atualizar Métricas de Marketing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Mês de Referência</Label>
                <Input
                  type="month"
                  value={metricaForm.mes_referencia}
                  onChange={(e) => setMetricaForm(prev => ({ ...prev, mes_referencia: e.target.value }))}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Investimento em Marketing (R$)</Label>
                  <Input
                    value={metricaForm.investimento_marketing}
                    onChange={(e) => setMetricaForm(prev => ({ ...prev, investimento_marketing: e.target.value }))}
                    placeholder="0,00"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Receita Gerada (R$)</Label>
                  <Input
                    value={metricaForm.receita_gerada}
                    onChange={(e) => setMetricaForm(prev => ({ ...prev, receita_gerada: e.target.value }))}
                    placeholder="0,00"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Novos Clientes</Label>
                  <Input
                    type="number"
                    value={metricaForm.novos_clientes}
                    onChange={(e) => setMetricaForm(prev => ({ ...prev, novos_clientes: e.target.value }))}
                    placeholder="0"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>LTV Médio (R$)</Label>
                  <Input
                    value={metricaForm.ltv}
                    onChange={(e) => setMetricaForm(prev => ({ ...prev, ltv: e.target.value }))}
                    placeholder="0,00"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground">
                  <strong>ROI:</strong> (Receita - Investimento) / Investimento × 100<br />
                  <strong>CAC:</strong> Investimento / Novos Clientes
                </p>
              </div>

              <Button onClick={handleSaveMetrica} className="w-full">
                Salvar Métricas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Exportação direta sem MFAPageGuard (removido - DeviceMFAGuard já cobre)
export default function Contabilidade() {
  return <ContabilidadeContent />;
}
