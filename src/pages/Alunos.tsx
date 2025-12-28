// ============================================
// TRAMON v8.1 - ACADEMIA QUANTUM
// Sistema Neural de Gestão de Alunos
// WordPress removido em 2025-12-28
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, GraduationCap, Trash2, Edit2, Users, Award, TrendingUp, Brain, RefreshCw, AlertTriangle, CheckCircle, XCircle, Crown, ArrowLeft, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { BetaAccessManager } from "@/components/students/BetaAccessManager";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { CyberBackground } from "@/components/ui/cyber-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/employees/StatCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StudentAnalytics } from "@/components/students/StudentAnalytics";
import { AttachmentButton } from "@/components/attachments/AutoAttachmentWrapper";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VirtualTable } from "@/components/performance/VirtualTable";
import { CriarAcessoOficialModal } from "@/components/students/CriarAcessoOficialModal";
import { useAlunosPaginados } from "@/hooks/useAlunosPaginados";
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
  role?: 'beta' | 'aluno_gratuito' | null;
}

const STATUS_OPTIONS = ["Ativo", "Concluído", "Pendente", "Cancelado"];

export default function Alunos() {
  // ============================================
  // Estado de pré-seleção de universo + produto
  // null = tela de seleção, valor = gestão filtrada
  // Persistência via querystring
  // ============================================
  const [selection, setSelection] = useState<AlunoSelectionState | null>(() => {
    return parseSelectionFromUrl();
  });
  
  const handleSelectionChange = (newSelection: AlunoSelectionState | null) => {
    setSelection(newSelection);
    updateUrlWithSelection(newSelection);
  };
  
  // Converter universo para filtro A/B/C/D
  const universoFiltro = useMemo(() => {
    if (!selection) return null;
    switch (selection.universe) {
      case 'presencial': return 'A' as const;
      case 'presencial_online': return 'B' as const;
      case 'online': return 'C' as const;
      case 'registrados': return 'D' as const;
      default: return null;
    }
  }, [selection]);

  // Hook de paginação server-side
  const {
    alunos: paginatedStudents,
    contadores,
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    isLoading: isLoadingPaginated,
    refetch: refetchPaginated,
  } = useAlunosPaginados({
    pageSize: 50,
    universoFiltro,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ nome: "", email: "", curso: "", status: "Ativo" });
  
  // Modal de Criar Acesso Oficial
  const [isCriarAcessoModalOpen, setIsCriarAcessoModalOpen] = useState(false);

  // Converter alunos paginados para formato Student
  const students: Student[] = useMemo(() => {
    return paginatedStudents.map(a => ({
      id: a.id,
      nome: a.nome,
      email: a.email,
      curso: '',
      status: a.status,
      fonte: a.fonte || undefined,
      role: a.role,
    }));
  }, [paginatedStudents]);

  // Função para refetch
  const fetchData = useCallback(() => {
    refetchPaginated();
  }, [refetchPaginated]);

  // ⚡ FIX: Role é informativo, NÃO filtro obrigatório
  // Alunos cadastrados aparecem mesmo sem role associada
  const expectedRole = useMemo(() => {
    if (!selection) return null;
    // Role é apenas para exibição/badge, não para filtro
    if (selection.universe === 'registrados') return 'aluno_gratuito';
    return 'beta';
  }, [selection]);

  const universeFilters = useMemo(() => {
    if (!selection) return null;
    return getUniverseFilters(selection);
  }, [selection]);

  // ⚡ FIX: Não filtrar por role - mostrar TODOS os alunos do universo
  // Role é informação complementar, não critério de exclusão
  const filteredStudents = useMemo(() => {
    if (!universeFilters) return students;
    
    // Aplicar apenas filtro de universo (presencial/online), não de role
    return students.filter(s => universeFilters.filterFn(s));
  }, [students, universeFilters]);

  // Stats recalculados
  const ativos = contadores.ativos;
  const concluidos = contadores.concluidos;

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
          // UPSERT ROLE (CONSTITUIÇÃO v10.x)
          const { error: roleError } = await supabase.from("user_roles").upsert({
            user_id: profileData.id,
            role: "beta" as any,
          }, { onConflict: "user_id" });

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

  // Se não selecionou universo, mostra tela de seleção
  if (!selection) {
    return <AlunosUniverseSelector onSelect={handleSelectionChange} />;
  }

  // Labels combinados (universo + produto)
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
          {/* Botão voltar + Badge do universo/produto */}
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
              { label: "Total Alunos", value: contadores.total, icon: Users },
              { label: "Ativos", value: contadores.ativos, icon: CheckCircle },
              { label: "Concluídos", value: contadores.concluidos, icon: Award },
            ]}
            action={
              <div className="flex gap-2">
                {/* Botão Criar Acesso Oficial */}
                <Button 
                  onClick={() => setIsCriarAcessoModalOpen(true)}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/25"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Acesso Oficial
                </Button>
                <Button 
                  onClick={() => openModal()}
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Aluno
                </Button>
              </div>
            }
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FuturisticCard accentColor="blue" className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{contadores.total}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
            </FuturisticCard>
            <FuturisticCard accentColor="green" className="p-4 text-center">
              <GraduationCap className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-400">{contadores.ativos}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Ativos</div>
            </FuturisticCard>
            <FuturisticCard accentColor="purple" className="p-4 text-center">
              <Award className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">{contadores.concluidos}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Concluídos</div>
            </FuturisticCard>
            <FuturisticCard accentColor="cyan" className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-cyan-400">
                {contadores.total > 0 ? Math.round((contadores.concluidos / contadores.total) * 100) : 0}%
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

          {/* Table com paginação server-side */}
          <FuturisticCard accentColor="blue">
            {/* Header com info de paginação */}
            <div className="p-4 border-b border-blue-500/20 flex items-center justify-between">
              <h3 className="font-semibold text-blue-400">
                Alunos Cadastrados
                <span className="text-muted-foreground font-normal ml-2">
                  (Página {page} de {totalPages})
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={!hasPrevPage || isLoadingPaginated}
                  className="border-blue-500/30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage || isLoadingPaginated}
                  className="border-blue-500/30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <VirtualTable
              items={filteredStudents}
              rowHeight={56}
              containerHeight={500}
              emptyMessage={isLoadingPaginated ? "Carregando..." : "Nenhum aluno cadastrado"}
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
            
            {/* Footer com paginação */}
            <div className="p-4 border-t border-blue-500/20 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Mostrando {filteredStudents.length} de {contadores.total} alunos
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={page === 1 || isLoadingPaginated}
                  className="border-blue-500/30"
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={!hasPrevPage || isLoadingPaginated}
                  className="border-blue-500/30"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage || isLoadingPaginated}
                  className="border-blue-500/30"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={page === totalPages || isLoadingPaginated}
                  className="border-blue-500/30"
                >
                  Última
                </Button>
              </div>
            </div>
          </FuturisticCard>

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

          {/* Modal Criar Acesso Oficial */}
          <CriarAcessoOficialModal 
            open={isCriarAcessoModalOpen}
            onOpenChange={setIsCriarAcessoModalOpen}
            onSuccess={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
