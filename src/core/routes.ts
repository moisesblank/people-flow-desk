// ============================================
// 🔥 ROUTES.TS — ROTAS CENTRALIZADAS (MAPA DEFINITIVO OMEGA v2)
// Single Source of Truth para todas as rotas do sistema
// PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
// 
// ⚠️ ARQUITETURA MONO-DOMÍNIO v2.0 (27/12/2025)
// - DOMÍNIO ÚNICO: pro.moisesmedeiros.com.br
// - Área Staff: pro.moisesmedeiros.com.br/gestaofc (ROTA INTERNA)
// - Rotas definidas em src/routes/gestaofcRoutes.tsx
//
// ============================================
// 📍 MAPA DE URLs DEFINITIVO v2.0 (REGRA SUPREMA)
// ============================================
//
// 🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
// 👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
// 👔 FUNCIONÁRIO: pro.moisesmedeiros.com.br/gestaofc (SECRETO - só URL direta)
// 👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import type { SystemDomain } from "./urlAccessControl";

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
  requiresAuth?: boolean; // Legacy compatibility
}

export type RouteDomain = 
  | "public"      // Qualquer um
  | "auth"        // Login/registro
  | "comunidade"  // Não pagante (cadastro grátis)
  | "aluno"       // Aluno Beta (pagante)
  | "gestao"      // Funcionários
  | "admin"       // Admin
  | "owner"       // Apenas owner
  | "empresas"    // Empresas
  | "marketing"   // Marketing
  | "financas"    // Finanças
  | "aulas"       // Aulas/Cursos
  | "pessoal"     // Pessoal do owner
  | "publico"     // Alias para public
  | "alunos";     // Alias para aluno

// ============================================
// ROTAS DO SISTEMA (CONSTANTES TIPADAS)
// ============================================
export const ROUTES = {
  // === PÚBLICAS (QUALQUER UM) ===
  HOME: "/",
  SITE: "/site",
  AUTH: "/auth",
  TERMOS: "/termos",
  PRIVACIDADE: "/privacidade",
  AREA_GRATUITA: "/area-gratuita",
  CADASTRO: "/cadastro",
  LOGIN: "/login",
  RECUPERAR_SENHA: "/recuperar-senha",

  // === COMUNIDADE (NÃO PAGANTE - CADASTRO GRÁTIS) ===
  COMUNIDADE: "/comunidade",
  COMUNIDADE_FORUM: "/comunidade/forum",
  COMUNIDADE_POSTS: "/comunidade/posts",
  COMUNIDADE_MEMBROS: "/comunidade/membros",
  COMUNIDADE_EVENTOS: "/comunidade/eventos",
  COMUNIDADE_CHAT: "/comunidade/chat",

  // === PORTAL DO ALUNO BETA (PAGANTE) ===
  ALUNOS: "/alunos",
  ALUNOS_DASHBOARD: "/alunos/dashboard",
  ALUNOS_LIVRO_WEB: "/alunos/livro-web",
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
  // DEPRECATED: Flashcards migrado para /alunos/materiais
  ALUNOS_FLASHCARDS: "/alunos/materiais",
  ALUNOS_METAS: "/alunos/metas",
  ALUNOS_AGENDA: "/alunos/agenda",
  ALUNOS_CERTIFICADOS: "/alunos/certificados",
  ALUNOS_PERFIL: "/alunos/perfil",
  ALUNOS_CURSOS: "/alunos/cursos",
  ALUNOS_AULAS: "/alunos/aulas",
  ALUNOS_PROGRESSO: "/alunos/progresso",
  ALUNOS_HISTORICO: "/alunos/historico",

  // === GESTÃO (FUNCIONÁRIOS) ===
  GESTAO: "/gestao",
  GESTAO_DASHBOARD: "/gestao/dashboard",
  GESTAO_DASHBOARD_EXECUTIVO: "/gestao/dashboard-executivo",
  GESTAO_TAREFAS: "/gestao/tarefas",
  GESTAO_INTEGRACOES: "/gestao/integracoes",
  GESTAO_CALENDARIO: "/gestao/calendario",
  GESTAO_FUNCIONARIOS: "/gestao/funcionarios",
  GESTAO_DOCUMENTOS: "/gestao/documentos",
  GESTAO_PERFIL: "/gestao/perfil",
  GESTAO_GUIA: "/gestao/guia",
  
  // Gestão - Marketing
  GESTAO_MARKETING: "/gestao/marketing",
  GESTAO_LANCAMENTO: "/gestao/lancamento",
  GESTAO_METRICAS: "/gestao/metricas",
  GESTAO_ARQUIVOS: "/gestao/arquivos",
  
  // Gestão - Aulas
  GESTAO_AREA_PROFESSOR: "/gestao/area-professor",
  GESTAO_PLANEJAMENTO_AULA: "/gestao/planejamento-aula",
  GESTAO_LABORATORIO: "/gestao/laboratorio",
  GESTAO_TURMAS_ONLINE: "/gestao/turmas-online",
  GESTAO_TURMAS_PRESENCIAIS: "/gestao/turmas-presenciais",
  GESTAO_CURSOS: "/gestao/cursos",
  GESTAO_SIMULADOS: "/gestao/simulados",
  GESTAO_LIVES: "/gestao/lives",
  
  // Gestão - Finanças
  GESTAO_ENTRADAS: "/gestao/entradas",
  GESTAO_FINANCAS_EMPRESA: "/gestao/financas-empresa",
  GESTAO_FINANCAS_PESSOAIS: "/gestao/financas-pessoais",
  GESTAO_PAGAMENTOS: "/gestao/pagamentos",
  GESTAO_CONTABILIDADE: "/gestao/contabilidade",
  GESTAO_TRANSACOES_HOTMART: "/gestao/transacoes-hotmart",
  
  // Gestão - Alunos
  GESTAO_ALUNOS: "/gestao/gestao-alunos",
  GESTAO_PORTAL_ALUNO: "/gestao/portal-aluno",
  GESTAO_RELATORIOS: "/gestao/relatorios",
  GESTAO_AFILIADOS: "/gestao/afiliados",
  
  // Gestão - Admin
  GESTAO_PERMISSOES: "/gestao/permissoes",
  GESTAO_CONFIGURACOES: "/gestao/configuracoes",
  GESTAO_EQUIPE: "/gestao/gestao-equipe",
  GESTAO_SITE: "/gestao/gestao-site",
  GESTAO_DISPOSITIVOS: "/gestao/gestao-dispositivos",
  GESTAO_AUDITORIA: "/gestao/auditoria-acessos",
  
  // Gestão - Owner
  GESTAO_CENTRAL_MONITORAMENTO: "/gestao/central-monitoramento",
  GESTAO_MONITORAMENTO: "/gestao/monitoramento",
  GESTAO_CENTRAL_WHATSAPP: "/gestao/central-whatsapp",
  GESTAO_WHATSAPP_LIVE: "/gestao/whatsapp-live",
  GESTAO_DIAGNOSTICO_WHATSAPP: "/gestao/diagnostico-whatsapp",
  GESTAO_DIAGNOSTICO_WEBHOOKS: "/gestao/diagnostico-webhooks",
  GESTAO_CENTRAL_METRICAS: "/gestao/central-metricas",
  GESTAO_CENTRAL_IAS: "/gestao/central-ias",
  GESTAO_LEADS_WHATSAPP: "/gestao/leads-whatsapp",
  GESTAO_SITE_PROGRAMADOR: "/gestao/site-programador",
  GESTAO_CENTRAL_DIAGNOSTICO: "/gestao/central-diagnostico",
  GESTAO_VIDA_PESSOAL: "/gestao/vida-pessoal",
  GESTAO_PESSOAL: "/gestao/pessoal",
  GESTAO_MASTER: "/gestao/master",
  GESTAO_OWNER: "/gestao/owner",
  
  // Gestão - Empresas
  GESTAO_EMPRESAS_DASHBOARD: "/gestao/empresas/dashboard",
  GESTAO_EMPRESAS_RECEITAS: "/gestao/empresas/receitas",
  GESTAO_EMPRESAS_ARQUIVOS: "/gestao/empresas/arquivos",
  GESTAO_EMPRESAS_RH: "/gestao/empresas/rh",

  // === ROTAS LEGADAS ===
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
  MARKETING: "/marketing",
  LANCAMENTO: "/lancamento",
  METRICAS: "/metricas",
  ARQUIVOS: "/arquivos",
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
  ENTRADAS: "/entradas",
  FINANCAS_EMPRESA: "/financas-empresa",
  FINANCAS_PESSOAIS: "/financas-pessoais",
  PAGAMENTOS: "/pagamentos",
  CONTABILIDADE: "/contabilidade",
  TRANSACOES_HOTMART: "/transacoes-hotmart",
  GESTAO_ALUNOS_LEGACY: "/gestao-alunos",
  PORTAL_ALUNO: "/portal-aluno",
  RELATORIOS: "/relatorios",
  AFILIADOS: "/afiliados",
  VIDA_PESSOAL: "/vida-pessoal",
  PESSOAL: "/pessoal",
  PERMISSOES: "/permissoes",
  CONFIGURACOES: "/configuracoes",
  GESTAO_EQUIPE_LEGACY: "/gestao-equipe",
  GESTAO_SITE_LEGACY: "/gestao-site",
  GESTAO_DISPOSITIVOS_LEGACY: "/gestao-dispositivos",
  AUDITORIA_ACESSOS: "/auditoria-acessos",
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
  EMPRESAS_DASHBOARD: "/empresas/dashboard",
  EMPRESAS_RECEITAS: "/empresas/receitas",
  EMPRESAS_ARQUIVOS: "/empresas/arquivos",
  EMPRESAS_RH: "/empresas/rh",

  // === DIAGNÓSTICO (OWNER) ===
  CENTRAL_DIAGNOSTICO: "/central-diagnostico",

  // === FALLBACK ===
  NOT_FOUND: "*",
  EM_DESENVOLVIMENTO: "/em-desenvolvimento",
  SEM_PERMISSAO: "/sem-permissao",
} as const;

// ============================================
// ARRAYS DE ROTAS POR CATEGORIA (LEGACY COMPAT)
// ============================================

export const PUBLIC_ROUTES: RouteDefinition[] = [
  { path: "/", domain: "public", title: "Home", authRequired: false, status: "active", requiresAuth: false },
  { path: "/site", domain: "public", title: "Site", authRequired: false, status: "active", requiresAuth: false },
  { path: "/auth", domain: "auth", title: "Login", authRequired: false, status: "active", requiresAuth: false },
  { path: "/termos", domain: "public", title: "Termos de Uso", authRequired: false, status: "active", requiresAuth: false },
  { path: "/privacidade", domain: "public", title: "Privacidade", authRequired: false, status: "active", requiresAuth: false },
  { path: "/area-gratuita", domain: "public", title: "Área Gratuita", authRequired: false, status: "active", requiresAuth: false },
  { path: "/cadastro", domain: "auth", title: "Cadastro", authRequired: false, status: "active", requiresAuth: false },
  { path: "/login", domain: "auth", title: "Login", authRequired: false, status: "active", requiresAuth: false },
  { path: "/recuperar-senha", domain: "auth", title: "Recuperar Senha", authRequired: false, status: "active", requiresAuth: false },
];

export const COMMUNITY_ROUTES: RouteDefinition[] = [
  { path: "/comunidade", domain: "comunidade", title: "Comunidade", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  { path: "/comunidade/forum", domain: "comunidade", title: "Fórum", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  { path: "/comunidade/posts", domain: "comunidade", title: "Posts", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  { path: "/comunidade/membros", domain: "comunidade", title: "Membros", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  { path: "/comunidade/eventos", domain: "comunidade", title: "Eventos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  { path: "/comunidade/chat", domain: "comunidade", title: "Chat", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  { path: "/comunidade/pps", domain: "comunidade", title: "PPS", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno", "viewer"] },
];

export const STUDENT_ROUTES: RouteDefinition[] = [
  { path: "/alunos/dashboard", domain: "aluno", title: "Portal do Aluno", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/dashboard", domain: "aluno", title: "Dashboard", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/livro-web", domain: "aluno", title: "Livro Web", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/cronograma", domain: "aluno", title: "Cronograma", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/videoaulas", domain: "aluno", title: "Videoaulas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/materiais", domain: "aluno", title: "Materiais", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/resumos", domain: "aluno", title: "Resumos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/mapas-mentais", domain: "aluno", title: "Mapas Mentais", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/questoes", domain: "aluno", title: "Questões", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/simulados", domain: "aluno", title: "Simulados", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/redacao", domain: "aluno", title: "Redação", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/desempenho", domain: "aluno", title: "Desempenho", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/ranking", domain: "aluno", title: "Ranking", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/conquistas", domain: "aluno", title: "Conquistas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/tutoria", domain: "aluno", title: "Tutoria IA", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/forum", domain: "aluno", title: "Fórum", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/lives", domain: "aluno", title: "Lives", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/duvidas", domain: "aluno", title: "Dúvidas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/revisao", domain: "aluno", title: "Revisão", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/laboratorio", domain: "aluno", title: "Laboratório Virtual", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/calculadora", domain: "aluno", title: "Calculadora", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/tabela-periodica", domain: "aluno", title: "Tabela Periódica", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  // DEPRECATED: Flashcards migrado para /alunos/materiais (redirect ativo)
  { path: "/alunos/flashcards", domain: "aluno", title: "Flashcards", authRequired: true, status: "disabled", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/metas", domain: "aluno", title: "Metas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/agenda", domain: "aluno", title: "Agenda", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/certificados", domain: "aluno", title: "Certificados", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/perfil", domain: "aluno", title: "Meu Perfil", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/cursos", domain: "aluno", title: "Cursos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/aulas", domain: "aluno", title: "Aulas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/progresso", domain: "aluno", title: "Progresso", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
  { path: "/alunos/historico", domain: "aluno", title: "Histórico", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "beta", "aluno"] },
];

export const MANAGEMENT_ROUTES: RouteDefinition[] = [
  { path: "/gestao", domain: "gestao", title: "Gestão", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"] },
  { path: "/gestao/dashboard", domain: "gestao", title: "Dashboard", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"] },
  { path: "/gestao/dashboard-executivo", domain: "gestao", title: "Dashboard Executivo", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/tarefas", domain: "gestao", title: "Tarefas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing"] },
  { path: "/gestao/integracoes", domain: "gestao", title: "Integrações", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/calendario", domain: "gestao", title: "Calendário", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "professor"] },
  { path: "/gestao/funcionarios", domain: "gestao", title: "Funcionários", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/documentos", domain: "gestao", title: "Documentos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao"] },
  { path: "/gestao/perfil", domain: "gestao", title: "Meu Perfil", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"] },
  { path: "/gestao/guia", domain: "gestao", title: "Guia", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"] },
  { path: "/gestao/marketing", domain: "marketing", title: "Marketing", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "marketing"] },
  { path: "/gestao/lancamento", domain: "marketing", title: "Lançamento", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "marketing"] },
  { path: "/gestao/metricas", domain: "marketing", title: "Métricas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "marketing"] },
  { path: "/gestao/arquivos", domain: "gestao", title: "Arquivos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario", "marketing"] },
  { path: "/gestao/area-professor", domain: "aulas", title: "Área do Professor", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor"] },
  { path: "/gestao/planejamento-aula", domain: "aulas", title: "Planejamento de Aula", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor"] },
  { path: "/gestao/laboratorio", domain: "aulas", title: "Laboratório", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor"] },
  { path: "/gestao/turmas-online", domain: "aulas", title: "Turmas Online", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor"] },
  { path: "/gestao/turmas-presenciais", domain: "aulas", title: "Turmas Presenciais", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor"] },
  { path: "/gestao/cursos", domain: "aulas", title: "Cursos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor"] },
  { path: "/gestao/simulados", domain: "aulas", title: "Simulados", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor"] },
  { path: "/gestao/lives", domain: "aulas", title: "Lives", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor"] },
  { path: "/gestao/entradas", domain: "financas", title: "Entradas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "contabilidade"] },
  { path: "/gestao/financas-empresa", domain: "financas", title: "Finanças Empresa", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "contabilidade"] },
  { path: "/gestao/financas-pessoais", domain: "financas", title: "Finanças Pessoais", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/gestao/pagamentos", domain: "financas", title: "Pagamentos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "contabilidade"] },
  { path: "/gestao/contabilidade", domain: "financas", title: "Contabilidade", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "contabilidade"] },
  { path: "/gestao/transacoes-hotmart", domain: "financas", title: "Transações Hotmart", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/gestao-alunos", domain: "gestao", title: "Gestão de Alunos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "suporte"] },
  { path: "/gestao/portal-aluno", domain: "gestao", title: "Portal do Aluno", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/relatorios", domain: "gestao", title: "Relatórios", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/afiliados", domain: "gestao", title: "Afiliados", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "afiliado"] },
  { path: "/gestao/permissoes", domain: "admin", title: "Permissões", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/configuracoes", domain: "admin", title: "Configurações", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario"] },
  { path: "/gestao/gestao-equipe", domain: "admin", title: "Gestão de Equipe", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/gestao-site", domain: "admin", title: "Gestão do Site", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/gestao-dispositivos", domain: "admin", title: "Gestão de Dispositivos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario"] },
  { path: "/gestao/auditoria-acessos", domain: "admin", title: "Auditoria de Acessos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/empresas/dashboard", domain: "empresas", title: "Dashboard Empresarial", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/empresas/receitas", domain: "empresas", title: "Receitas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "contabilidade"] },
  { path: "/gestao/empresas/arquivos", domain: "empresas", title: "Arquivos Empresariais", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/empresas/rh", domain: "empresas", title: "RH", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
];

export const OWNER_ROUTES: RouteDefinition[] = [
  { path: "/gestao/central-monitoramento", domain: "owner", title: "Central de Monitoramento", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/gestao/monitoramento", domain: "owner", title: "Monitoramento", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/central-whatsapp", domain: "owner", title: "Central WhatsApp", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/whatsapp-live", domain: "owner", title: "WhatsApp Live", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/diagnostico-whatsapp", domain: "owner", title: "Diagnóstico WhatsApp", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/gestao/diagnostico-webhooks", domain: "owner", title: "Diagnóstico Webhooks", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/gestao/central-metricas", domain: "owner", title: "Central de Métricas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/central-ias", domain: "owner", title: "Central de IAs", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/gestao/leads-whatsapp", domain: "owner", title: "Leads WhatsApp", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "marketing"] },
  { path: "/gestao/site-programador", domain: "owner", title: "Site Programador", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/gestao/central-diagnostico", domain: "owner", title: "Central de Diagnóstico", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/gestao/vida-pessoal", domain: "pessoal", title: "Vida Pessoal", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/gestao/pessoal", domain: "pessoal", title: "Pessoal", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/gestao/master", domain: "owner", title: "Master", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/gestao/owner", domain: "owner", title: "Owner", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/central-diagnostico", domain: "owner", title: "Central de Diagnóstico", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
];

export const LEGACY_ROUTES: RouteDefinition[] = [
  { path: "/dashboard", domain: "gestao", title: "Dashboard", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario"] },
  { path: "/tarefas", domain: "gestao", title: "Tarefas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario"] },
  { path: "/funcionarios", domain: "gestao", title: "Funcionários", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/marketing", domain: "marketing", title: "Marketing", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "marketing"] },
  { path: "/entradas", domain: "financas", title: "Entradas", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "contabilidade"] },
  { path: "/financas-empresa", domain: "financas", title: "Finanças Empresa", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "contabilidade"] },
  { path: "/financas-pessoais", domain: "financas", title: "Finanças Pessoais", authRequired: true, status: "active", requiresAuth: true, roles: ["owner"] },
  { path: "/cursos", domain: "aulas", title: "Cursos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor", "beta", "aluno"] },
  { path: "/simulados", domain: "aulas", title: "Simulados", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "professor"] },
  { path: "/afiliados", domain: "gestao", title: "Afiliados", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "afiliado"] },
  { path: "/gestao-alunos", domain: "gestao", title: "Gestão de Alunos", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "suporte"] },
  { path: "/relatorios", domain: "gestao", title: "Relatórios", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin"] },
  { path: "/configuracoes", domain: "admin", title: "Configurações", authRequired: true, status: "active", requiresAuth: true, roles: ["owner", "admin", "funcionario"] },
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
export function getRoutesByDomain(domain: RouteDomain | SystemDomain): RouteDefinition[] {
  return ALL_ROUTES.filter(r => r.domain === domain);
}

/**
 * Verifica se uma rota requer autenticação
 */
export function requiresAuth(path: string): boolean {
  const route = findRoute(path);
  return route?.authRequired ?? route?.requiresAuth ?? true;
}

/**
 * Verifica se uma role pode acessar uma rota
 */
export function canRoleAccessRoute(role: string | null, path: string): boolean {
  const route = findRoute(path);
  if (!route) return false;
  if (!route.authRequired && !route.requiresAuth) return true;
  if (!route.roles) return !!role;
  if (!role) return false;
  return route.roles.includes(role);
}

/**
 * Obtém todas as rotas permitidas para uma role
 */
export function getRoutesForRole(role: string): RouteDefinition[] {
  return ALL_ROUTES.filter(route => {
    if (!route.authRequired && !route.requiresAuth) return true;
    if (!route.roles) return true;
    return route.roles.includes(role);
  });
}

/**
 * Verifica se uma rota é pública
 */
export function isPublicRoute(path: string): boolean {
  const route = findRoute(path);
  return route ? (!route.authRequired && !route.requiresAuth) : false;
}

/**
 * Obtém o título de uma rota
 */
export function getRouteTitle(path: string): string {
  const route = findRoute(path);
  return route?.title ?? "Página";
}

// ============================================
// ROUTE_DEFINITIONS (METADATA COMPLETO)
// ============================================
export const ROUTE_DEFINITIONS: Record<string, RouteDefinition> = {
  // === PÚBLICAS ===
  HOME: { path: "/", title: "Home", authRequired: false, status: "active", domain: "public" },
  SITE: { path: "/site", title: "Site", authRequired: false, status: "active", domain: "public" },
  AUTH: { path: "/auth", title: "Login", authRequired: false, status: "active", domain: "auth" },
  TERMOS: { path: "/termos", title: "Termos de Uso", authRequired: false, status: "active", domain: "public" },
  PRIVACIDADE: { path: "/privacidade", title: "Privacidade", authRequired: false, status: "active", domain: "public" },
  AREA_GRATUITA: { path: "/area-gratuita", title: "Área Gratuita", authRequired: false, status: "active", domain: "public" },
  CADASTRO: { path: "/cadastro", title: "Cadastro", authRequired: false, status: "active", domain: "auth" },
  LOGIN: { path: "/login", title: "Login", authRequired: false, status: "active", domain: "auth" },
  RECUPERAR_SENHA: { path: "/recuperar-senha", title: "Recuperar Senha", authRequired: false, status: "active", domain: "auth" },

  // === COMUNIDADE ===
  COMUNIDADE: { path: "/comunidade", title: "Comunidade", authRequired: true, roles: ["owner", "admin", "beta", "aluno", "viewer"], status: "active", domain: "comunidade" },
  COMUNIDADE_FORUM: { path: "/comunidade/forum", title: "Fórum", authRequired: true, roles: ["owner", "admin", "beta", "aluno", "viewer"], status: "active", domain: "comunidade" },
  COMUNIDADE_POSTS: { path: "/comunidade/posts", title: "Posts", authRequired: true, roles: ["owner", "admin", "beta", "aluno", "viewer"], status: "active", domain: "comunidade" },
  COMUNIDADE_MEMBROS: { path: "/comunidade/membros", title: "Membros", authRequired: true, roles: ["owner", "admin", "beta", "aluno", "viewer"], status: "active", domain: "comunidade" },
  COMUNIDADE_EVENTOS: { path: "/comunidade/eventos", title: "Eventos", authRequired: true, roles: ["owner", "admin", "beta", "aluno", "viewer"], status: "active", domain: "comunidade" },
  COMUNIDADE_CHAT: { path: "/comunidade/chat", title: "Chat", authRequired: true, roles: ["owner", "admin", "beta", "aluno", "viewer"], status: "active", domain: "comunidade" },

  // === PORTAL DO ALUNO BETA ===
  ALUNOS: { path: "/alunos/dashboard", title: "Central do Aluno", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_DASHBOARD: { path: "/alunos/dashboard", title: "Dashboard do Aluno", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_LIVRO_WEB: { path: "/alunos/livro-web", title: "Livro Web", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_CRONOGRAMA: { path: "/alunos/cronograma", title: "Cronograma", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_VIDEOAULAS: { path: "/alunos/videoaulas", title: "Videoaulas", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_MATERIAIS: { path: "/alunos/materiais", title: "Materiais", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_RESUMOS: { path: "/alunos/resumos", title: "Resumos", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_MAPAS_MENTAIS: { path: "/alunos/mapas-mentais", title: "Mapas Mentais", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_QUESTOES: { path: "/alunos/questoes", title: "Questões", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_SIMULADOS: { path: "/alunos/simulados", title: "Simulados", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_REDACAO: { path: "/alunos/redacao", title: "Redação", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_DESEMPENHO: { path: "/alunos/desempenho", title: "Desempenho", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_RANKING: { path: "/alunos/ranking", title: "Ranking", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_CONQUISTAS: { path: "/alunos/conquistas", title: "Conquistas", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_TUTORIA: { path: "/alunos/tutoria", title: "Tutoria IA", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_FORUM: { path: "/alunos/forum", title: "Fórum", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_LIVES: { path: "/alunos/lives", title: "Lives", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_DUVIDAS: { path: "/alunos/duvidas", title: "Dúvidas", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_REVISAO: { path: "/alunos/revisao", title: "Revisão", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_LABORATORIO: { path: "/alunos/laboratorio", title: "Laboratório Virtual", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_CALCULADORA: { path: "/alunos/calculadora", title: "Calculadora", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_TABELA_PERIODICA: { path: "/alunos/tabela-periodica", title: "Tabela Periódica", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  // DEPRECATED: Flashcards migrado para /alunos/materiais (mantido para redirect)
  ALUNOS_FLASHCARDS: { path: "/alunos/materiais", title: "Flashcards", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "disabled", domain: "aluno" },
  ALUNOS_METAS: { path: "/alunos/metas", title: "Metas", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_AGENDA: { path: "/alunos/agenda", title: "Agenda", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_CERTIFICADOS: { path: "/alunos/certificados", title: "Certificados", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_PERFIL: { path: "/alunos/perfil", title: "Meu Perfil", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_CURSOS: { path: "/alunos/cursos", title: "Cursos", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_AULAS: { path: "/alunos/aulas", title: "Aulas", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_PROGRESSO: { path: "/alunos/progresso", title: "Progresso", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },
  ALUNOS_HISTORICO: { path: "/alunos/historico", title: "Histórico", authRequired: true, roles: ["owner", "admin", "beta", "aluno"], status: "active", domain: "aluno" },

  // === GESTÃO ===
  GESTAO: { path: "/gestao", title: "Gestão", authRequired: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"], status: "active", domain: "gestao" },
  GESTAO_DASHBOARD: { path: "/gestao/dashboard", title: "Dashboard", authRequired: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"], status: "active", domain: "gestao" },
  GESTAO_DASHBOARD_EXECUTIVO: { path: "/gestao/dashboard-executivo", title: "Dashboard Executivo", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "gestao" },
  GESTAO_TAREFAS: { path: "/gestao/tarefas", title: "Tarefas", authRequired: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing"], status: "active", domain: "gestao" },
  GESTAO_INTEGRACOES: { path: "/gestao/integracoes", title: "Integrações", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "gestao" },
  GESTAO_CALENDARIO: { path: "/gestao/calendario", title: "Calendário", authRequired: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "professor"], status: "active", domain: "gestao" },
  GESTAO_FUNCIONARIOS: { path: "/gestao/funcionarios", title: "Funcionários", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "gestao" },
  GESTAO_DOCUMENTOS: { path: "/gestao/documentos", title: "Documentos", authRequired: true, roles: ["owner", "admin", "funcionario", "suporte", "coordenacao"], status: "active", domain: "gestao" },
  GESTAO_PERFIL: { path: "/gestao/perfil", title: "Meu Perfil", authRequired: true, status: "active", domain: "gestao" },
  GESTAO_GUIA: { path: "/gestao/guia", title: "Guia", authRequired: true, status: "active", domain: "gestao" },
  GESTAO_MARKETING: { path: "/gestao/marketing", title: "Marketing", authRequired: true, roles: ["owner", "admin", "marketing"], status: "active", domain: "marketing" },
  GESTAO_LANCAMENTO: { path: "/gestao/lancamento", title: "Lançamento", authRequired: true, roles: ["owner", "admin", "marketing"], status: "active", domain: "marketing" },
  GESTAO_METRICAS: { path: "/gestao/metricas", title: "Métricas", authRequired: true, roles: ["owner", "admin", "marketing"], status: "active", domain: "marketing" },
  GESTAO_ARQUIVOS: { path: "/gestao/arquivos", title: "Arquivos", authRequired: true, roles: ["owner", "admin", "funcionario", "marketing"], status: "active", domain: "gestao" },
  GESTAO_AREA_PROFESSOR: { path: "/gestao/area-professor", title: "Área do Professor", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  GESTAO_PLANEJAMENTO_AULA: { path: "/gestao/planejamento-aula", title: "Planejamento de Aula", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  GESTAO_LABORATORIO: { path: "/gestao/laboratorio", title: "Laboratório", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  GESTAO_TURMAS_ONLINE: { path: "/gestao/turmas-online", title: "Turmas Online", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  GESTAO_TURMAS_PRESENCIAIS: { path: "/gestao/turmas-presenciais", title: "Turmas Presenciais", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  GESTAO_CURSOS: { path: "/gestao/cursos", title: "Cursos", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  GESTAO_SIMULADOS: { path: "/gestao/simulados", title: "Simulados", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  GESTAO_LIVES: { path: "/gestao/lives", title: "Lives", authRequired: true, roles: ["owner", "admin", "professor"], status: "active", domain: "aulas" },
  GESTAO_ENTRADAS: { path: "/gestao/entradas", title: "Entradas", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  GESTAO_FINANCAS_EMPRESA: { path: "/gestao/financas-empresa", title: "Finanças da Empresa", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  GESTAO_FINANCAS_PESSOAIS: { path: "/gestao/financas-pessoais", title: "Finanças Pessoais", authRequired: true, roles: ["owner"], status: "active", domain: "financas" },
  GESTAO_PAGAMENTOS: { path: "/gestao/pagamentos", title: "Pagamentos", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  GESTAO_CONTABILIDADE: { path: "/gestao/contabilidade", title: "Contabilidade", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  GESTAO_TRANSACOES_HOTMART: { path: "/gestao/transacoes-hotmart", title: "Transações Hotmart", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "financas" },
  GESTAO_ALUNOS: { path: "/gestao/gestao-alunos", title: "Gestão de Alunos", authRequired: true, roles: ["owner", "admin", "suporte"], status: "active", domain: "gestao" },
  GESTAO_PORTAL_ALUNO: { path: "/gestao/portal-aluno", title: "Portal do Aluno", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "gestao" },
  GESTAO_RELATORIOS: { path: "/gestao/relatorios", title: "Relatórios", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "gestao" },
  GESTAO_AFILIADOS: { path: "/gestao/afiliados", title: "Afiliados", authRequired: true, roles: ["owner", "admin", "afiliado"], status: "active", domain: "gestao" },
  GESTAO_PERMISSOES: { path: "/gestao/permissoes", title: "Permissões", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  GESTAO_CONFIGURACOES: { path: "/gestao/configuracoes", title: "Configurações", authRequired: true, roles: ["owner", "admin", "funcionario"], status: "active", domain: "admin" },
  GESTAO_EQUIPE: { path: "/gestao/gestao-equipe", title: "Gestão de Equipe", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  GESTAO_SITE: { path: "/gestao/gestao-site", title: "Gestão do Site", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  GESTAO_DISPOSITIVOS: { path: "/gestao/gestao-dispositivos", title: "Gestão de Dispositivos", authRequired: true, roles: ["owner", "admin", "funcionario"], status: "active", domain: "admin" },
  GESTAO_AUDITORIA: { path: "/gestao/auditoria-acessos", title: "Auditoria de Acessos", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  GESTAO_CENTRAL_MONITORAMENTO: { path: "/gestao/central-monitoramento", title: "Central de Monitoramento", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  GESTAO_MONITORAMENTO: { path: "/gestao/monitoramento", title: "Monitoramento", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  GESTAO_CENTRAL_WHATSAPP: { path: "/gestao/central-whatsapp", title: "Central WhatsApp", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  GESTAO_WHATSAPP_LIVE: { path: "/gestao/whatsapp-live", title: "WhatsApp Live", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  GESTAO_DIAGNOSTICO_WHATSAPP: { path: "/gestao/diagnostico-whatsapp", title: "Diagnóstico WhatsApp", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  GESTAO_DIAGNOSTICO_WEBHOOKS: { path: "/gestao/diagnostico-webhooks", title: "Diagnóstico Webhooks", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  GESTAO_CENTRAL_METRICAS: { path: "/gestao/central-metricas", title: "Central de Métricas", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  GESTAO_CENTRAL_IAS: { path: "/gestao/central-ias", title: "Central de IAs", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "owner" },
  GESTAO_LEADS_WHATSAPP: { path: "/gestao/leads-whatsapp", title: "Leads WhatsApp", authRequired: true, roles: ["owner", "admin", "marketing"], status: "active", domain: "owner" },
  GESTAO_SITE_PROGRAMADOR: { path: "/gestao/site-programador", title: "Site Programador", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  GESTAO_CENTRAL_DIAGNOSTICO: { path: "/gestao/central-diagnostico", title: "Central de Diagnóstico", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  GESTAO_VIDA_PESSOAL: { path: "/gestao/vida-pessoal", title: "Vida Pessoal", authRequired: true, roles: ["owner"], status: "active", domain: "pessoal" },
  GESTAO_PESSOAL: { path: "/gestao/pessoal", title: "Pessoal", authRequired: true, roles: ["owner"], status: "active", domain: "pessoal" },
  GESTAO_MASTER: { path: "/gestao/master", title: "Master", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  GESTAO_OWNER: { path: "/gestao/owner", title: "Owner", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  GESTAO_EMPRESAS_DASHBOARD: { path: "/gestao/empresas/dashboard", title: "Dashboard Empresarial", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "empresas" },
  GESTAO_EMPRESAS_RECEITAS: { path: "/gestao/empresas/receitas", title: "Receitas Empresariais", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "empresas" },
  GESTAO_EMPRESAS_ARQUIVOS: { path: "/gestao/empresas/arquivos", title: "Arquivos Empresariais", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "empresas" },
  GESTAO_EMPRESAS_RH: { path: "/gestao/empresas/rh", title: "RH", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "empresas" },

  // === ROTAS LEGADAS ===
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
  MARKETING: { path: "/marketing", title: "Marketing", authRequired: true, roles: ["owner", "admin", "marketing"], status: "active", domain: "marketing" },
  LANCAMENTO: { path: "/lancamento", title: "Lançamento", authRequired: true, roles: ["owner", "admin", "marketing"], status: "active", domain: "marketing" },
  METRICAS: { path: "/metricas", title: "Métricas", authRequired: true, status: "active", domain: "marketing" },
  ARQUIVOS: { path: "/arquivos", title: "Arquivos", authRequired: true, status: "active", domain: "marketing" },
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
  ENTRADAS: { path: "/entradas", title: "Entradas", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  FINANCAS_EMPRESA: { path: "/financas-empresa", title: "Finanças da Empresa", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  FINANCAS_PESSOAIS: { path: "/financas-pessoais", title: "Finanças Pessoais", authRequired: true, status: "active", domain: "financas" },
  PAGAMENTOS: { path: "/pagamentos", title: "Pagamentos", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  CONTABILIDADE: { path: "/contabilidade", title: "Contabilidade", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "financas" },
  TRANSACOES_HOTMART: { path: "/transacoes-hotmart", title: "Transações Hotmart", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "financas" },
  GESTAO_ALUNOS_LEGACY: { path: "/gestao-alunos", title: "Gestão de Alunos", authRequired: true, roles: ["owner", "admin", "suporte"], status: "active", domain: "gestao" },
  PORTAL_ALUNO: { path: "/portal-aluno", title: "Portal do Aluno", authRequired: true, status: "active", domain: "aluno" },
  RELATORIOS: { path: "/relatorios", title: "Relatórios", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "gestao" },
  AFILIADOS: { path: "/afiliados", title: "Afiliados", authRequired: true, roles: ["owner", "admin", "afiliado"], status: "active", domain: "gestao" },
  VIDA_PESSOAL: { path: "/vida-pessoal", title: "Vida Pessoal", authRequired: true, status: "active", domain: "pessoal" },
  PESSOAL: { path: "/pessoal", title: "Pessoal", authRequired: true, status: "active", domain: "pessoal" },
  PERMISSOES: { path: "/permissoes", title: "Permissões", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  CONFIGURACOES: { path: "/configuracoes", title: "Configurações", authRequired: true, status: "active", domain: "admin" },
  GESTAO_EQUIPE_LEGACY: { path: "/gestao-equipe", title: "Gestão de Equipe", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  GESTAO_SITE_LEGACY: { path: "/gestao-site", title: "Gestão do Site", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
  GESTAO_DISPOSITIVOS_LEGACY: { path: "/gestao-dispositivos", title: "Gestão de Dispositivos", authRequired: true, status: "active", domain: "admin" },
  AUDITORIA_ACESSOS: { path: "/auditoria-acessos", title: "Auditoria de Acessos", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "admin" },
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
  EMPRESAS_DASHBOARD: { path: "/empresas/dashboard", title: "Dashboard Empresarial", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "empresas" },
  EMPRESAS_RECEITAS: { path: "/empresas/receitas", title: "Receitas Empresariais", authRequired: true, roles: ["owner", "admin", "contabilidade"], status: "active", domain: "empresas" },
  EMPRESAS_ARQUIVOS: { path: "/empresas/arquivos", title: "Arquivos Empresariais", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "empresas" },
  EMPRESAS_RH: { path: "/empresas/rh", title: "RH", authRequired: true, roles: ["owner", "admin"], status: "active", domain: "empresas" },
  CENTRAL_DIAGNOSTICO: { path: "/central-diagnostico", title: "Central de Diagnóstico", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },
  NOT_FOUND: { path: "*", title: "Página não encontrada", authRequired: false, status: "active", domain: "public" },
  EM_DESENVOLVIMENTO: { path: "/em-desenvolvimento", title: "Em Desenvolvimento", authRequired: true, status: "coming_soon", domain: "gestao" },
  SEM_PERMISSAO: { path: "/sem-permissao", title: "Sem Permissão", authRequired: true, status: "active", domain: "gestao" },
};

// ============================================
// HELPERS AVANÇADOS
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
  let path: string = ROUTES[key];
  Object.entries(params).forEach(([paramKey, value]) => {
    path = path.replace(`:${paramKey}`, value);
  });
  return path;
}

/**
 * Verifica se uma rota existe
 */
export function isValidRoute(path: string): boolean {
  return Object.values(ROUTES).includes(path as typeof ROUTES[RouteKey]);
}

/**
 * Retorna a definição de uma rota pelo key
 */
export function getRouteDefinition(key: string): RouteDefinition | undefined {
  return ROUTE_DEFINITIONS[key];
}

/**
 * Verifica se o usuário tem acesso a uma rota
 * ✅ SEGURO: OWNER identificado por role, não email
 */
export function canAccessRoute(key: string, userRole?: string | null, _email?: string | null): boolean {
  // Owner MASTER pode tudo (verificado por role, não email)
  if (userRole === "owner") {
    return true;
  }
  
  const def = ROUTE_DEFINITIONS[key];
  if (!def) return false;
  
  if (!def.authRequired) return true;
  if (!def.roles) return true;
  if (!userRole) return false;
  
  return def.roles.includes(userRole);
}

/**
 * Retorna todas as rotas de um domínio pelo key
 */
export function getRouteKeysByDomain(domain: RouteDomain): string[] {
  return Object.keys(ROUTE_DEFINITIONS).filter(
    key => ROUTE_DEFINITIONS[key].domain === domain
  );
}

/**
 * Retorna a URL correta para redirect baseado no role
 */
export function getRedirectUrl(role: string | null, email?: string | null): string {
  // Owner vai para gestão
  if (role === "owner" || email?.toLowerCase() === "moisesblank@gmail.com") {
    return ROUTES.GESTAO_DASHBOARD;
  }
  
  // Funcionários vão para gestão
  const funcionarioRoles = ["admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"];
  if (role && funcionarioRoles.includes(role)) {
    return ROUTES.GESTAO_DASHBOARD;
  }
  
  // Alunos beta vão para portal do aluno
  if (role === "beta" || role === "aluno") {
    return ROUTES.ALUNOS_DASHBOARD;
  }
  
  // Viewers vão para comunidade
  if (role === "viewer") {
    return ROUTES.COMUNIDADE;
  }
  
  // Default
  return ROUTES.COMUNIDADE;
}

// ============================================
// EXPORTS
// ============================================
export default ROUTES;
