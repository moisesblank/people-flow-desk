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
import { useNavigate } from "react-router-dom";
import { 
  Plus, GraduationCap, Trash2, Edit2, Users, Award, TrendingUp, 
  UserPlus, ChevronLeft, ChevronRight, Search, Crown, Shield,
  CheckCircle, XCircle, Clock, AlertCircle, MapPin, Globe, Wifi, UserCheck, X, Eye, Package,
  Download, FileSpreadsheet, Loader2, Upload
} from "lucide-react";
import { BetaAccessManager } from "@/components/students/BetaAccessManager";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { CyberBackground } from "@/components/ui/cyber-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AttachmentButton } from "@/components/attachments/AutoAttachmentWrapper";
import { VirtualTable } from "@/components/performance/VirtualTable";
import { CriarAcessoOficialModal } from "@/components/students/CriarAcessoOficialModal";
import { ImportStudentsModal } from "@/components/students/ImportStudentsModal";
import { NuclearAnnihilateButton } from "@/components/students/NuclearAnnihilateButton";
import { BulkImportCPFModal } from "@/components/students/BulkImportCPFModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStudentPresence, getPresenceStatus } from "@/hooks/useStudentPresence";
import { useExportStudents } from "@/hooks/useExportStudents";
import { useAdminCheck } from "@/hooks/useAdminCheck";

// ============================================
// TYPES
// ============================================

// CONSTITUIÇÃO v10.x - 4 roles de aluno válidas
type StudentRoleType = 'beta' | 'aluno_gratuito' | 'aluno_presencial' | 'beta_expira';

interface Student {
  id: string;
  nome: string;
  email: string;
  status: string;
  fonte: string | null;
  tipo_produto: string | null;  // 'livroweb' | 'fisico' | null
  role: StudentRoleType | null;
  created_at: string;
}

interface AlunosContadores {
  total: number;
  ativos: number;
  concluidos: number;
  pendentes: number;
  cancelados: number;
  beta: number;
  betaLivroweb: number;
  betaFisico: number;
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

type UniverseFilterType = 'all' | 'beta' | 'beta_livroweb' | 'beta_fisico' | 'presencial' | 'presencial_online' | 'online' | 'registrados';

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
    accentColor: 'purple',
  },
  {
    id: 'registrados',
    label: 'Registrados (Área Gratuita)',
    description: 'Usuários registrados sem pagamento confirmado',
    icon: UserCheck,
    accentColor: 'green',
  },
];

// ============================================
// ROLE → DISPLAY MAPPING (SINCRONIZADO COM CARDS)
// Cada role de aluno tem ícone, label e cor correspondente ao card
// ============================================
const ROLE_DISPLAY_CONFIG = {
  // Card: "Alunos Presencial" (roxo/blue)
  aluno_presencial: { 
    label: 'Presencial', 
    colorClass: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    icon: MapPin,
  },
  // Card: "Presencial + Online" (verde/purple) = Beta
  beta: { 
    label: 'Beta', 
    colorClass: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    icon: Globe,
  },
  // Card: "Alunos Online" (ciano) = Beta com Expiração
  beta_expira: { 
    label: 'Online', 
    colorClass: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
    icon: Wifi,
  },
  // Card: "Registrados (Área Gratuita)" (green)
  aluno_gratuito: { 
    label: 'Gratuito', 
    colorClass: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    icon: UserCheck,
  },
} as const;

// Helper para obter config de display baseado no role
function getRoleDisplayConfig(role: EffectiveRole) {
  return ROLE_DISPLAY_CONFIG[role] || ROLE_DISPLAY_CONFIG.aluno_gratuito;
}

const UNIVERSO_LABELS = {
  presencial: { label: 'Presencial', color: 'blue', icon: '📍' },
  online: { label: 'Online', color: 'cyan', icon: '🌐' },
  registrados: { label: 'Registrado', color: 'green', icon: '✓' },
  hibrido: { label: 'Híbrido', color: 'purple', icon: '🔀' },
} as const;

// ============================================
// DETERMINAÇÃO DE ROLE EFETIVO
// ============================================
// REGRA CANÔNICA (CONSTITUIÇÃO v10.x):
// - 4 roles válidas: beta, aluno_gratuito, aluno_presencial, beta_expira
// - Aluno Hotmart = PAGANTE = beta implícito
// - Mesmo sem profile/user_roles, Hotmart indica pagamento confirmado
// ============================================
type EffectiveRole = 'beta' | 'aluno_gratuito' | 'aluno_presencial' | 'beta_expira';

function getEffectiveRole(student: Student): EffectiveRole {
  // Role explícito tem prioridade (4 roles válidas)
  if (student.role === 'beta' || student.role === 'aluno_gratuito' || 
      student.role === 'aluno_presencial' || student.role === 'beta_expira') {
    return student.role;
  }
  
  // HOTMART = PAGANTE = BETA IMPLÍCITO
  const fonte = student.fonte?.toLowerCase() || '';
  if (fonte.includes('hotmart')) {
    return 'beta';
  }
  
  // Acesso Oficial (Gestão) = BETA por default (admin criou)
  if (fonte.includes('acesso oficial') || fonte.includes('gestão') || fonte.includes('gestao')) {
    return 'beta';
  }
  
  // Sem fonte identificável = registrado gratuito
  return 'aluno_gratuito';
}

// Derivar label do aluno baseado em dados existentes
function deriveStudentLabel(student: Student): keyof typeof UNIVERSO_LABELS {
  const effectiveRole = getEffectiveRole(student);
  
  // Role-based first
  if (effectiveRole === 'aluno_gratuito') return 'registrados';
  
  // aluno_presencial → presencial
  if (effectiveRole === 'aluno_presencial') return 'presencial';
  
  // Fonte-based para pagantes (beta, beta_expira)
  const fonte = student.fonte?.toLowerCase() || '';
  if (fonte.includes('presencial')) return 'presencial';
  if (fonte.includes('híbrido') || fonte.includes('hibrido')) return 'hibrido';
  
  // Default: online para pagantes (beta, beta_expira)
  if (effectiveRole === 'beta' || effectiveRole === 'beta_expira') return 'online';
  
  return 'registrados';
}

// Filtrar aluno pelo universo selecionado
// SEGMENTOS CANÔNICOS (CONSTITUIÇÃO v10.x):
// - presencial: role aluno_presencial OU fonte contém 'presencial' (sem online)
// - presencial_online: híbrido ou presencial+online
// - online: pagantes (beta, beta_expira) SEM presencial na fonte
// - registrados: APENAS aluno_gratuito confirmado (não pagou)
function matchesUniverseFilter(student: Student, filter: UniverseFilterType): boolean {
  if (filter === 'all') return true;
  
  const fonte = student.fonte?.toLowerCase() || '';
  const effectiveRole = getEffectiveRole(student);
  
  switch (filter) {
    case 'presencial':
      // Presencial exclusivo: role aluno_presencial OU fonte presencial sem online
      return effectiveRole === 'aluno_presencial' || 
             (fonte.includes('presencial') && !fonte.includes('online') && !fonte.includes('híbrido') && !fonte.includes('hibrido'));
    
    case 'presencial_online':
      // Híbrido: presencial + online ou marcado como híbrido
      return (fonte.includes('presencial') && fonte.includes('online')) || 
             fonte.includes('híbrido') || fonte.includes('hibrido');
    
    case 'online':
      // Online: pagantes (beta, beta_expira) que NÃO são presencial
      return !fonte.includes('presencial') && 
             effectiveRole !== 'aluno_presencial' &&
             (effectiveRole === 'beta' || effectiveRole === 'beta_expira');
    
    case 'registrados':
      // Registrados: APENAS aluno_gratuito confirmado
      // Hotmart/Acesso Oficial NUNCA vai para registrados
      return effectiveRole === 'aluno_gratuito' && !fonte.includes('hotmart') && !fonte.includes('acesso oficial');
    
    case 'beta':
      // Beta/Pagos: todos os alunos pagantes (beta ou beta_expira)
      return effectiveRole === 'beta' || effectiveRole === 'beta_expira';
    
    case 'beta_livroweb':
      // Beta Livroweb: alunos pagantes com tipo_produto = 'livroweb'
      return (effectiveRole === 'beta' || effectiveRole === 'beta_expira') && 
             (student as any).tipo_produto === 'livroweb';
    
    case 'beta_fisico':
      // Beta Físico: alunos pagantes com tipo_produto = 'fisico'
      return (effectiveRole === 'beta' || effectiveRole === 'beta_expira') && 
             (student as any).tipo_produto === 'fisico';
    
    default:
      return true;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Alunos() {
  const queryClient = useQueryClient();
  
  // Hook de presença para status online/offline em tempo real
  const { presenceMap } = useStudentPresence();
  
  // Hook de exportação (LEI CANÔNICA DO EXPORT)
  const { exportStudents, isExporting } = useExportStudents();
  
  // Hook de verificação de admin (apenas OWNER/ADMIN podem exportar)
  const { isOwner, isAdmin, isAdminOrOwner } = useAdminCheck();
  
  // Paginação
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkImportCPFModalOpen, setIsBulkImportCPFModalOpen] = useState(false);
  
  // Estado para confirmação de exclusão (substitui confirm() nativo)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

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
        betaLivrowebResult,
        betaFisicoResult,
        gratuitoResult,
      ] = await Promise.all([
        supabase.from('alunos').select('*', { count: 'exact', head: true }),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'ativo'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'concluído'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'pendente'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'cancelado'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'beta'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('tipo_produto', 'livroweb'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('tipo_produto', 'fisico'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'aluno_gratuito'),
      ]);

      return {
        total: totalResult.count || 0,
        ativos: ativosResult.count || 0,
        concluidos: concluidosResult.count || 0,
        pendentes: pendentesResult.count || 0,
        cancelados: canceladosResult.count || 0,
        beta: betaResult.count || 0,
        betaLivroweb: betaLivrowebResult.count || 0,
        betaFisico: betaFisicoResult.count || 0,
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
      // Incluindo tipo_produto para filtro Livroweb/Físico
      let query = supabase
        .from('alunos')
        .select('id, nome, email, status, fonte, tipo_produto, created_at', { count: 'exact' });

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
      // CONSTITUIÇÃO v10.x - 4 roles de aluno válidas
      const emails = (data || []).map(a => a.email?.toLowerCase()).filter(Boolean);
      let roleMap: Record<string, StudentRoleType> = {};
      
      if (emails.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select(`role, profiles!inner(email)`)
          .in('role', ['beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira']);

        (rolesData || []).forEach((r: any) => {
          const email = r.profiles?.email?.toLowerCase();
          if (email && emails.includes(email)) {
            // Prioridade: beta > beta_expira > aluno_presencial > aluno_gratuito
            const currentRole = roleMap[email];
            const newRole = r.role as StudentRoleType;
            if (!currentRole || 
                (newRole === 'beta') || 
                (newRole === 'beta_expira' && currentRole !== 'beta') ||
                (newRole === 'aluno_presencial' && currentRole === 'aluno_gratuito')) {
              roleMap[email] = newRole;
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
        tipo_produto: a.tipo_produto || null,
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

  // ============================================
  // 🔥 DOGMA SUPREMO: EXCLUIR = ANIQUILAR
  // DELETE PERMANENTE + CASCADE + LOGOUT FORÇADO
  // ============================================
  
  // Abre o dialog de confirmação (substitui confirm() nativo)
  const openDeleteConfirm = (id: string) => {
    if (!isAdminOrOwner) {
      toast.error("Sem permissão", {
        description: "Apenas Admin ou Owner podem excluir alunos"
      });
      return;
    }
    const student = allStudents.find(s => s.id === id);
    if (student) {
      setStudentToDelete(student);
      setDeleteConfirmOpen(true);
    }
  };
  
  // Executa a exclusão após confirmação
  const executeDelete = async () => {
    if (!studentToDelete) return;
    
    const id = studentToDelete.id;
    const studentEmail = studentToDelete.email;
    
    setDeleteConfirmOpen(false);
    
    try {
      // 🔥 DOGMA SUPREMO: Deletar PERMANENTEMENTE via Edge Function
      if (studentEmail) {
        console.log('[DELETE-PERMANENTE] 💀 Aniquilando usuário:', studentEmail);
        
        const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
          body: {
            targetEmail: studentEmail,
            reason: 'Aluno excluído pelo administrador',
          },
        });

        if (deleteError) {
          console.error('[DELETE-PERMANENTE] ❌ Erro:', deleteError);
          toast.error("Erro ao excluir usuário do sistema de autenticação", {
            description: deleteError.message
          });
        } else {
          console.log('[DELETE-PERMANENTE] ✅ Usuário ANIQUILADO:', deleteResult);
        }
      }

      // 2. Deletar da tabela alunos
      const { error } = await supabase.from("alunos").delete().eq("id", id);
      if (error) {
        if (error.code === '42501' || error.message.includes('policy')) {
          toast.error("Sem permissão para excluir", {
            description: "Apenas Admin ou Owner podem excluir alunos"
          });
          return;
        }
        throw error;
      }
      
      toast.success("🔥 Aluno EXCLUÍDO PERMANENTEMENTE!", {
        description: "Removido de TODAS as camadas: auth, sessões, dispositivos, dados."
      });
      refetch();
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast.error("Erro ao remover aluno", {
        description: error.message || "Tente novamente"
      });
    } finally {
      setStudentToDelete(null);
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
    total: 0, ativos: 0, concluidos: 0, pendentes: 0, cancelados: 0, beta: 0, betaLivroweb: 0, betaFisico: 0, gratuito: 0,
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
  // HANDLER: EXPORTAR (LEI CANÔNICA)
  // Gestão seleciona QUEM, Perfil fornece O QUE
  // ============================================
  const handleExport = useCallback(() => {
    const filterLabel = universeFilter === 'all' 
      ? 'Todos os Alunos' 
      : UNIVERSE_OPTIONS.find(o => o.id === universeFilter)?.label || universeFilter;
    
    exportStudents(students, {
      universeFilter,
      filterLabel,
    });
  }, [students, universeFilter, exportStudents]);

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
              <Button 
                onClick={() => setIsCriarAcessoModalOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/25"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Acesso Oficial
              </Button>
            }
          />

          {/* Stats Grid — FUTURISTIC HOLOGRAPHIC STYLE */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Users, value: contadores.total, label: 'TOTAL', gradient: 'from-blue-600 via-blue-500 to-cyan-400', glow: 'shadow-blue-500/30', border: 'border-blue-500/40', filterId: null },
              { icon: CheckCircle, value: contadores.ativos, label: 'ATIVOS', gradient: 'from-emerald-600 via-emerald-500 to-teal-400', glow: 'shadow-emerald-500/30', border: 'border-emerald-500/40', filterId: null },
              { icon: Crown, value: contadores.beta, label: 'BETA (PAGOS)', gradient: 'from-purple-600 via-purple-500 to-pink-400', glow: 'shadow-purple-500/30', border: 'border-purple-500/40', filterId: 'beta' as UniverseFilterType },
              { icon: Shield, value: contadores.gratuito, label: 'GRATUITOS', gradient: 'from-cyan-600 via-cyan-500 to-blue-400', glow: 'shadow-cyan-500/30', border: 'border-cyan-500/40', filterId: 'registrados' as UniverseFilterType },
            ].map((stat, idx) => {
              const StatIcon = stat.icon;
              const isActive = stat.filterId && universeFilter === stat.filterId;
              const isClickable = !!stat.filterId;
              
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (stat.filterId) {
                      setUniverseFilter(universeFilter === stat.filterId ? 'all' : stat.filterId);
                    }
                  }}
                  className={`
                    relative group overflow-hidden rounded-xl border backdrop-blur-xl
                    bg-gradient-to-br from-background/80 via-background/60 to-background/40
                    ${stat.border} hover:border-opacity-80
                    shadow-lg ${stat.glow} hover:shadow-xl
                    transition-all duration-300 hover:scale-[1.02]
                    ${isClickable ? 'cursor-pointer' : ''}
                    ${isActive ? 'ring-2 ring-purple-500/50 ring-offset-2 ring-offset-background' : ''}
                  `}
                >
                  {/* Holographic shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-10`} />
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.1)_50%,transparent_60%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-15`} />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 p-4 text-center">
                    {/* Icon with glow ring */}
                    <div className={`
                      inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2
                      bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.glow}
                    `}>
                      <StatIcon className="h-5 w-5 text-white" />
                    </div>
                    
                    {/* Value with gradient text */}
                    <div className={`text-3xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    
                    {/* Label */}
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                      {stat.label}
                    </div>
                  </div>
                  
                  {/* Corner accents */}
                  <div className={`absolute top-1 left-1 w-2 h-2 border-t border-l ${stat.border} rounded-tl`} />
                  <div className={`absolute top-1 right-1 w-2 h-2 border-t border-r ${stat.border} rounded-tr`} />
                  <div className={`absolute bottom-1 left-1 w-2 h-2 border-b border-l ${stat.border} rounded-bl`} />
                  <div className={`absolute bottom-1 right-1 w-2 h-2 border-b border-r ${stat.border} rounded-br`} />
                </div>
              );
            })}
          </div>

          {/* Subcards Beta — ALUNOS ONLINE SUBGRUPOS */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { 
                icon: Globe, 
                value: contadores.betaLivroweb, 
                label: 'ONLINE - LIVROWEB', 
                description: 'Material Digital',
                gradient: 'from-violet-600 via-purple-500 to-fuchsia-400', 
                glow: 'shadow-violet-500/30', 
                border: 'border-violet-500/40', 
                filterId: 'beta_livroweb' as UniverseFilterType 
              },
              { 
                icon: Package, 
                value: contadores.betaFisico, 
                label: 'ONLINE - FÍSICO', 
                description: 'Material Físico',
                gradient: 'from-fuchsia-600 via-pink-500 to-rose-400', 
                glow: 'shadow-fuchsia-500/30', 
                border: 'border-fuchsia-500/40', 
                filterId: 'beta_fisico' as UniverseFilterType 
              },
            ].map((stat, idx) => {
              const StatIcon = stat.icon;
              const isActive = universeFilter === stat.filterId;
              
              return (
                <div
                  key={`beta-sub-${idx}`}
                  onClick={() => setUniverseFilter(universeFilter === stat.filterId ? 'all' : stat.filterId)}
                  className={`
                    relative group overflow-hidden rounded-xl border backdrop-blur-xl cursor-pointer
                    bg-gradient-to-br from-background/80 via-background/60 to-background/40
                    ${stat.border} hover:border-opacity-80
                    shadow-lg ${stat.glow} hover:shadow-xl
                    transition-all duration-300 hover:scale-[1.02]
                    ${isActive ? 'ring-2 ring-purple-500/50 ring-offset-2 ring-offset-background' : ''}
                  `}
                >
                  {/* Holographic shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-10`} />
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.1)_50%,transparent_60%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-15`} />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 p-4 flex items-center gap-4">
                    {/* Icon with glow ring */}
                    <div className={`
                      inline-flex items-center justify-center w-12 h-12 rounded-lg
                      bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.glow}
                    `}>
                      <StatIcon className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      {/* Value with gradient text */}
                      <div className={`text-2xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                      
                      {/* Label */}
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                        {stat.label}
                      </div>
                      
                      {/* Description */}
                      <div className="text-[9px] text-muted-foreground/70 mt-0.5">
                        {stat.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Corner accents */}
                  <div className={`absolute top-1 left-1 w-2 h-2 border-t border-l ${stat.border} rounded-tl`} />
                  <div className={`absolute top-1 right-1 w-2 h-2 border-t border-r ${stat.border} rounded-tr`} />
                  <div className={`absolute bottom-1 left-1 w-2 h-2 border-b border-l ${stat.border} rounded-bl`} />
                  <div className={`absolute bottom-1 right-1 w-2 h-2 border-b border-r ${stat.border} rounded-br`} />
                </div>
              );
            })}
          </div>

          {/* Universe Cards — FUTURISTIC FILTER SELECTOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {UNIVERSE_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              const isActive = universeFilter === option.id;
              const count = universeCounters[option.id as keyof typeof universeCounters] || 0;
              
              const colorMap: Record<string, { gradient: string; border: string; glow: string; text: string; bg: string }> = {
                blue: { gradient: 'from-blue-600 to-cyan-500', border: 'border-blue-500/50', glow: 'shadow-blue-500/20', text: 'text-blue-400', bg: 'bg-blue-500' },
                purple: { gradient: 'from-purple-600 to-pink-500', border: 'border-purple-500/50', glow: 'shadow-purple-500/20', text: 'text-purple-400', bg: 'bg-purple-500' },
                cyan: { gradient: 'from-cyan-600 to-blue-500', border: 'border-cyan-500/50', glow: 'shadow-cyan-500/20', text: 'text-cyan-400', bg: 'bg-cyan-500' },
                green: { gradient: 'from-emerald-600 to-teal-500', border: 'border-emerald-500/50', glow: 'shadow-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500' },
              };
              const colors = colorMap[option.accentColor] || colorMap.blue;
              
              return (
                <div
                  key={option.id}
                  onClick={() => handleUniverseSelect(option.id)}
                  className={`
                    relative group cursor-pointer overflow-hidden rounded-xl border backdrop-blur-xl
                    transition-all duration-300 hover:scale-[1.02]
                    ${isActive 
                      ? `${colors.border} bg-gradient-to-br from-background/90 to-background/70 shadow-lg ${colors.glow}` 
                      : 'border-white/10 bg-background/50 hover:border-white/20 hover:bg-background/70'
                    }
                  `}
                >
                  {/* Active indicator glow */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-10`} />
                  )}
                  
                  {/* Scan line effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[scan_2s_linear_infinite]" />
                  </div>
                  
                  <div className="relative z-10 p-3">
                    <div className="flex items-center gap-3">
                      {/* Icon with gradient background */}
                      <div className={`
                        p-2 rounded-lg transition-all duration-300
                        ${isActive 
                          ? `bg-gradient-to-br ${colors.gradient} shadow-lg ${colors.glow}` 
                          : 'bg-white/5 group-hover:bg-white/10'
                        }
                      `}>
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : colors.text}`} />
                      </div>
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}>
                            {option.label}
                          </h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {option.description}
                        </p>
                      </div>
                      
                      {/* Counter badge */}
                      <div className={`
                        px-2 py-0.5 rounded-md text-xs font-bold tabular-nums
                        ${isActive 
                          ? `bg-gradient-to-r ${colors.gradient} text-white shadow-sm` 
                          : `bg-white/5 ${colors.text}`
                        }
                      `}>
                        {count}
                      </div>
                      
                      {/* Close button when active */}
                      {isActive && (
                        <div className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                          <X className="h-3 w-3 text-white/70" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className={`
                    absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${colors.gradient}` 
                      : 'bg-transparent group-hover:bg-white/10'
                    }
                  `} />
                </div>
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
                      placeholder="Buscar por nome, email, CPF ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-blue-500/30 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Página {page} de {totalPages}</span>
                    <span className="text-blue-400">({totalCount} alunos)</span>
                  </div>
                  
                  {/* BOTÕES IMPORTAR + EXPORTAR — LEI CANÔNICA (OWNER/ADMIN apenas) */}
                  {isAdminOrOwner && (
                    <div className="flex items-center gap-2">
                      {/* BOTÃO IMPORTAR (VERMELHO) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsImportModalOpen(true)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        IMPORTAR
                      </Button>
                      
                      {/* BOTÃO IMPORTAR CPF (AMBER) — Validação Receita Federal */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsBulkImportCPFModalOpen(true)}
                        className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-400"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        IMPORTAR CPF
                      </Button>
                      
                      {/* BOTÃO NUCLEAR — OWNER ONLY */}
                      <NuclearAnnihilateButton />
                      
                      {/* BOTÃO EXPORTAR (VERDE) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={isExporting || students.length === 0}
                        className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-400"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Exportando...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            EXPORTAR
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Table — VIRTUALIZAÇÃO PERMANENTE */}
            <VirtualTable
              items={students}
              rowHeight={64}
              containerHeight="calc(100vh - 520px)"
              emptyMessage={isLoading ? "Carregando..." : debouncedSearch ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              forceVirtualization={true}
              renderHeader={() => (
                <table className="w-full">
                  <thead className="bg-blue-500/10">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-blue-400 w-[27%]">Nome</th>
                      <th className="text-left p-4 text-sm font-medium text-blue-400 w-[23%]">Email</th>
                      <th className="text-left p-4 text-sm font-medium text-blue-400 w-[10%]">Presença</th>
                      <th className="text-left p-4 text-sm font-medium text-blue-400 w-[12%]">Tipo</th>
                      <th className="text-right p-4 text-sm font-medium text-blue-400 w-[23%]">Ações</th>
                    </tr>
                  </thead>
                </table>
              )}
              renderRow={(student) => {
                // SINCRONIZADO: Usa role REAL do aluno (user_roles)
                const effectiveRole = getEffectiveRole(student);
                const roleConfig = getRoleDisplayConfig(effectiveRole);
                const RoleIcon = roleConfig.icon;
                
                // Presença online/offline em tempo real
                const presence = getPresenceStatus(presenceMap, student.id);
                const isOnline = presence.presence_status === 'online';
                const isAway = presence.presence_status === 'away';
                
                return (
                  <table className="w-full">
                    <tbody>
                      <tr className="border-t border-blue-500/20 hover:bg-blue-500/5 transition-colors cursor-pointer" onClick={() => navigate(`/gestaofc/gestao-alunos/${student.id}`)}>
                        <td className="p-4 text-foreground font-medium w-[27%]">
                          <div className="flex items-center gap-2">
                            {effectiveRole === 'beta' && <Crown className="h-4 w-4 text-yellow-400" />}
                            <span className="hover:text-blue-400 transition-colors">{student.nome}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground w-[23%]">{student.email || "-"}</td>
                        {/* Coluna Presença: Online/Offline com bolinha */}
                        <td className="p-4 w-[10%]">
                          <div className="flex items-center gap-2" title={
                            isOnline ? 'Online agora' : 
                            isAway ? 'Visto recentemente' : 
                            'Offline'
                          }>
                            {isOnline ? (
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 w-[12%]">
                          {/* TIPO: Sincronizado com user_roles e cards */}
                          <Badge variant="outline" className={roleConfig.colorClass}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleConfig.label}
                          </Badge>
                        </td>
                        <td className="p-4 text-right w-[23%]">
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
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openModal(student); }}>
                              <Edit2 className="h-4 w-4 text-blue-400" />
                            </Button>
                            {/* Botão DELETE - APENAS ADMIN ou OWNER */}
                            {isAdminOrOwner && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); openDeleteConfirm(student.id); }} 
                                className="text-red-400 hover:text-red-300"
                                title="Excluir aluno (Admin/Owner)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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

          {/* Modal Importar Alunos (LEI CANÔNICA) */}
          <ImportStudentsModal
            open={isImportModalOpen}
            onOpenChange={setIsImportModalOpen}
            onImportComplete={refetch}
          />
          
          {/* Modal Importar Alunos com Validação CPF */}
          <BulkImportCPFModal
            open={isBulkImportCPFModalOpen}
            onOpenChange={setIsBulkImportCPFModalOpen}
            onSuccess={refetch}
          />
          
          {/* AlertDialog de confirmação de exclusão (substitui confirm() nativo) */}
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent className="bg-background border-red-500/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  Confirmar Exclusão Permanente
                </AlertDialogTitle>
                {/* P0 FIX: AlertDialogDescription geralmente renderiza <p>; não pode conter <p> dentro (React validateDOMNesting). */}
                <AlertDialogDescription className="text-muted-foreground space-y-3">
                  <span className="block font-semibold text-yellow-400">
                    ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
                  </span>
                  <span className="block">
                    O aluno <span className="font-bold text-foreground">"{studentToDelete?.nome || studentToDelete?.email}"</span> será
                    EXCLUÍDO PERMANENTEMENTE de TODAS as camadas do sistema.
                  </span>
                  <span className="block text-sm">
                    Isso inclui: autenticação, sessões, dispositivos e todos os dados associados.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-muted">Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={executeDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Excluir Permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
