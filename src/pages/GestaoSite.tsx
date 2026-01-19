// ============================================
// MOISÉS MEDEIROS v7.0 - GESTÃO DO SITE
// Spider-Man Theme - Pendências e Tarefas
// + Guia Operacional (OWNER ONLY)
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  Globe, 
  Sparkles, 
  Plus,
  Check,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  Filter,
  FileText,
  Upload,
  BookOpen,
  ListTodo,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/utils/formatError";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GuiaOperacionalOwner } from "@/components/owner/GuiaOperacionalOwner";
import { PlatformEducationHub } from "@/components/education/PlatformEducationHub";

interface Pendencia {
  id: string;
  titulo: string;
  descricao: string | null;
  area: string;
  prioridade: string;
  status: string;
  responsavel: string | null;
  data_limite: string | null;
  data_conclusao: string | null;
}

const AREAS = [
  "Homepage", "Página de Vendas", "Checkout", "Área do Aluno", 
  "Blog", "SEO", "Performance", "Design", "Mobile", "Integrações"
];

const PRIORIDADES = [
  { value: "baixa", label: "Baixa", color: "bg-muted text-muted-foreground" },
  { value: "normal", label: "Normal", color: "bg-[hsl(var(--stats-blue))]/20 text-[hsl(var(--stats-blue))]" },
  { value: "alta", label: "Alta", color: "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]" },
  { value: "urgente", label: "Urgente", color: "bg-destructive/20 text-destructive" },
];

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente", color: "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-[hsl(var(--stats-blue))]/20 text-[hsl(var(--stats-blue))]" },
  { value: "concluido", label: "Concluído", color: "bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]" },
  { value: "cancelado", label: "Cancelado", color: "bg-muted text-muted-foreground" },
];

export default function GestaoSite() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOwner } = useRolePermissions();
  const [activeTab, setActiveTab] = useState<"pendencias" | "guia" | "plataforma">("pendencias");
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPendencia, setEditingPendencia] = useState<Pendencia | null>(null);
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    area: "Homepage",
    prioridade: "normal",
    responsavel: "",
    data_limite: "",
  });

  useEffect(() => {
    fetchPendencias();
  }, []);

  const fetchPendencias = async () => {
    try {
      // ⚡ DOGMA V.5K: Limite para evitar sobrecarga
      const { data, error } = await supabase
        .from("website_pendencias")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setPendencias(data || []);
    } catch (error) {
      console.error("Error fetching pendencias:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPendencias = useMemo(() => {
    return pendencias.filter(p => {
      if (filterArea !== "all" && p.area !== filterArea) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      return true;
    });
  }, [pendencias, filterArea, filterStatus]);

  const stats = useMemo(() => {
    const total = pendencias.length;
    const concluidas = pendencias.filter(p => p.status === "concluido").length;
    const pendentes = pendencias.filter(p => p.status === "pendente").length;
    const emAndamento = pendencias.filter(p => p.status === "em_andamento").length;
    const urgentes = pendencias.filter(p => p.prioridade === "urgente" && p.status !== "concluido").length;
    
    const progresso = total > 0 ? (concluidas / total) * 100 : 0;

    return { total, concluidas, pendentes, emAndamento, urgentes, progresso };
  }, [pendencias]);

  const openModal = (pendencia?: Pendencia) => {
    if (pendencia) {
      setEditingPendencia(pendencia);
      setFormData({
        titulo: pendencia.titulo,
        descricao: pendencia.descricao || "",
        area: pendencia.area,
        prioridade: pendencia.prioridade,
        responsavel: pendencia.responsavel || "",
        data_limite: pendencia.data_limite || "",
      });
    } else {
      setEditingPendencia(null);
      setFormData({
        titulo: "",
        descricao: "",
        area: "Homepage",
        prioridade: "normal",
        responsavel: "",
        data_limite: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      toast({ title: "Erro", description: "Título é obrigatório", variant: "destructive" });
      return;
    }

    try {
      if (editingPendencia) {
        const { error } = await supabase
          .from("website_pendencias")
          .update({
            titulo: formData.titulo,
            descricao: formData.descricao || null,
            area: formData.area,
            prioridade: formData.prioridade,
            responsavel: formData.responsavel || null,
            data_limite: formData.data_limite || null,
          })
          .eq("id", editingPendencia.id);

        if (error) throw error;
        toast({ title: "Pendência atualizada!" });
      } else {
        const { error } = await supabase.from("website_pendencias").insert({
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          area: formData.area,
          prioridade: formData.prioridade,
          responsavel: formData.responsavel || null,
          data_limite: formData.data_limite || null,
          created_by: user?.id,
        });

        if (error) throw error;
        toast({ title: "Pendência adicionada!" });
      }

      await fetchPendencias();
      setIsModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: formatError(error), variant: "destructive" });
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "concluido") {
        updateData.data_conclusao = format(new Date(), "yyyy-MM-dd");
      }

      const { error } = await supabase
        .from("website_pendencias")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      toast({ title: newStatus === "concluido" ? "Tarefa concluída! ✓" : "Status atualizado" });
      await fetchPendencias();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deletePendencia = async (id: string) => {
    try {
      const { error } = await supabase.from("website_pendencias").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Pendência removida" });
      await fetchPendencias();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option ? <Badge className={option.color}>{option.label}</Badge> : null;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const option = PRIORIDADES.find(p => p.value === prioridade);
    return option ? <Badge className={option.color}>{option.label}</Badge> : null;
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
              <span className="text-sm font-medium tracking-wide uppercase">Desenvolvimento</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Gestão do Site
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Controle de pendências, melhorias e tarefas do site.
            </p>
          </div>
        </motion.header>

        {/* Tabs para Owner */}
        {isOwner && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pendencias" | "guia" | "plataforma")} className="mb-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="pendencias" className="gap-2">
                <ListTodo className="h-4 w-4" />
                <span className="hidden sm:inline">Pendências</span>
              </TabsTrigger>
              <TabsTrigger value="guia" className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Guia IA</span>
              </TabsTrigger>
              <TabsTrigger value="plataforma" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Guia Plataforma</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Conteúdo baseado na tab ativa */}
        {activeTab === "guia" && isOwner ? (
          <GuiaOperacionalOwner />
        ) : activeTab === "plataforma" && isOwner ? (
          <PlatformEducationHub />
        ) : (
          <>
        {/* Progress & Stats - GPU optimized */}
        <motion.section
          {...gpuAnimationProps.fadeUp}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-8 will-change-transform transform-gpu"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Progresso Geral</h3>
            <span className="text-sm text-muted-foreground">
              {stats.concluidas}/{stats.total} tarefas concluídas
            </span>
          </div>
          <Progress value={stats.progresso} className="h-3 mb-6" />
          
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold text-[hsl(var(--stats-gold))]">{stats.pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold text-[hsl(var(--stats-blue))]">{stats.emAndamento}</p>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">{stats.concluidas}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-secondary/30">
              <p className="text-2xl font-bold text-destructive">{stats.urgentes}</p>
              <p className="text-xs text-muted-foreground">Urgentes</p>
            </div>
          </div>
        </motion.section>

        {/* Filters & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-2">
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Áreas</SelectItem>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
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

          <Button onClick={() => openModal()} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Pendência
          </Button>
        </motion.div>

        {/* List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {filteredPendencias.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma pendência encontrada</p>
            </div>
          ) : (
            filteredPendencias.map((pendencia, index) => (
              <motion.div
                key={pendencia.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className={cn(
                  "glass-card rounded-xl p-4 hover:border-primary/30 transition-all",
                  pendencia.status === "concluido" && "opacity-60"
                )}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => updateStatus(pendencia.id, pendencia.status === "concluido" ? "pendente" : "concluido")}
                    className={cn(
                      "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      pendencia.status === "concluido"
                        ? "bg-[hsl(var(--stats-green))] border-[hsl(var(--stats-green))]"
                        : "border-muted-foreground hover:border-[hsl(var(--stats-green))]"
                    )}
                  >
                    {pendencia.status === "concluido" && <Check className="h-3 w-3 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className={cn(
                        "font-medium text-foreground",
                        pendencia.status === "concluido" && "line-through"
                      )}>
                        {pendencia.titulo}
                      </h4>
                      <Badge variant="outline" className="text-xs">{pendencia.area}</Badge>
                      {getPrioridadeBadge(pendencia.prioridade)}
                      {getStatusBadge(pendencia.status)}
                    </div>
                    
                    {pendencia.descricao && (
                      <p className="text-sm text-muted-foreground mb-2">{pendencia.descricao}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {pendencia.responsavel && (
                        <span>👤 {pendencia.responsavel}</span>
                      )}
                      {pendencia.data_limite && (
                        <span>📅 {format(new Date(pendencia.data_limite), "dd/MM/yyyy")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {pendencia.status !== "concluido" && pendencia.status !== "em_andamento" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateStatus(pendencia.id, "em_andamento")}
                        title="Iniciar"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(pendencia)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => deletePendencia(pendencia.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPendencia ? "Editar" : "Nova"} Pendência</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="O que precisa ser feito?"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Detalhes da tarefa..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Área</Label>
                  <Select value={formData.area} onValueChange={(v) => setFormData(prev => ({ ...prev, area: v }))}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={formData.prioridade} onValueChange={(v) => setFormData(prev => ({ ...prev, prioridade: v }))}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Responsável</Label>
                  <Input
                    value={formData.responsavel}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                    placeholder="Nome"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Data Limite</Label>
                  <Input
                    type="date"
                    value={formData.data_limite}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_limite: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingPendencia ? "Salvar Alterações" : "Adicionar Pendência"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
