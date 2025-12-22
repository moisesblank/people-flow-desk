// ============================================
// 🔥🛡️ ROUTES OMEGA v3.0 🛡️🔥
// DEFINIÇÃO CENTRALIZADA DE TODAS AS ROTAS
// ============================================
// 150+ rotas organizadas por área
// ============================================

import type { SystemDomain } from "./urlAccessControl";

// ============================================
// TIPOS
// ============================================

export interface RouteDefinition {
  path: string;
  domain: SystemDomain;
  title: string;
  requiresAuth: boolean;
}

// ============================================
// ROTAS PÚBLICAS (Qualquer um)
// ============================================

export const PUBLIC_ROUTES: RouteDefinition[] = [
  { path: "/", domain: "publico", title: "Home", requiresAuth: false },
  { path: "/site", domain: "publico", title: "Site", requiresAuth: false },
  { path: "/auth", domain: "publico", title: "Login", requiresAuth: false },
  { path: "/termos", domain: "publico", title: "Termos de Uso", requiresAuth: false },
  { path: "/privacidade", domain: "publico", title: "Privacidade", requiresAuth: false },
  { path: "/area-gratuita", domain: "publico", title: "Área Gratuita", requiresAuth: false },
  { path: "/cadastro", domain: "publico", title: "Cadastro", requiresAuth: false },
  { path: "/login", domain: "publico", title: "Login", requiresAuth: false },
  { path: "/recuperar-senha", domain: "publico", title: "Recuperar Senha", requiresAuth: false },
];

// ============================================
// ROTAS DA COMUNIDADE (Não pagante + Beta)
// ============================================

export const COMMUNITY_ROUTES: RouteDefinition[] = [
  { path: "/comunidade", domain: "comunidade", title: "Comunidade", requiresAuth: true },
  { path: "/comunidade/forum", domain: "comunidade", title: "Fórum", requiresAuth: true },
  { path: "/comunidade/posts", domain: "comunidade", title: "Posts", requiresAuth: true },
  { path: "/comunidade/membros", domain: "comunidade", title: "Membros", requiresAuth: true },
  { path: "/comunidade/eventos", domain: "comunidade", title: "Eventos", requiresAuth: true },
  { path: "/comunidade/chat", domain: "comunidade", title: "Chat", requiresAuth: true },
];

// ============================================
// ROTAS DO ALUNO BETA (Pagante)
// ============================================

export const STUDENT_ROUTES: RouteDefinition[] = [
  { path: "/alunos", domain: "alunos", title: "Portal do Aluno", requiresAuth: true },
  { path: "/alunos/dashboard", domain: "alunos", title: "Dashboard", requiresAuth: true },
  { path: "/alunos/cronograma", domain: "alunos", title: "Cronograma", requiresAuth: true },
  { path: "/alunos/videoaulas", domain: "alunos", title: "Videoaulas", requiresAuth: true },
  { path: "/alunos/materiais", domain: "alunos", title: "Materiais", requiresAuth: true },
  { path: "/alunos/resumos", domain: "alunos", title: "Resumos", requiresAuth: true },
  { path: "/alunos/mapas-mentais", domain: "alunos", title: "Mapas Mentais", requiresAuth: true },
  { path: "/alunos/questoes", domain: "alunos", title: "Questões", requiresAuth: true },
  { path: "/alunos/simulados", domain: "alunos", title: "Simulados", requiresAuth: true },
  { path: "/alunos/redacao", domain: "alunos", title: "Redação", requiresAuth: true },
  { path: "/alunos/desempenho", domain: "alunos", title: "Desempenho", requiresAuth: true },
  { path: "/alunos/ranking", domain: "alunos", title: "Ranking", requiresAuth: true },
  { path: "/alunos/conquistas", domain: "alunos", title: "Conquistas", requiresAuth: true },
  { path: "/alunos/tutoria", domain: "alunos", title: "Tutoria IA", requiresAuth: true },
  { path: "/alunos/forum", domain: "alunos", title: "Fórum", requiresAuth: true },
  { path: "/alunos/lives", domain: "alunos", title: "Lives", requiresAuth: true },
  { path: "/alunos/duvidas", domain: "alunos", title: "Dúvidas", requiresAuth: true },
  { path: "/alunos/revisao", domain: "alunos", title: "Revisão", requiresAuth: true },
  { path: "/alunos/laboratorio", domain: "alunos", title: "Laboratório Virtual", requiresAuth: true },
  { path: "/alunos/calculadora", domain: "alunos", title: "Calculadora", requiresAuth: true },
  { path: "/alunos/tabela-periodica", domain: "alunos", title: "Tabela Periódica", requiresAuth: true },
  { path: "/alunos/flashcards", domain: "alunos", title: "Flashcards", requiresAuth: true },
  { path: "/alunos/metas", domain: "alunos", title: "Metas", requiresAuth: true },
  { path: "/alunos/agenda", domain: "alunos", title: "Agenda", requiresAuth: true },
  { path: "/alunos/certificados", domain: "alunos", title: "Certificados", requiresAuth: true },
  { path: "/alunos/perfil", domain: "alunos", title: "Meu Perfil", requiresAuth: true },
  { path: "/alunos/cursos", domain: "alunos", title: "Cursos", requiresAuth: true },
  { path: "/alunos/aulas", domain: "alunos", title: "Aulas", requiresAuth: true },
  { path: "/alunos/progresso", domain: "alunos", title: "Progresso", requiresAuth: true },
  { path: "/alunos/historico", domain: "alunos", title: "Histórico", requiresAuth: true },
];

// ============================================
// ROTAS DE GESTÃO (Funcionários)
// ============================================

export const MANAGEMENT_ROUTES: RouteDefinition[] = [
  // Dashboard
  { path: "/gestao", domain: "gestao", title: "Gestão", requiresAuth: true },
  { path: "/gestao/dashboard", domain: "gestao", title: "Dashboard", requiresAuth: true },
  { path: "/gestao/dashboard-executivo", domain: "gestao", title: "Dashboard Executivo", requiresAuth: true },
  
  // Operacional
  { path: "/gestao/tarefas", domain: "gestao", title: "Tarefas", requiresAuth: true },
  { path: "/gestao/integracoes", domain: "gestao", title: "Integrações", requiresAuth: true },
  { path: "/gestao/calendario", domain: "gestao", title: "Calendário", requiresAuth: true },
  { path: "/gestao/funcionarios", domain: "gestao", title: "Funcionários", requiresAuth: true },
  { path: "/gestao/documentos", domain: "gestao", title: "Documentos", requiresAuth: true },
  { path: "/gestao/perfil", domain: "gestao", title: "Meu Perfil", requiresAuth: true },
  { path: "/gestao/guia", domain: "gestao", title: "Guia", requiresAuth: true },
  
  // Marketing
  { path: "/gestao/marketing", domain: "gestao", title: "Marketing", requiresAuth: true },
  { path: "/gestao/lancamento", domain: "gestao", title: "Lançamento", requiresAuth: true },
  { path: "/gestao/metricas", domain: "gestao", title: "Métricas", requiresAuth: true },
  { path: "/gestao/arquivos", domain: "gestao", title: "Arquivos", requiresAuth: true },
  
  // Pedagógico
  { path: "/gestao/area-professor", domain: "gestao", title: "Área do Professor", requiresAuth: true },
  { path: "/gestao/planejamento-aula", domain: "gestao", title: "Planejamento de Aula", requiresAuth: true },
  { path: "/gestao/laboratorio", domain: "gestao", title: "Laboratório", requiresAuth: true },
  { path: "/gestao/turmas-online", domain: "gestao", title: "Turmas Online", requiresAuth: true },
  { path: "/gestao/turmas-presenciais", domain: "gestao", title: "Turmas Presenciais", requiresAuth: true },
  { path: "/gestao/cursos", domain: "gestao", title: "Cursos", requiresAuth: true },
  { path: "/gestao/simulados", domain: "gestao", title: "Simulados", requiresAuth: true },
  { path: "/gestao/lives", domain: "gestao", title: "Lives", requiresAuth: true },
  
  // Financeiro
  { path: "/gestao/entradas", domain: "gestao", title: "Entradas", requiresAuth: true },
  { path: "/gestao/financas-empresa", domain: "gestao", title: "Finanças Empresa", requiresAuth: true },
  { path: "/gestao/financas-pessoais", domain: "gestao", title: "Finanças Pessoais", requiresAuth: true },
  { path: "/gestao/pagamentos", domain: "gestao", title: "Pagamentos", requiresAuth: true },
  { path: "/gestao/contabilidade", domain: "gestao", title: "Contabilidade", requiresAuth: true },
  { path: "/gestao/transacoes-hotmart", domain: "gestao", title: "Transações Hotmart", requiresAuth: true },
  
  // Alunos
  { path: "/gestao/gestao-alunos", domain: "gestao", title: "Gestão de Alunos", requiresAuth: true },
  { path: "/gestao/portal-aluno", domain: "gestao", title: "Portal do Aluno", requiresAuth: true },
  { path: "/gestao/relatorios", domain: "gestao", title: "Relatórios", requiresAuth: true },
  { path: "/gestao/afiliados", domain: "gestao", title: "Afiliados", requiresAuth: true },
  
  // Configurações
  { path: "/gestao/permissoes", domain: "gestao", title: "Permissões", requiresAuth: true },
  { path: "/gestao/configuracoes", domain: "gestao", title: "Configurações", requiresAuth: true },
  { path: "/gestao/gestao-equipe", domain: "gestao", title: "Gestão de Equipe", requiresAuth: true },
  { path: "/gestao/gestao-site", domain: "gestao", title: "Gestão do Site", requiresAuth: true },
  { path: "/gestao/gestao-dispositivos", domain: "gestao", title: "Gestão de Dispositivos", requiresAuth: true },
  { path: "/gestao/auditoria-acessos", domain: "gestao", title: "Auditoria de Acessos", requiresAuth: true },
  
  // Empresas
  { path: "/gestao/empresas/dashboard", domain: "gestao", title: "Dashboard Empresarial", requiresAuth: true },
  { path: "/gestao/empresas/receitas", domain: "gestao", title: "Receitas", requiresAuth: true },
  { path: "/gestao/empresas/arquivos", domain: "gestao", title: "Arquivos Empresariais", requiresAuth: true },
  { path: "/gestao/empresas/rh", domain: "gestao", title: "RH", requiresAuth: true },
];

// ============================================
// ROTAS OWNER ONLY
// ============================================

export const OWNER_ROUTES: RouteDefinition[] = [
  { path: "/gestao/central-monitoramento", domain: "owner", title: "Central de Monitoramento", requiresAuth: true },
  { path: "/gestao/diagnostico-whatsapp", domain: "owner", title: "Diagnóstico WhatsApp", requiresAuth: true },
  { path: "/gestao/diagnostico-webhooks", domain: "owner", title: "Diagnóstico Webhooks", requiresAuth: true },
  { path: "/gestao/site-programador", domain: "owner", title: "Site Programador", requiresAuth: true },
  { path: "/gestao/central-diagnostico", domain: "owner", title: "Central de Diagnóstico", requiresAuth: true },
  { path: "/gestao/vida-pessoal", domain: "owner", title: "Vida Pessoal", requiresAuth: true },
  { path: "/gestao/pessoal", domain: "owner", title: "Pessoal", requiresAuth: true },
  { path: "/gestao/master", domain: "owner", title: "Master", requiresAuth: true },
  { path: "/gestao/owner", domain: "owner", title: "Owner", requiresAuth: true },
  { path: "/central-diagnostico", domain: "owner", title: "Central de Diagnóstico", requiresAuth: true },
];

// ============================================
// ROTAS LEGADAS (Compatibilidade)
// ============================================

export const LEGACY_ROUTES: RouteDefinition[] = [
  // Rotas antigas sem /gestao
  { path: "/dashboard", domain: "gestao", title: "Dashboard", requiresAuth: true },
  { path: "/tarefas", domain: "gestao", title: "Tarefas", requiresAuth: true },
  { path: "/funcionarios", domain: "gestao", title: "Funcionários", requiresAuth: true },
  { path: "/marketing", domain: "gestao", title: "Marketing", requiresAuth: true },
  { path: "/entradas", domain: "gestao", title: "Entradas", requiresAuth: true },
  { path: "/financas-empresa", domain: "gestao", title: "Finanças Empresa", requiresAuth: true },
  { path: "/financas-pessoais", domain: "gestao", title: "Finanças Pessoais", requiresAuth: true },
  { path: "/cursos", domain: "gestao", title: "Cursos", requiresAuth: true },
  { path: "/simulados", domain: "gestao", title: "Simulados", requiresAuth: true },
  { path: "/afiliados", domain: "gestao", title: "Afiliados", requiresAuth: true },
  { path: "/gestao-alunos", domain: "gestao", title: "Gestão de Alunos", requiresAuth: true },
  { path: "/relatorios", domain: "gestao", title: "Relatórios", requiresAuth: true },
  { path: "/configuracoes", domain: "gestao", title: "Configurações", requiresAuth: true },
];

// ============================================
// TODAS AS ROTAS
// ============================================

export const ALL_ROUTES: RouteDefinition[] = [
  ...PUBLIC_ROUTES,
  ...COMMUNITY_ROUTES,
  ...STUDENT_ROUTES,
  ...MANAGEMENT_ROUTES,
  ...OWNER_ROUTES,
  ...LEGACY_ROUTES,
];

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Busca uma rota pelo path
 */
export function findRoute(path: string): RouteDefinition | undefined {
  return ALL_ROUTES.find(r => r.path === path);
}

/**
 * Obtém todas as rotas de um domínio
 */
export function getRoutesByDomain(domain: SystemDomain): RouteDefinition[] {
  return ALL_ROUTES.filter(r => r.domain === domain);
}

/**
 * Verifica se uma rota requer autenticação
 */
export function requiresAuth(path: string): boolean {
  const route = findRoute(path);
  return route?.requiresAuth ?? true;
}
