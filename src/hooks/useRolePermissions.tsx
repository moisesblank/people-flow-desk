// ============================================
// 🔥 MOISÉS MEDEIROS v12.0 - ROLE PERMISSIONS HOOK
// Sistema de Permissões por Cargo Completo
// ARQUITETURA MONO-DOMÍNIO (pro.moisesmedeiros.com.br)
// /gestaofc/* = área de funcionários
// /alunos/* = área de alunos
// ============================================
// 📌 REGRA MATRIZ - ARQUITETURA MONO-DOMÍNIO:
// ┌─────────────────────────────────────────────────────────────────┐
// │ CATEGORIA        │ PATH                                │ ACESSO │
// ├─────────────────────────────────────────────────────────────────┤
// │ OWNER (Master)   │ TODOS                               │ SUPREMO│
// │ GESTÃO           │ /gestaofc/*                         │ Func.  │
// │ BETA (Alunos)    │ /alunos/*                           │ Pagante│
// │ ÁREA GRATUITA    │ / + /comunidade                     │ Público│
// └─────────────────────────────────────────────────────────────────┘
// Owner: moisesblank@gmail.com → Acesso Total SUPREMO
// ============================================

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  MATRIZ_URLS, 
  MATRIZ_PATHS, 
  ROLE_TO_CATEGORIA, 
  validarAcessoUrl,
  type CategoriaAcesso 
} from "@/config/matriz-urls";
import {
  isOwner as isOwnerFn,
  isImmune,
  isGestaoRole,
  getRolePermissions as getCoreRolePermissions,
  validateAccess,
  getPostLoginRedirect,
  getAccessDeniedRedirect,
  type AppRole,
  type SystemDomain,
  type AccessCategory,
} from "@/core/urlAccessControl";

// ============================================
// CONSTANTES GLOBAIS - ARQUITETURA MONO-DOMÍNIO
// ============================================
export const OWNER_EMAIL = "moisesblank@gmail.com";

// Re-exportar constantes da matriz para uso externo
export { MATRIZ_URLS, MATRIZ_PATHS };

// ============================================
// FUNÇÕES DE DETECÇÃO DE ÁREA (NÃO DOMÍNIO)
// ARQUITETURA MONO-DOMÍNIO: tudo em pro.moisesmedeiros.com.br
// ============================================

/**
 * @deprecated Domínio gestao.* não existe mais. Use isGestaoPath()
 */
export function isGestaoHost(_hostname?: string): boolean {
  // SEMPRE RETORNA FALSE - domínio gestao.* foi descontinuado
  return false;
}

export function isProHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h.startsWith("pro.") || h.includes("pro.") || h.includes("localhost") || h.includes("lovable");
}

export function isPublicHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h.startsWith("www.") || h === "moisesmedeiros.com.br";
}

/**
 * Verifica se está na área de gestão (/gestaofc)
 */
export function isGestaoPath(pathname?: string): boolean {
  const p = (pathname || (typeof window !== "undefined" ? window.location.pathname : "")).toLowerCase();
  return p.startsWith("/gestaofc");
}

export function getCurrentDomain(): "pro" | "public" | "localhost" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const h = window.location.hostname.toLowerCase();
  if (h.includes("localhost") || h.includes("lovable")) return "localhost";
  if (isProHost(h)) return "pro";
  if (isPublicHost(h)) return "public";
  return "unknown";
}

// ============================================
// FUNÇÃO DE VALIDAÇÃO DE ACESSO POR DOMÍNIO
// ============================================
export function validarAcessoPorDominio(
  role: string | null,
  pathname: string
): { permitido: boolean; redirecionarPara?: string; motivo?: string } {
  if (typeof window === "undefined") return { permitido: true };
  
  const hostname = window.location.hostname;
  const categoria: CategoriaAcesso = role ? (ROLE_TO_CATEGORIA[role] || "publico") : "publico";
  
  // Owner tem bypass total
  if (categoria === "owner") {
    return { permitido: true };
  }
  
  return validarAcessoUrl(categoria, pathname, hostname);
}

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
  | "contabilidade"
  | "beta"           // ALUNO PAGANTE (365 dias)
  | "aluno_gratuito"; // CADASTRO COMUM (apenas área gratuita)

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
  | "livros-web"
  | "lives"
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
  | "receitas-empresariais"
  | "rh-funcionarios"
  | "arquivos-empresariais"
  | "fluxo-caixa"
  | "contas-pagar"
  | "contas-receber"
  // NOVAS ÁREAS PARA ALUNOS
  | "area-beta"
  | "area-gratuita"
  | "comunidade"
  | "portal-beta"
  // ===== CENTRAL DO ALUNO - QUÍMICA ENEM =====
  | "aluno-dashboard"
  | "aluno-cronograma"
  | "aluno-videoaulas"
  | "aluno-materiais"
  | "aluno-resumos"
  | "aluno-mapas-mentais"
  | "aluno-questoes"
  | "aluno-simulados"
  | "aluno-redacao"
  | "aluno-desempenho"
  | "aluno-ranking"
  | "aluno-conquistas"
  | "aluno-tutoria"
  | "aluno-forum"
  | "aluno-lives"
  | "aluno-duvidas"
  | "aluno-revisao"
  | "aluno-laboratorio"
  | "aluno-calculadora"
  | "aluno-tabela-periodica"
  | "aluno-flashcards"
  | "aluno-metas"
  | "aluno-agenda"
  | "aluno-certificados"
  | "aluno-perfil"
  | "aluno-livro-web";

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
  "/gestaofc/gestao-alunos": "alunos",
  "/portal-aluno": "portal-aluno",
  "/gestao-site": "gestao-site",
  "/relatorios": "relatorios",
  "/guia": "guia",
  "/laboratorio": "laboratorio",
  "/site-programador": "site-programador",
  "/gestaofc/livros-web": "livros-web",
  "/gestaofc/lives": "lives",
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
  "/empresas/dashboard": "financas-empresa", // Redirecionado para Central Financeira
  "/empresas/receitas": "receitas-empresariais",
  "/empresas/rh": "rh-funcionarios",
  "/empresas/arquivos": "arquivos-empresariais",
  "/empresas/fluxo-caixa": "fluxo-caixa",
  "/empresas/contas-pagar": "contas-pagar",
  "/empresas/contas-receber": "contas-receber",
  // ÁREAS DE ALUNOS
  "/area-beta": "area-beta",
  "/area-gratuita": "area-gratuita",
  "/comunidade": "comunidade",
  "/portal-beta": "portal-beta",
  // ===== CENTRAL DO ALUNO - QUÍMICA ENEM =====
  // URL BASE: /alunos (home dos alunos após login)
  "/alunos": "aluno-dashboard",
  "/alunos/dashboard": "aluno-dashboard",
  "/alunos/cronograma": "aluno-cronograma",
  "/alunos/videoaulas": "aluno-videoaulas",
  "/alunos/materiais": "aluno-materiais",
  "/alunos/resumos": "aluno-resumos",
  "/alunos/mapas-mentais": "aluno-mapas-mentais",
  "/alunos/questoes": "aluno-questoes",
  "/alunos/simulados": "aluno-simulados",
  "/alunos/redacao": "aluno-redacao",
  "/alunos/desempenho": "aluno-desempenho",
  "/alunos/ranking": "aluno-ranking",
  "/alunos/conquistas": "aluno-conquistas",
  "/alunos/tutoria": "aluno-tutoria",
  "/alunos/forum": "aluno-forum",
  "/alunos/lives": "aluno-lives",
  "/alunos/duvidas": "aluno-duvidas",
  "/alunos/revisao": "aluno-revisao",
  "/alunos/laboratorio": "aluno-laboratorio",
  "/alunos/calculadora": "aluno-calculadora",
  "/alunos/tabela-periodica": "aluno-tabela-periodica",
  "/alunos/flashcards": "aluno-flashcards",
  "/alunos/metas": "aluno-metas",
  "/alunos/agenda": "aluno-agenda",
  "/alunos/certificados": "aluno-certificados",
  "/alunos/perfil": "aluno-perfil",
  "/alunos/livro-web": "aluno-livro-web",
};

// ============================================
// CONFIGURAÇÃO DE PERMISSÕES POR CARGO
// ============================================
const ROLE_PERMISSIONS: Record<FullAppRole, SystemArea[]> = {
  // OWNER - ACESSO TOTAL A TUDO (incluindo área do aluno)
  owner: [
    "dashboard", "dashboard-executivo", "tarefas", "integracoes", "calendario",
    "funcionarios", "area-professor", "gestao-equipe", "marketing", "lancamento",
    "metricas", "arquivos", "planejamento-aula", "turmas-online", "turmas-presenciais",
    "financas-pessoais", "financas-empresa", "entradas", "pagamentos", "contabilidade",
    "cursos", "simulados", "afiliados", "alunos", "portal-aluno", "gestao-site",
    "relatorios", "guia", "laboratorio", "site-programador", "livros-web", "lives", "pessoal", "vida-pessoal",
    "permissoes", "configuracoes", "monitoramento", "central-whatsapp", "diagnostico-whatsapp",
    "auditoria-acessos", "central-monitoramento", "central-ias", "central-metricas", "documentos",
    "dashboard-empresarial", "receitas-empresariais", "rh-funcionarios", "arquivos-empresariais",
    "fluxo-caixa", "contas-pagar", "contas-receber",
    // ÁREAS DE ALUNOS (OWNER VÊ TUDO)
    "area-beta", "area-gratuita", "comunidade", "portal-beta",
    "aluno-dashboard", "aluno-cronograma", "aluno-videoaulas", "aluno-materiais",
    "aluno-resumos", "aluno-mapas-mentais", "aluno-questoes", "aluno-simulados",
    "aluno-redacao", "aluno-desempenho", "aluno-ranking", "aluno-conquistas",
    "aluno-tutoria", "aluno-forum", "aluno-lives", "aluno-duvidas",
    "aluno-revisao", "aluno-laboratorio", "aluno-calculadora", "aluno-tabela-periodica",
    "aluno-flashcards", "aluno-metas", "aluno-agenda", "aluno-certificados", "aluno-perfil",
    "aluno-livro-web"
  ],

  // ADMIN - Igual owner mas sem vida pessoal e monitoramento
  admin: [
    "dashboard", "dashboard-executivo", "tarefas", "integracoes", "calendario",
    "funcionarios", "area-professor", "gestao-equipe", "marketing", "lancamento",
    "metricas", "arquivos", "planejamento-aula", "turmas-online", "turmas-presenciais",
    "financas-empresa", "entradas", "pagamentos", "contabilidade",
    "cursos", "simulados", "afiliados", "alunos", "portal-aluno", "gestao-site",
    "relatorios", "guia", "laboratorio", "site-programador", "livros-web", "lives",
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

  // BETA - ALUNO PAGANTE (365 dias) - ACESSO COMPLETO À ÁREA DO ALUNO
  beta: [
    "portal-beta", "area-beta", "cursos", "simulados", 
    "portal-aluno", "comunidade", "guia",
    // CENTRAL DO ALUNO COMPLETA
    "aluno-dashboard", "aluno-cronograma", "aluno-videoaulas", "aluno-materiais",
    "aluno-resumos", "aluno-mapas-mentais", "aluno-questoes", "aluno-simulados",
    "aluno-redacao", "aluno-desempenho", "aluno-ranking", "aluno-conquistas",
    "aluno-tutoria", "aluno-forum", "aluno-lives", "aluno-duvidas",
    "aluno-revisao", "aluno-laboratorio", "aluno-calculadora", "aluno-tabela-periodica",
    "aluno-flashcards", "aluno-metas", "aluno-agenda", "aluno-certificados", "aluno-perfil",
    "aluno-livro-web"
  ],

  // ALUNO GRATUITO - Apenas área pré-login
  aluno_gratuito: [
    "area-gratuita"
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
  beta: "Aluno BETA (Premium)",
  aluno_gratuito: "Usuário Gratuito",
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
  beta: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black",
  aluno_gratuito: "bg-gradient-to-r from-slate-400 to-gray-300 text-black",
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
  beta: "Aluno Premium com acesso completo por 365 dias à área do aluno.",
  aluno_gratuito: "Acesso exclusivo à área gratuita (pré-login).",
};

// OWNER_EMAIL já exportado no topo do arquivo

// Roles que são "funcionários ou acima" (usados para bypass de segurança)
const FUNCIONARIO_OR_ABOVE_ROLES: FullAppRole[] = [
  'owner', 'admin', 'coordenacao', 'suporte', 'monitoria', 'employee', 'marketing', 'contabilidade', 'afiliado'
];

export interface UseRolePermissionsReturn {
  role: FullAppRole | null;
  isLoading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isBeta: boolean;
  isAlunoGratuito: boolean;
  isGodMode: boolean;
  canEdit: boolean;
  canViewAll: boolean;
  isFuncionarioOrAbove: boolean; // SANCTUM: Para bypass de proteção de vídeo
  userEmail: string | null;
  roleLabel: string;
  roleColor: string;
  roleDescription: string;
  allowedAreas: SystemArea[];
  hasAccess: (area: SystemArea | string) => boolean;
  hasAccessToUrl: (url: string) => boolean;
  canModify: (area: SystemArea) => boolean;
}

export function useRolePermissions(): UseRolePermissionsReturn {
  const { user, role: authRole } = useAuth();
  const [role, setRole] = useState<FullAppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ============================================
    // 🛡️ REGRA MATRIZ MÃE: OWNER EMAIL = OWNER ROLE
    // Bypass IMEDIATO sem esperar banco (evita race condition)
    // ============================================
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    const userEmail = (user.email || "").toLowerCase();

    // ✅ OWNER BYPASS DETERMINÍSTICO (REGRA MATRIZ)
    if (userEmail === OWNER_EMAIL) {
      console.log('[ROLE] ✅ OWNER detectado por email - bypass imediato');
      setRole("owner");
      setIsLoading(false);
      return;
    }

    // ✅ Se useAuth já tem a role, usar ela (evita fetch duplicado)
    if (authRole) {
      console.log('[ROLE] ✅ Usando role do AuthProvider:', authRole);
      setRole(authRole as FullAppRole);
      setIsLoading(false);
      return;
    }

    // ============================================
    // Fallback: buscar role do banco (usuários normais)
    // ============================================
    let timeoutId: ReturnType<typeof setTimeout>;
    let didTimeout = false;

    async function fetchRole() {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (didTimeout) return;

        if (error) {
          console.error("Erro ao buscar role:", error);
          setRole("employee");
        } else {
          setRole(data?.role as FullAppRole ?? "employee");
        }
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
        if (!didTimeout) {
          setRole("employee");
        }
      } finally {
        if (!didTimeout) {
          setIsLoading(false);
          clearTimeout(timeoutId);
        }
      }
    }

    // ⏱️ TIMEOUT: Se não carregar em 3s, usar fallback
    timeoutId = setTimeout(() => {
      if (isLoading) {
        didTimeout = true;
        console.warn("[useRolePermissions] Timeout atingido (3s) - usando fallback");
        setRole("employee");
        setIsLoading(false);
      }
    }, 3000);

    fetchRole();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, authRole]);

  const userEmail = user?.email || null;
  
  // P1-2 FIX: Role como fonte da verdade (email é apenas log/fallback UX)
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  // CONSTITUIÇÃO v10.x - Roles premium incluem beta, aluno_presencial, beta_expira
  const roleStr = role as string;
  const isBeta = roleStr === "beta" || roleStr === "aluno_presencial" || roleStr === "beta_expira";
  const isAlunoGratuito = role === "aluno_gratuito";
  const isGodMode = isOwner;
  const canEdit = isOwner;
  const canViewAll = isOwner || isAdmin;
  
  // SANCTUM 2.0: Verifica se é funcionário ou acima (bypass de proteção de vídeo)
  const isFuncionarioOrAbove = useMemo(() => {
    if (!role) return false;
    return FUNCIONARIO_OR_ABOVE_ROLES.includes(role);
  }, [role]);

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
    // P1-2 FIX: Contabilidade só visualiza, sem 'employee' deprecated
    if (role === "contabilidade") return false;
    return hasAccess(area);
  };

  return {
    role,
    isLoading,
    isOwner,
    isAdmin,
    isBeta,
    isAlunoGratuito,
    isGodMode,
    canEdit,
    canViewAll,
    isFuncionarioOrAbove,
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

// ============================================
// 🔐 VALIDAÇÃO DE ACESSO (MONO-DOMÍNIO v2.0)
// ============================================
// REGRA ATUALIZADA:
// - pro.moisesmedeiros.com.br/gestaofc → FUNCIONÁRIOS + OWNER
// - pro.moisesmedeiros.com.br/alunos → ALUNOS BETA + OWNER
// - pro.moisesmedeiros.com.br/ → ÁREA PÚBLICA
// - Owner (moisesblank@gmail.com) → ACESSO SUPREMO EM TODOS
// ============================================

// Roles permitidos em cada domínio
export const GESTAO_ALLOWED_ROLES: FullAppRole[] = [
  "owner", "admin", "coordenacao", "suporte", "monitoria", 
  "afiliado", "marketing", "contabilidade", "employee"
];

export const PRO_ALLOWED_ROLES: FullAppRole[] = [
  "owner", "beta", "aluno_gratuito"
];

export interface DomainAccessResult {
  permitido: boolean;
  redirecionarPara?: string;
  motivo?: string;
  dominioAtual: "gestao" | "pro" | "public" | "localhost" | "unknown";
}

/**
 * Valida se o role do usuário pode acessar o domínio atual APÓS LOGIN.
 * Usa-se logo após autenticação para verificar se deve redirecionar.
 * 
 * @param role - Role do usuário logado
 * @param userEmail - Email do usuário (para verificar owner)
 * @returns Objeto com permitido, redirecionarPara e motivo
 */
export function validateDomainAccessForLogin(
  role: FullAppRole | null,
  userEmail: string | null
): DomainAccessResult {
  // SSR safety
  if (typeof window === "undefined") {
    return { permitido: true, dominioAtual: "unknown" };
  }

  const hostname = window.location.hostname.toLowerCase();
  
  // Detectar domínio atual
  let dominioAtual: DomainAccessResult["dominioAtual"] = "unknown";
  // Localhost + Lovable preview = bypass total
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1") || hostname.includes("lovable.app") || hostname.includes("lovableproject.com")) {
    dominioAtual = "localhost"; // Dev/Preview - permitir tudo
  } else if (isGestaoHost(hostname)) {
    dominioAtual = "gestao";
  } else if (isProHost(hostname)) {
    dominioAtual = "pro";
  } else if (isPublicHost(hostname)) {
    dominioAtual = "public";
  }

  // Owner tem BYPASS SUPREMO em qualquer domínio
  if (userEmail?.toLowerCase() === OWNER_EMAIL) {
    console.log("[DOMAIN-ACCESS] Owner detectado - bypass supremo ativado");
    return { permitido: true, dominioAtual };
  }

  // Sem role = usuário não logado ainda → PERMITIR acessar /auth normalmente
  // O redirecionamento só acontece APÓS login quando sabemos o role real
  if (!role) {
    console.log("[DOMAIN-ACCESS] Sem role (usuário não logado) - permitindo acesso para login");
    return { permitido: true, dominioAtual };
  }

  // Localhost/Preview - permitir tudo para desenvolvimento
  if (dominioAtual === "localhost") {
    return { permitido: true, dominioAtual };
  }

  // ============================================
  // 🛡️ LEI SUPREMA: NUNCA REDIRECIONAR ENTRE DOMÍNIOS
  // Cada domínio é independente - NÃO existe domínio canônico
  // gestao.* e pro.* coexistem sem redirect forçado
  // ============================================
  
  if (dominioAtual === "gestao") {
    const isAllowed = GESTAO_ALLOWED_ROLES.includes(role);
    if (!isAllowed) {
      console.log(`[DOMAIN-ACCESS] Role "${role}" não é gestão, mas PERMANECE no domínio atual (sem redirect)`);
      return { permitido: false, dominioAtual, motivo: `Acesso restrito para este cargo.` };
    }
    return { permitido: true, dominioAtual };
  }

  if (dominioAtual === "pro") {
    const isAllowed = PRO_ALLOWED_ROLES.includes(role);
    if (!isAllowed) {
      console.log(`[DOMAIN-ACCESS] Role "${role}" não é aluno, mas PERMANECE no domínio atual (sem redirect)`);
      return { permitido: false, dominioAtual, motivo: `Acesso restrito para este cargo.` };
    }
    return { permitido: true, dominioAtual };
  }

  // Domínio público ou unknown - permitir (landing pages etc)
  return { permitido: true, dominioAtual };
}

/**
 * Hook para usar validação de domínio em componentes React
 * Retorna estado reativo da validação
 */
export function useDomainAccessValidation() {
  const { role, isLoading, userEmail } = useRolePermissions();
  
  const validation = useMemo(() => {
    if (isLoading) return null;
    return validateDomainAccessForLogin(role, userEmail);
  }, [role, userEmail, isLoading]);

  return {
    isLoading,
    ...validation
  };
}

// Re-exportar tudo para garantir acessibilidade
export { 
  ROLE_PERMISSIONS, 
  URL_TO_AREA, 
  FUNCIONARIO_OR_ABOVE_ROLES
};

// Alias para compatibilidade com código legado
export const FULL_ROLE_LABELS = ROLE_LABELS;
export type UserRole = FullAppRole;
