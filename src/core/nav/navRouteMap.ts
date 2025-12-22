// ============================================
// 🔥🛡️ NAV ROUTE MAP OMEGA v3.0 🛡️🔥
// MAPEAMENTO DE NAVEGAÇÃO PARA ROTAS
// ============================================
// 100+ itens de navegação com RBAC completo
// ============================================

import type { AppRole } from "../urlAccessControl";
import { OWNER_EMAIL, isOwner } from "../urlAccessControl";

// ============================================
// TIPOS
// ============================================

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  roles: AppRole[];
  group: string;
  order: number;
}

// ============================================
// GRUPOS DE NAVEGAÇÃO
// ============================================

export const NAV_GROUPS = {
  // Público
  publico: "Público",
  
  // Comunidade
  comunidade: "Comunidade",
  
  // Alunos
  "alunos-principal": "Portal do Aluno",
  "alunos-estudo": "Estudos",
  "alunos-ferramentas": "Ferramentas",
  "alunos-social": "Social",
  
  // Gestão
  "gestao-dashboard": "Dashboard",
  "gestao-operacional": "Operacional",
  "gestao-pedagogico": "Pedagógico",
  "gestao-financeiro": "Financeiro",
  "gestao-alunos": "Alunos",
  "gestao-config": "Configurações",
  "gestao-empresas": "Empresas",
  
  // Owner
  owner: "Owner",
} as const;

// ============================================
// ROLES POR CATEGORIA
// ============================================

const ALL_ROLES: AppRole[] = [
  "owner", "admin", "funcionario", "suporte", "coordenacao", 
  "monitoria", "marketing", "contabilidade", "professor",
  "beta", "aluno", "viewer", "employee"
];

const GESTAO_ROLES: AppRole[] = [
  "owner", "admin", "funcionario", "suporte", "coordenacao",
  "monitoria", "marketing", "contabilidade", "professor", "employee"
];

const ALUNO_ROLES: AppRole[] = ["owner", "admin", "beta", "aluno"];

const COMUNIDADE_ROLES: AppRole[] = ["owner", "admin", "beta", "aluno", "viewer"];

const OWNER_ONLY: AppRole[] = ["owner"];

// ============================================
// ITENS DE NAVEGAÇÃO - PÚBLICO
// ============================================

export const NAV_ITEMS_PUBLICO: NavItem[] = [
  { id: "home", title: "Home", path: "/", icon: "Home", roles: ALL_ROLES, group: "publico", order: 1 },
  { id: "auth", title: "Login", path: "/auth", icon: "LogIn", roles: ALL_ROLES, group: "publico", order: 2 },
];

// ============================================
// ITENS DE NAVEGAÇÃO - COMUNIDADE
// ============================================

export const NAV_ITEMS_COMUNIDADE: NavItem[] = [
  { id: "comunidade-home", title: "Comunidade", path: "/comunidade", icon: "Users", roles: COMUNIDADE_ROLES, group: "comunidade", order: 1 },
  { id: "comunidade-forum", title: "Fórum", path: "/comunidade/forum", icon: "MessageSquare", roles: COMUNIDADE_ROLES, group: "comunidade", order: 2 },
  { id: "comunidade-posts", title: "Posts", path: "/comunidade/posts", icon: "FileText", roles: COMUNIDADE_ROLES, group: "comunidade", order: 3 },
  { id: "comunidade-membros", title: "Membros", path: "/comunidade/membros", icon: "Users", roles: COMUNIDADE_ROLES, group: "comunidade", order: 4 },
  { id: "comunidade-eventos", title: "Eventos", path: "/comunidade/eventos", icon: "Calendar", roles: COMUNIDADE_ROLES, group: "comunidade", order: 5 },
  { id: "comunidade-chat", title: "Chat", path: "/comunidade/chat", icon: "MessageCircle", roles: COMUNIDADE_ROLES, group: "comunidade", order: 6 },
];

// ============================================
// ITENS DE NAVEGAÇÃO - ALUNOS
// ============================================

export const NAV_ITEMS_ALUNOS: NavItem[] = [
  // Principal
  { id: "alunos-dashboard", title: "Dashboard", path: "/alunos/dashboard", icon: "LayoutDashboard", roles: ALUNO_ROLES, group: "alunos-principal", order: 1 },
  { id: "alunos-cronograma", title: "Cronograma", path: "/alunos/cronograma", icon: "Calendar", roles: ALUNO_ROLES, group: "alunos-principal", order: 2 },
  { id: "alunos-perfil", title: "Meu Perfil", path: "/alunos/perfil", icon: "User", roles: ALUNO_ROLES, group: "alunos-principal", order: 3 },
  
  // Estudos
  { id: "alunos-videoaulas", title: "Videoaulas", path: "/alunos/videoaulas", icon: "Play", roles: ALUNO_ROLES, group: "alunos-estudo", order: 1 },
  { id: "alunos-materiais", title: "Materiais", path: "/alunos/materiais", icon: "FileText", roles: ALUNO_ROLES, group: "alunos-estudo", order: 2 },
  { id: "alunos-resumos", title: "Resumos", path: "/alunos/resumos", icon: "BookOpen", roles: ALUNO_ROLES, group: "alunos-estudo", order: 3 },
  { id: "alunos-mapas-mentais", title: "Mapas Mentais", path: "/alunos/mapas-mentais", icon: "Brain", roles: ALUNO_ROLES, group: "alunos-estudo", order: 4 },
  { id: "alunos-questoes", title: "Questões", path: "/alunos/questoes", icon: "HelpCircle", roles: ALUNO_ROLES, group: "alunos-estudo", order: 5 },
  { id: "alunos-simulados", title: "Simulados", path: "/alunos/simulados", icon: "ClipboardList", roles: ALUNO_ROLES, group: "alunos-estudo", order: 6 },
  { id: "alunos-flashcards", title: "Flashcards", path: "/alunos/flashcards", icon: "Layers", roles: ALUNO_ROLES, group: "alunos-estudo", order: 7 },
  
  // Ferramentas
  { id: "alunos-tutoria", title: "Tutoria IA", path: "/alunos/tutoria", icon: "Bot", roles: ALUNO_ROLES, group: "alunos-ferramentas", order: 1 },
  { id: "alunos-laboratorio", title: "Laboratório", path: "/alunos/laboratorio", icon: "Flask", roles: ALUNO_ROLES, group: "alunos-ferramentas", order: 2 },
  { id: "alunos-calculadora", title: "Calculadora", path: "/alunos/calculadora", icon: "Calculator", roles: ALUNO_ROLES, group: "alunos-ferramentas", order: 3 },
  { id: "alunos-tabela", title: "Tabela Periódica", path: "/alunos/tabela-periodica", icon: "Table", roles: ALUNO_ROLES, group: "alunos-ferramentas", order: 4 },
  
  // Social
  { id: "alunos-ranking", title: "Ranking", path: "/alunos/ranking", icon: "Trophy", roles: ALUNO_ROLES, group: "alunos-social", order: 1 },
  { id: "alunos-conquistas", title: "Conquistas", path: "/alunos/conquistas", icon: "Award", roles: ALUNO_ROLES, group: "alunos-social", order: 2 },
  { id: "alunos-forum", title: "Fórum", path: "/alunos/forum", icon: "MessageSquare", roles: ALUNO_ROLES, group: "alunos-social", order: 3 },
  { id: "alunos-lives", title: "Lives", path: "/alunos/lives", icon: "Video", roles: ALUNO_ROLES, group: "alunos-social", order: 4 },
];

// ============================================
// ITENS DE NAVEGAÇÃO - GESTÃO
// ============================================

export const NAV_ITEMS_GESTAO: NavItem[] = [
  // Dashboard
  { id: "gestao-dashboard", title: "Dashboard", path: "/gestao/dashboard", icon: "LayoutDashboard", roles: GESTAO_ROLES, group: "gestao-dashboard", order: 1 },
  { id: "gestao-dashboard-executivo", title: "Dashboard Executivo", path: "/gestao/dashboard-executivo", icon: "Gauge", roles: GESTAO_ROLES, group: "gestao-dashboard", order: 2 },
  
  // Operacional
  { id: "gestao-tarefas", title: "Tarefas", path: "/gestao/tarefas", icon: "CheckSquare", roles: GESTAO_ROLES, group: "gestao-operacional", order: 1 },
  { id: "gestao-calendario", title: "Calendário", path: "/gestao/calendario", icon: "Calendar", roles: GESTAO_ROLES, group: "gestao-operacional", order: 2 },
  { id: "gestao-funcionarios", title: "Funcionários", path: "/gestao/funcionarios", icon: "Users", roles: GESTAO_ROLES, group: "gestao-operacional", order: 3 },
  { id: "gestao-documentos", title: "Documentos", path: "/gestao/documentos", icon: "FileText", roles: GESTAO_ROLES, group: "gestao-operacional", order: 4 },
  { id: "gestao-integracoes", title: "Integrações", path: "/gestao/integracoes", icon: "Link", roles: GESTAO_ROLES, group: "gestao-operacional", order: 5 },
  
  // Pedagógico
  { id: "gestao-cursos", title: "Cursos", path: "/gestao/cursos", icon: "GraduationCap", roles: GESTAO_ROLES, group: "gestao-pedagogico", order: 1 },
  { id: "gestao-area-professor", title: "Área do Professor", path: "/gestao/area-professor", icon: "User", roles: GESTAO_ROLES, group: "gestao-pedagogico", order: 2 },
  { id: "gestao-planejamento", title: "Planejamento", path: "/gestao/planejamento-aula", icon: "Calendar", roles: GESTAO_ROLES, group: "gestao-pedagogico", order: 3 },
  { id: "gestao-turmas-online", title: "Turmas Online", path: "/gestao/turmas-online", icon: "Monitor", roles: GESTAO_ROLES, group: "gestao-pedagogico", order: 4 },
  { id: "gestao-simulados", title: "Simulados", path: "/gestao/simulados", icon: "ClipboardList", roles: GESTAO_ROLES, group: "gestao-pedagogico", order: 5 },
  { id: "gestao-lives", title: "Lives", path: "/gestao/lives", icon: "Video", roles: GESTAO_ROLES, group: "gestao-pedagogico", order: 6 },
  
  // Financeiro
  { id: "gestao-entradas", title: "Entradas", path: "/gestao/entradas", icon: "DollarSign", roles: GESTAO_ROLES, group: "gestao-financeiro", order: 1 },
  { id: "gestao-financas-empresa", title: "Finanças Empresa", path: "/gestao/financas-empresa", icon: "Building2", roles: GESTAO_ROLES, group: "gestao-financeiro", order: 2 },
  { id: "gestao-pagamentos", title: "Pagamentos", path: "/gestao/pagamentos", icon: "CreditCard", roles: GESTAO_ROLES, group: "gestao-financeiro", order: 3 },
  { id: "gestao-contabilidade", title: "Contabilidade", path: "/gestao/contabilidade", icon: "Calculator", roles: GESTAO_ROLES, group: "gestao-financeiro", order: 4 },
  { id: "gestao-hotmart", title: "Transações Hotmart", path: "/gestao/transacoes-hotmart", icon: "Activity", roles: GESTAO_ROLES, group: "gestao-financeiro", order: 5 },
  
  // Alunos
  { id: "gestao-alunos", title: "Gestão de Alunos", path: "/gestao/gestao-alunos", icon: "Users", roles: GESTAO_ROLES, group: "gestao-alunos", order: 1 },
  { id: "gestao-afiliados", title: "Afiliados", path: "/gestao/afiliados", icon: "Handshake", roles: GESTAO_ROLES, group: "gestao-alunos", order: 2 },
  { id: "gestao-relatorios", title: "Relatórios", path: "/gestao/relatorios", icon: "BarChart", roles: GESTAO_ROLES, group: "gestao-alunos", order: 3 },
  { id: "gestao-marketing", title: "Marketing", path: "/gestao/marketing", icon: "Megaphone", roles: GESTAO_ROLES, group: "gestao-alunos", order: 4 },
  
  // Configurações
  { id: "gestao-permissoes", title: "Permissões", path: "/gestao/permissoes", icon: "Shield", roles: GESTAO_ROLES, group: "gestao-config", order: 1 },
  { id: "gestao-configuracoes", title: "Configurações", path: "/gestao/configuracoes", icon: "Settings", roles: GESTAO_ROLES, group: "gestao-config", order: 2 },
  { id: "gestao-equipe", title: "Gestão de Equipe", path: "/gestao/gestao-equipe", icon: "UserCog", roles: GESTAO_ROLES, group: "gestao-config", order: 3 },
  { id: "gestao-site", title: "Gestão do Site", path: "/gestao/gestao-site", icon: "Globe", roles: GESTAO_ROLES, group: "gestao-config", order: 4 },
  { id: "gestao-auditoria", title: "Auditoria", path: "/gestao/auditoria-acessos", icon: "Eye", roles: GESTAO_ROLES, group: "gestao-config", order: 5 },
  
  // Empresas
  { id: "gestao-empresas-dash", title: "Dashboard Empresarial", path: "/gestao/empresas/dashboard", icon: "Building2", roles: GESTAO_ROLES, group: "gestao-empresas", order: 1 },
  { id: "gestao-empresas-receitas", title: "Receitas", path: "/gestao/empresas/receitas", icon: "TrendingUp", roles: GESTAO_ROLES, group: "gestao-empresas", order: 2 },
  { id: "gestao-empresas-rh", title: "RH", path: "/gestao/empresas/rh", icon: "Users", roles: GESTAO_ROLES, group: "gestao-empresas", order: 3 },
];

// ============================================
// ITENS DE NAVEGAÇÃO - OWNER
// ============================================

export const NAV_ITEMS_OWNER: NavItem[] = [
  { id: "owner-monitoramento", title: "Central de Monitoramento", path: "/gestao/central-monitoramento", icon: "Activity", roles: OWNER_ONLY, group: "owner", order: 1 },
  { id: "owner-diagnostico", title: "Central de Diagnóstico", path: "/gestao/central-diagnostico", icon: "Stethoscope", roles: OWNER_ONLY, group: "owner", order: 2 },
  { id: "owner-whatsapp", title: "Diagnóstico WhatsApp", path: "/gestao/diagnostico-whatsapp", icon: "MessageSquare", roles: OWNER_ONLY, group: "owner", order: 3 },
  { id: "owner-webhooks", title: "Diagnóstico Webhooks", path: "/gestao/diagnostico-webhooks", icon: "Webhook", roles: OWNER_ONLY, group: "owner", order: 4 },
  { id: "owner-programador", title: "Site Programador", path: "/gestao/site-programador", icon: "Code", roles: OWNER_ONLY, group: "owner", order: 5 },
  { id: "owner-pessoal", title: "Vida Pessoal", path: "/gestao/vida-pessoal", icon: "Heart", roles: OWNER_ONLY, group: "owner", order: 6 },
  { id: "owner-master", title: "Master", path: "/gestao/master", icon: "Crown", roles: OWNER_ONLY, group: "owner", order: 7 },
];

// ============================================
// TODOS OS ITENS
// ============================================

export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAV_ITEMS_PUBLICO,
  ...NAV_ITEMS_COMUNIDADE,
  ...NAV_ITEMS_ALUNOS,
  ...NAV_ITEMS_GESTAO,
  ...NAV_ITEMS_OWNER,
];

// ============================================
// FUNÇÕES DE ACESSO
// ============================================

/**
 * Verifica se um usuário pode acessar um item de navegação
 */
export function canAccessNavItem(
  item: NavItem,
  role: string | null,
  email?: string | null
): boolean {
  // Owner MASTER tem acesso total
  if (isOwner(email, role)) {
    return true;
  }
  
  if (!role) return false;
  
  return item.roles.includes(role as AppRole);
}

/**
 * Obtém itens de navegação filtrados por role
 */
export function getNavItemsForRole(role: string | null, email?: string | null): NavItem[] {
  return ALL_NAV_ITEMS.filter(item => canAccessNavItem(item, role, email));
}

/**
 * Agrupa itens de navegação por grupo
 */
export function groupNavItems(items: NavItem[]): Record<string, NavItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);
}
