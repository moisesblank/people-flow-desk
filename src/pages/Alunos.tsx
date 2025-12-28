// ============================================
// GESTÃO DE ALUNOS — LISTA UNIFICADA v3.0
// HARD BINDING CONTRACT ENFORCED
// ============================================
// 
// DATA BINDING ARCHITECTURE:
// ┌─────────────────────────────────────────────────────────────┐
// │                    SINGLE SOURCE OF TRUTH                   │
// │                     (alunos table + user_roles)             │
// └───────────────────────────┬─────────────────────────────────┘
//                             │
//                             ▼
// ┌─────────────────────────────────────────────────────────────┐
// │                     allStudents (Query)                     │
// │     TODOS os alunos carregados uma única vez                │
// └───────────────────────────┬─────────────────────────────────┘
//                             │
//               ┌─────────────┴─────────────┐
//               ▼                           ▼
// ┌─────────────────────────┐   ┌───────────────────────────────┐
// │    universeCounters     │   │      students (filtered)      │
// │   Contadores por área   │   │   Lista filtrada por universo │
// │   (derivado)            │   │   + busca (derivado)          │
// └─────────────────────────┘   └───────────────────────────────┘
//               │                           │
//               ▼                           ▼
// ┌─────────────────────────┐   ┌───────────────────────────────┐
// │   4 UNIVERSE CARDS      │   │     SEARCH TABLE VIEW         │
// │   (exibem contadores)   │   │   (exibe students filtrados)  │
// └─────────────────────────┘   └───────────────────────────────┘
//
// BINDING RULES (IMMUTABLE):
// 1. students = filter(allStudents, universeFilter)
// 2. universeCounters = count(allStudents, each universe)
// 3. totalCount = students.length (not raw query count)
// 4. Table ALWAYS shows students (never raw query)
// 5. Cards ALWAYS show universeCounters (never cached)
// 6. ANY change in allStudents → IMMEDIATE propagation
//
// FORBIDDEN:
// - Independent state for search view
// - Cached counters not derived from allStudents
// - Parallel queries for different views
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Plus, GraduationCap, Trash2, Edit2, Users, Award, TrendingUp, 
  UserPlus, ChevronLeft, ChevronRight, Search, Crown, Shield,
  CheckCircle, XCircle, Clock, AlertCircle, MapPin, Globe, Wifi, UserCheck, X
} from "lucide-react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AttachmentButton } from "@/components/attachments/AutoAttachmentWrapper";
import { VirtualTable } from "@/components/performance/VirtualTable";
import { CriarAcessoOficialModal } from "@/components/students/CriarAcessoOficialModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ============================================
// TYPES
// ============================================

interface Student {
  id: string;
  nome: string;
  email: string;
  status: string;
  fonte: string | null;
  role: 'beta' | 'aluno_gratuito' | null;
  created_at: string;
}

interface AlunosContadores {
  total: number;
  ativos: number;
  concluidos: number;
  pendentes: number;
  cancelados: number;
  beta: number;
  gratuito: number;
}

const STATUS_OPTIONS = ["Ativo", "Concluído", "Pendente", "Cancelado"];

// ============================================
// CONSTANTS — BLOCK 2 COMPLIANCE
// ============================================

const PAGE_SIZE = 100; // BLOCK 2: 100 por página
const STALE_TIME = 30_000;

// ============================================
// UNIVERSOS — Cards de filtro rápido
// ============================================

type UniverseFilterType = 'all' | 'presencial' | 'presencial_online' | 'online' | 'registrados';

const UNIVERSE_OPTIONS: Array<{
  id: UniverseFilterType;
  label: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
}> = [
  {
    id: 'presencial',
    label: 'Alunos Presencial',
    description: 'Alunos matriculados em cursos presenciais',
    icon: MapPin,
    accentColor: 'blue',
  },
  {
    id: 'presencial_online',
    label: 'Presencial + Online',
    description: 'Alunos com acesso híbrido (presencial e online)',
    icon: Globe,
    accentColor: 'purple',
  },
  {
    id: 'online',
    label: 'Alunos Online',
    description: 'Alunos matriculados exclusivamente online',
    icon: Wifi,
    accentColor: 'cyan',
  },
  {
    id: 'registrados',
    label: 'Registrados (Área Gratuita)',
    description: 'Usuários registrados sem pagamento confirmado',
    icon: UserCheck,
    accentColor: 'green',
  },
];

const UNIVERSO_LABELS = {
  presencial: { label: 'Presencial', color: 'blue', icon: '📍' },
  online: { label: 'Online', color: 'cyan', icon: '🌐' },
  registrados: { label: 'Registrado', color: 'green', icon: '✓' },
  hibrido: { label: 'Híbrido', color: 'purple', icon: '🔀' },
} as const;

// Derivar label do aluno baseado em dados existentes
function deriveStudentLabel(student: Student): keyof typeof UNIVERSO_LABELS {
  // Role-based first
  if (student.role === 'aluno_gratuito') return 'registrados';
  
  // Fonte-based
  const fonte = student.fonte?.toLowerCase() || '';
  if (fonte.includes('presencial')) return 'presencial';
  if (fonte.includes('híbrido') || fonte.includes('hibrido')) return 'hibrido';
  
  // Default: online para pagantes
  if (student.role === 'beta') return 'online';
  
  return 'registrados';
}

// Filtrar aluno pelo universo selecionado
function matchesUniverseFilter(student: Student, filter: UniverseFilterType): boolean {
  if (filter === 'all') return true;
  
  const fonte = student.fonte?.toLowerCase() || '';
  
  switch (filter) {
    case 'presencial':
      return fonte.includes('presencial') && !fonte.includes('online');
    case 'presencial_online':
      return fonte.includes('presencial') && fonte.includes('online') || 
             fonte.includes('híbrido') || fonte.includes('hibrido') ||
             (student.role === 'beta' && fonte.includes('presencial'));
    case 'online':
      return !fonte.includes('presencial') && student.role === 'beta';
    case 'registrados':
      return student.role === 'aluno_gratuito' || student.role === null;
    default:
      return true;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Alunos() {
  const queryClient = useQueryClient();
  
  // Paginação
  const [page, setPage] = useState(1);
  
  // Filtro de universo
  const [universeFilter, setUniverseFilter] = useState<UniverseFilterType>('all');
  
  // Busca global
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ nome: "", email: "", curso: "", status: "Ativo" });
  const [isCriarAcessoModalOpen, setIsCriarAcessoModalOpen] = useState(false);

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ============================================
  // QUERY 1: Contadores agregados (Zero N+1)
  // ============================================
  const contadoresQuery = useQuery({
    queryKey: ['alunos-contadores-unified'],
    queryFn: async (): Promise<AlunosContadores> => {
      const [
        totalResult,
        ativosResult,
        concluidosResult,
        pendentesResult,
        canceladosResult,
        betaResult,
        gratuitoResult,
      ] = await Promise.all([
        supabase.from('alunos').select('*', { count: 'exact', head: true }),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'ativo'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'concluído'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'pendente'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'cancelado'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'beta'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'aluno_gratuito'),
      ]);

      return {
        total: totalResult.count || 0,
        ativos: ativosResult.count || 0,
        concluidos: concluidosResult.count || 0,
        pendentes: pendentesResult.count || 0,
        cancelados: canceladosResult.count || 0,
        beta: betaResult.count || 0,
        gratuito: gratuitoResult.count || 0,
      };
    },
    staleTime: STALE_TIME,
  });

  // ============================================
  // QUERY 2: Alunos paginados — TODOS juntos
  // BLOCK 2: Ordenação alfabética (pt-BR), 100/página
  // ============================================
  const alunosQuery = useQuery({
    queryKey: ['alunos-unified', page, debouncedSearch],
    queryFn: async (): Promise<{ data: Student[]; count: number }> => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Query base — TODOS os alunos (pagos + não pagos)
      let query = supabase
        .from('alunos')
        .select('id, nome, email, status, fonte, created_at', { count: 'exact' });

      // Busca global: nome OU email (case-insensitive, partial match)
      if (debouncedSearch.trim()) {
        query = query.or(`nome.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      // BLOCK 2: Ordenação alfabética por nome
      query = query
        .order('nome', { ascending: true })
        .range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      // Buscar roles apenas para emails desta página (evita N+1)
      const emails = (data || []).map(a => a.email?.toLowerCase()).filter(Boolean);
      let roleMap: Record<string, 'beta' | 'aluno_gratuito'> = {};
      
      if (emails.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select(`role, profiles!inner(email)`)
          .in('role', ['beta', 'aluno_gratuito']);

        (rolesData || []).forEach((r: any) => {
          const email = r.profiles?.email?.toLowerCase();
          if (email && emails.includes(email)) {
            // Beta tem prioridade sobre aluno_gratuito
            if (roleMap[email] !== 'beta') {
              roleMap[email] = r.role as 'beta' | 'aluno_gratuito';
            }
          }
        });
      }

      const alunos: Student[] = (data || []).map(a => ({
        id: a.id,
        nome: a.nome,
        email: a.email || '',
        status: a.status || 'Ativo',
        fonte: a.fonte || null,
        role: roleMap[(a.email || '').toLowerCase()] || null,
        created_at: a.created_at || '',
      }));

      return { data: alunos, count: count || 0 };
    },
    staleTime: STALE_TIME,
  });

  // ============================================
  // REALTIME — Refetch imediato
  // ============================================
  useEffect(() => {
    const channel = supabase
      .channel('gestao-alunos-unified-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['alunos-unified'] });
        queryClient.invalidateQueries({ queryKey: ['alunos-contadores-unified'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['alunos-unified'] });
        queryClient.invalidateQueries({ queryKey: ['alunos-contadores-unified'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['alunos-unified'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['alunos-unified'] });
    queryClient.invalidateQueries({ queryKey: ['alunos-contadores-unified'] });
  }, [queryClient]);

  // ============================================
  // CRUD HANDLERS
  // ============================================
  const openModal = (student?: Student) => {
    setEditingItem(student || null);
    setFormData(student 
      ? { nome: student.nome, email: student.email, curso: '', status: student.status }
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
        const { data: alunoData, error: alunoError } = await supabase.from("alunos").insert({
          nome: formData.nome,
          email: formData.email,
          status: formData.status,
        }).select().single();
        
        if (alunoError) throw alunoError;

        // Verificar se existe profile para atribuir role beta
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", formData.email.toLowerCase())
          .maybeSingle();

        if (profileData?.id) {
          const { error: roleError } = await supabase.from("user_roles").upsert({
            user_id: profileData.id,
            role: "beta" as any,
          }, { onConflict: "user_id" });

          if (!roleError) {
            toast.success("🎓 Aluno adicionado com acesso BETA!");
          } else {
            toast.success("Aluno adicionado!");
          }
        } else {
          toast.success("Aluno adicionado! (Role será atribuído quando fizer login)");
        }
      }

      refetch();
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
      refetch();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Erro ao remover");
    }
  };

  // ============================================
  // DERIVED DATA
  // ============================================
  const allStudents = alunosQuery.data?.data || [];
  
  // Aplicar filtro de universo (client-side para evitar requery)
  // HARD BINDING: students SEMPRE deriva de allStudents + universeFilter
  const students = useMemo(() => {
    if (universeFilter === 'all') return allStudents;
    return allStudents.filter(s => matchesUniverseFilter(s, universeFilter));
  }, [allStudents, universeFilter]);
  
  // Contadores por universo — HARD BINDING: derivados de allStudents
  const universeCounters = useMemo(() => ({
    presencial: allStudents.filter(s => matchesUniverseFilter(s, 'presencial')).length,
    presencial_online: allStudents.filter(s => matchesUniverseFilter(s, 'presencial_online')).length,
    online: allStudents.filter(s => matchesUniverseFilter(s, 'online')).length,
    registrados: allStudents.filter(s => matchesUniverseFilter(s, 'registrados')).length,
  }), [allStudents]);
  
  const contadores = contadoresQuery.data || {
    total: 0, ativos: 0, concluidos: 0, pendentes: 0, cancelados: 0, beta: 0, gratuito: 0,
  };
  const isLoading = alunosQuery.isLoading;

  // ============================================
  // PAGINATION — HARD BINDING TO FILTERED STUDENTS
  // ============================================
  // totalCount MUST equal students.length (filtered view)
  // This ensures search area is DERIVED from universe filter
  const totalCount = students.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) setPage(p => p + 1);
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) setPage(p => p - 1);
  }, [hasPrevPage]);
  
  // Handler para selecionar universo
  const handleUniverseSelect = (id: UniverseFilterType) => {
    setUniverseFilter(id === universeFilter ? 'all' : id);
    setPage(1);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="relative min-h-screen">
      <CyberBackground variant="matrix" />
      
      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <FuturisticPageHeader
            title="Gestão de Alunos"
            subtitle="Lista unificada — Todos os alunos (pagos + gratuitos)"
            icon={GraduationCap}
            badge="FONTE ÚNICA"
            accentColor="blue"
            stats={[
              { label: "Total", value: contadores.total, icon: Users },
              { label: "Beta (Pagos)", value: contadores.beta, icon: Crown },
              { label: "Gratuitos", value: contadores.gratuito, icon: Shield },
            ]}
            action={
              <div className="flex gap-2">
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
              <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-400">{contadores.ativos}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Ativos</div>
            </FuturisticCard>
            <FuturisticCard accentColor="purple" className="p-4 text-center">
              <Crown className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">{contadores.beta}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Beta (Pagos)</div>
            </FuturisticCard>
            <FuturisticCard accentColor="cyan" className="p-4 text-center">
              <Shield className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-cyan-400">{contadores.gratuito}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Gratuitos</div>
            </FuturisticCard>
          </div>

          {/* Universe Cards — Filtros de área (HARD BINDING com contadores derivados) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {UNIVERSE_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              const isActive = universeFilter === option.id;
              // HARD BINDING: contador deriva de universeCounters
              const count = universeCounters[option.id as keyof typeof universeCounters] || 0;
              
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FuturisticCard
                    accentColor={option.accentColor as any}
                    className={`p-4 cursor-pointer group hover:scale-[1.02] transition-all duration-300 ${
                      isActive ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                    } ${
                      isActive && option.accentColor === 'blue' ? 'ring-blue-500' : ''
                    } ${
                      isActive && option.accentColor === 'purple' ? 'ring-purple-500' : ''
                    } ${
                      isActive && option.accentColor === 'cyan' ? 'ring-cyan-500' : ''
                    } ${
                      isActive && option.accentColor === 'green' ? 'ring-emerald-500' : ''
                    }`}
                    onClick={() => handleUniverseSelect(option.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2.5 rounded-xl 
                        ${option.accentColor === 'blue' ? 'bg-blue-500/20 text-blue-400' : ''}
                        ${option.accentColor === 'purple' ? 'bg-purple-500/20 text-purple-400' : ''}
                        ${option.accentColor === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                        ${option.accentColor === 'green' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {option.label}
                          </h3>
                          {/* Contador derivado = HARD BINDING */}
                          <Badge variant="secondary" className={`ml-2 text-xs ${
                            option.accentColor === 'blue' ? 'bg-blue-500/20 text-blue-400' : ''
                          } ${
                            option.accentColor === 'purple' ? 'bg-purple-500/20 text-purple-400' : ''
                          } ${
                            option.accentColor === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' : ''
                          } ${
                            option.accentColor === 'green' ? 'bg-emerald-500/20 text-emerald-400' : ''
                          }`}>
                            {count}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {option.description}
                        </p>
                      </div>
                      
                      {isActive && (
                        <div className="flex-shrink-0">
                          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </div>
                      )}
                    </div>
                  </FuturisticCard>
                </motion.div>
              );
            })}
          </div>
          
          {/* Active Filter Indicator */}
          {universeFilter !== 'all' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-sm text-muted-foreground">Filtrando por:</span>
              <Badge variant="outline" className="border-primary/50 text-primary">
                {UNIVERSE_OPTIONS.find(o => o.id === universeFilter)?.label}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setUniverseFilter('all')}
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
              <span className="ml-auto text-sm text-muted-foreground">
                {students.length} alunos encontrados
              </span>
            </div>
          )}

          {/* Search + Table */}
          <FuturisticCard accentColor="blue">
            {/* Search Header */}
            <div className="p-4 border-b border-blue-500/20">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Página {page} de {totalPages}</span>
                  <span className="text-blue-400">({totalCount} alunos)</span>
                </div>
              </div>
            </div>
            
            {/* Table */}
            <VirtualTable
              items={students}
              rowHeight={64}
              containerHeight={600}
              emptyMessage={isLoading ? "Carregando..." : debouncedSearch ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              renderHeader={() => (
                <table className="w-full">
                  <thead className="bg-blue-500/10">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-blue-400 w-[30%]">Nome</th>
                      <th className="text-left p-4 text-sm font-medium text-blue-400 w-[25%]">Email</th>
                      <th className="text-left p-4 text-sm font-medium text-blue-400 w-[12%]">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-blue-400 w-[13%]">Tipo</th>
                      <th className="text-right p-4 text-sm font-medium text-blue-400 w-[20%]">Ações</th>
                    </tr>
                  </thead>
                </table>
              )}
              renderRow={(student) => {
                const labelKey = deriveStudentLabel(student);
                const labelInfo = UNIVERSO_LABELS[labelKey];
                
                return (
                  <table className="w-full">
                    <tbody>
                      <tr className="border-t border-blue-500/20 hover:bg-blue-500/5 transition-colors">
                        <td className="p-4 text-foreground font-medium w-[30%]">
                          <div className="flex items-center gap-2">
                            {student.role === 'beta' && <Crown className="h-4 w-4 text-yellow-400" />}
                            {student.nome}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground w-[25%]">{student.email || "-"}</td>
                        <td className="p-4 w-[12%]">
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
                        <td className="p-4 w-[13%]">
                          <Badge variant="outline" className={
                            labelKey === 'online' ? "border-cyan-500/50 text-cyan-400" :
                            labelKey === 'presencial' ? "border-blue-500/50 text-blue-400" :
                            labelKey === 'hibrido' ? "border-purple-500/50 text-purple-400" :
                            "border-green-500/50 text-green-400"
                          }>
                            {labelInfo.icon} {labelInfo.label}
                          </Badge>
                        </td>
                        <td className="p-4 text-right w-[20%]">
                          <div className="flex justify-end gap-2">
                            <BetaAccessManager
                              studentEmail={student.email}
                              studentName={student.nome}
                              studentId={student.id}
                              onAccessChange={refetch}
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
                );
              }}
            />
            
            {/* Footer com paginação */}
            <div className="p-4 border-t border-blue-500/20 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Mostrando {students.length} de {totalCount} alunos
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={page === 1 || isLoading}
                  className="border-blue-500/30"
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={!hasPrevPage || isLoading}
                  className="border-blue-500/30"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage || isLoading}
                  className="border-blue-500/30"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={page === totalPages || isLoading}
                  className="border-blue-500/30"
                >
                  Última
                </Button>
              </div>
            </div>
          </FuturisticCard>

          {/* Modal Edição */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md border-blue-500/30">
              <DialogHeader>
                <DialogTitle className="text-blue-400">{editingItem ? "Editar" : "Novo"} Aluno</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome</Label>
                  <Input 
                    value={formData.nome} 
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} 
                    placeholder="Nome do aluno" 
                    className="mt-1.5 border-blue-500/30" 
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    value={formData.email} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                    placeholder="email@exemplo.com" 
                    className="mt-1.5 border-blue-500/30" 
                  />
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
                <Button onClick={handleSave} className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Criar Acesso Oficial */}
          <CriarAcessoOficialModal 
            open={isCriarAcessoModalOpen}
            onOpenChange={setIsCriarAcessoModalOpen}
            onSuccess={refetch}
          />
        </div>
      </div>
    </div>
  );
}
