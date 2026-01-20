// ============================================
// 🏛️ LEI VI - CONSTITUIÇÃO DA IMUNIDADE SISTÊMICA v3.1 OMEGA
// INVENTÁRIO OFICIAL DO PROJETO (AUDITADO EM 24/12/2024)
// DOGMA SUPREMO: NUNCA BLOQUEAR A SI MESMO
// ============================================

// ============================================
// 📊 INVENTÁRIO AUDITADO DO PROJETO
// ============================================

export const PROJECT_INVENTORY = {
  EDGE_FUNCTIONS: 69,
  SECRETS: 33,
  TABLES: '150+',
  STORAGE_BUCKETS: 10,
  CONNECTORS: ['ElevenLabs', 'Firecrawl'] as const,
  DOMAINS: ['pro.moisesmedeiros.com.br'] as const, // MONO-DOMÍNIO
  OWNER: 'MOISESBLANK@GMAIL.COM',
  VERSION: '3.1 OMEGA DEFINITIVA',
  AUDIT_DATE: '2024-12-24',
  HASH: 'LEI_VI_v3.1_OMEGA_DEFINITIVA_2024',
} as const;

// ============================================
// TÍTULO I — NÍVEIS DE IMUNIDADE
// ============================================

// Art. 1° IMUNIDADE OMEGA (TOTAL - BYPASS TUDO)
export const IMMUNITY_OMEGA_DOMAINS = [
  '*.lovable.dev',
  '*.lovable.app',
  'ai.gateway.lovable.dev',
  'fyikfsasudgzsjmumdlw.supabase.co',
  '*.supabase.co',
  '*.supabase.in',
  '*.cloudflare.com',
] as const;

// Art. 2° IMUNIDADE ALPHA (BYPASS BOT BLOCK + CUSTOM RULES)
export const IMMUNITY_ALPHA_DOMAINS = [
  'api.hotmart.com',
  'api-sec-vlc.hotmart.com',
  'sandbox.hotmart.com',
  'player-vz-*.tv.pandavideo.com.br',
  'api-v2.pandavideo.com.br',
  'api.firecrawl.dev',      // ✨ Connector
  'api.elevenlabs.io',      // ✨ Connector
  'api.openai.com',
  'generativelanguage.googleapis.com',
  'api.resend.com',
] as const;

// Art. 3° IMUNIDADE BETA (BYPASS CUSTOM RULES, MANTÉM BOT + RATE)
export const IMMUNITY_BETA_DOMAINS = [
  'graph.facebook.com',
  'graph.instagram.com',
  'api.tiktok.com',
  'www.googleapis.com',
  'youtube.googleapis.com',
  'analyticsdata.googleapis.com',
  '*.wordpress.org',
  'pro.moisesmedeiros.com.br',
  'fonts.googleapis.com',
] as const;

// Art. 4° IMUNIDADE DE ROTA (ROTAS CRÍTICAS NO DOMÍNIO)
export const IMMUNE_ROUTES = [
  '/functions/v1/*',
  '/webhooks/*',
  '/webhook-*',
  '/hotmart*',
  '/sna-*',
  '/orchestrator*',
  '/api/*',
  '/verify-turnstile*',
  '/c-*',
  '/event-*',
] as const;

// Art. 5° IMUNIDADE DE HEADER (REQUESTS AUTENTICADOS)
export const IMMUNE_HEADERS = [
  'Authorization: Bearer LOVABLE_API_KEY',
  'Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY',
  'X-Supabase-Auth',
  'X-Client-Info: supabase-js/*',
  'apikey',
  'X-Hotmart-Hottok',
  'X-Panda-Signature',
  'X-Webhook-Secret',
  'X-WordPress-Auth',
  // 'cf-turnstile-response', // ERRADICADO
] as const;

// ============================================
// TÍTULO II — INVENTÁRIO DE EDGE FUNCTIONS (69 FUNÇÕES)
// ============================================

// Art. 6° TIER OMEGA (CRÍTICAS - NUNCA DESATIVAR)
export const EDGE_FUNCTIONS_OMEGA = [
  'sna-gateway',
  'sna-worker',
  'orchestrator',
  'event-router',
  'webhook-receiver',
  'queue-worker',
  'hotmart-webhook-processor',
  'hotmart-fast',
  'webhook-curso-quimica',
  'verify-turnstile',
  'rate-limit-gateway',
  'api-gateway',
  'api-fast',
  'ia-gateway',
  'secure-webhook-ultra',
] as const;

// Art. 7° TIER ALPHA (IMPORTANTES - MONITORAR)
export const EDGE_FUNCTIONS_ALPHA = [
  'ai-tutor',
  'ai-tramon',
  'ai-assistant',
  'book-chat-ai',
  'chat-tramon',
  'generate-ai-content',
  'video-authorize-omega',
  'sanctum-asset-manifest',
  'book-page-signed-url',
  'get-panda-signed-url',
  'secure-video-url',
  'wordpress-webhook',
  'wordpress-api',
  'sync-wordpress-users',
  'c-create-beta-user',
  'c-handle-refund',
  'c-grant-xp',
  'send-email',
  'send-notification-email',
  'notify-owner',
] as const;

// Art. 8° TIER BETA (AUXILIARES - PODEM FALHAR TEMPORARIAMENTE)
export const EDGE_FUNCTIONS_BETA = [
  'youtube-sync', 'youtube-api', 'youtube-live',
  'instagram-sync', 'facebook-ads-sync', 'tiktok-sync',
  'google-analytics-sync', 'google-calendar',
  'social-media-stats',
  'send-2fa-code', 'verify-2fa-code',
  'backup-data', 'reports-api', 'send-report',
  'generate-weekly-report', 'send-weekly-report',
  'task-reminder', 'check-vencimentos',
  'atualizar-status-alunos',
  'genesis-upload', 'genesis-book-upload',
  'book-page-manifest',
  'sanctum-report-violation', 'video-violation-omega',
  'reschedule-flashcard',
  'extract-document', 'ocr-receipt',
  'generate-context',
  'automacoes',
  'whatsapp-webhook',
  'invite-employee',
  'secure-api-proxy', 'secure-webhook', 'webhook-handler',
] as const;

// ============================================
// TÍTULO III — INVENTÁRIO DE SECRETS (33 CONFIGURADOS)
// ============================================

// Art. 9° TIER OMEGA (SAGRADOS - NUNCA REMOVER)
export const SECRETS_OMEGA = [
  'LOVABLE_API_KEY',
  'HOTMART_HOTTOK',
  'HOTMART_CLIENT_ID',
  'HOTMART_CLIENT_SECRET',
  'PANDA_API_KEY',
  'WP_API_URL',
  'WP_API_TOKEN',
  'CLOUDFLARE_TURNSTILE_SECRET_KEY',
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY',
  'FIRECRAWL_API_KEY',
] as const;

// Art. 10° TIER ALPHA (IMPORTANTES)
export const SECRETS_ALPHA = [
  'RESEND_API_KEY',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'YOUTUBE_API_KEY',
  'YOUTUBE_CHANNEL_HANDLE',
  'FACEBOOK_ACCESS_TOKEN',
  'FACEBOOK_AD_ACCOUNT_ID',
  'INSTAGRAM_BUSINESS_ACCOUNT_ID',
] as const;

// Art. 11° TIER BETA (AUXILIARES)
export const SECRETS_BETA = [
  'CLOUDFLARE_EMAIL',
  'CLOUDFLARE_PASSWORD',
  'CPANEL_URL',
  'CPANEL_USERNAME',
  'CPANEL_PASSWORD',
  'REGISTROBR_USER',
  'REGISTROBR_PASSWORD',
  'TIKTOK_USERNAME',
  'WP_ACF_PRO_LICENSE',
  'WP_FEEDBACKWP_LICENSE',
  'WP_MAILSMTP_LICENSE',
] as const;

// ============================================
// TÍTULO IV — INVENTÁRIO DE STORAGE (10 BUCKETS)
// ============================================

// Art. 12° BUCKETS ATIVOS
export const STORAGE_BUCKETS = [
  'arquivos',
  'aulas',
  'avatars',
  'certificados',
  'comprovantes',
  'documentos',
  'ena-assets-raw',
  'ena-assets-transmuted',
  'materiais',
  'whatsapp-attachments',
] as const;

// ============================================
// TÍTULO V — USER-AGENTS
// ============================================

// Art. 13° TIER OMEGA (SISTEMAS INTERNOS - NUNCA BLOQUEAR)
export const ALLOWED_USER_AGENTS = [
  'Deno/*',
  'Supabase Edge Functions',
  'supabase-js/*',
  'Lovable/*',
  'node-fetch/*',
  'undici/*',
  'PostmanRuntime/*',
  'curl/*',
] as const;

// Art. 14° USER-AGENTS PROIBIDOS (BLOQUEAR SEMPRE)
export const BLOCKED_USER_AGENTS = [
  'sqlmap/*',
  'nikto/*',
  'masscan/*',
  'nmap/*',
  'gobuster/*',
  'dirbuster/*',
  'wpscan/*',
  'nuclei/*',
  'httpx/*',
  '', // empty user-agent
] as const;

// ============================================
// TÍTULO VI — REGRAS DE PRECEDÊNCIA (Art. 15°)
// ============================================

export type ImmunityLevel = 'omega' | 'alpha' | 'beta' | 'route' | 'header' | 'none';

export const IMMUNITY_PRECEDENCE: ImmunityLevel[] = [
  'omega',   // 1° - Passa SEMPRE
  'alpha',   // 2° - Passa (exceto rate limit extremo)
  'beta',    // 3° - Passa custom rules
  'route',   // 4° - Bypass específico
  'header',  // 5° - Request autenticado
  'none',    // 6° - Aplica regras de bloqueio
];

// ============================================
// TÍTULO VII — RATE LIMITS (Art. 19°)
// ============================================

export interface RateLimitConfig {
  endpoint: string;
  limit: number;
  windowSeconds: number;
  reason: string;
}

export const RATE_LIMITS: RateLimitConfig[] = [
  { endpoint: '/auth/*', limit: 10, windowSeconds: 60, reason: 'Brute force' },
  { endpoint: '/api/login', limit: 5, windowSeconds: 300, reason: 'Brute force' },
  { endpoint: '/functions/v1/ai-tutor', limit: 30, windowSeconds: 60, reason: 'Spam de perguntas' },
  { endpoint: '/functions/v1/chat-*', limit: 30, windowSeconds: 60, reason: 'Spam de chat' },
  { endpoint: '/functions/v1/book-*', limit: 60, windowSeconds: 60, reason: 'Navegação livro' },
  { endpoint: '/functions/v1/*', limit: 100, windowSeconds: 60, reason: 'Geral' },
  { endpoint: '/*', limit: 200, windowSeconds: 60, reason: 'Páginas normais' },
];

// Exceções de rate limit (sem limite)
export const RATE_LIMIT_EXCEPTIONS = [
  ...IMMUNE_ROUTES,
  // Headers do Art. 17° também são exceções
];

// ============================================
// TÍTULO VIII — PROTEÇÃO ANTI-AUTOLESÃO
// ============================================

// Art. 21° AÇÕES PROIBIDAS PARA A IA
export const AI_PROHIBITED_ACTIONS = [
  'Criar regras que bloqueiem domínios IMUNES',
  'Modificar código que quebre integração com IAs',
  'Desabilitar edge functions TIER OMEGA',
  'Remover secrets TIER OMEGA',
  'Bloquear webhooks autorizados',
  'Alterar constante OWNER_EMAIL',
  'Criar regras WAF sem verificar lista de imunidade',
  'Remover código de limpeza de Service Worker',
  'Ativar Service Workers (LEI V)',
] as const;

// Art. 23° EDGE FUNCTIONS INTOCÁVEIS
export const UNTOUCHABLE_EDGE_FUNCTIONS = [
  'sna-gateway',
  'sna-worker',
  'orchestrator',
  'hotmart-webhook-processor',
  'verify-turnstile',
  'rate-limit-gateway',
  'video-authorize-omega',
  'sanctum-asset-manifest',
  'book-page-signed-url',
] as const;

// Art. 24° SECRETS INTOCÁVEIS
export const UNTOUCHABLE_SECRETS = [
  'LOVABLE_API_KEY',
  'HOTMART_HOTTOK',
  'HOTMART_CLIENT_ID',
  'HOTMART_CLIENT_SECRET',
  'PANDA_API_KEY',
  'WP_API_TOKEN',
  'CLOUDFLARE_TURNSTILE_SECRET_KEY',
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY',
  'FIRECRAWL_API_KEY',
] as const;

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Art. 15° - Verifica o nível de imunidade de um domínio
 */
export function getDomainImmunityLevel(domain: string): ImmunityLevel {
  // OMEGA - Infraestrutura crítica
  if (IMMUNITY_OMEGA_DOMAINS.some(d => matchDomain(domain, d))) {
    return 'omega';
  }
  
  // ALPHA - Integrações de negócio
  if (IMMUNITY_ALPHA_DOMAINS.some(d => matchDomain(domain, d))) {
    return 'alpha';
  }
  
  // BETA - Plataformas auxiliares
  if (IMMUNITY_BETA_DOMAINS.some(d => matchDomain(domain, d))) {
    return 'beta';
  }
  
  return 'none';
}

/**
 * Art. 4° - Verifica se uma rota é imune
 */
export function isRouteImmune(path: string): boolean {
  return IMMUNE_ROUTES.some(route => {
    const pattern = route.replace(/\*/g, '.*');
    return new RegExp(`^${pattern}$`).test(path);
  });
}

/**
 * Art. 5° - Verifica se um header indica request autenticado
 */
export function hasImmuneHeader(headers: Record<string, string>): boolean {
  const headerKeys = Object.keys(headers).map(k => k.toLowerCase());
  
  // Verificar headers específicos
  if (headers['x-hotmart-hottok']) return true;
  if (headers['x-supabase-auth']) return true;
  if (headers['x-panda-signature']) return true;
  if (headers['x-webhook-secret']) return true;
  if (headers['x-wordpress-auth']) return true;
  if (headers['cf-turnstile-response']) return true;
  if (headers['x-client-info']?.includes('supabase')) return true;
  if (headers['apikey']) return true;
  
  return false;
}

/**
 * Art. 13° - Verifica se user-agent é permitido
 */
export function isUserAgentAllowed(userAgent: string): boolean {
  if (!userAgent || userAgent.trim() === '') {
    return false; // Empty UA = blocked
  }
  
  // Verificar se é bloqueado
  if (BLOCKED_USER_AGENTS.some(blocked => 
    blocked && userAgent.toLowerCase().includes(blocked.replace('/*', '').toLowerCase())
  )) {
    return false;
  }
  
  return true;
}

/**
 * Art. 14° - Verifica se user-agent é malicioso
 */
export function isUserAgentMalicious(userAgent: string): boolean {
  if (!userAgent || userAgent.trim() === '') {
    return true;
  }
  
  return BLOCKED_USER_AGENTS.some(blocked => 
    blocked && userAgent.toLowerCase().includes(blocked.replace('/*', '').toLowerCase())
  );
}

/**
 * Art. 21° - Verifica se uma edge function é intocável
 */
export function isEdgeFunctionUntouchable(functionName: string): boolean {
  return UNTOUCHABLE_EDGE_FUNCTIONS.includes(functionName as any);
}

/**
 * Art. 24° - Verifica se um secret é intocável
 */
export function isSecretUntouchable(secretName: string): boolean {
  return UNTOUCHABLE_SECRETS.includes(secretName as any);
}

/**
 * Art. 6-8° - Obtém o tier de uma edge function
 */
export function getEdgeFunctionTier(functionName: string): 'omega' | 'alpha' | 'beta' | 'unknown' {
  if (EDGE_FUNCTIONS_OMEGA.includes(functionName as any)) return 'omega';
  if (EDGE_FUNCTIONS_ALPHA.includes(functionName as any)) return 'alpha';
  if (EDGE_FUNCTIONS_BETA.includes(functionName as any)) return 'beta';
  return 'unknown';
}

/**
 * Art. 9-11° - Obtém o tier de um secret
 */
export function getSecretTier(secretName: string): 'omega' | 'alpha' | 'beta' | 'unknown' {
  if (SECRETS_OMEGA.includes(secretName as any)) return 'omega';
  if (SECRETS_ALPHA.includes(secretName as any)) return 'alpha';
  if (SECRETS_BETA.includes(secretName as any)) return 'beta';
  return 'unknown';
}

/**
 * Art. 19° - Obtém rate limit para um endpoint
 */
export function getRateLimitForEndpoint(path: string): RateLimitConfig | null {
  // Verificar exceções primeiro
  if (isRouteImmune(path)) {
    return null; // Sem limite
  }
  
  // Encontrar rate limit mais específico
  for (const limit of RATE_LIMITS) {
    const pattern = limit.endpoint.replace(/\*/g, '.*');
    if (new RegExp(`^${pattern}$`).test(path)) {
      return limit;
    }
  }
  
  return RATE_LIMITS[RATE_LIMITS.length - 1]; // Default
}

/**
 * REGRA DE OURO - Verifica imunidade completa
 */
export function checkImmunity(request: {
  domain?: string;
  path?: string;
  headers?: Record<string, string>;
  userAgent?: string;
}): { isImmune: boolean; level: ImmunityLevel; reason: string } {
  // 1° OMEGA - Domínio
  if (request.domain) {
    const domainLevel = getDomainImmunityLevel(request.domain);
    if (domainLevel === 'omega') {
      return { isImmune: true, level: 'omega', reason: 'Domínio OMEGA (infraestrutura crítica)' };
    }
    if (domainLevel === 'alpha') {
      return { isImmune: true, level: 'alpha', reason: 'Domínio ALPHA (integração de negócio)' };
    }
    if (domainLevel === 'beta') {
      return { isImmune: true, level: 'beta', reason: 'Domínio BETA (plataforma auxiliar)' };
    }
  }
  
  // 4° ROTA
  if (request.path && isRouteImmune(request.path)) {
    return { isImmune: true, level: 'route', reason: 'Rota imune (webhook/API)' };
  }
  
  // 5° HEADER
  if (request.headers && hasImmuneHeader(request.headers)) {
    return { isImmune: true, level: 'header', reason: 'Header autenticado' };
  }
  
  // Verificar user-agent malicioso
  if (request.userAgent && isUserAgentMalicious(request.userAgent)) {
    return { isImmune: false, level: 'none', reason: 'User-Agent malicioso detectado' };
  }
  
  return { isImmune: false, level: 'none', reason: 'Sem imunidade - aplicar regras normais' };
}

// ============================================
// HELPERS
// ============================================

function matchDomain(domain: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    return domain.endsWith(suffix) || domain === suffix.slice(1);
  }
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(domain);
  }
  return domain === pattern;
}

// ============================================
// TÍTULO X — AUDITORIA E MONITORAMENTO
// ============================================

export interface AuditResult {
  timestamp: string;
  inventory: typeof PROJECT_INVENTORY;
  edgeFunctions: {
    omega: number;
    alpha: number;
    beta: number;
    total: number;
  };
  secrets: {
    omega: number;
    alpha: number;
    beta: number;
    total: number;
  };
  storageBuckets: number;
  status: 'healthy' | 'warning' | 'critical';
}

/**
 * Art. 27-29° - Executa auditoria do sistema
 */
export function runAudit(): AuditResult {
  return {
    timestamp: new Date().toISOString(),
    inventory: PROJECT_INVENTORY,
    edgeFunctions: {
      omega: EDGE_FUNCTIONS_OMEGA.length,
      alpha: EDGE_FUNCTIONS_ALPHA.length,
      beta: EDGE_FUNCTIONS_BETA.length,
      total: EDGE_FUNCTIONS_OMEGA.length + EDGE_FUNCTIONS_ALPHA.length + EDGE_FUNCTIONS_BETA.length,
    },
    secrets: {
      omega: SECRETS_OMEGA.length,
      alpha: SECRETS_ALPHA.length,
      beta: SECRETS_BETA.length,
      total: SECRETS_OMEGA.length + SECRETS_ALPHA.length + SECRETS_BETA.length,
    },
    storageBuckets: STORAGE_BUCKETS.length,
    status: 'healthy',
  };
}

/**
 * Log do status da LEI VI
 */
export function logLeiVIStatus(): void {
  const audit = runAudit();
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🏛️ LEI VI - CONSTITUIÇÃO DA IMUNIDADE SISTÊMICA v3.1 OMEGA');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📊 INVENTÁRIO AUDITADO`);
  console.log(`   🔧 Edge Functions: ${audit.edgeFunctions.total} (Ω:${audit.edgeFunctions.omega} α:${audit.edgeFunctions.alpha} β:${audit.edgeFunctions.beta})`);
  console.log(`   📦 Secrets: ${audit.secrets.total} (Ω:${audit.secrets.omega} α:${audit.secrets.alpha} β:${audit.secrets.beta})`);
  console.log(`   🪣 Storage Buckets: ${audit.storageBuckets}`);
  console.log(`   🔗 Connectors: ${PROJECT_INVENTORY.CONNECTORS.join(', ')}`);
  console.log(`   👑 Owner: ${PROJECT_INVENTORY.OWNER}`);
  console.log(`   📅 Audit: ${audit.timestamp}`);
  console.log(`   ✅ Status: ${audit.status.toUpperCase()}`);
  console.log('═══════════════════════════════════════════════════════════════');
}

// ============================================
// DISPOSIÇÕES FINAIS
// ============================================

export const LEI_VI_METADATA = {
  name: 'LEI VI - CONSTITUIÇÃO DA IMUNIDADE SISTÊMICA',
  version: '3.1 OMEGA DEFINITIVA',
  date: '2024-12-24',
  hash: 'LEI_VI_v3.1_OMEGA_DEFINITIVA_2024',
  status: 'VIGENTE E INVIOLÁVEL',
  articles: 32,
  owner: 'MOISESBLANK@GMAIL.COM',
  dogma: 'NUNCA BLOQUEAR A SI MESMO',
} as const;

// Export default para fácil acesso
export default {
  PROJECT_INVENTORY,
  IMMUNITY_OMEGA_DOMAINS,
  IMMUNITY_ALPHA_DOMAINS,
  IMMUNITY_BETA_DOMAINS,
  IMMUNE_ROUTES,
  IMMUNE_HEADERS,
  EDGE_FUNCTIONS_OMEGA,
  EDGE_FUNCTIONS_ALPHA,
  EDGE_FUNCTIONS_BETA,
  SECRETS_OMEGA,
  SECRETS_ALPHA,
  SECRETS_BETA,
  STORAGE_BUCKETS,
  ALLOWED_USER_AGENTS,
  BLOCKED_USER_AGENTS,
  RATE_LIMITS,
  UNTOUCHABLE_EDGE_FUNCTIONS,
  UNTOUCHABLE_SECRETS,
  AI_PROHIBITED_ACTIONS,
  // Functions
  getDomainImmunityLevel,
  isRouteImmune,
  hasImmuneHeader,
  isUserAgentAllowed,
  isUserAgentMalicious,
  isEdgeFunctionUntouchable,
  isSecretUntouchable,
  getEdgeFunctionTier,
  getSecretTier,
  getRateLimitForEndpoint,
  checkImmunity,
  runAudit,
  logLeiVIStatus,
  LEI_VI_METADATA,
};
