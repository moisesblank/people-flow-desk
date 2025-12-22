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
// MAPA: NAV ITEM → ROLES PERMITIDAS
// ============================================
export const NAV_RBAC: Record<NavItemKey, UserRole[]> = {
  // === COMUNIDADE (NÃO PAGANTE + BETA) ===
  // Qualquer cadastrado pode acessar
  "comunidade": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "beta", "aluno", "viewer"],
  "comunidade-forum": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "beta", "aluno", "viewer"],
  "comunidade-posts": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "beta", "aluno", "viewer"],
  "comunidade-membros": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "beta", "aluno", "viewer"],
  "comunidade-eventos": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "beta", "aluno", "viewer"],
  "comunidade-chat": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "beta", "aluno", "viewer"],

  // === GESTÃO - Principal (FUNCIONÁRIOS) ===
  "gestao-dashboard": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"],
  "gestao-dashboard-executivo": ["owner", "admin"],
  "gestao-tarefas": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing"],
  "gestao-integracoes": ["owner", "admin"],
  "gestao-calendario": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "professor"],
  "gestao-funcionarios": ["owner", "admin"],
  "gestao-documentos": ["owner", "admin", "funcionario", "suporte", "coordenacao"],
  "gestao-perfil": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"],
  "gestao-guia": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"],
  
  // === GESTÃO - Marketing ===
  "gestao-marketing": ["owner", "admin", "marketing"],
  "gestao-lancamento": ["owner", "admin", "marketing"],
  "gestao-metricas": ["owner", "admin", "marketing"],
  "gestao-arquivos": ["owner", "admin", "funcionario", "marketing"],
  "gestao-leads-whatsapp": ["owner", "admin", "marketing"],
  
  // === GESTÃO - Aulas ===
  "gestao-area-professor": ["owner", "admin", "professor"],
  "gestao-planejamento-aula": ["owner", "admin", "professor"],
  "gestao-laboratorio": ["owner", "admin", "professor"],
  "gestao-turmas-online": ["owner", "admin", "professor"],
  "gestao-turmas-presenciais": ["owner", "admin", "professor"],
  "gestao-cursos": ["owner", "admin", "professor"],
  "gestao-simulados": ["owner", "admin", "professor"],
  "gestao-lives": ["owner", "admin", "professor"],
  
  // === GESTÃO - Finanças ===
  "gestao-entradas": ["owner", "admin", "contabilidade"],
  "gestao-financas-empresa": ["owner", "admin", "contabilidade"],
  "gestao-financas-pessoais": ["owner"],
  "gestao-pagamentos": ["owner", "admin", "contabilidade"],
  "gestao-contabilidade": ["owner", "admin", "contabilidade"],
  "gestao-transacoes-hotmart": ["owner", "admin"],
  
  // === GESTÃO - Alunos ===
  "gestao-alunos": ["owner", "admin", "suporte"],
  "gestao-portal-aluno": ["owner", "admin"],
  "gestao-relatorios": ["owner", "admin"],
  "gestao-afiliados": ["owner", "admin", "afiliado"],
  
  // === GESTÃO - Admin ===
  "gestao-permissoes": ["owner", "admin"],
  "gestao-configuracoes": ["owner", "admin", "funcionario"],
  "gestao-equipe": ["owner", "admin"],
  "gestao-site": ["owner", "admin"],
  "gestao-dispositivos": ["owner", "admin", "funcionario"],
  "gestao-auditoria": ["owner", "admin"],
  
  // === GESTÃO - Owner ONLY ===
  "gestao-central-monitoramento": ["owner"],
  "gestao-monitoramento": ["owner", "admin"],
  "gestao-central-whatsapp": ["owner", "admin"],
  "gestao-whatsapp-live": ["owner", "admin"],
  "gestao-diagnostico-whatsapp": ["owner"],
  "gestao-diagnostico-webhooks": ["owner"],
  "gestao-central-metricas": ["owner", "admin"],
  "gestao-central-ias": ["owner", "admin"],
  "gestao-site-programador": ["owner"],
  "gestao-central-diagnostico": ["owner"],
  "gestao-vida-pessoal": ["owner"],
  "gestao-pessoal": ["owner"],
  "gestao-master": ["owner"],
  "gestao-owner": ["owner"],
  
  // === GESTÃO - Empresas ===
  "gestao-empresas-dashboard": ["owner", "admin"],
  "gestao-empresas-receitas": ["owner", "admin", "contabilidade"],
  "gestao-empresas-arquivos": ["owner", "admin"],
  "gestao-empresas-rh": ["owner", "admin"],

  // === PORTAL ALUNO BETA (PAGANTE) ===
  "alunos": ["owner", "admin", "beta", "aluno"],
  "alunos-dashboard": ["owner", "admin", "beta", "aluno"],
  "alunos-cronograma": ["owner", "admin", "beta", "aluno"],
  "alunos-videoaulas": ["owner", "admin", "beta", "aluno"],
  "alunos-materiais": ["owner", "admin", "beta", "aluno"],
  "alunos-resumos": ["owner", "admin", "beta", "aluno"],
  "alunos-mapas-mentais": ["owner", "admin", "beta", "aluno"],
  "alunos-questoes": ["owner", "admin", "beta", "aluno"],
  "alunos-simulados": ["owner", "admin", "beta", "aluno"],
  "alunos-redacao": ["owner", "admin", "beta", "aluno"],
  "alunos-desempenho": ["owner", "admin", "beta", "aluno"],
  "alunos-ranking": ["owner", "admin", "beta", "aluno"],
  "alunos-conquistas": ["owner", "admin", "beta", "aluno"],
  "alunos-tutoria": ["owner", "admin", "beta", "aluno"],
  "alunos-forum": ["owner", "admin", "beta", "aluno"],
  "alunos-lives": ["owner", "admin", "beta", "aluno"],
  "alunos-duvidas": ["owner", "admin", "beta", "aluno"],
  "alunos-revisao": ["owner", "admin", "beta", "aluno"],
  "alunos-laboratorio": ["owner", "admin", "beta", "aluno"],
  "alunos-calculadora": ["owner", "admin", "beta", "aluno"],
  "alunos-tabela-periodica": ["owner", "admin", "beta", "aluno"],
  "alunos-flashcards": ["owner", "admin", "beta", "aluno"],
  "alunos-metas": ["owner", "admin", "beta", "aluno"],
  "alunos-agenda": ["owner", "admin", "beta", "aluno"],
  "alunos-certificados": ["owner", "admin", "beta", "aluno"],
  "alunos-perfil": ["owner", "admin", "beta", "aluno"],
  "alunos-cursos": ["owner", "admin", "beta", "aluno"],
  "alunos-aulas": ["owner", "admin", "beta", "aluno"],
  "alunos-progresso": ["owner", "admin", "beta", "aluno"],
  "alunos-historico": ["owner", "admin", "beta", "aluno"],

  // === LEGADO ===
  "dashboard": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "aluno", "beta"],
  "dashboard-executivo": ["owner", "admin"],
  "tarefas": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing"],
  "integracoes": ["owner", "admin"],
  "calendario": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "professor"],
  "funcionarios": ["owner", "admin"],
  "documentos": ["owner", "admin", "funcionario", "suporte", "coordenacao"],
  "perfil": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "aluno", "beta"],
  "guia": ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "aluno", "beta"],
  "marketing": ["owner", "admin", "marketing"],
  "lancamento": ["owner", "admin", "marketing"],
  "metricas": ["owner", "admin", "marketing"],
  "arquivos": ["owner", "admin", "funcionario", "marketing"],
  "leads-whatsapp": ["owner", "admin", "marketing"],
  "area-professor": ["owner", "admin", "professor"],
  "planejamento-aula": ["owner", "admin", "professor"],
  "laboratorio": ["owner", "admin", "professor", "aluno", "beta"],
  "turmas-online": ["owner", "admin", "professor"],
  "turmas-presenciais": ["owner", "admin", "professor"],
  "cursos": ["owner", "admin", "professor"],
  "simulados": ["owner", "admin", "professor", "aluno", "beta"],
  "lives": ["owner", "admin", "professor", "aluno", "beta"],
  "entradas": ["owner", "admin", "contabilidade"],
  "financas-empresa": ["owner", "admin", "contabilidade"],
  "financas-pessoais": ["owner", "admin", "funcionario"],
  "pagamentos": ["owner", "admin", "contabilidade"],
  "contabilidade": ["owner", "admin", "contabilidade"],
  "transacoes-hotmart": ["owner", "admin"],
  "gestao-alunos-legacy": ["owner", "admin", "suporte"],
  "portal-aluno": ["owner", "admin", "aluno", "beta"],
  "relatorios": ["owner", "admin"],
  "afiliados": ["owner", "admin", "afiliado"],
  "vida-pessoal": ["owner"],
  "pessoal": ["owner"],
  "permissoes": ["owner", "admin"],
  "configuracoes": ["owner", "admin", "funcionario"],
  "gestao-equipe-legacy": ["owner", "admin"],
  "gestao-site-legacy": ["owner", "admin"],
  "gestao-dispositivos-legacy": ["owner", "admin", "funcionario"],
  "auditoria-acessos": ["owner", "admin"],
  "central-monitoramento": ["owner"],
  "monitoramento": ["owner", "admin"],
  "central-whatsapp": ["owner", "admin"],
  "whatsapp-live": ["owner", "admin"],
  "diagnostico-whatsapp": ["owner"],
  "diagnostico-webhooks": ["owner"],
  "central-metricas": ["owner", "admin"],
  "central-ias": ["owner", "admin"],
  "site-programador": ["owner"],
  "empresas-dashboard": ["owner", "admin"],
  "empresas-receitas": ["owner", "admin", "contabilidade"],
  "empresas-arquivos": ["owner", "admin"],
  "empresas-rh": ["owner", "admin"],
  "central-diagnostico": ["owner"],
};

// ============================================
// MAPA: NAV ITEM → STATUS
// ============================================
export const NAV_STATUS: Record<NavItemKey, NavItemStatus> = {
  // Comunidade
  "comunidade": "active",
  "comunidade-forum": "active",
  "comunidade-posts": "active",
  "comunidade-membros": "active",
  "comunidade-eventos": "active",
  "comunidade-chat": "active",

  // Gestão - Principal
  "gestao-dashboard": "active",
  "gestao-dashboard-executivo": "active",
  "gestao-tarefas": "active",
  "gestao-integracoes": "active",
  "gestao-calendario": "active",
  "gestao-funcionarios": "active",
  "gestao-documentos": "active",
  "gestao-perfil": "active",
  "gestao-guia": "active",
  
  // Gestão - Marketing
  "gestao-marketing": "active",
  "gestao-lancamento": "active",
  "gestao-metricas": "active",
  "gestao-arquivos": "active",
  "gestao-leads-whatsapp": "active",
  
  // Gestão - Aulas
  "gestao-area-professor": "active",
  "gestao-planejamento-aula": "active",
  "gestao-laboratorio": "active",
  "gestao-turmas-online": "active",
  "gestao-turmas-presenciais": "active",
  "gestao-cursos": "active",
  "gestao-simulados": "active",
  "gestao-lives": "active",
  
  // Gestão - Finanças
  "gestao-entradas": "active",
  "gestao-financas-empresa": "active",
  "gestao-financas-pessoais": "active",
  "gestao-pagamentos": "active",
  "gestao-contabilidade": "active",
  "gestao-transacoes-hotmart": "active",
  
  // Gestão - Alunos
  "gestao-alunos": "active",
  "gestao-portal-aluno": "active",
  "gestao-relatorios": "active",
  "gestao-afiliados": "active",
  
  // Gestão - Admin
  "gestao-permissoes": "active",
  "gestao-configuracoes": "active",
  "gestao-equipe": "active",
  "gestao-site": "active",
  "gestao-dispositivos": "active",
  "gestao-auditoria": "active",
  
  // Gestão - Owner
  "gestao-central-monitoramento": "active",
  "gestao-monitoramento": "active",
  "gestao-central-whatsapp": "active",
  "gestao-whatsapp-live": "active",
  "gestao-diagnostico-whatsapp": "active",
  "gestao-diagnostico-webhooks": "active",
  "gestao-central-metricas": "active",
  "gestao-central-ias": "active",
  "gestao-site-programador": "active",
  "gestao-central-diagnostico": "active",
  "gestao-vida-pessoal": "active",
  "gestao-pessoal": "active",
  "gestao-master": "active",
  "gestao-owner": "active",
  
  // Gestão - Empresas
  "gestao-empresas-dashboard": "active",
  "gestao-empresas-receitas": "active",
  "gestao-empresas-arquivos": "active",
  "gestao-empresas-rh": "active",

  // Portal Aluno
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
  "alunos-cursos": "active",
  "alunos-aulas": "active",
  "alunos-progresso": "active",
  "alunos-historico": "active",

  // Legado
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
  "gestao-alunos-legacy": "active",
  "portal-aluno": "active",
  "relatorios": "active",
  "afiliados": "active",
  "vida-pessoal": "active",
  "pessoal": "active",
  "permissoes": "active",
  "configuracoes": "active",
  "gestao-equipe-legacy": "active",
  "gestao-site-legacy": "active",
  "gestao-dispositivos-legacy": "active",
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
  "central-diagnostico": "active",
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
 * OWNER = MASTER = PODE TUDO
 */
export function canAccessNavItem(navItemKey: NavItemKey, userRole: UserRole | null, email?: string | null): boolean {
  // Owner MASTER pode tudo
  if (userRole === "owner" || email?.toLowerCase() === "moisesblank@gmail.com") {
    return true;
  }
  
  if (!userRole) return false;
  
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
export function getAccessibleNavItems(userRole: UserRole, email?: string | null): NavItemKey[] {
  return (Object.keys(NAV_ROUTE_MAP) as NavItemKey[]).filter(
    key => canAccessNavItem(key, userRole, email) && getNavItemStatus(key) === "active"
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
