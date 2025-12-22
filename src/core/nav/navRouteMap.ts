// ============================================
// 🔥 NAV ROUTE MAP — MAPA DE NAVEGAÇÃO COMPLETO
// Mapeia cada item de menu para sua rota e permissões
// ============================================

import { RouteKey } from "../routes";

// ============================================
// TIPOS
// ============================================
export type NavItemKey = 
  // Principal
  | "dashboard"
  | "dashboard-executivo"
  | "tarefas"
  | "integracoes"
  | "calendario"
  | "funcionarios"
  | "documentos"
  | "perfil"
  | "guia"
  
  // Marketing
  | "marketing"
  | "lancamento"
  | "metricas"
  | "arquivos"
  | "leads-whatsapp"
  
  // Aulas
  | "area-professor"
  | "planejamento-aula"
  | "laboratorio"
  | "turmas-online"
  | "turmas-presenciais"
  | "cursos"
  | "simulados"
  | "lives"
  
  // Finanças
  | "entradas"
  | "financas-empresa"
  | "financas-pessoais"
  | "pagamentos"
  | "contabilidade"
  | "transacoes-hotmart"
  
  // Negócios
  | "gestao-alunos"
  | "portal-aluno"
  | "relatorios"
  | "afiliados"
  
  // Pessoal
  | "vida-pessoal"
  | "pessoal"
  
  // Admin
  | "permissoes"
  | "configuracoes"
  | "gestao-equipe"
  | "gestao-site"
  | "gestao-dispositivos"
  | "auditoria-acessos"
  
  // Owner
  | "central-monitoramento"
  | "monitoramento"
  | "central-whatsapp"
  | "whatsapp-live"
  | "diagnostico-whatsapp"
  | "diagnostico-webhooks"
  | "central-metricas"
  | "central-ias"
  | "site-programador"
  
  // Empresas
  | "empresas-dashboard"
  | "empresas-receitas"
  | "empresas-arquivos"
  | "empresas-rh"
  
  // Portal Aluno
  | "alunos"
  | "alunos-dashboard"
  | "alunos-cronograma"
  | "alunos-videoaulas"
  | "alunos-materiais"
  | "alunos-resumos"
  | "alunos-mapas-mentais"
  | "alunos-questoes"
  | "alunos-simulados"
  | "alunos-redacao"
  | "alunos-desempenho"
  | "alunos-ranking"
  | "alunos-conquistas"
  | "alunos-tutoria"
  | "alunos-forum"
  | "alunos-lives"
  | "alunos-duvidas"
  | "alunos-revisao"
  | "alunos-laboratorio"
  | "alunos-calculadora"
  | "alunos-tabela-periodica"
  | "alunos-flashcards"
  | "alunos-metas"
  | "alunos-agenda"
  | "alunos-certificados"
  | "alunos-perfil";

export type NavItemStatus = "active" | "disabled" | "coming_soon";

export type UserRole = 
  | "owner"
  | "admin"
  | "funcionario"
  | "suporte"
  | "coordenacao"
  | "monitoria"
  | "afiliado"
  | "marketing"
  | "contabilidade"
  | "professor"
  | "aluno"
  | "beta";

// ============================================
// MAPA: NAV ITEM → ROTA
// ============================================
export const NAV_ROUTE_MAP: Record<NavItemKey, RouteKey> = {
  // Principal
  "dashboard": "DASHBOARD",
  "dashboard-executivo": "DASHBOARD_EXECUTIVO",
  "tarefas": "TAREFAS",
  "integracoes": "INTEGRACOES",
  "calendario": "CALENDARIO",
  "funcionarios": "FUNCIONARIOS",
  "documentos": "DOCUMENTOS",
  "perfil": "PERFIL",
  "guia": "GUIA",
  
  // Marketing
  "marketing": "MARKETING",
  "lancamento": "LANCAMENTO",
  "metricas": "METRICAS",
  "arquivos": "ARQUIVOS",
  "leads-whatsapp": "LEADS_WHATSAPP",
  
  // Aulas
  "area-professor": "AREA_PROFESSOR",
  "planejamento-aula": "PLANEJAMENTO_AULA",
  "laboratorio": "LABORATORIO",
  "turmas-online": "TURMAS_ONLINE",
  "turmas-presenciais": "TURMAS_PRESENCIAIS",
  "cursos": "CURSOS",
  "simulados": "SIMULADOS",
  "lives": "LIVES",
  
  // Finanças
  "entradas": "ENTRADAS",
  "financas-empresa": "FINANCAS_EMPRESA",
  "financas-pessoais": "FINANCAS_PESSOAIS",
  "pagamentos": "PAGAMENTOS",
  "contabilidade": "CONTABILIDADE",
  "transacoes-hotmart": "TRANSACOES_HOTMART",
  
  // Negócios
  "gestao-alunos": "GESTAO_ALUNOS",
  "portal-aluno": "PORTAL_ALUNO",
  "relatorios": "RELATORIOS",
  "afiliados": "AFILIADOS",
  
  // Pessoal
  "vida-pessoal": "VIDA_PESSOAL",
  "pessoal": "PESSOAL",
  
  // Admin
  "permissoes": "PERMISSOES",
  "configuracoes": "CONFIGURACOES",
  "gestao-equipe": "GESTAO_EQUIPE",
  "gestao-site": "GESTAO_SITE",
  "gestao-dispositivos": "GESTAO_DISPOSITIVOS",
  "auditoria-acessos": "AUDITORIA_ACESSOS",
  
  // Owner
  "central-monitoramento": "CENTRAL_MONITORAMENTO",
  "monitoramento": "MONITORAMENTO",
  "central-whatsapp": "CENTRAL_WHATSAPP",
  "whatsapp-live": "WHATSAPP_LIVE",
  "diagnostico-whatsapp": "DIAGNOSTICO_WHATSAPP",
  "diagnostico-webhooks": "DIAGNOSTICO_WEBHOOKS",
  "central-metricas": "CENTRAL_METRICAS",
  "central-ias": "CENTRAL_IAS",
  "site-programador": "SITE_PROGRAMADOR",
  
  // Empresas
  "empresas-dashboard": "EMPRESAS_DASHBOARD",
  "empresas-receitas": "EMPRESAS_RECEITAS",
  "empresas-arquivos": "EMPRESAS_ARQUIVOS",
  "empresas-rh": "EMPRESAS_RH",
  
  // Portal Aluno
  "alunos": "ALUNOS",
  "alunos-dashboard": "ALUNOS_DASHBOARD",
  "alunos-cronograma": "ALUNOS_CRONOGRAMA",
  "alunos-videoaulas": "ALUNOS_VIDEOAULAS",
  "alunos-materiais": "ALUNOS_MATERIAIS",
  "alunos-resumos": "ALUNOS_RESUMOS",
  "alunos-mapas-mentais": "ALUNOS_MAPAS_MENTAIS",
  "alunos-questoes": "ALUNOS_QUESTOES",
  "alunos-simulados": "ALUNOS_SIMULADOS",
  "alunos-redacao": "ALUNOS_REDACAO",
  "alunos-desempenho": "ALUNOS_DESEMPENHO",
  "alunos-ranking": "ALUNOS_RANKING",
  "alunos-conquistas": "ALUNOS_CONQUISTAS",
  "alunos-tutoria": "ALUNOS_TUTORIA",
  "alunos-forum": "ALUNOS_FORUM",
  "alunos-lives": "ALUNOS_LIVES",
  "alunos-duvidas": "ALUNOS_DUVIDAS",
  "alunos-revisao": "ALUNOS_REVISAO",
  "alunos-laboratorio": "ALUNOS_LABORATORIO",
  "alunos-calculadora": "ALUNOS_CALCULADORA",
  "alunos-tabela-periodica": "ALUNOS_TABELA_PERIODICA",
  "alunos-flashcards": "ALUNOS_FLASHCARDS",
  "alunos-metas": "ALUNOS_METAS",
  "alunos-agenda": "ALUNOS_AGENDA",
  "alunos-certificados": "ALUNOS_CERTIFICADOS",
  "alunos-perfil": "ALUNOS_PERFIL",
};

// ============================================
// MAPA: NAV ITEM → ROLES PERMITIDAS
// ============================================
export const NAV_RBAC: Record<NavItemKey, UserRole[]> = {
  // Principal (todos autenticados)
  "dashboard": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "aluno", "beta"],
  "dashboard-executivo": ["owner", "admin"],
  "tarefas": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing"],
  "integracoes": ["owner", "admin"],
  "calendario": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "professor"],
  "funcionarios": ["owner", "admin"],
  "documentos": ["owner", "admin", "funcionario", "suporte", "coordenacao"],
  "perfil": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "aluno", "beta"],
  "guia": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "aluno", "beta"],
  
  // Marketing
  "marketing": ["owner", "admin", "marketing"],
  "lancamento": ["owner", "admin", "marketing"],
  "metricas": ["owner", "admin", "marketing"],
  "arquivos": ["owner", "admin", "funcionario", "marketing"],
  "leads-whatsapp": ["owner", "admin", "marketing"],
  
  // Aulas
  "area-professor": ["owner", "admin", "professor"],
  "planejamento-aula": ["owner", "admin", "professor"],
  "laboratorio": ["owner", "admin", "professor", "aluno", "beta"],
  "turmas-online": ["owner", "admin", "professor"],
  "turmas-presenciais": ["owner", "admin", "professor"],
  "cursos": ["owner", "admin", "professor"],
  "simulados": ["owner", "admin", "professor", "aluno", "beta"],
  "lives": ["owner", "admin", "professor", "aluno", "beta"],
  
  // Finanças
  "entradas": ["owner", "admin", "contabilidade"],
  "financas-empresa": ["owner", "admin", "contabilidade"],
  "financas-pessoais": ["owner", "admin", "funcionario"],
  "pagamentos": ["owner", "admin", "contabilidade"],
  "contabilidade": ["owner", "admin", "contabilidade"],
  "transacoes-hotmart": ["owner", "admin"],
  
  // Negócios
  "gestao-alunos": ["owner", "admin", "suporte"],
  "portal-aluno": ["owner", "admin", "aluno", "beta"],
  "relatorios": ["owner", "admin"],
  "afiliados": ["owner", "admin", "afiliado"],
  
  // Pessoal
  "vida-pessoal": ["owner"],
  "pessoal": ["owner"],
  
  // Admin
  "permissoes": ["owner", "admin"],
  "configuracoes": ["owner", "admin", "funcionario"],
  "gestao-equipe": ["owner", "admin"],
  "gestao-site": ["owner", "admin"],
  "gestao-dispositivos": ["owner", "admin", "funcionario"],
  "auditoria-acessos": ["owner", "admin"],
  
  // Owner
  "central-monitoramento": ["owner"],
  "monitoramento": ["owner", "admin"],
  "central-whatsapp": ["owner", "admin"],
  "whatsapp-live": ["owner", "admin"],
  "diagnostico-whatsapp": ["owner"],
  "diagnostico-webhooks": ["owner"],
  "central-metricas": ["owner", "admin"],
  "central-ias": ["owner", "admin"],
  "site-programador": ["owner"],
  
  // Empresas
  "empresas-dashboard": ["owner", "admin"],
  "empresas-receitas": ["owner", "admin", "contabilidade"],
  "empresas-arquivos": ["owner", "admin"],
  "empresas-rh": ["owner", "admin"],
  
  // Portal Aluno
  "alunos": ["owner", "admin", "aluno", "beta"],
  "alunos-dashboard": ["owner", "admin", "aluno", "beta"],
  "alunos-cronograma": ["owner", "admin", "aluno", "beta"],
  "alunos-videoaulas": ["owner", "admin", "aluno", "beta"],
  "alunos-materiais": ["owner", "admin", "aluno", "beta"],
  "alunos-resumos": ["owner", "admin", "aluno", "beta"],
  "alunos-mapas-mentais": ["owner", "admin", "aluno", "beta"],
  "alunos-questoes": ["owner", "admin", "aluno", "beta"],
  "alunos-simulados": ["owner", "admin", "aluno", "beta"],
  "alunos-redacao": ["owner", "admin", "aluno", "beta"],
  "alunos-desempenho": ["owner", "admin", "aluno", "beta"],
  "alunos-ranking": ["owner", "admin", "aluno", "beta"],
  "alunos-conquistas": ["owner", "admin", "aluno", "beta"],
  "alunos-tutoria": ["owner", "admin", "aluno", "beta"],
  "alunos-forum": ["owner", "admin", "aluno", "beta"],
  "alunos-lives": ["owner", "admin", "aluno", "beta"],
  "alunos-duvidas": ["owner", "admin", "aluno", "beta"],
  "alunos-revisao": ["owner", "admin", "aluno", "beta"],
  "alunos-laboratorio": ["owner", "admin", "aluno", "beta"],
  "alunos-calculadora": ["owner", "admin", "aluno", "beta"],
  "alunos-tabela-periodica": ["owner", "admin", "aluno", "beta"],
  "alunos-flashcards": ["owner", "admin", "aluno", "beta"],
  "alunos-metas": ["owner", "admin", "aluno", "beta"],
  "alunos-agenda": ["owner", "admin", "aluno", "beta"],
  "alunos-certificados": ["owner", "admin", "aluno", "beta"],
  "alunos-perfil": ["owner", "admin", "aluno", "beta"],
};

// ============================================
// MAPA: NAV ITEM → STATUS
// ============================================
export const NAV_STATUS: Record<NavItemKey, NavItemStatus> = {
  // Ativos
  "dashboard": "active",
  "dashboard-executivo": "active",
  "tarefas": "active",
  "integracoes": "active",
  "calendario": "active",
  "funcionarios": "active",
  "documentos": "active",
  "perfil": "active",
  "guia": "active",
  "marketing": "active",
  "lancamento": "active",
  "metricas": "active",
  "arquivos": "active",
  "leads-whatsapp": "active",
  "area-professor": "active",
  "planejamento-aula": "active",
  "laboratorio": "active",
  "turmas-online": "active",
  "turmas-presenciais": "active",
  "cursos": "active",
  "simulados": "active",
  "lives": "active",
  "entradas": "active",
  "financas-empresa": "active",
  "financas-pessoais": "active",
  "pagamentos": "active",
  "contabilidade": "active",
  "transacoes-hotmart": "active",
  "gestao-alunos": "active",
  "portal-aluno": "active",
  "relatorios": "active",
  "afiliados": "active",
  "vida-pessoal": "active",
  "pessoal": "active",
  "permissoes": "active",
  "configuracoes": "active",
  "gestao-equipe": "active",
  "gestao-site": "active",
  "gestao-dispositivos": "active",
  "auditoria-acessos": "active",
  "central-monitoramento": "active",
  "monitoramento": "active",
  "central-whatsapp": "active",
  "whatsapp-live": "active",
  "diagnostico-whatsapp": "active",
  "diagnostico-webhooks": "active",
  "central-metricas": "active",
  "central-ias": "active",
  "site-programador": "active",
  "empresas-dashboard": "active",
  "empresas-receitas": "active",
  "empresas-arquivos": "active",
  "empresas-rh": "active",
  "alunos": "active",
  "alunos-dashboard": "active",
  "alunos-cronograma": "active",
  "alunos-videoaulas": "active",
  "alunos-materiais": "active",
  "alunos-resumos": "active",
  "alunos-mapas-mentais": "active",
  "alunos-questoes": "active",
  "alunos-simulados": "active",
  "alunos-redacao": "active",
  "alunos-desempenho": "active",
  "alunos-ranking": "active",
  "alunos-conquistas": "active",
  "alunos-tutoria": "active",
  "alunos-forum": "active",
  "alunos-lives": "active",
  "alunos-duvidas": "active",
  "alunos-revisao": "active",
  "alunos-laboratorio": "active",
  "alunos-calculadora": "active",
  "alunos-tabela-periodica": "active",
  "alunos-flashcards": "active",
  "alunos-metas": "active",
  "alunos-agenda": "active",
  "alunos-certificados": "active",
  "alunos-perfil": "active",
};

// ============================================
// HELPERS
// ============================================

/**
 * Retorna a rota para um item de navegação
 */
export function getRouteForNavItem(navItemKey: NavItemKey): RouteKey {
  return NAV_ROUTE_MAP[navItemKey];
}

/**
 * Verifica se um usuário tem acesso a um item de navegação
 */
export function canAccessNavItem(navItemKey: NavItemKey, userRole: UserRole | null): boolean {
  if (!userRole) return false;
  if (userRole === "owner") return true;
  
  const allowedRoles = NAV_RBAC[navItemKey];
  return allowedRoles.includes(userRole);
}

/**
 * Retorna o status de um item de navegação
 */
export function getNavItemStatus(navItemKey: NavItemKey): NavItemStatus {
  return NAV_STATUS[navItemKey];
}

/**
 * Retorna todos os itens de navegação acessíveis por uma role
 */
export function getAccessibleNavItems(userRole: UserRole): NavItemKey[] {
  return (Object.keys(NAV_ROUTE_MAP) as NavItemKey[]).filter(
    key => canAccessNavItem(key, userRole) && getNavItemStatus(key) === "active"
  );
}

/**
 * Audita o mapa de navegação
 */
export function auditNavRouteMap(): {
  total: number;
  active: number;
  disabled: number;
  comingSoon: number;
  orphans: NavItemKey[];
} {
  const items = Object.keys(NAV_ROUTE_MAP) as NavItemKey[];
  
  let active = 0;
  let disabled = 0;
  let comingSoon = 0;
  const orphans: NavItemKey[] = [];
  
  items.forEach(key => {
    const status = NAV_STATUS[key];
    
    if (status === "active") active++;
    else if (status === "disabled") disabled++;
    else if (status === "coming_soon") comingSoon++;
    
    // Verificar se rota existe
    const routeKey = NAV_ROUTE_MAP[key];
    if (!routeKey) {
      orphans.push(key);
    }
  });
  
  return {
    total: items.length,
    active,
    disabled,
    comingSoon,
    orphans,
  };
}

// ============================================
// EXPORTS
// ============================================
export default {
  NAV_ROUTE_MAP,
  NAV_RBAC,
  NAV_STATUS,
  getRouteForNavItem,
  canAccessNavItem,
  getNavItemStatus,
  getAccessibleNavItems,
  auditNavRouteMap,
};
