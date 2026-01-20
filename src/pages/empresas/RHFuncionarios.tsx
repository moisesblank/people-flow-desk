// ============================================
// MOISÉS MEDEIROS v15.0 - CENTRAL DE RH EMPRESARIAL
// Sistema Completo de RH: Funcionários + Folha + Cargos + Relatórios
// Tudo unificado em um único lugar - Estilo Multinacional
// ============================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCSVExportWorker } from "@/hooks/useWebWorker";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users,
  UserPlus,
  AlertCircle,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Search,
  MoreVertical,
  Lock,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  XCircle,
  UserCheck,
  Activity,
  PieChart,
  Download,
  Mail,
  Phone,
  Award,
  Plane,
  Heart,
  GraduationCap,
  Landmark,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart as RechartPieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip } from "recharts";
import { EmployeeModal } from "@/components/empresas/rh/EmployeeModal";

// ═══════════════════════════════════════════════════════════════
// TIPOS E CONSTANTES
// ═══════════════════════════════════════════════════════════════

// 🎯 CONSTITUIÇÃO ROLES v1.0.0 - Nomenclatura Definitiva
// "employee" e "funcionario" são CATEGORIAS, não roles
// Cada funcionário recebe UMA role específica de permissão
export type StaffRole = 
  | "owner"        // Nível 0 - Proprietário (TOTAL)
  | "admin"        // Nível 1 - Administrador (quase total)
  | "coordenacao"  // Nível 2 - Coordenação
  | "contabilidade"// Nível 2 - Contabilidade  
  | "suporte"      // Nível 3 - Suporte
  | "monitoria"    // Nível 3 - Monitoria
  | "marketing"    // Nível 3 - Marketing
  | "afiliado";    // Nível 3 - Afiliados

// Opções de nível de acesso para o formulário
const STAFF_ROLE_OPTIONS: { value: StaffRole; label: string; description: string; level: number }[] = [
  { value: "admin", label: "Administrador", description: "Acesso quase total (sem god_mode)", level: 1 },
  { value: "coordenacao", label: "Coordenação", description: "Alunos, cursos, relatórios", level: 2 },
  { value: "contabilidade", label: "Contabilidade", description: "Financeiro completo", level: 2 },
  { value: "suporte", label: "Suporte", description: "Atendimento a alunos", level: 3 },
  { value: "monitoria", label: "Monitoria", description: "Acompanhamento pedagógico", level: 3 },
  { value: "marketing", label: "Marketing", description: "Campanhas e analytics", level: 3 },
  { value: "afiliado", label: "Afiliados", description: "Gestão de afiliações", level: 3 },
];

interface Employee {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  funcao: string;
  setor: string;
  status: string;
  data_admissao: string | null;
  horario_trabalho: string | null;
  salario?: number | null;
  foto_url?: string | null;
  created_by?: string | null;
  user_id?: string | null;  // ID do usuário vinculado (acesso ao sistema)
}

interface Compensation {
  employee_id: number;
  salario: number;
  bonus?: number;
  beneficios?: number;
}

const SETORES = [
  { id: "todos", label: "Todos", color: "bg-muted", icon: Users },
  { id: "Coordenação", label: "Coordenação", color: "bg-purple-500", icon: Award },
  { id: "Suporte", label: "Suporte", color: "bg-blue-500", icon: Heart },
  { id: "Monitoria", label: "Monitoria", color: "bg-green-500", icon: GraduationCap },
  { id: "Afiliados", label: "Afiliados", color: "bg-orange-500", icon: Landmark },
  { id: "Marketing", label: "Marketing", color: "bg-pink-500", icon: TrendingUp },
  { id: "Administrativo", label: "Administrativo", color: "bg-cyan-500", icon: Briefcase },
];

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo", color: "bg-green-500/20 text-green-500", icon: CheckCircle2 },
  { value: "ferias", label: "Férias", color: "bg-blue-500/20 text-blue-500", icon: Plane },
  { value: "afastado", label: "Afastado", color: "bg-yellow-500/20 text-yellow-500", icon: AlertTriangle },
  { value: "inativo", label: "Inativo", color: "bg-red-500/20 text-red-500", icon: XCircle },
];

const CHART_COLORS = ['#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#F97316'];

type ViewMode = "dashboard" | "lista" | "folha" | "cargos" | "relatorios";

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES UTILITÁRIAS
// ═══════════════════════════════════════════════════════════════
// Formatação centralizada - import de @/utils
import { formatCurrencyMasked as formatCurrency } from "@/utils";
// ═══════════════════════════════════════════════════════════════

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getStatusInfo(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
}

function getSetorInfo(setor: string) {
  return SETORES.find(s => s.id === setor) || SETORES[0];
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function RHFuncionarios() {
  const { user } = useAuth();
  
  // Estados principais
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [compensations, setCompensations] = useState<Compensation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [setorFiltro, setSetorFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [sortBy, setSortBy] = useState<"nome" | "salario" | "admissao">("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    funcao: "", // Cargo/descrição humana (ex: "Desenvolvedor Sênior")
    nivel_acesso: "suporte" as StaffRole, // Role de permissão (nova)
    setor: "Administrativo",
    status: "ativo",
    data_admissao: format(new Date(), "yyyy-MM-dd"),
    salario: "",
    horario_trabalho: "08:00 - 17:00",
    senha: "",
  });

  // ═══════════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════════

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Buscar funcionários
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .order("nome");

      if (empError) throw empError;

      // Buscar compensações
      const { data: compData, error: compError } = await supabase
        .from("employee_compensation")
        .select("*");

      if (compError) {
        console.warn("Erro ao buscar compensações:", compError);
      }

      // Mapear salários para funcionários
      const employeesWithSalary = (empData || []).map(emp => ({
        ...emp,
        salario: compData?.find(c => c.employee_id === emp.id)?.salario || null
      }));

      setEmployees(employeesWithSalary);
      setCompensations(compData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar funcionários");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ═══════════════════════════════════════════════════════════════
  // FILTROS E ORDENAÇÃO
  // ═══════════════════════════════════════════════════════════════

  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.nome?.toLowerCase().includes(term) ||
        e.email?.toLowerCase().includes(term) ||
        e.funcao?.toLowerCase().includes(term)
      );
    }

    // Filtro por setor
    if (setorFiltro !== "todos") {
      result = result.filter(e => e.setor === setorFiltro);
    }

    // Filtro por status
    if (statusFiltro !== "todos") {
      result = result.filter(e => e.status === statusFiltro);
    }

    // Ordenação
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "nome") {
        comparison = (a.nome || "").localeCompare(b.nome || "");
      } else if (sortBy === "salario") {
        comparison = (a.salario || 0) - (b.salario || 0);
      } else if (sortBy === "admissao") {
        comparison = (a.data_admissao || "").localeCompare(b.data_admissao || "");
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [employees, searchTerm, setorFiltro, statusFiltro, sortBy, sortOrder]);

  // ═══════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════

  const stats = useMemo(() => {
    const total = employees.length;
    const ativos = employees.filter(e => e.status === "ativo").length;
    const ferias = employees.filter(e => e.status === "ferias").length;
    const afastados = employees.filter(e => e.status === "afastado").length;
    const inativos = employees.filter(e => e.status === "inativo").length;

    const folhaTotal = employees.reduce((sum, e) => sum + (e.salario || 0), 0);
    const salarioMedio = total > 0 ? Math.round(folhaTotal / total) : 0;
    const maiorSalario = Math.max(...employees.map(e => e.salario || 0), 0);
    const menorSalario = Math.min(...employees.filter(e => e.salario).map(e => e.salario || 0), 0);

    // Por setor
    const porSetor: Record<string, number> = {};
    employees.forEach(e => {
      porSetor[e.setor] = (porSetor[e.setor] || 0) + 1;
    });

    // Por função
    const porFuncao: Record<string, number> = {};
    employees.forEach(e => {
      porFuncao[e.funcao] = (porFuncao[e.funcao] || 0) + 1;
    });

    return {
      total,
      ativos,
      ferias,
      afastados,
      inativos,
      folhaTotal,
      salarioMedio,
      maiorSalario,
      menorSalario,
      porSetor,
      porFuncao,
      taxaAtivos: total > 0 ? Math.round((ativos / total) * 100) : 0,
    };
  }, [employees]);

  // ═══════════════════════════════════════════════════════════════
  // DADOS PARA GRÁFICOS
  // ═══════════════════════════════════════════════════════════════

  const chartData = useMemo(() => {
    // Por setor
    const setorData = Object.entries(stats.porSetor)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Por status
    const statusData = [
      { name: "Ativos", value: stats.ativos, color: "#10B981" },
      { name: "Férias", value: stats.ferias, color: "#3B82F6" },
      { name: "Afastados", value: stats.afastados, color: "#F59E0B" },
      { name: "Inativos", value: stats.inativos, color: "#EF4444" },
    ].filter(d => d.value > 0);

    // Distribuição salarial
    const salaryRanges = [
      { range: "< R$2k", min: 0, max: 200000 },
      { range: "R$2k-4k", min: 200000, max: 400000 },
      { range: "R$4k-6k", min: 400000, max: 600000 },
      { range: "R$6k-8k", min: 600000, max: 800000 },
      { range: "> R$8k", min: 800000, max: Infinity },
    ];
    const salaryData = salaryRanges.map(({ range, min, max }) => ({
      range,
      count: employees.filter(e => (e.salario || 0) >= min && (e.salario || 0) < max).length
    }));

    return { setorData, statusData, salaryData };
  }, [stats, employees]);

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        nome: employee.nome || "",
        email: employee.email || "",
        telefone: employee.telefone || "",
        funcao: employee.funcao || "",
        nivel_acesso: "suporte" as StaffRole, // Default para edição
        setor: employee.setor || "Administrativo",
        status: employee.status || "ativo",
        data_admissao: employee.data_admissao || format(new Date(), "yyyy-MM-dd"),
        salario: employee.salario ? String(employee.salario / 100) : "",
        horario_trabalho: employee.horario_trabalho || "08:00 - 17:00",
        senha: "",
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        funcao: "",
        nivel_acesso: "suporte" as StaffRole,
        setor: "Administrativo",
        status: "ativo",
        data_admissao: format(new Date(), "yyyy-MM-dd"),
        salario: "",
        horario_trabalho: "08:00 - 17:00",
        senha: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Preencha o nome do funcionário");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Preencha o email do funcionário");
      return;
    }

    setIsSaving(true);
    const salarioCentavos = formData.salario ? Math.round(parseFloat(formData.salario.replace(",", ".")) * 100) : null;

    try {
      if (editingEmployee) {
        // Atualizar funcionário existente
        const { error } = await supabase
          .from("employees")
          .update({
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone || null,
            funcao: formData.funcao,
            setor: formData.setor as any,
            status: formData.status as any,
            data_admissao: formData.data_admissao || null,
            horario_trabalho: formData.horario_trabalho || null,
          })
          .eq("id", editingEmployee.id);

        if (error) throw error;

        // Atualizar/inserir salário
        if (salarioCentavos !== null) {
          const { error: compError } = await supabase
            .from("employee_compensation")
            .upsert({
              employee_id: editingEmployee.id,
              salario: salarioCentavos,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'employee_id' });

          if (compError) {
            console.warn("Erro ao atualizar salário:", compError);
          }
        }

        toast.success("Funcionário atualizado!", {
          description: `${formData.nome} foi atualizado com sucesso.`,
        });
      } else {
        // Criar novo funcionário
        const { data: newEmp, error } = await supabase
          .from("employees")
          .insert({
            nome: formData.nome,
            funcao: formData.funcao,
            email: formData.email,
            telefone: formData.telefone || null,
            setor: formData.setor as any,
            status: formData.status as any,
            data_admissao: formData.data_admissao || null,
            horario_trabalho: formData.horario_trabalho || null,
            created_by: user?.id,
          })
          .select("id")
          .single();

        if (error) throw error;

        // Inserir salário
        if (newEmp && salarioCentavos !== null) {
          const { error: compError } = await supabase
            .from("employee_compensation")
            .insert({
              employee_id: newEmp.id,
              salario: salarioCentavos,
            });

          if (compError) {
            console.warn("Erro ao inserir salário:", compError);
          }
        }

        // 🎯 SIMPLIFICADO: Criar funcionário = Enviar convite automaticamente
        if (newEmp) {
          await handleSendInvite(newEmp.id);
        }

        toast.success("Funcionário cadastrado!", {
          description: `${formData.nome} foi adicionado e receberá acesso ao sistema.`,
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar funcionário", {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // 🔥 DOGMA SUPREMO: EXCLUIR = ANIQUILAR
  // DELETE PERMANENTE + CASCADE + LOGOUT FORÇADO
  // ============================================
  const handleDelete = async () => {
    if (!deleteDialogOpen) return;

    // Confirmação extra para exclusão PERMANENTE
    if (!confirm(`⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nO funcionário "${deleteDialogOpen.nome}" será EXCLUÍDO PERMANENTEMENTE de TODAS as camadas do sistema.\n\nDeseja continuar?`)) {
      setDeleteDialogOpen(null);
      return;
    }

    setIsSaving(true);
    try {
      // 🔥 DOGMA SUPREMO: Deletar PERMANENTEMENTE via Edge Function
      if (deleteDialogOpen.email) {
        console.log('[DELETE-PERMANENTE] 💀 Aniquilando funcionário:', deleteDialogOpen.email);
        
        const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
          body: {
            targetEmail: deleteDialogOpen.email,
            reason: 'Funcionário excluído pelo administrador (RH)',
          },
        });

        if (deleteError) {
          console.error('[DELETE-PERMANENTE] ❌ Erro:', deleteError);
          // Continua com delete da tabela employees mesmo se auth falhar
        } else {
          console.log('[DELETE-PERMANENTE] ✅ Auth user ANIQUILADO:', deleteResult);
        }
      }

      // FK CASCADE cuida de employee_compensation, employee_documents, etc.
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", deleteDialogOpen.id);

      if (error) {
        console.error("[RH] Erro detalhado ao excluir:", error);
        throw error;
      }

      toast.success("🔥 Funcionário EXCLUÍDO PERMANENTEMENTE!", {
        description: `${deleteDialogOpen.nome} foi removido de TODAS as camadas.`,
      });

      setDeleteDialogOpen(null);
      fetchData();
    } catch (error: any) {
      console.error("[RH] Erro ao excluir funcionário:", error);
      toast.error("Erro ao excluir funcionário", {
        description: error?.message || error?.details || "Tente novamente",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvite = async (employeeId?: number) => {
    const email = formData.email?.trim();
    const nome = formData.nome?.trim();
    
    if (!email) {
      toast.error("Preencha o email do funcionário");
      return false;
    }

    try {
      // Senha forte gerada automaticamente se não fornecida (mín 8 + min/maiúscula/número/especial)
      const generateStrongPassword = () => {
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const digits = "0123456789";
        const special = "!@#$%^&*()_+-=[]{};':\"\\|<>?,./`~";
        const all = lower + upper + digits + special;

        const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
        const result = [pick(lower), pick(upper), pick(digits), pick(special)];
        // completa até 12 chars
        while (result.length < 12) result.push(pick(all));
        // shuffle simples
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result.join("");
      };

      const senhaGerada = formData.senha?.trim() || generateStrongPassword();
      
      console.log("[RH] Enviando convite:", { email, nome, employee_id: employeeId, role: formData.nivel_acesso });
      
      const { data, error } = await supabase.functions.invoke("invite-employee", {
        body: {
          email,
          nome,
          senha: senhaGerada,
          funcao: formData.funcao,
          role: formData.nivel_acesso, // 🎯 NOVA: Role específica de permissão
          employee_id: employeeId || editingEmployee?.id || undefined,
        },
      });

      if (error) {
        console.error("[RH] Erro no invoke:", error);
        throw error;
      }
      
      if (data?.error) {
        console.error("[RH] Erro retornado:", data.error);
        throw new Error(data.error);
      }

      console.log("[RH] Convite enviado com sucesso:", data);
      toast.success("Convite enviado!", {
        description: `Acesso criado para ${email}`,
      });
      
      // Refresh para mostrar user_id vinculado
      await fetchData();
      
      return true;
    } catch (error: any) {
      console.error("[RH] Erro ao enviar convite:", error);
      toast.error("Erro ao criar acesso", {
        description: error.message,
      });
      return false;
    }
  };

  // 🏛️ LEI I - Web Worker para CSV (UI fluida)
  const { exportToCSV: workerExportCSV, isProcessing: isExportingCSV } = useCSVExportWorker();

  const handleExport = useCallback(async () => {
    const headers = ["Nome", "Email", "Telefone", "Função", "Setor", "Status", "Data Admissão", "Salário"];
    const rows = filteredEmployees.map(e => [
      e.nome,
      e.email,
      e.telefone || "",
      e.funcao,
      e.setor,
      e.status,
      e.data_admissao || "",
      e.salario ? (e.salario / 100).toFixed(2) : "",
    ]);

    // 🏛️ LEI I - Processamento off-thread (UI nunca congela)
    await workerExportCSV(`funcionarios_${format(new Date(), "yyyy-MM-dd")}`, headers, rows);

    toast.success("Exportado!", { description: "Arquivo CSV gerado com sucesso." });
  }, [filteredEmployees, workerExportCSV]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER: CARDS DE KPI
  // ═══════════════════════════════════════════════════════════════

  const renderKPICards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Funcionários */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Funcionários</CardTitle>
            <div className="p-2 rounded-lg bg-primary/20">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <UserCheck className="h-3 w-3 mr-1" />
                {stats.ativos} ativos
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Folha Mensal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative overflow-hidden border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Folha Mensal</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-3xl font-bold text-green-500">{formatCurrency(stats.folhaTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {formatCurrency(stats.salarioMedio)}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* De Férias */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">De Férias</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Plane className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-3xl font-bold text-blue-500">{stats.ferias}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.afastados} afastados
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Taxa de Atividade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Atividade</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-3xl font-bold text-purple-500">{stats.taxaAtivos}%</p>
            <Progress value={stats.taxaAtivos} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER: GRÁFICOS
  // ═══════════════════════════════════════════════════════════════

  const renderCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Por Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Funcionários por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPieChart>
                <Pie
                  data={chartData.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </RechartPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Por Setor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Funcionários por Setor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.setorData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#EC4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição Salarial */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Distribuição Salarial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.salaryData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER: LISTA DE FUNCIONÁRIOS
  // ═══════════════════════════════════════════════════════════════

  const renderEmployeeList = () => (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou função..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Filtro por Setor */}
          <Select value={setorFiltro} onValueChange={setSetorFiltro}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              {SETORES.map((setor) => (
                <SelectItem key={setor.id} value={setor.id}>
                  <div className="flex items-center gap-2">
                    <setor.icon className="h-4 w-4" />
                    {setor.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por Status */}
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <status.icon className="h-4 w-4" />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ordenação */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setSortBy("nome"); setSortOrder("asc"); }}>
                Nome (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("nome"); setSortOrder("desc"); }}>
                Nome (Z-A)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortBy("salario"); setSortOrder("desc"); }}>
                Maior Salário
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("salario"); setSortOrder("asc"); }}>
                Menor Salário
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortBy("admissao"); setSortOrder("desc"); }}>
                Mais Recentes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("admissao"); setSortOrder("asc"); }}>
                Mais Antigos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredEmployees.length === employees.length
            ? `${employees.length} funcionário${employees.length !== 1 ? "s" : ""}`
            : `${filteredEmployees.length} de ${employees.length} funcionário${employees.length !== 1 ? "s" : ""}`
          }
        </p>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/2 bg-muted rounded" />
                    <div className="h-3 w-1/3 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum funcionário encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || setorFiltro !== "todos" || statusFiltro !== "todos"
                ? "Tente ajustar os filtros de busca"
                : "Adicione o primeiro funcionário da equipe"
              }
            </p>
            <Button onClick={() => openModal()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredEmployees.map((employee, index) => {
              const statusInfo = getStatusInfo(employee.status);
              const setorInfo = getSetorInfo(employee.setor);
              
              return (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          {employee.foto_url ? (
                            <AvatarImage src={employee.foto_url} alt={employee.nome} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-semibold text-lg">
                            {getInitials(employee.nome)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-foreground truncate">
                              {employee.nome}
                            </h3>
                            <Badge className={cn("text-xs", statusInfo.color)}>
                              <statusInfo.icon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate">
                            {employee.funcao}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className={cn("text-xs", setorInfo.color.replace('bg-', 'border-'))}>
                              <setorInfo.icon className="h-3 w-3 mr-1" />
                              {employee.setor}
                            </Badge>
                            {employee.salario && (
                              <Badge variant="secondary" className="text-xs text-green-500">
                                {formatCurrency(employee.salario)}
                              </Badge>
                            )}
                            {/* Indicador de acesso vinculado */}
                            {employee.user_id ? (
                              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500 border-green-500/30">
                                <Lock className="h-3 w-3 mr-1" />
                                Com Acesso
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Sem Acesso
                              </Badge>
                            )}
                          </div>

                          {employee.data_admissao && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Desde {format(parseISO(employee.data_admissao), "dd/MM/yyyy")}
                              {" "}({differenceInYears(new Date(), parseISO(employee.data_admissao))} anos)
                            </p>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {employee.email && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => window.open(`mailto:${employee.email}`)}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Enviar Email</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {employee.telefone && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => window.open(`https://wa.me/55${employee.telefone?.replace(/\D/g, '')}`)}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>WhatsApp</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openModal(employee)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`mailto:${employee.email}`)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar Email
                              </DropdownMenuItem>
                              {/* Opção de criar/reenviar acesso */}
                              {!employee.user_id && employee.email && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={async () => {
                                      setFormData({
                                        ...formData,
                                        email: employee.email,
                                        nome: employee.nome,
                                        funcao: employee.funcao,
                                        senha: "",
                                      });
                                      await handleSendInvite(employee.id);
                                    }}
                                    className="text-green-600"
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Criar Acesso
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteDialogOpen(employee)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER: FOLHA DE PAGAMENTO
  // ═══════════════════════════════════════════════════════════════

  const renderPayroll = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Folha de Pagamento - {format(new Date(), "MMMM yyyy", { locale: ptBR })}</CardTitle>
            <CardDescription>Detalhamento completo da folha mensal</CardDescription>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Salários</p>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.folhaTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Funcionários</p>
              <p className="text-2xl font-bold">{stats.ativos}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Média Salarial</p>
              <p className="text-2xl font-bold text-purple-500">{formatCurrency(stats.salarioMedio)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maior Salário</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.maiorSalario)}</p>
            </div>
          </div>

          {/* Lista */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {employees
                .filter(e => e.status === "ativo" && e.salario)
                .sort((a, b) => (b.salario || 0) - (a.salario || 0))
                .map((employee, index) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(employee.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{employee.nome}</p>
                        <p className="text-xs text-muted-foreground">{employee.funcao}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-500">{formatCurrency(employee.salario)}</p>
                      <p className="text-xs text-muted-foreground">{employee.setor}</p>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Central de Recursos Humanos
                </h1>
                <p className="text-muted-foreground">
                  Funcionários, folha de pagamento, cargos e relatórios em um único lugar
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/25"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Navegação */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="lista" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Funcionários</span>
            </TabsTrigger>
            <TabsTrigger value="folha" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Folha</span>
            </TabsTrigger>
            <TabsTrigger value="cargos" className="gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Cargos</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {renderKPICards()}
            {renderCharts()}
          </TabsContent>

          {/* Lista */}
          <TabsContent value="lista" className="space-y-6">
            {renderKPICards()}
            {renderEmployeeList()}
          </TabsContent>

          {/* Folha */}
          <TabsContent value="folha" className="space-y-6">
            {renderKPICards()}
            {renderPayroll()}
          </TabsContent>

          {/* Cargos */}
          <TabsContent value="cargos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.porFuncao)
                .sort(([, a], [, b]) => b - a)
                .map(([funcao, count], index) => (
                  <motion.div
                    key={funcao}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{funcao}</CardTitle>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {employees
                            .filter(e => e.funcao === funcao)
                            .slice(0, 3)
                            .map(e => (
                              <div key={e.id} className="flex items-center gap-2 text-sm">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(e.nome)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">{e.nome}</span>
                              </div>
                            ))}
                          {count > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{count - 3} mais
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        <EmployeeModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          editingEmployee={editingEmployee}
          formData={formData}
          setFormData={setFormData}
          staffRoleOptions={STAFF_ROLE_OPTIONS}
          setores={SETORES}
          statusOptions={STATUS_OPTIONS}
          isSaving={isSaving}
          onSave={handleSave}
        />

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{deleteDialogOpen?.nome}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
