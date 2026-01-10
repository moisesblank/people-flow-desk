// ============================================
// 🎯 ÚNICA FONTE DE VERDADE — SYSTEM AREAS
// ============================================
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// DOGMA II: Qualquer nova área DEVE ser adicionada AQUI
// e será automaticamente propagada para TODO o sistema
// ============================================

// ============================================
// 📋 ÁREAS DO SISTEMA (ARRAY CANÔNICO)
// ============================================
// Adicione novas áreas APENAS aqui. O TypeScript vai
// automaticamente exigir atualizações em todos os arquivos.

export const SYSTEM_AREAS = [
  // ===== DASHBOARD & PRINCIPAL =====
  "dashboard",
  "dashboard-executivo",
  "reset-seguranca",
  "tarefas",
  "integracoes",
  "calendario",
  "logs",
  
  // ===== EQUIPE & RH =====
  "funcionarios",
  "area-professor",
  "gestao-equipe",
  
  // ===== MARKETING & VENDAS =====
  "marketing",
  "lancamento",
  "metricas",
  
  // ===== ARQUIVOS & DOCUMENTOS =====
  "arquivos",
  "documentos",
  
  // ===== ENSINO & TURMAS =====
  "planejamento-aula",
  "turmas-online",
  "turmas-presenciais",
  
  // ===== FINANÇAS =====
  "financas-pessoais",
  "financas-empresa",
  "entradas",
  "pagamentos",
  "contabilidade",
  "fluxo-caixa",
  "contas-pagar",
  "contas-receber",
  
  // ===== CURSOS & CONTEÚDO =====
  "cursos",
  "questoes",
  "simulados",
  "livros-web",
  "lives",
  
  // ===== GESTÃO ACADÊMICA (GESTAOFC) =====
  "flashcards",
  "materiais",
  "mapas-mentais",
  
  // ===== AFILIADOS & ALUNOS (GESTÃO) =====
  "afiliados",
  "alunos",
  "portal-aluno",
  "gestao-site",
  
  // ===== RELATÓRIOS & ANÁLISES =====
  "relatorios",
  "guia",
  "laboratorio",
  "videoaulas",
  "tutoria",
  "forum",
  "planejamento",
  "cronograma",
  
  // ===== DESENVOLVIMENTO & OWNER =====
  "site-programador",
  "pessoal",
  "vida-pessoal",
  "permissoes",
  "configuracoes",
  "monitoramento",
  
  // ===== WHATSAPP & COMUNICAÇÃO =====
  "central-whatsapp",
  "diagnostico-whatsapp",
  
  // ===== AUDITORIA & MONITORAMENTO =====
  "auditoria-acessos",
  "central-monitoramento",
  "central-ias",
  "central-metricas",
  
  // ===== ÁREAS EMPRESARIAIS =====
  "dashboard-empresarial",
  "receitas-empresariais",
  "rh-funcionarios",
  "arquivos-empresariais",
  
  // ===== ÁREAS PARA ALUNOS (PÚBLICO) =====
  "area-beta",
  "area-gratuita",
  "comunidade",
  "portal-beta",
  
  // ===== CENTRAL DO ALUNO - QUÍMICA ENEM =====
  "aluno-dashboard",
  "aluno-cronograma",
  "aluno-videoaulas",
  "aluno-materiais",
  "aluno-resumos",
  "aluno-mapas-mentais",
  "aluno-questoes",
  "aluno-simulados",
  "aluno-redacao",
  "aluno-desempenho",
  "aluno-ranking",
  "aluno-conquistas",
  "aluno-tutoria",
  "aluno-forum",
  "aluno-lives",
  "aluno-duvidas",
  "aluno-revisao",
  "aluno-laboratorio",
  "aluno-calculadora",
  "aluno-tabela-periodica",
  "aluno-flashcards",
  "aluno-metas",
  "aluno-agenda",
  "aluno-certificados",
  "aluno-perfil",
  "aluno-livro-web",
  "aluno-planejamento",
  "aluno-cursos",
] as const;

// ============================================
// 📋 TIPO DERIVADO AUTOMATICAMENTE
// ============================================
// NUNCA defina SystemArea manualmente em outros arquivos!
// Sempre importe daqui.

export type SystemArea = (typeof SYSTEM_AREAS)[number];

// ============================================
// 📋 URL → ÁREA (MAPEAMENTO CANÔNICO)
// ============================================
// Adicione novas rotas APENAS aqui.

export const URL_TO_AREA: Record<string, SystemArea> = {
  // Dashboard & Principal
  "/": "dashboard",
  "/dashboard-executivo": "dashboard-executivo",
  "/tarefas": "tarefas",
  "/integracoes": "integracoes",
  "/calendario": "calendario",
  "/logs": "logs",
  "/gestaofc/logs": "logs",
  
  // Equipe & RH
  "/funcionarios": "funcionarios",
  "/area-professor": "area-professor",
  "/gestao-equipe": "gestao-equipe",
  
  // Marketing & Vendas
  "/marketing": "marketing",
  "/lancamento": "lancamento",
  "/metricas": "metricas",
  
  // Arquivos & Documentos
  "/arquivos": "arquivos",
  "/documentos": "documentos",
  
  // Ensino & Turmas
  "/planejamento-aula": "planejamento-aula",
  "/turmas-online": "turmas-online",
  "/turmas-presenciais": "turmas-presenciais",
  
  // Finanças
  "/financas-pessoais": "financas-pessoais",
  "/financas-empresa": "financas-empresa",
  "/entradas": "entradas",
  "/pagamentos": "pagamentos",
  "/contabilidade": "contabilidade",
  
  // Cursos & Conteúdo
  "/cursos": "cursos",
  "/simulados": "simulados",
  
  // Afiliados & Alunos (Gestão)
  "/afiliados": "afiliados",
  "/portal-aluno": "portal-aluno",
  "/gestao-site": "gestao-site",
  
  // Relatórios & Análises
  "/relatorios": "relatorios",
  "/guia": "guia",
  "/laboratorio": "laboratorio",
  
  // Desenvolvimento & Owner
  "/site-programador": "site-programador",
  "/pessoal": "pessoal",
  "/vida-pessoal": "vida-pessoal",
  "/permissoes": "permissoes",
  "/configuracoes": "configuracoes",
  "/monitoramento": "monitoramento",
  
  // WhatsApp & Comunicação
  "/central-whatsapp": "central-whatsapp",
  "/diagnostico-whatsapp": "diagnostico-whatsapp",
  
  // Auditoria & Monitoramento
  "/auditoria-acessos": "auditoria-acessos",
  "/central-monitoramento": "central-monitoramento",
  "/central-ias": "central-ias",
  "/central-metricas": "central-metricas",
  
  // ===== ROTAS /gestaofc/* =====
  "/gestaofc": "dashboard",
  "/gestaofc/dashboard": "dashboard",
  "/gestaofc/gestao-alunos": "alunos",
  "/gestaofc/livros-web": "livros-web",
  "/gestaofc/lives": "lives",
  "/gestaofc/flashcards": "flashcards",
  "/gestaofc/mapas-mentais": "mapas-mentais",
  "/gestaofc/funcionarios": "funcionarios",
  "/gestaofc/afiliados": "afiliados",
  "/gestaofc/cursos": "cursos",
  "/gestaofc/turmas-online": "turmas-online",
  "/gestaofc/turmas-presenciais": "turmas-presenciais",
  "/gestaofc/marketing": "marketing",
  "/gestaofc/lancamento": "lancamento",
  "/gestaofc/relatorios": "relatorios",
  "/gestaofc/simulados": "simulados",
  "/gestaofc/central-whatsapp": "central-whatsapp",
  "/gestaofc/diagnostico-whatsapp": "diagnostico-whatsapp",
  "/gestaofc/central-monitoramento": "central-monitoramento",
  "/gestaofc/central-ias": "central-ias",
  "/gestaofc/central-metricas": "central-metricas",
  "/gestaofc/auditoria-acessos": "auditoria-acessos",
  "/gestaofc/permissoes": "permissoes",
  "/gestaofc/configuracoes": "configuracoes",
  "/gestaofc/site-programador": "site-programador",
  "/gestaofc/vida-pessoal": "vida-pessoal",
  "/gestaofc/pessoal": "pessoal",
  "/gestaofc/financas-pessoais": "financas-pessoais",
  "/gestaofc/financas-empresa": "financas-empresa",
  "/gestaofc/entradas": "entradas",
  "/gestaofc/pagamentos": "pagamentos",
  "/gestaofc/contabilidade": "contabilidade",
  "/gestaofc/arquivos": "arquivos",
  "/gestaofc/documentos": "documentos",
  "/gestaofc/calendario": "calendario",
  "/gestaofc/tarefas": "tarefas",
  "/gestaofc/integracoes": "integracoes",
  "/gestaofc/gestao-equipe": "gestao-equipe",
  "/gestaofc/area-professor": "area-professor",
  "/gestaofc/planejamento-aula": "planejamento-aula",
  "/gestaofc/metricas": "metricas",
  "/gestaofc/guia": "guia",
  "/gestaofc/laboratorio": "laboratorio",
  "/gestaofc/gestao-site": "gestao-site",
  "/gestaofc/portal-aluno": "portal-aluno",
  "/gestaofc/monitoramento": "monitoramento",
  "/gestaofc/videoaulas": "videoaulas",
  "/gestaofc/tutoria": "tutoria",
  "/gestaofc/forum": "forum",
  "/gestaofc/cronograma": "cronograma",
  "/gestaofc/planejamento": "planejamento",
  
  // ===== ROTAS /empresas/* =====
  "/empresas/dashboard": "financas-empresa",
  "/empresas/receitas": "receitas-empresariais",
  "/empresas/rh": "rh-funcionarios",
  "/empresas/arquivos": "arquivos-empresariais",
  "/empresas/fluxo-caixa": "fluxo-caixa",
  "/empresas/contas-pagar": "contas-pagar",
  "/empresas/contas-receber": "contas-receber",
  
  // ===== ROTAS /alunos/* (Portal do Aluno) =====
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
  "/alunos/planejamento": "aluno-planejamento",
  "/alunos/cursos": "aluno-cursos",
  
  // Comunidade
  "/comunidade": "comunidade",
  "/area-beta": "area-beta",
  "/area-gratuita": "area-gratuita",
  "/portal-beta": "portal-beta",
};

// ============================================
// 📋 PERMISSÕES POR ROLE (ÁREAS DETALHADAS)
// ============================================
// Define quais áreas cada role pode acessar

import type { FullAppRole } from "@/types/auth";

export const ROLE_AREA_PERMISSIONS: Record<FullAppRole, SystemArea[]> = {
  // 👑 OWNER - ACESSO TOTAL
  owner: [...SYSTEM_AREAS],
  
  // 👔 ADMIN - Quase tudo (exceto vida pessoal)
  admin: SYSTEM_AREAS.filter(a => 
    !["vida-pessoal", "pessoal"].includes(a)
  ),
  
  // 👔 COORDENAÇÃO - Gestão acadêmica
  coordenacao: [
    "dashboard", "tarefas", "calendario", "logs",
    "funcionarios", "area-professor", "gestao-equipe",
    "planejamento-aula", "turmas-online", "turmas-presenciais",
    "cursos", "simulados", "alunos", "portal-aluno",
    "relatorios", "guia", "laboratorio", "videoaulas", "tutoria", "forum", "cronograma", "planejamento",
    "flashcards", "mapas-mentais", "livros-web", "lives",
    // Áreas de aluno (para visualização)
    "aluno-dashboard", "aluno-cronograma", "aluno-videoaulas",
    "aluno-materiais", "aluno-resumos", "aluno-mapas-mentais",
    "aluno-questoes", "aluno-simulados", "aluno-redacao",
    "aluno-desempenho", "aluno-ranking", "aluno-conquistas",
    "aluno-cursos",
  ],
  
  // 👔 CONTABILIDADE - Finanças
  contabilidade: [
    "dashboard", "financas-empresa", "entradas", "pagamentos",
    "contabilidade", "fluxo-caixa", "contas-pagar", "contas-receber",
    "relatorios", "dashboard-empresarial", "receitas-empresariais",
  ],
  
  // 👔 SUPORTE - Atendimento
  suporte: [
    "dashboard", "alunos", "portal-aluno", "central-whatsapp",
    "relatorios",
    // Áreas de aluno (para suporte)
    "aluno-dashboard", "aluno-cronograma", "aluno-desempenho",
    "aluno-cursos",
  ],
  
  // 👔 MONITORIA - Acompanhamento
  monitoria: [
    "dashboard", "alunos", "portal-aluno", "simulados",
    "flashcards", "mapas-mentais", "relatorios", "tutoria", "forum",
    // Áreas de aluno
    "aluno-dashboard", "aluno-cronograma", "aluno-videoaulas",
    "aluno-questoes", "aluno-simulados", "aluno-desempenho",
    "aluno-duvidas", "aluno-forum", "aluno-cursos",
  ],
  
  // 👔 MARKETING - Campanhas
  marketing: [
    "dashboard", "marketing", "lancamento", "metricas",
    "afiliados", "relatorios",
  ],
  
  // 👔 AFILIADO - Vendas
  afiliado: [
    "dashboard", "afiliados", "relatorios",
  ],
  
  // 👨‍🎓 BETA - Aluno pagante (todas áreas de aluno)
  beta: [
    "area-beta", "comunidade", "portal-beta",
    "aluno-dashboard", "aluno-cronograma", "aluno-videoaulas",
    "aluno-materiais", "aluno-resumos", "aluno-mapas-mentais",
    "aluno-questoes", "aluno-simulados", "aluno-redacao",
    "aluno-desempenho", "aluno-ranking", "aluno-conquistas",
    "aluno-tutoria", "aluno-forum", "aluno-lives",
    "aluno-duvidas", "aluno-revisao", "aluno-laboratorio",
    "aluno-calculadora", "aluno-tabela-periodica", "aluno-flashcards",
    "aluno-metas", "aluno-agenda", "aluno-certificados",
    "aluno-perfil", "aluno-livro-web", "aluno-planejamento",
    "aluno-cursos",
  ],
  
  // 👨‍🎓 ALUNO GRATUITO - Limitado
  aluno_gratuito: [
    "area-gratuita", "comunidade",
    "aluno-dashboard", "aluno-perfil",
  ],
  
  // 👨‍🎓 ALUNO PRESENCIAL - Similar ao beta
  aluno_presencial: [
    "area-beta", "comunidade", "portal-beta",
    "aluno-dashboard", "aluno-cronograma", "aluno-videoaulas",
    "aluno-materiais", "aluno-resumos", "aluno-mapas-mentais",
    "aluno-questoes", "aluno-simulados", "aluno-redacao",
    "aluno-desempenho", "aluno-ranking", "aluno-conquistas",
    "aluno-tutoria", "aluno-forum", "aluno-lives",
    "aluno-duvidas", "aluno-revisao", "aluno-laboratorio",
    "aluno-calculadora", "aluno-tabela-periodica", "aluno-flashcards",
    "aluno-metas", "aluno-agenda", "aluno-certificados",
    "aluno-perfil", "aluno-livro-web", "aluno-planejamento",
    "aluno-cursos",
  ],
  
  // 👨‍🎓 BETA EXPIRA - Similar ao beta
  beta_expira: [
    "area-beta", "comunidade", "portal-beta",
    "aluno-dashboard", "aluno-cronograma", "aluno-videoaulas",
    "aluno-materiais", "aluno-resumos", "aluno-mapas-mentais",
    "aluno-questoes", "aluno-simulados", "aluno-redacao",
    "aluno-desempenho", "aluno-ranking", "aluno-conquistas",
    "aluno-tutoria", "aluno-forum", "aluno-lives",
    "aluno-duvidas", "aluno-revisao", "aluno-laboratorio",
    "aluno-calculadora", "aluno-tabela-periodica", "aluno-flashcards",
    "aluno-metas", "aluno-agenda", "aluno-certificados",
    "aluno-perfil", "aluno-livro-web", "aluno-planejamento",
    "aluno-cursos",
  ],
};

// ============================================
// 🔧 FUNÇÕES AUXILIARES
// ============================================

/**
 * Verifica se uma área é válida
 */
export function isValidArea(area: string): area is SystemArea {
  return SYSTEM_AREAS.includes(area as SystemArea);
}

/**
 * Obtém a área de uma URL
 */
export function getAreaFromUrl(pathname: string): SystemArea | null {
  // Match exato
  if (URL_TO_AREA[pathname]) {
    return URL_TO_AREA[pathname];
  }
  
  // Match por prefixo para URLs dinâmicas
  const sortedPaths = Object.keys(URL_TO_AREA).sort((a, b) => b.length - a.length);
  for (const path of sortedPaths) {
    if (pathname.startsWith(path + "/") || pathname === path) {
      return URL_TO_AREA[path];
    }
  }
  
  return null;
}

/**
 * Verifica se uma role tem acesso a uma área
 */
export function roleHasAccess(role: FullAppRole, area: SystemArea): boolean {
  const permissions = ROLE_AREA_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(area);
}

/**
 * Obtém todas as áreas de uma role
 */
export function getRoleAreas(role: FullAppRole): SystemArea[] {
  return ROLE_AREA_PERMISSIONS[role] || [];
}

// ============================================
// 🚨 VALIDAÇÃO EM TEMPO DE COMPILAÇÃO
// ============================================
// Se você adicionar uma área em SYSTEM_AREAS mas esquecer de 
// adicionar em ROLE_AREA_PERMISSIONS, o TypeScript vai reclamar.

// Força todas as roles a terem permissões definidas
type _ValidateRolePermissions = {
  [K in FullAppRole]: K extends keyof typeof ROLE_AREA_PERMISSIONS ? true : never;
};
