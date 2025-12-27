// ============================================
// TRAMON v8 - ACADEMIA QUANTUM
// Sistema Neural de Gestão de Alunos + WordPress Sync
// ⚡ PARTE 6: Pré-seleção operacional de universo
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, GraduationCap, Trash2, Edit2, Users, Award, TrendingUp, Brain, RefreshCw, AlertTriangle, CheckCircle, XCircle, Globe, Crown, ArrowLeft } from "lucide-react";
import { BetaAccessManager } from "@/components/students/BetaAccessManager";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { CyberBackground } from "@/components/ui/cyber-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/employees/StatCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StudentAnalytics } from "@/components/students/StudentAnalytics";
import { AttachmentButton } from "@/components/attachments/AutoAttachmentWrapper";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VirtualTable } from "@/components/performance/VirtualTable";
import { 
  AlunosUniverseSelector, 
  AlunoUniverseType, 
  AlunoSelectionState,
  getUniverseFilters,
  parseSelectionFromUrl,
  updateUrlWithSelection,
  ALUNO_UNIVERSE_OPTIONS,
  ONLINE_PRODUCT_OPTIONS
} from "@/components/students/AlunosUniverseSelector";

interface Student {
  id: string;
  nome: string;
  email: string;
  curso: string;
  status: string;
  fonte?: string;
}

interface WordPressUser {
  id: string;
  wp_user_id: number;
  email: string;
  nome: string;
  grupos: string[];
  status_acesso: string;
  tem_pagamento_confirmado: boolean;
  data_cadastro_wp: string | null;
  ultimo_login: string | null;
  updated_at: string;
}

const STATUS_OPTIONS = ["Ativo", "Concluído", "Pendente", "Cancelado"];

export default function Alunos() {
  // ============================================
  // ⚡ PARTE 6 + 7: Estado de pré-seleção de universo + produto
  // null = tela de seleção, valor = gestão filtrada
  // Persistência via querystring (PARTE 7)
  // ============================================
  const [selection, setSelection] = useState<AlunoSelectionState | null>(() => {
    // Inicializa do querystring se disponível
    return parseSelectionFromUrl();
  });
  
  // ⚡ PARTE 7: Atualiza URL quando seleção muda
  const handleSelectionChange = (newSelection: AlunoSelectionState | null) => {
    setSelection(newSelection);
    updateUrlWithSelection(newSelection);
  };
  
  const [students, setStudents] = useState<Student[]>([]);
  const [wpUsers, setWpUsers] = useState<WordPressUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ nome: "", email: "", curso: "", status: "Ativo" });
  const [activeTab, setActiveTab] = useState("alunos");

  // Stats
  const [wpStats, setWpStats] = useState({
    total: 0,
    ativos: 0,
    comPagamento: 0,
    semPagamento: 0
  });

  const fetchData = async () => {
    try {
      // Fetch alunos from original table
      const { data: alunosData, error: alunosError } = await supabase
        .from("alunos")
        .select("id, nome, email, curso_id, status")
        .order("nome")
        .limit(500);
      if (alunosError) throw alunosError;
      
      setStudents(alunosData?.map(s => ({
        id: s.id,
        nome: s.nome,
        email: s.email || "",
        curso: s.curso_id || "",
        status: s.status || "ativo",
      })) || []);

      // Fetch WordPress sync users
      const { data: wpData, error: wpError } = await supabase
        .from("usuarios_wordpress_sync")
        .select("id, wp_user_id, email, nome, status_acesso, grupos, tem_pagamento_confirmado, data_cadastro_wp, ultimo_login, updated_at")
        .order("updated_at", { ascending: false })
        .limit(500);
      
      if (wpError) {
        console.error("Error fetching WP users:", wpError);
      } else {
        const wpUsersMapped: WordPressUser[] = (wpData || []).map(u => ({
          id: u.id,
          wp_user_id: u.wp_user_id,
          email: u.email,
          nome: u.nome || '',
          grupos: Array.isArray(u.grupos) ? (u.grupos as unknown as string[]) : [],
          status_acesso: u.status_acesso || 'aguardando_pagamento',
          tem_pagamento_confirmado: u.tem_pagamento_confirmado || false,
          data_cadastro_wp: u.data_cadastro_wp,
          ultimo_login: u.ultimo_login,
          updated_at: u.updated_at
        }));
        setWpUsers(wpUsersMapped);

        // Calculate stats
        const ativos = wpUsersMapped.filter(u => u.status_acesso === 'ativo').length;
        const comPagamento = wpUsersMapped.filter(u => u.tem_pagamento_confirmado).length;
        const semPagamento = wpUsersMapped.filter(u => !u.tem_pagamento_confirmado && u.grupos.length > 0).length;

        setWpStats({
          total: wpUsersMapped.length,
          ativos,
          comPagamento,
          semPagamento
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription for WordPress sync
    const channel = supabase
      .channel('wp-sync-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios_wordpress_sync' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const syncWordPress = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-wordpress-users');
      
      if (error) throw error;
      
      toast.success(`✅ Sincronização concluída!`, {
        description: `${data?.total_synced || 0} usuários sincronizados`
      });
      
      await fetchData();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Erro ao sincronizar com WordPress");
    } finally {
      setIsSyncing(false);
    }
  };

  // ============================================
  // ⚡ PARTE 6 + 7: Filtragem por universo + produto selecionado
  // Aplica filtros sem duplicar lógica existente
  // ============================================
  const universeFilters = useMemo(() => {
    if (!selection) return null;
    return getUniverseFilters(selection);
  }, [selection]);

  const filteredStudents = useMemo(() => {
    if (!universeFilters) return students;
    return students.filter(universeFilters.filterFn);
  }, [students, universeFilters]);

  const filteredWpUsers = useMemo(() => {
    if (!universeFilters || !universeFilters.wpFilterFn) return wpUsers;
    return wpUsers.filter(universeFilters.wpFilterFn);
  }, [wpUsers, universeFilters]);

  // Stats recalculados com base nos dados filtrados
  const filteredWpStats = useMemo(() => {
    const ativos = filteredWpUsers.filter(u => u.status_acesso === 'ativo').length;
    const comPagamento = filteredWpUsers.filter(u => u.tem_pagamento_confirmado).length;
    const semPagamento = filteredWpUsers.filter(u => !u.tem_pagamento_confirmado && u.grupos.length > 0).length;
    return {
      total: filteredWpUsers.length,
      ativos,
      comPagamento,
      semPagamento
    };
  }, [filteredWpUsers]);

  const ativos = filteredStudents.filter(s => s.status === "Ativo" || s.status === "ativo").length;
  const concluidos = filteredStudents.filter(s => s.status === "Concluído" || s.status === "concluido").length;

  const openModal = (student?: Student) => {
    setEditingItem(student || null);
    setFormData(student 
      ? { nome: student.nome, email: student.email, curso: student.curso, status: student.status }
      : { nome: "", email: "", curso: "", status: "Ativo" }
    );
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Preencha o nome");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Preencha o email");
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("alunos")
          .update({ nome: formData.nome, email: formData.email, status: formData.status })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Aluno atualizado!");
      } else {
        // 1. Inserir na tabela alunos
        const { data: alunoData, error: alunoError } = await supabase.from("alunos").insert({
          nome: formData.nome,
          email: formData.email,
          status: formData.status,
        }).select().single();
        
        if (alunoError) throw alunoError;

        // 2. Verificar se existe um profile com esse email para atribuir role beta
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", formData.email.toLowerCase())
          .maybeSingle();

        if (profileData?.id) {
          // 3. Atribuir role 'beta' ao usuário (aluno pagante)
          const { error: roleError } = await supabase.from("user_roles").upsert({
            user_id: profileData.id,
            role: "beta" as any,
          }, { onConflict: "user_id,role" });

          if (roleError) {
            console.warn("Não foi possível atribuir role beta:", roleError);
          } else {
            toast.success("🎓 Aluno adicionado com acesso BETA!");
          }
        } else {
          toast.success("Aluno adicionado! (Role será atribuído quando fizer login)");
        }
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error(error.message || "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("alunos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Aluno removido!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Erro ao remover");
    }
  };

  // ============================================
  // ⚡ PARTE 6 + 7: Renderização condicional
  // Se não selecionou universo, mostra tela de seleção
  // ============================================
  if (!selection) {
    return <AlunosUniverseSelector onSelect={handleSelectionChange} />;
  }

  // ⚡ PARTE 7: Labels combinados (universo + produto)
  const universeOption = ALUNO_UNIVERSE_OPTIONS.find(o => o.id === selection.universe);
  const productOption = selection.product 
    ? ONLINE_PRODUCT_OPTIONS.find(o => o.id === selection.product) 
    : null;
  const selectedUniverseLabel = productOption 
    ? `${universeOption?.label || 'Todos'} → ${productOption.label}`
    : universeOption?.label || 'Todos';

  return (
    <div className="relative min-h-screen">
      <CyberBackground variant="matrix" />
      
      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* ⚡ PARTE 6 + 7: Botão voltar + Badge do universo/produto */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleSelectionChange(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à seleção
            </Button>
            <Badge variant="outline" className="text-sm">
              {selectedUniverseLabel}
            </Badge>
          </div>

          {/* Futuristic Header */}
          <FuturisticPageHeader
            title="Academia Quantum"
            subtitle={`Gestão de Alunos — ${selectedUniverseLabel}`}
            icon={GraduationCap}
            badge="STUDENT MATRIX"
            accentColor="blue"
            stats={[
              { label: "Alunos DB", value: filteredStudents.length, icon: Users },
              { label: "WordPress", value: filteredWpStats.total, icon: Globe },
              { label: "Com Pagamento", value: filteredWpStats.comPagamento, icon: CheckCircle },
            ]}
            action={
              <div className="flex gap-2">
                <Button 
                  onClick={syncWordPress}
                  disabled={isSyncing}
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync WordPress
                </Button>
                <Button 
                  onClick={() => openModal()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Aluno
                </Button>
              </div>
            }
          />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-background/50 border border-blue-500/30">
              <TabsTrigger value="alunos" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                <Users className="h-4 w-4 mr-2" />
                Alunos DB ({filteredStudents.length})
              </TabsTrigger>
              <TabsTrigger value="wordpress" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Globe className="h-4 w-4 mr-2" />
                WordPress ({filteredWpStats.total})
              </TabsTrigger>
            </TabsList>

            {/* Tab: Alunos */}
            <TabsContent value="alunos" className="space-y-6 mt-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FuturisticCard accentColor="blue" className="p-4 text-center">
                  <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-400">{filteredStudents.length}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
                </FuturisticCard>
                <FuturisticCard accentColor="green" className="p-4 text-center">
                  <GraduationCap className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-emerald-400">{ativos}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Ativos</div>
                </FuturisticCard>
                <FuturisticCard accentColor="purple" className="p-4 text-center">
                  <Award className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-400">{concluidos}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Concluídos</div>
                </FuturisticCard>
                <FuturisticCard accentColor="cyan" className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-cyan-400">
                    {filteredStudents.length > 0 ? Math.round((concluidos / filteredStudents.length) * 100) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Taxa</div>
                </FuturisticCard>
              </div>

              {/* Analytics */}
              <StudentAnalytics 
                totalStudents={filteredStudents.length}
                activeStudents={ativos}
                completedStudents={concluidos}
                averageProgress={filteredStudents.length > 0 ? 65 : 0}
                averageXP={filteredStudents.length > 0 ? 2450 : 0}
                topPerformers={filteredStudents.slice(0, 5).map((s, i) => ({
                  id: s.id.toString(),
                  name: s.nome,
                  xp: 3000 - (i * 200),
                  progress: 90 - (i * 5)
                }))}
              />

              {/* Table */}
              <FuturisticCard accentColor="blue">
                <VirtualTable
                  items={filteredStudents}
                  rowHeight={56}
                  containerHeight={500}
                  emptyMessage="Nenhum aluno cadastrado"
                  renderHeader={() => (
                    <table className="w-full">
                      <thead className="bg-blue-500/10">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-blue-400">Nome</th>
                          <th className="text-left p-4 text-sm font-medium text-blue-400">Email</th>
                          <th className="text-left p-4 text-sm font-medium text-blue-400">Status</th>
                          <th className="text-right p-4 text-sm font-medium text-blue-400">Ações</th>
                        </tr>
                      </thead>
                    </table>
                  )}
                  renderRow={(student) => (
                    <table className="w-full">
                      <tbody>
                        <tr className="border-t border-blue-500/20 hover:bg-blue-500/5 transition-colors">
                          <td className="p-4 text-foreground font-medium" style={{ width: '25%' }}>{student.nome}</td>
                          <td className="p-4 text-muted-foreground" style={{ width: '30%' }}>{student.email || "-"}</td>
                          <td className="p-4" style={{ width: '20%' }}>
                            <Badge variant={
                              student.status === "Ativo" ? "default" :
                              student.status === "Concluído" ? "secondary" : "outline"
                            } className={
                              student.status === "Ativo" ? "bg-emerald-500/20 text-emerald-400" :
                              student.status === "Concluído" ? "bg-purple-500/20 text-purple-400" :
                              student.status === "Pendente" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            }>
                              {student.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right" style={{ width: '25%' }}>
                            <div className="flex justify-end gap-2">
                              <BetaAccessManager
                                studentEmail={student.email}
                                studentName={student.nome}
                                studentId={student.id}
                                onAccessChange={fetchData}
                              />
                              <AttachmentButton
                                entityType="student"
                                entityId={student.id}
                                entityLabel={student.nome}
                                variant="ghost"
                                size="icon"
                              />
                              <Button variant="ghost" size="icon" onClick={() => openModal(student)}>
                                <Edit2 className="h-4 w-4 text-blue-400" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)} className="text-red-400 hover:text-red-300">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                />
              </FuturisticCard>
            </TabsContent>

            {/* Tab: WordPress Sync */}
            <TabsContent value="wordpress" className="space-y-6 mt-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FuturisticCard accentColor="cyan" className="p-4 text-center">
                  <Globe className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-cyan-400">{filteredWpStats.total}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Total WordPress</div>
                </FuturisticCard>
                <FuturisticCard accentColor="green" className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-emerald-400">{filteredWpStats.ativos}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Ativos</div>
                </FuturisticCard>
                <FuturisticCard accentColor="blue" className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-400">{filteredWpStats.comPagamento}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Pagamento OK</div>
                </FuturisticCard>
                <FuturisticCard accentColor="orange" className="p-4 text-center">
                  <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-400">{filteredWpStats.semPagamento}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">⚠️ Sem Pagamento</div>
                </FuturisticCard>
              </div>

              {/* Alert for users without payment */}
              {filteredWpStats.semPagamento > 0 && (
                <FuturisticCard accentColor="orange" className="p-4 border-red-500/50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                    <div>
                      <h4 className="font-semibold text-red-400">Atenção: Acesso Indevido Detectado</h4>
                      <p className="text-sm text-muted-foreground">
                        {filteredWpStats.semPagamento} usuário(s) têm acesso ao curso mas não possuem pagamento confirmado.
                        Verifique na página de Auditoria de Acessos.
                      </p>
                    </div>
                  </div>
                </FuturisticCard>
              )}

              {/* WordPress Users Table */}
              <FuturisticCard accentColor="cyan">
                <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
                  <h3 className="font-semibold text-cyan-400">Usuários WordPress Sincronizados</h3>
                  <Button 
                    onClick={syncWordPress} 
                    disabled={isSyncing} 
                    size="sm"
                    className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sincronizar
                  </Button>
                </div>
                <VirtualTable
                  items={filteredWpUsers}
                  rowHeight={64}
                  containerHeight={500}
                  emptyMessage="Nenhum usuário sincronizado. Clique em 'Sincronizar' para importar usuários do WordPress"
                  renderHeader={() => (
                    <table className="w-full">
                      <thead className="bg-cyan-500/10">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-cyan-400">Nome</th>
                          <th className="text-left p-4 text-sm font-medium text-cyan-400">Email</th>
                          <th className="text-left p-4 text-sm font-medium text-cyan-400">Status</th>
                          <th className="text-left p-4 text-sm font-medium text-cyan-400">Pagamento</th>
                          <th className="text-left p-4 text-sm font-medium text-cyan-400">Grupos</th>
                        </tr>
                      </thead>
                    </table>
                  )}
                  renderRow={(user) => (
                    <table className="w-full">
                      <tbody>
                        <tr className="border-t border-cyan-500/20 hover:bg-cyan-500/5 transition-colors">
                          <td className="p-4 text-foreground font-medium" style={{ width: '20%' }}>{user.nome || "Sem nome"}</td>
                          <td className="p-4 text-muted-foreground" style={{ width: '25%' }}>{user.email}</td>
                          <td className="p-4" style={{ width: '15%' }}>
                            <Badge className={
                              user.status_acesso === 'ativo' 
                                ? "bg-emerald-500/20 text-emerald-400" 
                                : "bg-yellow-500/20 text-yellow-400"
                            }>
                              {user.status_acesso}
                            </Badge>
                          </td>
                          <td className="p-4" style={{ width: '15%' }}>
                            {user.tem_pagamento_confirmado ? (
                              <Badge className="bg-green-500/20 text-green-400">
                                <CheckCircle className="h-3 w-3 mr-1" /> Confirmado
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400">
                                <XCircle className="h-3 w-3 mr-1" /> Não confirmado
                              </Badge>
                            )}
                          </td>
                          <td className="p-4" style={{ width: '25%' }}>
                            <div className="flex flex-wrap gap-1">
                              {user.grupos.length > 0 ? user.grupos.slice(0, 3).map((g, i) => (
                                <Badge key={i} variant="outline" className="text-xs border-cyan-500/30">
                                  {String(g)}
                                </Badge>
                              )) : (
                                <span className="text-muted-foreground text-sm">Nenhum grupo</span>
                              )}
                              {user.grupos.length > 3 && (
                                <Badge variant="outline" className="text-xs border-cyan-500/30">
                                  +{user.grupos.length - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                />
              </FuturisticCard>
            </TabsContent>
          </Tabs>

          {/* Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md border-blue-500/30">
              <DialogHeader>
                <DialogTitle className="text-blue-400">{editingItem ? "Editar" : "Novo"} Aluno</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome do aluno" className="mt-1.5 border-blue-500/30" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@exemplo.com" className="mt-1.5 border-blue-500/30" />
                </div>
                <div>
                  <Label>Curso</Label>
                  <Input value={formData.curso} onChange={(e) => setFormData(prev => ({ ...prev, curso: e.target.value }))} placeholder="Nome do curso" className="mt-1.5 border-blue-500/30" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="mt-1.5 border-blue-500/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
