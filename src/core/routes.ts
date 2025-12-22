// ============================================
// 🔥 ROUTES.TS — ROTAS CENTRALIZADAS (MAPA DEFINITIVO OMEGA)
// Single Source of Truth para todas as rotas do sistema
// PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

// ============================================
// 📍 MAPA DE URLs DEFINITIVO (REGRA SUPREMA)
// ============================================
//
// 🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
// 👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
// 👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
// 👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
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
  | "pessoal";    // Pessoal do owner

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
  // URL: pro.moisesmedeiros.com.br/alunos
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
  ALUNOS_CURSOS: "/alunos/cursos",
  ALUNOS_AULAS: "/alunos/aulas",
  ALUNOS_PROGRESSO: "/alunos/progresso",
  ALUNOS_HISTORICO: "/alunos/historico",

  // === GESTÃO (FUNCIONÁRIOS) ===
  // URL: gestao.moisesmedeiros.com.br/gestao
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

  // === ROTAS LEGADAS (REDIRECT PARA NOVAS) ===
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
// DEFINIÇÕES DE ROTAS (METADATA)
// ============================================
export const ROUTE_DEFINITIONS: Record<RouteKey, RouteDefinition> = {
  // === PÚBLICAS ===
  HOME: { path: "/", title: "Home", authRequired: false, status: "active", domain: "public" },
  SITE: { path: "/site", title: "Site", authRequired: false, status: "active", domain: "public" },
  AUTH: { path: "/auth", title: "Login", authRequired: false, status: "active", domain: "auth" },
  TERMOS: { path: "/termos", title: "Termos de Uso", authRequired: false, status: "active", domain: "public" },
  PRIVACIDADE: { path: "/privacidade", title: "Política de Privacidade", authRequired: false, status: "active", domain: "public" },
  AREA_GRATUITA: { path: "/area-gratuita", title: "Área Gratuita", authRequired: false, status: "active", domain: "public" },
  CADASTRO: { path: "/cadastro", title: "Cadastro", authRequired: false, status: "active", domain: "auth" },
  LOGIN: { path: "/login", title: "Login", authRequired: false, status: "active", domain: "auth" },
  RECUPERAR_SENHA: { path: "/recuperar-senha", title: "Recuperar Senha", authRequired: false, status: "active", domain: "auth" },

  // === COMUNIDADE (NÃO PAGANTE) ===
  COMUNIDADE: { path: "/comunidade", title: "Comunidade", authRequired: true, status: "active", domain: "comunidade", roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  COMUNIDADE_FORUM: { path: "/comunidade/forum", title: "Fórum", authRequired: true, status: "active", domain: "comunidade", roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  COMUNIDADE_POSTS: { path: "/comunidade/posts", title: "Posts", authRequired: true, status: "active", domain: "comunidade", roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  COMUNIDADE_MEMBROS: { path: "/comunidade/membros", title: "Membros", authRequired: true, status: "active", domain: "comunidade", roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  COMUNIDADE_EVENTOS: { path: "/comunidade/eventos", title: "Eventos", authRequired: true, status: "active", domain: "comunidade", roles: ["owner", "admin", "beta", "aluno", "viewer"] },
  COMUNIDADE_CHAT: { path: "/comunidade/chat", title: "Chat", authRequired: true, status: "active", domain: "comunidade", roles: ["owner", "admin", "beta", "aluno", "viewer"] },

  // === PORTAL DO ALUNO BETA (PAGANTE) ===
  ALUNOS: { path: "/alunos", title: "Central do Aluno", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_DASHBOARD: { path: "/alunos/dashboard", title: "Dashboard do Aluno", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_CRONOGRAMA: { path: "/alunos/cronograma", title: "Cronograma", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_VIDEOAULAS: { path: "/alunos/videoaulas", title: "Videoaulas", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_MATERIAIS: { path: "/alunos/materiais", title: "Materiais", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_RESUMOS: { path: "/alunos/resumos", title: "Resumos", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_MAPAS_MENTAIS: { path: "/alunos/mapas-mentais", title: "Mapas Mentais", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_QUESTOES: { path: "/alunos/questoes", title: "Questões", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_SIMULADOS: { path: "/alunos/simulados", title: "Simulados", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_REDACAO: { path: "/alunos/redacao", title: "Redação", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_DESEMPENHO: { path: "/alunos/desempenho", title: "Desempenho", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_RANKING: { path: "/alunos/ranking", title: "Ranking", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_CONQUISTAS: { path: "/alunos/conquistas", title: "Conquistas", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_TUTORIA: { path: "/alunos/tutoria", title: "Tutoria", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_FORUM: { path: "/alunos/forum", title: "Fórum", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_LIVES: { path: "/alunos/lives", title: "Lives", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_DUVIDAS: { path: "/alunos/duvidas", title: "Dúvidas", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_REVISAO: { path: "/alunos/revisao", title: "Revisão", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_LABORATORIO: { path: "/alunos/laboratorio", title: "Laboratório", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_CALCULADORA: { path: "/alunos/calculadora", title: "Calculadora", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_TABELA_PERIODICA: { path: "/alunos/tabela-periodica", title: "Tabela Periódica", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_FLASHCARDS: { path: "/alunos/flashcards", title: "Flashcards", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_METAS: { path: "/alunos/metas", title: "Metas", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_AGENDA: { path: "/alunos/agenda", title: "Agenda", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_CERTIFICADOS: { path: "/alunos/certificados", title: "Certificados", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_PERFIL: { path: "/alunos/perfil", title: "Perfil", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_CURSOS: { path: "/alunos/cursos", title: "Cursos", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_AULAS: { path: "/alunos/aulas", title: "Aulas", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_PROGRESSO: { path: "/alunos/progresso", title: "Progresso", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },
  ALUNOS_HISTORICO: { path: "/alunos/historico", title: "Histórico", authRequired: true, status: "active", domain: "aluno", roles: ["owner", "admin", "beta", "aluno"] },

  // === GESTÃO (FUNCIONÁRIOS) ===
  GESTAO: { path: "/gestao", title: "Gestão", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"] },
  GESTAO_DASHBOARD: { path: "/gestao/dashboard", title: "Dashboard", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"] },
  GESTAO_DASHBOARD_EXECUTIVO: { path: "/gestao/dashboard-executivo", title: "Dashboard Executivo", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin"] },
  GESTAO_TAREFAS: { path: "/gestao/tarefas", title: "Tarefas", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing"] },
  GESTAO_INTEGRACOES: { path: "/gestao/integracoes", title: "Integrações", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin"] },
  GESTAO_CALENDARIO: { path: "/gestao/calendario", title: "Calendário", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "professor"] },
  GESTAO_FUNCIONARIOS: { path: "/gestao/funcionarios", title: "Funcionários", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin"] },
  GESTAO_DOCUMENTOS: { path: "/gestao/documentos", title: "Documentos", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin", "funcionario", "suporte", "coordenacao"] },
  GESTAO_PERFIL: { path: "/gestao/perfil", title: "Perfil", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"] },
  GESTAO_GUIA: { path: "/gestao/guia", title: "Guia", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"] },

  // Gestão - Marketing
  GESTAO_MARKETING: { path: "/gestao/marketing", title: "Marketing", authRequired: true, status: "active", domain: "marketing", roles: ["owner", "admin", "marketing"] },
  GESTAO_LANCAMENTO: { path: "/gestao/lancamento", title: "Lançamento", authRequired: true, status: "active", domain: "marketing", roles: ["owner", "admin", "marketing"] },
  GESTAO_METRICAS: { path: "/gestao/metricas", title: "Métricas", authRequired: true, status: "active", domain: "marketing", roles: ["owner", "admin", "marketing"] },
  GESTAO_ARQUIVOS: { path: "/gestao/arquivos", title: "Arquivos", authRequired: true, status: "active", domain: "marketing", roles: ["owner", "admin", "funcionario", "marketing"] },

  // Gestão - Aulas
  GESTAO_AREA_PROFESSOR: { path: "/gestao/area-professor", title: "Área do Professor", authRequired: true, status: "active", domain: "aulas", roles: ["owner", "admin", "professor"] },
  GESTAO_PLANEJAMENTO_AULA: { path: "/gestao/planejamento-aula", title: "Planejamento de Aula", authRequired: true, status: "active", domain: "aulas", roles: ["owner", "admin", "professor"] },
  GESTAO_LABORATORIO: { path: "/gestao/laboratorio", title: "Laboratório", authRequired: true, status: "active", domain: "aulas", roles: ["owner", "admin", "professor"] },
  GESTAO_TURMAS_ONLINE: { path: "/gestao/turmas-online", title: "Turmas Online", authRequired: true, status: "active", domain: "aulas", roles: ["owner", "admin", "professor"] },
  GESTAO_TURMAS_PRESENCIAIS: { path: "/gestao/turmas-presenciais", title: "Turmas Presenciais", authRequired: true, status: "active", domain: "aulas", roles: ["owner", "admin", "professor"] },
  GESTAO_CURSOS: { path: "/gestao/cursos", title: "Cursos", authRequired: true, status: "active", domain: "aulas", roles: ["owner", "admin", "professor"] },
  GESTAO_SIMULADOS: { path: "/gestao/simulados", title: "Simulados", authRequired: true, status: "active", domain: "aulas", roles: ["owner", "admin", "professor"] },
  GESTAO_LIVES: { path: "/gestao/lives", title: "Lives", authRequired: true, status: "active", domain: "aulas", roles: ["owner", "admin", "professor"] },

  // Gestão - Finanças
  GESTAO_ENTRADAS: { path: "/gestao/entradas", title: "Entradas", authRequired: true, status: "active", domain: "financas", roles: ["owner", "admin", "contabilidade"] },
  GESTAO_FINANCAS_EMPRESA: { path: "/gestao/financas-empresa", title: "Finanças da Empresa", authRequired: true, status: "active", domain: "financas", roles: ["owner", "admin", "contabilidade"] },
  GESTAO_FINANCAS_PESSOAIS: { path: "/gestao/financas-pessoais", title: "Finanças Pessoais", authRequired: true, status: "active", domain: "financas", roles: ["owner"] },
  GESTAO_PAGAMENTOS: { path: "/gestao/pagamentos", title: "Pagamentos", authRequired: true, status: "active", domain: "financas", roles: ["owner", "admin", "contabilidade"] },
  GESTAO_CONTABILIDADE: { path: "/gestao/contabilidade", title: "Contabilidade", authRequired: true, status: "active", domain: "financas", roles: ["owner", "admin", "contabilidade"] },
  GESTAO_TRANSACOES_HOTMART: { path: "/gestao/transacoes-hotmart", title: "Transações Hotmart", authRequired: true, status: "active", domain: "financas", roles: ["owner", "admin"] },

  // Gestão - Alunos
  GESTAO_ALUNOS: { path: "/gestao/gestao-alunos", title: "Gestão de Alunos", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin", "suporte"] },
  GESTAO_PORTAL_ALUNO: { path: "/gestao/portal-aluno", title: "Portal do Aluno", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin"] },
  GESTAO_RELATORIOS: { path: "/gestao/relatorios", title: "Relatórios", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin"] },
  GESTAO_AFILIADOS: { path: "/gestao/afiliados", title: "Afiliados", authRequired: true, status: "active", domain: "gestao", roles: ["owner", "admin", "afiliado"] },

  // Gestão - Admin
  GESTAO_PERMISSOES: { path: "/gestao/permissoes", title: "Permissões", authRequired: true, status: "active", domain: "admin", roles: ["owner", "admin"] },
  GESTAO_CONFIGURACOES: { path: "/gestao/configuracoes", title: "Configurações", authRequired: true, status: "active", domain: "admin", roles: ["owner", "admin", "funcionario"] },
  GESTAO_EQUIPE: { path: "/gestao/gestao-equipe", title: "Gestão de Equipe", authRequired: true, status: "active", domain: "admin", roles: ["owner", "admin"] },
  GESTAO_SITE: { path: "/gestao/gestao-site", title: "Gestão do Site", authRequired: true, status: "active", domain: "admin", roles: ["owner", "admin"] },
  GESTAO_DISPOSITIVOS: { path: "/gestao/gestao-dispositivos", title: "Gestão de Dispositivos", authRequired: true, status: "active", domain: "admin", roles: ["owner", "admin", "funcionario"] },
  GESTAO_AUDITORIA: { path: "/gestao/auditoria-acessos", title: "Auditoria de Acessos", authRequired: true, status: "active", domain: "admin", roles: ["owner", "admin"] },

  // Gestão - Owner ONLY
  GESTAO_CENTRAL_MONITORAMENTO: { path: "/gestao/central-monitoramento", title: "Central de Monitoramento", authRequired: true, status: "active", domain: "owner", roles: ["owner"] },
  GESTAO_MONITORAMENTO: { path: "/gestao/monitoramento", title: "Monitoramento", authRequired: true, status: "active", domain: "owner", roles: ["owner", "admin"] },
  GESTAO_CENTRAL_WHATSAPP: { path: "/gestao/central-whatsapp", title: "Central WhatsApp", authRequired: true, status: "active", domain: "owner", roles: ["owner", "admin"] },
  GESTAO_WHATSAPP_LIVE: { path: "/gestao/whatsapp-live", title: "WhatsApp Live", authRequired: true, status: "active", domain: "owner", roles: ["owner", "admin"] },
  GESTAO_DIAGNOSTICO_WHATSAPP: { path: "/gestao/diagnostico-whatsapp", title: "Diagnóstico WhatsApp", authRequired: true, status: "active", domain: "owner", roles: ["owner"] },
  GESTAO_DIAGNOSTICO_WEBHOOKS: { path: "/gestao/diagnostico-webhooks", title: "Diagnóstico Webhooks", authRequired: true, status: "active", domain: "owner", roles: ["owner"] },
  GESTAO_CENTRAL_METRICAS: { path: "/gestao/central-metricas", title: "Central de Métricas", authRequired: true, status: "active", domain: "owner", roles: ["owner", "admin"] },
  GESTAO_CENTRAL_IAS: { path: "/gestao/central-ias", title: "Central de IAs", authRequired: true, status: "active", domain: "owner", roles: ["owner", "admin"] },
  GESTAO_LEADS_WHATSAPP: { path: "/gestao/leads-whatsapp", title: "Leads WhatsApp", authRequired: true, status: "active", domain: "owner", roles: ["owner", "admin", "marketing"] },
  GESTAO_SITE_PROGRAMADOR: { path: "/gestao/site-programador", title: "Site Programador", authRequired: true, status: "active", domain: "owner", roles: ["owner"] },
  GESTAO_CENTRAL_DIAGNOSTICO: { path: "/gestao/central-diagnostico", title: "Central de Diagnóstico", authRequired: true, status: "active", domain: "owner", roles: ["owner"] },
  GESTAO_VIDA_PESSOAL: { path: "/gestao/vida-pessoal", title: "Vida Pessoal", authRequired: true, status: "active", domain: "pessoal", roles: ["owner"] },
  GESTAO_PESSOAL: { path: "/gestao/pessoal", title: "Pessoal", authRequired: true, status: "active", domain: "pessoal", roles: ["owner"] },
  GESTAO_MASTER: { path: "/gestao/master", title: "Master", authRequired: true, status: "active", domain: "owner", roles: ["owner"] },
  GESTAO_OWNER: { path: "/gestao/owner", title: "Owner", authRequired: true, status: "active", domain: "owner", roles: ["owner"] },

  // Gestão - Empresas
  GESTAO_EMPRESAS_DASHBOARD: { path: "/gestao/empresas/dashboard", title: "Dashboard Empresarial", authRequired: true, status: "active", domain: "empresas", roles: ["owner", "admin"] },
  GESTAO_EMPRESAS_RECEITAS: { path: "/gestao/empresas/receitas", title: "Receitas Empresariais", authRequired: true, status: "active", domain: "empresas", roles: ["owner", "admin", "contabilidade"] },
  GESTAO_EMPRESAS_ARQUIVOS: { path: "/gestao/empresas/arquivos", title: "Arquivos Empresariais", authRequired: true, status: "active", domain: "empresas", roles: ["owner", "admin"] },
  GESTAO_EMPRESAS_RH: { path: "/gestao/empresas/rh", title: "RH", authRequired: true, status: "active", domain: "empresas", roles: ["owner", "admin"] },

  // === ROTAS LEGADAS (REDIRECT) ===
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

  // Diagnóstico
  CENTRAL_DIAGNOSTICO: { path: "/central-diagnostico", title: "Central de Diagnóstico", authRequired: true, roles: ["owner"], status: "active", domain: "owner" },

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
  return Object.values(ROUTES).includes(path as typeof ROUTES[RouteKey]);
}

/**
 * Retorna a definição de uma rota
 */
export function getRouteDefinition(key: RouteKey): RouteDefinition {
  return ROUTE_DEFINITIONS[key];
}

/**
 * Verifica se o usuário tem acesso a uma rota
 * OWNER = MASTER = PODE TUDO
 */
export function canAccessRoute(key: RouteKey, userRole?: string | null, email?: string | null): boolean {
  // Owner MASTER pode tudo
  if (userRole === "owner" || email?.toLowerCase() === "moisesblank@gmail.com") {
    return true;
  }
  
  const def = ROUTE_DEFINITIONS[key];
  
  if (!def.authRequired) return true;
  if (!def.roles) return true;
  if (!userRole) return false;
  
  return def.roles.includes(userRole);
}

/**
 * Retorna todas as rotas de um domínio
 */
export function getRoutesByDomain(domain: RouteDomain): RouteKey[] {
  return (Object.keys(ROUTE_DEFINITIONS) as RouteKey[]).filter(
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
