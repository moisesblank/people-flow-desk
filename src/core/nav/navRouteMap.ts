// ============================================
// 🔥 NAV ROUTE MAP — MAPA DE NAVEGAÇÃO DEFINITIVO OMEGA
// Mapeia cada item de menu para sua rota e permissões
// PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
// 🌐 NÃO PAGANTE: /comunidade (cadastro grátis)
// 👨‍🎓 ALUNO BETA: /alunos (PAGANTE)
// 👔 FUNCIONÁRIO: /gestao (funcionários)
// 👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import { RouteKey } from "../routes";
import { OWNER_EMAIL, isOwner } from "../urlAccessControl";
import type { AppRole } from "../urlAccessControl";

// ============================================
// TIPOS
// ============================================
export type NavItemKey = 
  // === COMUNIDADE (NÃO PAGANTE) ===
  | "comunidade"
  | "comunidade-forum"
  | "comunidade-posts"
  | "comunidade-membros"
  | "comunidade-eventos"
  | "comunidade-chat"

  // === GESTÃO - Principal ===
  | "gestao-dashboard"
  | "gestao-dashboard-executivo"
  | "gestao-tarefas"
  | "gestao-integracoes"
  | "gestao-calendario"
  | "gestao-funcionarios"
  | "gestao-documentos"
  | "gestao-perfil"
  | "gestao-guia"
  
  // === GESTÃO - Marketing ===
  | "gestao-marketing"
  | "gestao-lancamento"
  | "gestao-metricas"
  | "gestao-arquivos"
  | "gestao-leads-whatsapp"
  
  // === GESTÃO - Aulas ===
  | "gestao-area-professor"
  | "gestao-planejamento-aula"
  | "gestao-laboratorio"
  | "gestao-turmas-online"
  | "gestao-turmas-presenciais"
  | "gestao-cursos"
  | "gestao-simulados"
  | "gestao-lives"
  
  // === GESTÃO - Finanças ===
  | "gestao-entradas"
  | "gestao-financas-empresa"
  | "gestao-financas-pessoais"
  | "gestao-pagamentos"
  | "gestao-contabilidade"
  | "gestao-transacoes-hotmart"
  
  // === GESTÃO - Alunos ===
  | "gestao-alunos"
  | "gestao-portal-aluno"
  | "gestao-relatorios"
  | "gestao-afiliados"
  
  // === GESTÃO - Admin ===
  | "gestao-permissoes"
  | "gestao-configuracoes"
  | "gestao-equipe"
  | "gestao-site"
  | "gestao-dispositivos"
  | "gestao-auditoria"
  
  // === GESTÃO - Owner ===
  | "gestao-central-monitoramento"
  | "gestao-monitoramento"
  | "gestao-central-whatsapp"
  | "gestao-whatsapp-live"
  | "gestao-diagnostico-whatsapp"
  | "gestao-diagnostico-webhooks"
  | "gestao-central-metricas"
  | "gestao-central-ias"
  | "gestao-site-programador"
  | "gestao-central-diagnostico"
  | "gestao-vida-pessoal"
  | "gestao-pessoal"
  | "gestao-master"
  | "gestao-owner"
  
  // === GESTÃO - Empresas ===
  | "gestao-empresas-dashboard"
  | "gestao-empresas-receitas"
  | "gestao-empresas-arquivos"
  | "gestao-empresas-rh"

  // === PORTAL ALUNO BETA (PAGANTE) ===
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
  | "alunos-perfil"
  | "alunos-cursos"
  | "alunos-aulas"
  | "alunos-progresso"
  | "alunos-historico"

  // === LEGADO (REDIRECT) ===
  | "dashboard"
  | "dashboard-executivo"
  | "tarefas"
  | "integracoes"
  | "calendario"
  | "funcionarios"
  | "documentos"
  | "perfil"
  | "guia"
  | "marketing"
  | "lancamento"
  | "metricas"
  | "arquivos"
  | "leads-whatsapp"
  | "area-professor"
  | "planejamento-aula"
  | "laboratorio"
  | "turmas-online"
  | "turmas-presenciais"
  | "cursos"
  | "simulados"
  | "lives"
  | "entradas"
  | "financas-empresa"
  | "financas-pessoais"
  | "pagamentos"
  | "contabilidade"
  | "transacoes-hotmart"
  | "gestao-alunos-legacy"
  | "portal-aluno"
  | "relatorios"
  | "afiliados"
  | "vida-pessoal"
  | "pessoal"
  | "permissoes"
  | "configuracoes"
  | "gestao-equipe-legacy"
  | "gestao-site-legacy"
  | "gestao-dispositivos-legacy"
  | "auditoria-acessos"
  | "central-monitoramento"
  | "monitoramento"
  | "central-whatsapp"
  | "whatsapp-live"
  | "diagnostico-whatsapp"
  | "diagnostico-webhooks"
  | "central-metricas"
  | "central-ias"
  | "site-programador"
  | "empresas-dashboard"
  | "empresas-receitas"
  | "empresas-arquivos"
  | "empresas-rh"
  | "central-diagnostico";

export type NavItemStatus = "active" | "disabled" | "coming_soon";

export type UserRole = 
  | "owner"       // MASTER — PODE TUDO
  | "admin"       // Administrador
  | "funcionario" // Funcionário genérico
  | "suporte"     // Suporte ao cliente
  | "coordenacao" // Coordenação
  | "monitoria"   // Monitoria
  | "afiliado"    // Afiliado
  | "marketing"   // Marketing
  | "contabilidade" // Contabilidade
  | "professor"   // Professor
  | "beta"        // ALUNO PAGANTE
  | "aluno"       // Aluno (legacy)
  | "viewer";     // Visitante cadastrado (NÃO PAGANTE)

// ============================================
// MAPA: NAV ITEM → ROTA
// ============================================
export const NAV_ROUTE_MAP: Record<NavItemKey, RouteKey> = {
  // === COMUNIDADE (NÃO PAGANTE) ===
  "comunidade": "COMUNIDADE",
  "comunidade-forum": "COMUNIDADE_FORUM",
  "comunidade-posts": "COMUNIDADE_POSTS",
  "comunidade-membros": "COMUNIDADE_MEMBROS",
  "comunidade-eventos": "COMUNIDADE_EVENTOS",
  "comunidade-chat": "COMUNIDADE_CHAT",

  // === GESTÃO - Principal ===
  "gestao-dashboard": "GESTAO_DASHBOARD",
  "gestao-dashboard-executivo": "GESTAO_DASHBOARD_EXECUTIVO",
  "gestao-tarefas": "GESTAO_TAREFAS",
  "gestao-integracoes": "GESTAO_INTEGRACOES",
  "gestao-calendario": "GESTAO_CALENDARIO",
  "gestao-funcionarios": "GESTAO_FUNCIONARIOS",
  "gestao-documentos": "GESTAO_DOCUMENTOS",
  "gestao-perfil": "GESTAO_PERFIL",
  "gestao-guia": "GESTAO_GUIA",
  
  // === GESTÃO - Marketing ===
  "gestao-marketing": "GESTAO_MARKETING",
  "gestao-lancamento": "GESTAO_LANCAMENTO",
  "gestao-metricas": "GESTAO_METRICAS",
  "gestao-arquivos": "GESTAO_ARQUIVOS",
  "gestao-leads-whatsapp": "GESTAO_LEADS_WHATSAPP",
  
  // === GESTÃO - Aulas ===
  "gestao-area-professor": "GESTAO_AREA_PROFESSOR",
  "gestao-planejamento-aula": "GESTAO_PLANEJAMENTO_AULA",
  "gestao-laboratorio": "GESTAO_LABORATORIO",
  "gestao-turmas-online": "GESTAO_TURMAS_ONLINE",
  "gestao-turmas-presenciais": "GESTAO_TURMAS_PRESENCIAIS",
  "gestao-cursos": "GESTAO_CURSOS",
  "gestao-simulados": "GESTAO_SIMULADOS",
  "gestao-lives": "GESTAO_LIVES",
  
  // === GESTÃO - Finanças ===
  "gestao-entradas": "GESTAO_ENTRADAS",
  "gestao-financas-empresa": "GESTAO_FINANCAS_EMPRESA",
  "gestao-financas-pessoais": "GESTAO_FINANCAS_PESSOAIS",
  "gestao-pagamentos": "GESTAO_PAGAMENTOS",
  "gestao-contabilidade": "GESTAO_CONTABILIDADE",
  "gestao-transacoes-hotmart": "GESTAO_TRANSACOES_HOTMART",
  
  // === GESTÃO - Alunos ===
  "gestao-alunos": "GESTAO_ALUNOS",
  "gestao-portal-aluno": "GESTAO_PORTAL_ALUNO",
  "gestao-relatorios": "GESTAO_RELATORIOS",
  "gestao-afiliados": "GESTAO_AFILIADOS",
  
  // === GESTÃO - Admin ===
  "gestao-permissoes": "GESTAO_PERMISSOES",
  "gestao-configuracoes": "GESTAO_CONFIGURACOES",
  "gestao-equipe": "GESTAO_EQUIPE",
  "gestao-site": "GESTAO_SITE",
  "gestao-dispositivos": "GESTAO_DISPOSITIVOS",
  "gestao-auditoria": "GESTAO_AUDITORIA",
  
  // === GESTÃO - Owner ===
  "gestao-central-monitoramento": "GESTAO_CENTRAL_MONITORAMENTO",
  "gestao-monitoramento": "GESTAO_MONITORAMENTO",
  "gestao-central-whatsapp": "GESTAO_CENTRAL_WHATSAPP",
  "gestao-whatsapp-live": "GESTAO_WHATSAPP_LIVE",
  "gestao-diagnostico-whatsapp": "GESTAO_DIAGNOSTICO_WHATSAPP",
  "gestao-diagnostico-webhooks": "GESTAO_DIAGNOSTICO_WEBHOOKS",
  "gestao-central-metricas": "GESTAO_CENTRAL_METRICAS",
  "gestao-central-ias": "GESTAO_CENTRAL_IAS",
  "gestao-site-programador": "GESTAO_SITE_PROGRAMADOR",
  "gestao-central-diagnostico": "GESTAO_CENTRAL_DIAGNOSTICO",
  "gestao-vida-pessoal": "GESTAO_VIDA_PESSOAL",
  "gestao-pessoal": "GESTAO_PESSOAL",
  "gestao-master": "GESTAO_MASTER",
  "gestao-owner": "GESTAO_OWNER",
  
  // === GESTÃO - Empresas ===
  "gestao-empresas-dashboard": "GESTAO_EMPRESAS_DASHBOARD",
  "gestao-empresas-receitas": "GESTAO_EMPRESAS_RECEITAS",
  "gestao-empresas-arquivos": "GESTAO_EMPRESAS_ARQUIVOS",
  "gestao-empresas-rh": "GESTAO_EMPRESAS_RH",

  // === PORTAL ALUNO BETA (PAGANTE) ===
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
  "alunos-cursos": "ALUNOS_CURSOS",
  "alunos-aulas": "ALUNOS_AULAS",
  "alunos-progresso": "ALUNOS_PROGRESSO",
  "alunos-historico": "ALUNOS_HISTORICO",

  // === LEGADO (REDIRECT PARA NOVOS) ===
  "dashboard": "DASHBOARD",
  "dashboard-executivo": "DASHBOARD_EXECUTIVO",
  "tarefas": "TAREFAS",
  "integracoes": "INTEGRACOES",
  "calendario": "CALENDARIO",
  "funcionarios": "FUNCIONARIOS",
  "documentos": "DOCUMENTOS",
  "perfil": "PERFIL",
  "guia": "GUIA",
  "marketing": "MARKETING",
  "lancamento": "LANCAMENTO",
  "metricas": "METRICAS",
  "arquivos": "ARQUIVOS",
  "leads-whatsapp": "LEADS_WHATSAPP",
  "area-professor": "AREA_PROFESSOR",
  "planejamento-aula": "PLANEJAMENTO_AULA",
  "laboratorio": "LABORATORIO",
  "turmas-online": "TURMAS_ONLINE",
  "turmas-presenciais": "TURMAS_PRESENCIAIS",
  "cursos": "CURSOS",
  "simulados": "SIMULADOS",
  "lives": "LIVES",
  "entradas": "ENTRADAS",
  "financas-empresa": "FINANCAS_EMPRESA",
  "financas-pessoais": "FINANCAS_PESSOAIS",
  "pagamentos": "PAGAMENTOS",
  "contabilidade": "CONTABILIDADE",
  "transacoes-hotmart": "TRANSACOES_HOTMART",
  "gestao-alunos-legacy": "GESTAO_ALUNOS_LEGACY",
  "portal-aluno": "PORTAL_ALUNO",
  "relatorios": "RELATORIOS",
  "afiliados": "AFILIADOS",
  "vida-pessoal": "VIDA_PESSOAL",
  "pessoal": "PESSOAL",
  "permissoes": "PERMISSOES",
  "configuracoes": "CONFIGURACOES",
  "gestao-equipe-legacy": "GESTAO_EQUIPE_LEGACY",
  "gestao-site-legacy": "GESTAO_SITE_LEGACY",
  "gestao-dispositivos-legacy": "GESTAO_DISPOSITIVOS_LEGACY",
  "auditoria-acessos": "AUDITORIA_ACESSOS",
  "central-monitoramento": "CENTRAL_MONITORAMENTO",
  "monitoramento": "MONITORAMENTO",
  "central-whatsapp": "CENTRAL_WHATSAPP",
  "whatsapp-live": "WHATSAPP_LIVE",
  "diagnostico-whatsapp": "DIAGNOSTICO_WHATSAPP",
  "diagnostico-webhooks": "DIAGNOSTICO_WEBHOOKS",
  "central-metricas": "CENTRAL_METRICAS",
  "central-ias": "CENTRAL_IAS",
  "site-programador": "SITE_PROGRAMADOR",
  "empresas-dashboard": "EMPRESAS_DASHBOARD",
  "empresas-receitas": "EMPRESAS_RECEITAS",
  "empresas-arquivos": "EMPRESAS_ARQUIVOS",
  "empresas-rh": "EMPRESAS_RH",
  "central-diagnostico": "CENTRAL_DIAGNOSTICO",
};

// ============================================
// INTERFACE NAV ITEM (COMPATIBILIDADE)
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
  if (isOwner(email, role as AppRole)) {
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

// ============================================
// EXPORT DEFAULT
// ============================================
export default NAV_ROUTE_MAP;
