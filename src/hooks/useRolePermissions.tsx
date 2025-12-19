// ============================================
// MOISÉS MEDEIROS v10.0 - ROLE PERMISSIONS HOOK
// Sistema de Permissões por Cargo Completo
// Cargos: Owner, Coordenação, Suporte, Monitoria, 
//         Afiliados, Marketing, Administrativo, Contabilidade
// ============================================

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Tipos de roles do sistema
export type FullAppRole = 
  | "owner" 
  | "admin" 
  | "employee" 
  | "coordenacao" 
  | "suporte" 
  | "monitoria" 
  | "afiliado" 
  | "marketing" 
  | "contabilidade";

// Áreas do sistema
export type SystemArea = 
  | "dashboard"
  | "dashboard-executivo"
  | "tarefas"
  | "integracoes"
  | "calendario"
  | "funcionarios"
  | "area-professor"
  | "gestao-equipe"
  | "marketing"
  | "lancamento"
  | "metricas"
  | "arquivos"
  | "planejamento-aula"
  | "turmas-online"
  | "turmas-presenciais"
  | "financas-pessoais"
  | "financas-empresa"
  | "entradas"
  | "pagamentos"
  | "contabilidade"
  | "cursos"
  | "simulados"
  | "afiliados"
  | "alunos"
  | "portal-aluno"
  | "gestao-site"
  | "relatorios"
  | "guia"
  | "laboratorio"
  | "site-programador"
  | "pessoal"
  | "vida-pessoal"
  | "permissoes"
  | "configuracoes"
  | "monitoramento"
  | "central-whatsapp"
  | "diagnostico-whatsapp"
  | "auditoria-acessos"
  | "central-monitoramento"
  | "central-ias"
  | "central-metricas"
  | "documentos"
  // NOVAS ÁREAS EMPRESARIAIS
  | "dashboard-empresarial"
  | "rh-funcionarios"
  | "arquivos-empresariais"
  | "fluxo-caixa"
  | "contas-pagar"
  | "contas-receber";

// Mapeamento de URLs para áreas
const URL_TO_AREA: Record<string, SystemArea> = {
  "/": "dashboard",
  "/dashboard-executivo": "dashboard-executivo",
  "/tarefas": "tarefas",
  "/integracoes": "integracoes",
  "/calendario": "calendario",
  "/funcionarios": "funcionarios",
  "/area-professor": "area-professor",
  "/gestao-equipe": "gestao-equipe",
  "/marketing": "marketing",
  "/lancamento": "lancamento",
  "/metricas": "metricas",
  "/arquivos": "arquivos",
  "/planejamento-aula": "planejamento-aula",
  "/turmas-online": "turmas-online",
  "/turmas-presenciais": "turmas-presenciais",
  "/financas-pessoais": "financas-pessoais",
  "/financas-empresa": "financas-empresa",
  "/entradas": "entradas",
  "/pagamentos": "pagamentos",
  "/contabilidade": "contabilidade",
  "/cursos": "cursos",
  "/simulados": "simulados",
  "/afiliados": "afiliados",
  "/alunos": "alunos",
  "/portal-aluno": "portal-aluno",
  "/gestao-site": "gestao-site",
  "/relatorios": "relatorios",
  "/guia": "guia",
  "/laboratorio": "laboratorio",
  "/site-programador": "site-programador",
  "/pessoal": "pessoal",
  "/vida-pessoal": "vida-pessoal",
  "/permissoes": "permissoes",
  "/configuracoes": "configuracoes",
  "/monitoramento": "monitoramento",
  "/central-whatsapp": "central-whatsapp",
  "/diagnostico-whatsapp": "diagnostico-whatsapp",
  "/auditoria-acessos": "auditoria-acessos",
  "/central-monitoramento": "central-monitoramento",
  "/central-ias": "central-ias",
  "/central-metricas": "central-metricas",
  "/documentos": "documentos",
  // NOVAS ÁREAS EMPRESARIAIS
  "/empresas/dashboard": "dashboard-empresarial",
  "/empresas/rh": "rh-funcionarios",
  "/empresas/arquivos": "arquivos-empresariais",
  "/empresas/fluxo-caixa": "fluxo-caixa",
  "/empresas/contas-pagar": "contas-pagar",
  "/empresas/contas-receber": "contas-receber",
};

// ============================================
// CONFIGURAÇÃO DE PERMISSÕES POR CARGO
// ============================================
const ROLE_PERMISSIONS: Record<FullAppRole, SystemArea[]> = {
  // OWNER - ACESSO TOTAL A TUDO
  owner: [
    "dashboard", "dashboard-executivo", "tarefas", "integracoes", "calendario",
    "funcionarios", "area-professor", "gestao-equipe", "marketing", "lancamento",
    "metricas", "arquivos", "planejamento-aula", "turmas-online", "turmas-presenciais",
    "financas-pessoais", "financas-empresa", "entradas", "pagamentos", "contabilidade",
    "cursos", "simulados", "afiliados", "alunos", "portal-aluno", "gestao-site",
    "relatorios", "guia", "laboratorio", "site-programador", "pessoal", "vida-pessoal",
    "permissoes", "configuracoes", "monitoramento", "central-whatsapp", "diagnostico-whatsapp",
    "auditoria-acessos", "central-monitoramento", "central-ias", "central-metricas", "documentos",
    "dashboard-empresarial", "rh-funcionarios", "arquivos-empresariais", "fluxo-caixa", "contas-pagar", "contas-receber"
  ],

  // ADMIN - Igual owner mas sem vida pessoal e monitoramento
  admin: [
    "dashboard", "dashboard-executivo", "tarefas", "integracoes", "calendario",
    "funcionarios", "area-professor", "gestao-equipe", "marketing", "lancamento",
    "metricas", "arquivos", "planejamento-aula", "turmas-online", "turmas-presenciais",
    "financas-empresa", "entradas", "pagamentos", "contabilidade",
    "cursos", "simulados", "afiliados", "alunos", "portal-aluno", "gestao-site",
    "relatorios", "guia", "laboratorio", "site-programador",
    "permissoes", "configuracoes", "central-whatsapp", "diagnostico-whatsapp"
  ],

  // COORDENAÇÃO - Gestão de equipe, turmas, professores
  coordenacao: [
    "dashboard", "tarefas", "calendario",
    "funcionarios", "area-professor", "gestao-equipe",
    "planejamento-aula", "turmas-online", "turmas-presenciais",
    "cursos", "simulados", "alunos", "portal-aluno",
    "relatorios", "guia"
  ],

  // SUPORTE - Atendimento ao aluno, portal
  suporte: [
    "dashboard", "tarefas", "calendario",
    "cursos", "alunos", "portal-aluno",
    "guia"
  ],

  // MONITORIA - Acompanhamento de alunos, simulados
  monitoria: [
    "dashboard", "tarefas", "calendario",
    "turmas-online", "turmas-presenciais",
    "cursos", "simulados", "alunos", "portal-aluno",
    "guia"
  ],

  // AFILIADOS - Área de afiliados e métricas de vendas
  afiliado: [
    "dashboard", "tarefas", "calendario",
    "metricas", "afiliados",
    "cursos", "relatorios", "guia"
  ],

  // MARKETING - Marketing, lançamentos, métricas
  marketing: [
    "dashboard", "tarefas", "calendario",
    "marketing", "lancamento", "metricas", "arquivos",
    "gestao-site", "relatorios", "guia"
  ],

  // CONTABILIDADE - Finanças da empresa (somente leitura)
  contabilidade: [
    "dashboard", "tarefas", "calendario",
    "financas-empresa", "entradas", "pagamentos", "contabilidade",
    "relatorios", "guia"
  ],

  // ADMINISTRATIVO - Visualiza tudo mas não modifica
  employee: [
    "dashboard", "tarefas", "calendario",
    "funcionarios", "marketing", "metricas",
    "cursos", "alunos", "portal-aluno",
    "relatorios", "guia"
  ],
};

// Rótulos amigáveis para cada cargo
export const ROLE_LABELS: Record<FullAppRole, string> = {
  owner: "Proprietário (Master)",
  admin: "Administrador",
  coordenacao: "Coordenação",
  suporte: "Suporte",
  monitoria: "Monitoria",
  afiliado: "Afiliados",
  marketing: "Marketing",
  contabilidade: "Contabilidade",
  employee: "Administrativo",
};

// Cores para badges de cargo
export const ROLE_COLORS: Record<FullAppRole, string> = {
  owner: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
  admin: "bg-gradient-to-r from-blue-600 to-cyan-600 text-white",
  coordenacao: "bg-gradient-to-r from-green-600 to-emerald-600 text-white",
  suporte: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
  monitoria: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
  afiliado: "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
  marketing: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
  contabilidade: "bg-gradient-to-r from-teal-500 to-green-500 text-white",
  employee: "bg-gradient-to-r from-gray-500 to-slate-500 text-white",
};

// Descrições dos cargos
export const ROLE_DESCRIPTIONS: Record<FullAppRole, string> = {
  owner: "Acesso total a todas as áreas. Pode modificar qualquer dado.",
  admin: "Acesso administrativo completo, exceto áreas pessoais do owner.",
  coordenacao: "Gerencia equipe, turmas e planejamento de aulas.",
  suporte: "Atendimento ao aluno e gestão do portal.",
  monitoria: "Acompanhamento de alunos, turmas e simulados.",
  afiliado: "Gestão de afiliados e métricas de vendas.",
  marketing: "Marketing, lançamentos e gestão do site.",
  contabilidade: "Acesso às finanças da empresa (visualização).",
  employee: "Acesso básico ao sistema (somente leitura em algumas áreas).",
};

const OWNER_EMAIL = "moisesblank@gmail.com";

interface RolePermissionsResult {
  role: FullAppRole | null;
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isGodMode: boolean;
  canEdit: boolean;
  canViewAll: boolean;
  userEmail: string | null;
  roleLabel: string;
  roleColor: string;
  roleDescription: string;
  allowedAreas: SystemArea[];
  hasAccess: (area: SystemArea | string) => boolean;
  hasAccessToUrl: (url: string) => boolean;
  canModify: (area: SystemArea) => boolean;
}

export function useRolePermissions(): RolePermissionsResult {
  const { user } = useAuth();
  const [role, setRole] = useState<FullAppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar role:", error);
          setRole(null);
        } else {
          setRole(data?.role as FullAppRole ?? "employee");
        }
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  const userEmail = user?.email || null;
  
  // Verificação de owner (role + email exato)
  const isOwner = role === "owner" && userEmail === OWNER_EMAIL;
  const isAdmin = role === "admin";
  const isGodMode = isOwner;
  const canEdit = isOwner;
  const canViewAll = isOwner || isAdmin;

  // Obtém as áreas permitidas para o role atual
  const allowedAreas = useMemo(() => {
    if (!role) return [];
    return ROLE_PERMISSIONS[role] || [];
  }, [role]);

  // Verifica se tem acesso a uma área específica
  const hasAccess = (area: SystemArea | string): boolean => {
    if (isOwner) return true;
    return allowedAreas.includes(area as SystemArea);
  };

  // Verifica se tem acesso a uma URL específica
  const hasAccessToUrl = (url: string): boolean => {
    if (isOwner) return true;
    const area = URL_TO_AREA[url];
    if (!area) return true; // URLs não mapeadas são permitidas
    return hasAccess(area);
  };

  // Verifica se pode modificar dados em uma área
  const canModify = (area: SystemArea): boolean => {
    if (isOwner) return true;
    if (isAdmin) return hasAccess(area);
    // Outros cargos só podem visualizar (exceto em suas próprias áreas de trabalho)
    if (role === "employee" || role === "contabilidade") return false;
    return hasAccess(area);
  };

  return {
    role,
    isLoading,
    isOwner,
    isAdmin,
    isGodMode,
    canEdit,
    canViewAll,
    userEmail,
    roleLabel: role ? ROLE_LABELS[role] : "Usuário",
    roleColor: role ? ROLE_COLORS[role] : "bg-gray-500 text-white",
    roleDescription: role ? ROLE_DESCRIPTIONS[role] : "",
    allowedAreas,
    hasAccess,
    hasAccessToUrl,
    canModify,
  };
}

// Hook auxiliar para verificar acesso a uma área específica
export function useHasAccess(area: SystemArea): boolean {
  const { hasAccess, isLoading } = useRolePermissions();
  if (isLoading) return false;
  return hasAccess(area);
}

// Exporta as constantes para uso em outros componentes
export { ROLE_PERMISSIONS, URL_TO_AREA };
