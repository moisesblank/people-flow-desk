// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - ÍNDICE GERAL v8.1 OMEGA DEFINITIVA             ║
// ║   7 LEIS SOBERANAS DO SISTEMA TOTALMENTE INTEGRADAS                         ║
// ║   OWNER SOBERANO: MOISESBLANK@GMAIL.COM                                     ║
// ║   ATUALIZADO: 2024-12-24 | 502+ ARTIGOS TOTAIS                              ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ============================================
// LEI I - PERFORMANCE (82 Artigos)
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
// LEI III - SEGURANÇA SOBERANA v3.0 OMEGA (147 Artigos)
// NASA Level Security + Zero Trust + 4 Camadas
// Cloudflare Pro + Supabase + LEI VII + Fortaleza Supreme
// ============================================
export { 
  default as LEI_III, 
  useSecurityConstitution,
  logLeiIIIStatus,
  LEI_III_VERSION,
  LEI_III_ARTICLES,
  LEI_III_ACTIVE,
  LEI_III_CODENAME,
  LEI_III_DOGMAS,
  LEI_III_HASH,
  OWNER_EMAIL,
  URL_MAP as LEI_III_URL_MAP,
  IMMUNE_ROLES,
  GESTAO_ROLES,
  BETA_ROLES,
  SESSION_CONFIG,
  DEVICE_CONFIG,
  RATE_LIMIT_CONFIG,
  CLOUDFLARE_CONFIG,
  checkUrlAccessFast,
  isOwnerBypass,
  sanitizeInput,
  sanitizeForDisplay,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  isValidCPF,
  maskEmail,
  maskPhone,
  maskCPF,
  logSecurityEvent,
  detectSuspiciousActivity,
  generateDeviceFingerprint,
  blockDangerousActions,
} from './LEI_III_SEGURANCA';

// ============================================
// LEI IV - SNA OMEGA v5.0 (48 Artigos)
// TESE PhD - Orquestração total de IAs e automatizações
// 5 Princípios Imutáveis + 5 Camadas Neurais
// ============================================
export * from './LEI_IV_SNA_OMEGA';
export { default as LEI_IV, SNA_CONFIG, EVENT_HANDLERS, useSNAConstitution } from './LEI_IV_SNA_OMEGA';

// ============================================
// LEI VII - PROTEÇÃO DE CONTEÚDO SOBERANA (127 Artigos)
// SANCTUM SHIELD - Blindagem total de conteúdo
// Aplicável em TODOS os dispositivos e sistemas
// ============================================
export { 
  default as LEI_VII,
  LEI_VII_VERSION,
  LEI_VII_ARTICLES,
  LEI_VII_ACTIVE,
  LEI_VII_CODENAME,
  getLeiVIIStatus,
  logLeiVIIStatus,
  THREAT_THRESHOLDS,
  EVENT_SEVERITIES,
  BLOCKED_SHORTCUTS,
  OWNER_EMAIL as LEI_VII_OWNER,
} from './LEI_VII_PROTECAO_CONTEUDO';

// ============================================
// EXECUTOR LEI VII - Execução Automática
// ============================================
export { 
  default as executeLeiVII,
  updateLeiVIIUser,
  getLeiVIIExecutionStatus,
} from './executeLeiVII';

// ============================================
// LEIS REFERENCIADAS (Documentação/Cloudflare)
// ============================================

// LEI V - ESTABILIDADE DE PRODUÇÃO (127 Artigos) → Documentação + vite.config.ts
// LEI VI - IMUNIDADE SISTÊMICA (32 Artigos) → Documentação + Cloudflare WAF

// ============================================
// ENFORCEMENT GLOBAL
// ============================================

import { LEI_I_PERFORMANCE } from './LEI_I_PERFORMANCE';
import { LEI_II_DISPOSITIVOS } from './LEI_II_DISPOSITIVOS';
import { LEI_III_ARTICLES as LEI_III_ART, LEI_III_ACTIVE as LEI_III_ACT, logLeiIIIStatus as logLeiIII } from './LEI_III_SEGURANCA';
import { LEI_VII_ARTICLES as L7_ART, LEI_VII_ACTIVE as L7_ACT, getLeiVIIStatus as getL7Status, logLeiVIIStatus as logL7Status } from './LEI_VII_PROTECAO_CONTEUDO';

// Constantes do SNA para verificação
const LEI_IV_ARTICLES = 48;
const LEI_IV_ACTIVE = true;

/**
 * 📍 MAPA DE URLs DEFINITIVO v2.0 (LEI IV - SNA OMEGA)
 * ATUALIZADO: 2024-12-24
 * 
 * 🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade → Cadastro gratuito
 * 👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos/* + /comunidade → role='beta' + acesso válido
 *    (Vem de pagamento Hotmart OU criado por Owner/Admin)
 * 👔 FUNCIONÁRIO: pro.moisesmedeiros.com.br/gestaofc/* → role='funcionario' + permissões (ROTA SECRETA)
 * 👑 OWNER: TODAS → role='owner' (MOISESBLANK@GMAIL.COM) - ACESSO MASTER TOTAL
 */
export const URL_MAP = {
  NAO_PAGANTE: {
    host: 'pro.moisesmedeiros.com.br',
    paths: ['/', '/comunidade', '/auth', '/termos', '/privacidade'],
    validacao: 'Cadastro gratuito = acesso livre (home + comunidade + auth)',
    descricao: 'Usuários não pagantes com cadastro gratuito',
  },
  ALUNO_BETA: {
    host: 'pro.moisesmedeiros.com.br',
    paths: ['/alunos/*', '/comunidade'],
    validacao: "role='beta' + access_expires_at válido",
    descricao: 'Aluno PAGANTE com acesso a tudo da área + comunidade. Origem: Hotmart/Owner/Admin',
    origem: ['hotmart_purchase', 'owner_created', 'admin_created', 'import'],
  },
  FUNCIONARIO: {
    host: 'pro.moisesmedeiros.com.br', // MONO-DOMÍNIO
    paths: ['/gestaofc/*'], // ROTA SECRETA
    validacao: "role='funcionario' | 'admin' | subcategorias",
    descricao: 'Funcionários com permissões específicas por categoria (acesso por URL direta)',
    subcategorias: ['coordenacao', 'suporte', 'monitoria', 'marketing', 'contabilidade', 'afiliado'],
  },
  OWNER: {
    host: 'TODAS',
    paths: ['/*'],
    validacao: "role='owner' (MOISESBLANK@GMAIL.COM)",
    descricao: 'MASTER - Acesso TOTAL e irrestrito a TUDO em tempo real',
    email: 'moisesblank@gmail.com',
    poderes: ['criar', 'editar', 'excluir', 'importar', 'exportar', 'configurar', 'auditar'],
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
  lastUpdate: string;
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
      name: 'LEI III - Segurança Soberana v3.0',
      articles: LEI_III_ART,
      active: LEI_III_ACT,
    },
    {
      name: 'LEI IV - SNA OMEGA (PhD)',
      articles: LEI_IV_ARTICLES,
      active: LEI_IV_ACTIVE,
    },
    {
      name: 'LEI V - Estabilidade Produção',
      articles: 127,
      active: true,
    },
    {
      name: 'LEI VI - Imunidade Sistêmica',
      articles: 32,
      active: true,
    },
    {
      name: 'LEI VII - Proteção Conteúdo',
      articles: L7_ART,
      active: L7_ACT,
    },
  ];
  
  return {
    active: laws.every(l => l.active),
    laws,
    totalArticles: laws.reduce((a, b) => a + b.articles, 0),
    version: 'v8.1 OMEGA DEFINITIVA',
    owner: 'MOISESBLANK@GMAIL.COM',
    lastUpdate: '2024-12-24',
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
  `║  ${law.active ? '✅' : '❌'} ${law.name.padEnd(35)} (${String(law.articles).padStart(3)} artigos) ║`
).join('\n')}
╠════════════════════════════════════════════════════════════════╣
║  📊 Total de Artigos: ${String(status.totalArticles).padEnd(39)}║
║  🔒 Status: ${(status.active ? 'TODAS 7 LEIS ATIVAS' : 'ATENÇÃO: Leis inativas!').padEnd(48)}║
╠════════════════════════════════════════════════════════════════╣
║  ⚖️  7 LEIS SOBERANAS DO SISTEMA:                               ║
║     I.   PERFORMANCE - 3G Zero Lag                             ║
║     II.  DISPOSITIVOS - Mobile-First Universal                 ║
║     III. SEGURANÇA - NASA Level Security                       ║
║     IV.  SNA OMEGA - Orquestração IA PhD                       ║
║     V.   ESTABILIDADE - Zero Quebras Produção                  ║
║     VI.  IMUNIDADE - Bypass Sistêmico                          ║
║     VII. PROTEÇÃO CONTEÚDO - Sanctum Shield                    ║
╚════════════════════════════════════════════════════════════════╝
  `.trim());
  
  // Log adicional da LEI VII
  logL7Status();
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
  
  // Rotas públicas (permitidas para todos)
  const publicRoutes = ['/', '/auth', '/termos', '/privacidade', '/comunidade', '/area-gratuita', '/site'];
  if (publicRoutes.includes(url)) {
    return { allowed: true, reason: 'Rota pública' };
  }
  
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

// ============================================
// RE-EXPORTS PARA ACESSO DIRETO
// ============================================

export { getL7Status as getLeiVIIStatusFn, logL7Status as logLeiVIIStatusFn };

// Auto-log no carregamento (apenas client-side)
if (typeof window !== 'undefined') {
  logConstitutionStatus();
}
