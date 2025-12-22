// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - ÍNDICE GERAL v5.0                               ║
// ║   Todas as leis do sistema em um só lugar                                   ║
// ║   OWNER SOBERANO: MOISESBLANK@GMAIL.COM                                     ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ============================================
// LEI I - PERFORMANCE (43 Artigos)
// Cobrindo toda otimização para 3G + celulares básicos
// ============================================
export * from './LEI_I_PERFORMANCE';
export { default as LEI_I } from './LEI_I_PERFORMANCE';

// ============================================
// LEI II - DISPOSITIVOS (43 Artigos)
// Cobrindo compatibilidade universal mobile-first
// ============================================
export * from './LEI_II_DISPOSITIVOS';
export { default as LEI_II } from './LEI_II_DISPOSITIVOS';

// ============================================
// LEI IV - SNA OMEGA v5.0 (48 Artigos)
// TESE PhD - Orquestração total de IAs e automatizações
// 5 Princípios Imutáveis + 5 Camadas Neurais
// ============================================
export * from './LEI_IV_SNA_OMEGA';
export { default as LEI_IV, SNA_CONFIG, EVENT_HANDLERS, useSNAConstitution } from './LEI_IV_SNA_OMEGA';

// ============================================
// FUTURAS LEIS (Placeholders)
// ============================================

// LEI III - SEGURANÇA (implementada em securityEvangelism.ts)
// LEI V - ACESSIBILIDADE (a ser implementada)
// LEI VI - SEO (a ser implementada)

// ============================================
// ENFORCEMENT GLOBAL
// ============================================

import { LEI_I_PERFORMANCE } from './LEI_I_PERFORMANCE';
import { LEI_II_DISPOSITIVOS } from './LEI_II_DISPOSITIVOS';

// Constantes do SNA para verificação
const LEI_IV_ARTICLES = 48;
const LEI_IV_ACTIVE = true;

/**
 * 📍 MAPA DE URLs DEFINITIVO (Reexportado para conveniência)
 * 
 * 🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ → Criar conta = acesso livre
 * 👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos → role='beta' + acesso válido
 * 👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/ → role='funcionario'
 * 👑 OWNER: TODAS → role='owner' (MOISESBLANK@GMAIL.COM)
 */
export const URL_MAP = {
  NAO_PAGANTE: {
    host: 'pro.moisesmedeiros.com.br',
    path: '/',
    validacao: 'Criar conta = acesso livre',
  },
  ALUNO_BETA: {
    host: 'pro.moisesmedeiros.com.br',
    path: '/alunos/*',
    validacao: "role='beta' + access_expires_at válido",
  },
  FUNCIONARIO: {
    host: 'gestao.moisesmedeiros.com.br',
    path: '/*',
    validacao: "role='funcionario' | 'admin' | 'owner'",
  },
  OWNER: {
    host: 'TODAS',
    path: '/*',
    validacao: "role='owner' (MOISESBLANK@GMAIL.COM)",
  },
} as const;

/**
 * Verifica se todas as leis estão ativas
 */
export function checkConstitutionStatus(): {
  active: boolean;
  laws: { name: string; articles: number; active: boolean }[];
  totalArticles: number;
  version: string;
  owner: string;
} {
  const laws = [
    {
      name: 'LEI I - Performance',
      articles: LEI_I_PERFORMANCE.ARTICLES_COUNT,
      active: true,
    },
    {
      name: 'LEI II - Dispositivos',
      articles: LEI_II_DISPOSITIVOS.ARTICLES_COUNT,
      active: true,
    },
    {
      name: 'LEI IV - SNA OMEGA (PhD)',
      articles: LEI_IV_ARTICLES,
      active: LEI_IV_ACTIVE,
    },
  ];
  
  return {
    active: laws.every(l => l.active),
    laws,
    totalArticles: laws.reduce((a, b) => a + b.articles, 0),
    version: 'v5.0',
    owner: 'MOISESBLANK@GMAIL.COM',
  };
}

/**
 * Log do status da constituição
 */
export function logConstitutionStatus(): void {
  const status = checkConstitutionStatus();
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🏛️ CONSTITUIÇÃO SYNAPSE ${status.version} - STATUS             ║
║           👑 Owner: ${status.owner}                      ║
╠════════════════════════════════════════════════════════════════╣
${status.laws.map(law => 
  `║  ${law.active ? '✅' : '❌'} ${law.name.padEnd(35)} (${String(law.articles).padStart(2)} artigos)  ║`
).join('\n')}
╠════════════════════════════════════════════════════════════════╣
║  📊 Total de Artigos: ${String(status.totalArticles).padEnd(40)}║
║  🔒 Status: ${(status.active ? 'TODAS LEIS ATIVAS' : 'ATENÇÃO: Leis inativas!').padEnd(49)}║
╠════════════════════════════════════════════════════════════════╣
║  ⚖️  5 PRINCÍPIOS IMUTÁVEIS DO SNA:                             ║
║     1. SOBERANIA - SNA é a única autoridade                    ║
║     2. OBEDIÊNCIA - Funcionar não basta, obedecer é obrigatório║
║     3. RASTREABILIDADE - Toda ação com registro                ║
║     4. EFICIÊNCIA - Nenhum recurso sem orçamento               ║
║     5. SEGURANÇA - Nenhuma decisão sem auditoria               ║
╚════════════════════════════════════════════════════════════════╝
  `.trim());
}

/**
 * Valida se URL está conforme o Mapa Definitivo
 */
export function validateUrlAccess(url: string, role: string, hostname: string): {
  allowed: boolean;
  reason: string;
  requiredRole?: string;
} {
  // Owner tem acesso a TUDO
  if (role === 'owner') {
    return { allowed: true, reason: 'OWNER - Acesso Total' };
  }
  
  // Verificar host
  const isGestao = hostname.includes('gestao.');
  const isPro = hostname.includes('pro.');
  
  // Gestão requer funcionário+
  if (isGestao && !['funcionario', 'admin', 'owner'].includes(role)) {
    return { 
      allowed: false, 
      reason: 'Área de Gestão requer role funcionário ou superior',
      requiredRole: 'funcionario',
    };
  }
  
  // Rotas /alunos/* requerem beta
  if (url.startsWith('/alunos') && !['beta', 'funcionario', 'admin', 'owner'].includes(role)) {
    return { 
      allowed: false, 
      reason: 'Área do Aluno requer role beta ou superior',
      requiredRole: 'beta',
    };
  }
  
  return { allowed: true, reason: 'Acesso permitido' };
}

// Auto-log no carregamento (apenas client-side)
if (typeof window !== 'undefined') {
  logConstitutionStatus();
}
