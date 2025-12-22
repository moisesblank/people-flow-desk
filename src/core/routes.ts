// ============================================
// 🔥 ROUTES.TS — ROTAS CENTRALIZADAS (ZERO STRINGS SOLTAS)
// Single Source of Truth para todas as rotas do sistema
// ============================================

// ============================================
// TIPOS
// ============================================
export type RouteKey = keyof typeof ROUTES;

export interface RouteDefinition {
  path: string;
  title: string;
  authRequired: boolean;
  roles?: string[];
  status: "active" | "disabled" | "coming_soon";
  domain: RouteDomain;
}

export type RouteDomain = 
  | "public"
  | "auth"
  | "gestao"
  | "admin"
  | "owner"
  | "aluno"
  | "empresas"
  | "marketing"
  | "financas"
  | "aulas"
  | "pessoal";

// ============================================
// ROTAS DO SISTEMA (CONSTANTES TIPADAS)
// ============================================
export const ROUTES = {
  // === PÚBLICAS ===
  HOME: "/",
  SITE: "/site",
  AUTH: "/auth",
  TERMOS: "/termos",
  PRIVACIDADE: "/privacidade",
  AREA_GRATUITA: "/area-gratuita",

  // === GESTÃO (PROTEGIDAS) ===
  DASHBOARD: "/dashboard",
  APP: "/app",
  DASHBOARD_EXECUTIVO: "/dashboard-executivo",
  TAREFAS: "/tarefas",
  INTEGRACOES: "/integracoes",
  CALENDARIO: "/calendario",
  FUNCIONARIOS: "/funcionarios",
  DOCUMENTOS: "/documentos",
  PERFIL: "/perfil",
  GUIA: "/guia",
  
  // === MARKETING ===
  MARKETING: "/marketing",
  LANCAMENTO: "/lancamento",
  METRICAS: "/metricas",
  ARQUIVOS: "/arquivos",
  
  // === AULAS ===
  AREA_PROFESSOR: "/area-professor",
  PLANEJAMENTO_AULA: "/planejamento-aula",
  LABORATORIO: "/laboratorio",
  TURMAS_ONLINE: "/turmas-online",
  TURMAS_PRESENCIAIS: "/turmas-presenciais",
  CURSOS: "/cursos",
  CURSO_DETALHE: "/cursos/:courseId",
  AULA: "/cursos/:courseId/aula/:lessonId",
  SIMULADOS: "/simulados",
  LIVES: "/lives",
  
  // === FINANÇAS ===
  ENTRADAS: "/entradas",
  FINANCAS_EMPRESA: "/financas-empresa",
  FINANCAS_PESSOAIS: "/financas-pessoais",
  PAGAMENTOS: "/pagamentos",
  CONTABILIDADE: "/contabilidade",
  TRANSACOES_HOTMART: "/transacoes-hotmart",
  
  // === NEGÓCIOS ===
  GESTAO_ALUNOS: "/gestao-alunos",
  PORTAL_ALUNO: "/portal-aluno",
  RELATORIOS: "/relatorios",
  AFILIADOS: "/afiliados",
  
  // === PESSOAL ===
  VIDA_PESSOAL: "/vida-pessoal",
  PESSOAL: "/pessoal",
  
  // === ADMIN ===
  PERMISSOES: "/permissoes",
  CONFIGURACOES: "/configuracoes",
  GESTAO_EQUIPE: "/gestao-equipe",
  GESTAO_SITE: "/gestao-site",
  GESTAO_DISPOSITIVOS: "/gestao-dispositivos",
  AUDITORIA_ACESSOS: "/auditoria-acessos",
  
  // === OWNER ===
  CENTRAL_MONITORAMENTO: "/central-monitoramento",
  MONITORAMENTO: "/monitoramento",
  CENTRAL_WHATSAPP: "/central-whatsapp",
  WHATSAPP_LIVE: "/whatsapp-live",
  DIAGNOSTICO_WHATSAPP: "/diagnostico-whatsapp",
  DIAGNOSTICO_WEBHOOKS: "/diagnostico-webhooks",
  CENTRAL_METRICAS: "/central-metricas",
  CENTRAL_IAS: "/central-ias",
  LEADS_WHATSAPP: "/leads-whatsapp",
  SITE_PROGRAMADOR: "/site-programador",
  
  // === EMPRESAS ===
  EMPRESAS_DASHBOARD: "/empresas/dashboard",
  EMPRESAS_RECEITAS: "/empresas/receitas",
  EMPRESAS_ARQUIVOS: "/empresas/arquivos",
  EMPRESAS_RH: "/empresas/rh",
  
  // === PORTAL DO ALUNO ===
  ALUNOS: "/alunos",
  ALUNOS_DASHBOARD: "/alunos/dashboard",
  ALUNOS_CRONOGRAMA: "/alunos/cronograma",
  ALUNOS_VIDEOAULAS: "/alunos/videoaulas",
  ALUNOS_MATERIAIS: "/alunos/materiais",
  ALUNOS_RESUMOS: "/alunos/resumos",
  ALUNOS_MAPAS_MENTAIS: "/alunos/mapas-mentais",
  ALUNOS_QUESTOES: "/alunos/questoes",
  ALUNOS_SIMULADOS: "/alunos/simulados",
  ALUNOS_REDACAO: "/alunos/redacao",
  ALUNOS_DESEMPENHO: "/alunos/desempenho",
  ALUNOS_RANKING: "/alunos/ranking",
  ALUNOS_CONQUISTAS: "/alunos/conquistas",
  ALUNOS_TUTORIA: "/alunos/tutoria",
  ALUNOS_FORUM: "/alunos/forum",
  ALUNOS_LIVES: "/alunos/lives",
  ALUNOS_DUVIDAS: "/alunos/duvidas",
  ALUNOS_REVISAO: "/alunos/revisao",
  ALUNOS_LABORATORIO: "/alunos/laboratorio",
  ALUNOS_CALCULADORA: "/alunos/calculadora",
  ALUNOS_TABELA_PERIODICA: "/alunos/tabela-periodica",
  ALUNOS_FLASHCARDS: "/alunos/flashcards",
  ALUNOS_METAS: "/alunos/metas",
  ALUNOS_AGENDA: "/alunos/agenda",
  ALUNOS_CERTIFICADOS: "/alunos/certificados",
  ALUNOS_PERFIL: "/alunos/perfil",
  
  // === FALLBACK ===
  NOT_FOUND: "*",
  EM_DESENVOLVIMENTO: "/em-desenvolvimento",
  SEM_PERMISSAO: "/sem-permissao",
} as const;

// ============================================
// DEFINIÇÕES DE ROTAS (METADATA)
// ============================================
export const ROUTE_DEFINITIONS: Record<RouteKey, RouteDefinition> = {
  // Públicas
  HOME: { path: "/", title: "Home", authRequired: false, status: "active", domain: "public" },
  SITE: { path: "/site", title: "Site", authRequired: false, status: "active", domain: "public" },
  AUTH: { path: "/auth", title: "Login", authRequired: false, status: "active", domain: "auth" },
  TERMOS: { path: "/termos", title: "Termos de Uso", authRequired: false, status: "active", domain: "public" },
  PRIVACIDADE: { path: "/privacidade", title: "Política de Privacidade", authRequired: false, status: "active", domain: "public" },
  AREA_GRATUITA: { path: "/area-gratuita", title: "Área Gratuita", authRequired: false, status: "active", domain: "public" },
  
  // Gestão
  DASHBOARD: { path: "/dashboard", title: "Dashboard", authRequired: true, status: "active", domain: "gestao" },
  APP: { path: "/app", title: "Dashboard", authRequired: true, status: "active", domain: "gestao" },
  DASHBOARD_EXECUTIVO: { path: "/dashboard-executivo", title: "Dashboard Executivo", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "gestao" },
  TAREFAS: { path: "/tarefas", title: "Tarefas", authRequired: true, status: "active", domain: "gestao" },
  INTEGRACOES: { path: "/integracoes", title: "Integrações", authRequired: true, status: "active", domain: "gestao" },
  CALENDARIO: { path: "/calendario", title: "Calendário", authRequired: true, status: "active", domain: "gestao" },
  FUNCIONARIOS: { path: "/funcionarios", title: "Funcionários", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "gestao" },
  DOCUMENTOS: { path: "/documentos", title: "Documentos", authRequired: true, status: "active", domain: "gestao" },
  PERFIL: { path: "/perfil", title: "Perfil", authRequired: true, status: "active", domain: "gestao" },
  GUIA: { path: "/guia", title: "Guia", authRequired: true, status: "active", domain: "gestao" },
  
  // Marketing
  MARKETING: { path: "/marketing", title: "Marketing", authRequired: true, roles: ["owner", "admin", "marketing"], status: "active", domain: "marketing" },
  LANCAMENTO: { path: "/lancamento", title: "Lançamento", authRequired: true, roles: ["owner", "admin", "marketing"], status: "active", domain: "marketing" },
  METRICAS: { path: "/metricas", title: "Métricas", authRequired: true, status: "active", domain: "marketing" },
  ARQUIVOS: { path: "/arquivos", title: "Arquivos", authRequired: true, status: "active", domain: "marketing" },
  
  // Aulas
  AREA_PROFESSOR: { path: "/area-professor", title: "Área do Professor", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  PLANEJAMENTO_AULA: { path: "/planejamento-aula", title: "Planejamento de Aula", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  LABORATORIO: { path: "/laboratorio", title: "Laboratório", authRequired: true, status: "active", domain: "aulas" },
  TURMAS_ONLINE: { path: "/turmas-online", title: "Turmas Online", authRequired: true, status: "active", domain: "aulas" },
  TURMAS_PRESENCIAIS: { path: "/turmas-presenciais", title: "Turmas Presenciais", authRequired: true, status: "active", domain: "aulas" },
  CURSOS: { path: "/cursos", title: "Cursos", authRequired: true, status: "active", domain: "aulas" },
  CURSO_DETALHE: { path: "/cursos/:courseId", title: "Detalhe do Curso", authRequired: true, status: "active", domain: "aulas" },
  AULA: { path: "/cursos/:courseId/aula/:lessonId", title: "Aula", authRequired: true, status: "active", domain: "aulas" },
  SIMULADOS: { path: "/simulados", title: "Simulados", authRequired: true, status: "active", domain: "aulas" },
  LIVES: { path: "/lives", title: "Lives", authRequired: true, status: "active", domain: "aulas" },
  
  // Finanças
  ENTRADAS: { path: "/entradas", title: "Entradas", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  FINANCAS_EMPRESA: { path: "/financas-empresa", title: "Finanças da Empresa", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  FINANCAS_PESSOAIS: { path: "/financas-pessoais", title: "Finanças Pessoais", authRequired: true, status: "active", domain: "financas" },
  PAGAMENTOS: { path: "/pagamentos", title: "Pagamentos", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  CONTABILIDADE: { path: "/contabilidade", title: "Contabilidade", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  TRANSACOES_HOTMART: { path: "/transacoes-hotmart", title: "Transações Hotmart", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "financas" },
  
  // Negócios
  GESTAO_ALUNOS: { path: "/gestao-alunos", title: "Gestão de Alunos", authRequired: true, roles: ["owner", "admin", "suporte"], status: "active", domain: "gestao" },
  PORTAL_ALUNO: { path: "/portal-aluno", title: "Portal do Aluno", authRequired: true, status: "active", domain: "aluno" },
  RELATORIOS: { path: "/relatorios", title: "Relatórios", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "gestao" },
  AFILIADOS: { path: "/afiliados", title: "Afiliados", authRequired: true, roles: ["owner", "admin", "afiliado"], status: "active", domain: "gestao" },
  
  // Pessoal
  VIDA_PESSOAL: { path: "/vida-pessoal", title: "Vida Pessoal", authRequired: true, status: "active", domain: "pessoal" },
  PESSOAL: { path: "/pessoal", title: "Pessoal", authRequired: true, status: "active", domain: "pessoal" },
  
  // Admin
  PERMISSOES: { path: "/permissoes", title: "Permissões", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  CONFIGURACOES: { path: "/configuracoes", title: "Configurações", authRequired: true, status: "active", domain: "admin" },
  GESTAO_EQUIPE: { path: "/gestao-equipe", title: "Gestão de Equipe", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  GESTAO_SITE: { path: "/gestao-site", title: "Gestão do Site", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  GESTAO_DISPOSITIVOS: { path: "/gestao-dispositivos", title: "Gestão de Dispositivos", authRequired: true, status: "active", domain: "admin" },
  AUDITORIA_ACESSOS: { path: "/auditoria-acessos", title: "Auditoria de Acessos", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  
  // Owner
  CENTRAL_MONITORAMENTO: { path: "/central-monitoramento", title: "Central de Monitoramento", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  MONITORAMENTO: { path: "/monitoramento", title: "Monitoramento", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  CENTRAL_WHATSAPP: { path: "/central-whatsapp", title: "Central WhatsApp", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  WHATSAPP_LIVE: { path: "/whatsapp-live", title: "WhatsApp Live", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  DIAGNOSTICO_WHATSAPP: { path: "/diagnostico-whatsapp", title: "Diagnóstico WhatsApp", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  DIAGNOSTICO_WEBHOOKS: { path: "/diagnostico-webhooks", title: "Diagnóstico Webhooks", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  CENTRAL_METRICAS: { path: "/central-metricas", title: "Central de Métricas", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  CENTRAL_IAS: { path: "/central-ias", title: "Central de IAs", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  LEADS_WHATSAPP: { path: "/leads-whatsapp", title: "Leads WhatsApp", authRequired: true, roles: ["owner", "admin", "marketing"], status: "active", domain: "owner" },
  SITE_PROGRAMADOR: { path: "/site-programador", title: "Site Programador", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  
  // Empresas
  EMPRESAS_DASHBOARD: { path: "/empresas/dashboard", title: "Dashboard Empresarial", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "empresas" },
  EMPRESAS_RECEITAS: { path: "/empresas/receitas", title: "Receitas Empresariais", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "empresas" },
  EMPRESAS_ARQUIVOS: { path: "/empresas/arquivos", title: "Arquivos Empresariais", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "empresas" },
  EMPRESAS_RH: { path: "/empresas/rh", title: "RH", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "empresas" },
  
  // Portal do Aluno
  ALUNOS: { path: "/alunos", title: "Central do Aluno", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_DASHBOARD: { path: "/alunos/dashboard", title: "Dashboard do Aluno", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_CRONOGRAMA: { path: "/alunos/cronograma", title: "Cronograma", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_VIDEOAULAS: { path: "/alunos/videoaulas", title: "Videoaulas", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_MATERIAIS: { path: "/alunos/materiais", title: "Materiais", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_RESUMOS: { path: "/alunos/resumos", title: "Resumos", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_MAPAS_MENTAIS: { path: "/alunos/mapas-mentais", title: "Mapas Mentais", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_QUESTOES: { path: "/alunos/questoes", title: "Questões", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_SIMULADOS: { path: "/alunos/simulados", title: "Simulados", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_REDACAO: { path: "/alunos/redacao", title: "Redação", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_DESEMPENHO: { path: "/alunos/desempenho", title: "Desempenho", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_RANKING: { path: "/alunos/ranking", title: "Ranking", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_CONQUISTAS: { path: "/alunos/conquistas", title: "Conquistas", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_TUTORIA: { path: "/alunos/tutoria", title: "Tutoria", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_FORUM: { path: "/alunos/forum", title: "Fórum", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_LIVES: { path: "/alunos/lives", title: "Lives", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_DUVIDAS: { path: "/alunos/duvidas", title: "Dúvidas", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_REVISAO: { path: "/alunos/revisao", title: "Revisão", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_LABORATORIO: { path: "/alunos/laboratorio", title: "Laboratório", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_CALCULADORA: { path: "/alunos/calculadora", title: "Calculadora", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_TABELA_PERIODICA: { path: "/alunos/tabela-periodica", title: "Tabela Periódica", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_FLASHCARDS: { path: "/alunos/flashcards", title: "Flashcards", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_METAS: { path: "/alunos/metas", title: "Metas", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_AGENDA: { path: "/alunos/agenda", title: "Agenda", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_CERTIFICADOS: { path: "/alunos/certificados", title: "Certificados", authRequired: true, status: "active", domain: "aluno" },
  ALUNOS_PERFIL: { path: "/alunos/perfil", title: "Perfil", authRequired: true, status: "active", domain: "aluno" },
  
  // Fallback
  NOT_FOUND: { path: "*", title: "Página não encontrada", authRequired: false, status: "active", domain: "public" },
  EM_DESENVOLVIMENTO: { path: "/em-desenvolvimento", title: "Em Desenvolvimento", authRequired: true, status: "coming_soon", domain: "gestao" },
  SEM_PERMISSAO: { path: "/sem-permissao", title: "Sem Permissão", authRequired: true, status: "active", domain: "gestao" },
};

// ============================================
// HELPERS
// ============================================

/**
 * Retorna o path de uma rota
 */
export function getRoute(key: RouteKey): string {
  return ROUTES[key];
}

/**
 * Retorna o path de uma rota com parâmetros substituídos
 */
export function getRouteWithParams(key: RouteKey, params: Record<string, string>): string {
  let path = ROUTES[key];
  Object.entries(params).forEach(([paramKey, value]) => {
    path = path.replace(`:${paramKey}`, value);
  });
  return path;
}

/**
 * Verifica se uma rota existe
 */
export function isValidRoute(path: string): boolean {
  return Object.values(ROUTES).includes(path as any);
}

/**
 * Retorna a definição de uma rota
 */
export function getRouteDefinition(key: RouteKey): RouteDefinition {
  return ROUTE_DEFINITIONS[key];
}

/**
 * Verifica se o usuário tem acesso a uma rota
 */
export function canAccessRoute(key: RouteKey, userRole?: string | null): boolean {
  const def = ROUTE_DEFINITIONS[key];
  
  if (!def.authRequired) return true;
  if (!def.roles) return true;
  if (!userRole) return false;
  
  return def.roles.includes(userRole) || userRole === "owner";
}

/**
 * Retorna todas as rotas de um domínio
 */
export function getRoutesByDomain(domain: RouteDomain): RouteKey[] {
  return (Object.keys(ROUTE_DEFINITIONS) as RouteKey[]).filter(
    key => ROUTE_DEFINITIONS[key].domain === domain
  );
}

// ============================================
// EXPORTS
// ============================================
export default ROUTES;
