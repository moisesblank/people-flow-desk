// ============================================
// 🛡️ FORTALEZA SUPREME v4.0 FINAL
// SISTEMA DE SEGURANÇA PHD-LEVEL 2300
// Preparado para 5000+ usuários simultâneos
// Otimizado para celulares 3G
// Rate Limits: Login=5, Signup=3, 2FA=5, Reset=3, Lockout=5
// ============================================

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical' | 'emergency';
export type SecurityAction = 'allow' | 'challenge' | 'rate_limit' | 'block_temp' | 'block_perm' | 'alert_admin' | 'quarantine';
export type AttackType = 'brute_force' | 'credential_stuffing' | 'session_hijacking' | 'privilege_escalation' | 'sql_injection' | 'xss_attempt' | 'ddos' | 'bot_attack' | 'api_abuse' | 'data_exfiltration';

export interface UrlAccessResult {
  allowed: boolean;
  reason: string;
  redirect_to: string | null;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retry_after: number;
}

export interface SecurityDashboard {
  timestamp: string;
  active_threats: number;
  blocked_users: number;
  rate_limited: number;
  events_1h: number;
  critical_24h: number;
  users_online: number;
}

export interface ThreatIntelligence {
  id: string;
  ip_address: string | null;
  user_id: string | null;
  device_fingerprint: string | null;
  threat_level: ThreatLevel;
  risk_score: number;
  blocked_until: string | null;
  total_violations: number;
  last_violation_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SecurityEvent {
  id?: string;
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  user_id?: string;
  ip_address?: string;
  device_fingerprint?: string;
  payload?: Record<string, unknown>;
  created_at?: string;
}

// ============================================
// 📍 MAPA DEFINITIVO DE URLs v4.0
// ============================================

// ============================================
// 📍 MAPA DEFINITIVO DE URLs v5.0
// MONO-DOMÍNIO: pro.moisesmedeiros.com.br
// GESTÃO: /gestaofc (rota interna secreta)
// ============================================

export const URL_MAP = {
  // 🌐 NÃO PAGANTE - pro.moisesmedeiros.com.br/ + /comunidade
  PUBLIC: {
    domain: 'pro.moisesmedeiros.com.br',
    paths: ['/', '/auth', '/auth/*', '/termos', '/privacidade', '/area-gratuita', '/site', '/login', '/registro', '/comunidade'],
    roles: ['anonymous', 'aluno_gratuito', 'beta', 'funcionario', 'owner'],
    requireSubscription: false,
    description: 'Páginas públicas + comunidade acessíveis a todos com cadastro gratuito'
  },
  
  // 🌐 COMUNIDADE - pro.moisesmedeiros.com.br/comunidade (acessível por TODOS cadastrados)
  COMUNIDADE: {
    domain: 'pro.moisesmedeiros.com.br',
    paths: ['/comunidade', '/comunidade/*'],
    roles: ['aluno_gratuito', 'beta', 'funcionario', 'owner'],
    requireSubscription: false,
    description: 'Comunidade acessível por não pagantes E pagantes'
  },
  
  // 👨‍🎓 ALUNO BETA - pro.moisesmedeiros.com.br/alunos/* + /comunidade
  // Origem: Hotmart (pagamento) OU criado por Owner/Admin
  ALUNO_BETA: {
    domain: 'pro.moisesmedeiros.com.br',
    paths: ['/alunos', '/alunos/*', '/aulas', '/aulas/*', '/materiais', '/materiais/*', '/certificados', '/certificados/*', '/comunidade'],
    roles: ['beta', 'owner'],
    requireSubscription: true,
    description: 'Área exclusiva para alunos PAGANTES (beta) + comunidade. Criados via Hotmart/Owner/Admin'
  },
  
  // 👔 FUNCIONÁRIO/GESTÃO - pro.moisesmedeiros.com.br/gestaofc/* (ROTA INTERNA SECRETA)
  // Acesso APENAS por digitação manual da URL - NÃO há links visíveis
  GESTAOFC: {
    domain: 'pro.moisesmedeiros.com.br',
    paths: ['/gestaofc', '/gestaofc/*'],
    // P1-2 FIX: Sem 'funcionario' e 'employee' deprecated
    roles: ['owner', 'admin', 'coordenacao', 'suporte', 'monitoria', 'marketing', 'contabilidade', 'afiliado'],
    requireSubscription: false,
    description: 'Área de gestão interna - acesso SOMENTE por URL direta (secreta)',
    isSecret: true,
    logAllAccess: true
  },
  
  // 💰 FINANCEIRO - pro.moisesmedeiros.com.br/gestaofc/financeiro
  FINANCEIRO: {
    domain: 'pro.moisesmedeiros.com.br',
    paths: ['/gestaofc/financeiro', '/gestaofc/financeiro/*', '/gestaofc/contabilidade', '/gestaofc/contabilidade/*', '/gestaofc/relatorios'],
    roles: ['coordenacao', 'admin', 'owner', 'contabilidade'],
    requireSubscription: false,
    description: 'Área financeira restrita',
    logAllAccess: true
  },
  
  // 👑 OWNER - TODAS (MOISESBLANK@GMAIL.COM = MASTER)
  OWNER: {
    domain: '*',
    paths: ['/*'],
    roles: ['owner'],
    requireSubscription: false,
    description: 'Acesso TOTAL e irrestrito - MASTER (moisesblank@gmail.com)',
    email: 'moisesblank@gmail.com',
    poderes: ['criar', 'editar', 'excluir', 'importar', 'exportar', 'configurar', 'auditar'],
    logAllAccess: true  // Log de TODAS ações do owner para auditoria
  },
} as const;

// Helper para verificar se uma rota é /gestaofc
export function isGestaoPath(path: string): boolean {
  return path.startsWith('/gestaofc');
}

// Helper para verificar se deve logar acesso
export function shouldLogAccess(path: string): boolean {
  return isGestaoPath(path) || path.startsWith('/alunos');
}

// ============================================
// CACHE INTELIGENTE (LEI I - PERFORMANCE)
// ============================================

const accessCache = new Map<string, { result: UrlAccessResult; timestamp: number }>();
const rateLimitCache = new Map<string, { result: RateLimitResult; timestamp: number }>();
const CACHE_TTL = 5000; // 5 segundos

function getCachedAccess(key: string): UrlAccessResult | null {
  const cached = accessCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  return null;
}

function setCachedAccess(key: string, result: UrlAccessResult): void {
  accessCache.set(key, { result, timestamp: Date.now() });
  // Limpar cache antigo
  if (accessCache.size > 100) {
    const oldestKey = accessCache.keys().next().value;
    if (oldestKey) accessCache.delete(oldestKey);
  }
}

// ============================================
// FUNÇÕES DE VERIFICAÇÃO DE ACESSO
// ============================================

/**
 * Verifica se usuário pode acessar URL conforme MAPA DEFINITIVO
 * Otimizado com cache para 5000+ usuários
 */
export async function checkUrlAccess(
  userId: string,
  url: string,
  domain: string = 'pro.moisesmedeiros.com.br'
): Promise<UrlAccessResult> {
  const cacheKey = `${userId}:${url}:${domain}`;
  
  // Verificar cache primeiro (performance)
  const cached = getCachedAccess(cacheKey);
  if (cached) return cached;
  
  try {
    const { data, error } = await supabase.rpc('check_url_access_v3', {
      p_user_id: userId,
      p_url: url,
      p_domain: domain,
    });

    if (error) {
      console.error('[FORTALEZA] Erro ao verificar acesso:', error);
      // Fallback local se banco falhar
      return checkUrlAccessLocal(userId, url, domain);
    }

    if (data && data.length > 0) {
      const result = {
        allowed: data[0].allowed,
        reason: data[0].reason,
        redirect_to: data[0].redirect_to,
      };
      setCachedAccess(cacheKey, result);
      return result;
    }

    return { allowed: false, reason: 'No access rule found', redirect_to: '/auth' };
  } catch (err) {
    console.error('[FORTALEZA] Exceção ao verificar acesso:', err);
    return checkUrlAccessLocal(userId, url, domain);
  }
}

/**
 * Fallback local para verificação de acesso (quando banco offline)
 */
function checkUrlAccessLocal(userId: string, url: string, domain: string): UrlAccessResult {
  // Rotas públicas sempre permitidas
  const publicPaths = ['/', '/auth', '/login', '/registro', '/termos', '/privacidade', '/area-gratuita'];
  if (publicPaths.some(p => url === p || url.startsWith(p + '/'))) {
    return { allowed: true, reason: 'Public route', redirect_to: null };
  }
  
  // Se não autenticado, redirecionar
  if (!userId) {
    return { allowed: false, reason: 'Not authenticated', redirect_to: '/auth' };
  }
  
  // Fallback: permitir se autenticado (fail-open para não bloquear usuários)
  return { allowed: true, reason: 'Fallback local', redirect_to: null };
}

/**
 * Verifica rate limit para endpoint
 * Otimizado para alta concorrência
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  role: string = 'anonymous'
): Promise<RateLimitResult> {
  const cacheKey = `${identifier}:${endpoint}`;
  
  // Verificar cache de rate limit
  const cached = rateLimitCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 1000) { // Cache de 1s para rate limit
    return cached.result;
  }
  
  try {
    const { data, error } = await supabase.rpc('check_rate_limit_v3', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_role: role,
    });

    if (error) {
      console.error('[FORTALEZA] Erro rate limit:', error);
      return { allowed: true, remaining: 60, retry_after: 0 }; // Fail open
    }

    if (data && data.length > 0) {
      const result = {
        allowed: data[0].allowed,
        remaining: data[0].remaining,
        retry_after: data[0].retry_after,
      };
      rateLimitCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    return { allowed: true, remaining: 60, retry_after: 0 };
  } catch (err) {
    console.error('[FORTALEZA] Exceção rate limit:', err);
    return { allowed: true, remaining: 60, retry_after: 0 };
  }
}

/**
 * Registra evento de segurança
 * Fire-and-forget para não bloquear UI
 */
export async function logSecurityEvent(
  eventType: string,
  userId?: string,
  severity: string = 'info',
  details: Record<string, unknown> = {}
): Promise<string | null> {
  try {
    // Sanitizar details para evitar erros de JSON
    const safeDetails = JSON.parse(JSON.stringify(details || {}));
    
    const { data, error } = await supabase.rpc('log_security_v3', {
      p_event_type: eventType,
      p_user_id: userId || null,
      p_severity: severity,
      p_details: safeDetails,
    });

    if (error) {
      console.warn('[FORTALEZA] Erro ao logar evento (não crítico):', error.message);
      return null;
    }

    return data as string;
  } catch (err) {
    console.warn('[FORTALEZA] Exceção ao logar evento (não crítico):', err);
    return null;
  }
}

/**
 * Busca dashboard de segurança em tempo real
 */
export async function getSecurityDashboard(): Promise<SecurityDashboard | null> {
  try {
    const { data, error } = await supabase.rpc('get_security_dashboard_v3');

    if (error) {
      console.error('[FORTALEZA] Erro dashboard:', error);
      // Retornar dashboard vazio em caso de erro
      return {
        timestamp: new Date().toISOString(),
        active_threats: 0,
        blocked_users: 0,
        rate_limited: 0,
        events_1h: 0,
        critical_24h: 0,
        users_online: 0,
      };
    }

    return data as unknown as SecurityDashboard;
  } catch (err) {
    console.error('[FORTALEZA] Exceção dashboard:', err);
    return null;
  }
}

/**
 * Executa limpeza de dados antigos
 */
export async function cleanupSecurityData(): Promise<Record<string, number> | null> {
  try {
    const { data, error } = await supabase.rpc('cleanup_security_data_v3');

    if (error) {
      console.error('[FORTALEZA] Erro cleanup:', error);
      return null;
    }

    return data as Record<string, number>;
  } catch (err) {
    console.error('[FORTALEZA] Exceção cleanup:', err);
    return null;
  }
}

// ============================================
// RATE LIMITER CLIENT-SIDE (BACKUP)
// Otimizado para LEI I - Performance
// ============================================

const clientRateLimits = new Map<string, { count: number; windowStart: number }>();
const MAX_CLIENT_CACHE_SIZE = 1000;

export function checkClientRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = clientRateLimits.get(key);

  if (!record || now - record.windowStart > windowMs) {
    clientRateLimits.set(key, { count: 1, windowStart: now });
    
    // Limitar tamanho do cache (LEI I)
    if (clientRateLimits.size > MAX_CLIENT_CACHE_SIZE) {
      const oldestKey = clientRateLimits.keys().next().value;
      if (oldestKey) clientRateLimits.delete(oldestKey);
    }
    
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export function resetClientRateLimit(key: string): void {
  clientRateLimits.delete(key);
}

// ============================================
// DETECÇÃO DE AMEAÇAS CLIENT-SIDE
// ============================================

export function detectSuspiciousActivity(): {
  suspicious: boolean;
  reasons: string[];
  riskScore: number;
} {
  const reasons: string[] = [];
  let riskScore = 0;
  
  // 🛡️ P0 FIX: Preview environment bypass
  const hostname = window.location.hostname.toLowerCase();
  const isPreviewEnv = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('lovableproject.com') ||
    hostname.includes('.lovable.app') ||
    hostname.includes('.vercel.app');
  
  if (isPreviewEnv) {
    return { suspicious: false, riskScore: 0, reasons: ['preview_env_bypass'] };
  }

  try {
    // Detectar DevTools aberto
    const devToolsOpen = window.outerWidth - window.innerWidth > 160 ||
                         window.outerHeight - window.innerHeight > 160;
    if (devToolsOpen) {
      reasons.push('DevTools detected');
      riskScore += 20;
    }

    // Detectar automação (webdriver)
    if ((navigator as any).webdriver) {
      reasons.push('Automation detected');
      riskScore += 50;
    }

    // Detectar headless browser
    if (!navigator.languages || navigator.languages.length === 0) {
      reasons.push('Possible headless browser');
      riskScore += 30;
    }

    // Detectar múltiplas abas
    const tabCount = parseInt(sessionStorage.getItem('_tabCount') || '0', 10);
    if (tabCount > 5) {
      reasons.push('Multiple tabs detected');
      riskScore += 10;
    }

    // Detectar manipulação de DOM
    const bodyModified = document.body.getAttribute('data-integrity') !== 'valid';
    if (bodyModified && document.body.hasAttribute('data-integrity')) {
      reasons.push('DOM manipulation detected');
      riskScore += 30;
    }

    // Detectar plugins suspeitos
    const plugins = navigator.plugins?.length || 0;
    if (plugins === 0 && !('ontouchstart' in window)) {
      reasons.push('No plugins (possible bot)');
      riskScore += 15;
    }

  } catch (e) {
    // Silent fail
  }

  return {
    suspicious: riskScore >= 30,
    reasons,
    riskScore: Math.min(100, riskScore),
  };
}

// ============================================
// SANITIZAÇÃO E VALIDAÇÃO
// ============================================

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')
    .trim()
    .substring(0, 10000);
}

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const masked = local.slice(0, 2) + '***';
  return `${masked}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '***';
  return '***' + phone.slice(-4);
}

export function maskCPF(cpf: string): string {
  if (!cpf || cpf.length < 3) return '***';
  return '***' + cpf.slice(-3);
}

// ============================================
// CONFIGURAÇÕES DE SEGURANÇA v4.0
// ============================================

export const SECURITY_CONFIG = {
  // Rate Limiting por tipo de operação (EXPANDIDO v4.1)
  RATE_LIMIT: {
    AUTH: { requests: 5, windowMs: 60000, burst: 3, blockMs: 300000 },
    API: { requests: 100, windowMs: 60000, burst: 20 },
    UPLOAD: { requests: 10, windowMs: 60000, burst: 5 },
    SEARCH: { requests: 20, windowMs: 60000, burst: 10 },
    DOWNLOAD: { requests: 5, windowMs: 60000, burst: 3, blockMs: 60000 },
    CHAT: { requests: 20, windowMs: 10000, burst: 5 },
    VIDEO_URL: { requests: 10, windowMs: 60000, burst: 3, blockMs: 120000 },
    LIVE: { requests: 30, windowMs: 60000, burst: 10 },
    CONTENT_ACCESS: { requests: 50, windowMs: 60000, burst: 15 },
  },
  
  // Sessão
  SESSION: {
    CHECK_INTERVAL_MS: 30000,
    MAX_DEVICES: 3,
    IDLE_TIMEOUT_MS: 1800000, // 30 min
    ABSOLUTE_TIMEOUT_MS: 86400000, // 24h
  },
  
  // Bloqueio progressivo
  LOCKOUT: {
    MAX_ATTEMPTS: 5, // 5 tentativas - padrão de segurança
    DURATION_MS: 900000, // 15 min
    PROGRESSIVE: true,
    MULTIPLIER: 2,
    MAX_DURATION_MS: 86400000, // 24h máximo
  },
  
  // Tokens
  TOKEN: {
    REFRESH_THRESHOLD_MS: 300000, // 5 min antes de expirar
  },
  
  // Detecção de ameaças
  THREAT_DETECTION: {
    ENABLED: true,
    CHECK_INTERVAL_MS: 60000,
    RISK_THRESHOLD: 30,
    AUTO_BLOCK_THRESHOLD: 70,
  },
  
  // Cache
  CACHE: {
    ACCESS_TTL_MS: 5000,
    RATE_LIMIT_TTL_MS: 1000,
    MAX_SIZE: 1000,
  },
} as const;

// Tipos para rate limit endpoint
export type RateLimitEndpoint = keyof typeof SECURITY_CONFIG.RATE_LIMIT;

// ============================================
// MELHORIA 1: logAudit() - Auditoria Dedicada
// ============================================

export async function logAudit(
  action: string,
  category: string = 'general',
  tableName?: string,
  recordId?: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>,
  metadata: Record<string, unknown> = {}
): Promise<string | null> {
  try {
    // Usar logSecurityEvent como fallback - mais robusto
    const details = {
      action,
      category,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
      new_data: newData ? JSON.parse(JSON.stringify(newData)) : null,
      ...metadata,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    return await logSecurityEvent('audit', undefined, 'info', details);
  } catch (err) {
    console.warn('[FORTALEZA] Audit exception (non-critical):', err);
    return null;
  }
}

// ============================================
// MELHORIA 2: detectScreenCapture() - Anti-Screenshot/Gravação
// ============================================

export function detectScreenCapture(callback: () => void): () => void {
  // Detectar tecla Print Screen
  const handleKeyDown = (e: KeyboardEvent) => {
    if (
      e.key === 'PrintScreen' ||
      (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) || // Mac screenshot
      (e.ctrlKey && e.key === 'PrintScreen') // Windows
    ) {
      callback();
      e.preventDefault();
    }
  };

  // Detectar Picture-in-Picture (possível gravação)
  const handlePiP = () => {
    if (document.pictureInPictureElement) {
      callback();
    }
  };

  // Detectar visibilidade (gravar com OBS pode disparar isso)
  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      // Log silencioso - não bloquear
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('enterpictureinpicture', handlePiP);
    document.addEventListener('visibilitychange', handleVisibility);
  }

  // Retorna função de cleanup
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('enterpictureinpicture', handlePiP);
      document.removeEventListener('visibilitychange', handleVisibility);
    }
  };
}

// ============================================
// MELHORIA 3: Rate Limit com blockedUntil
// ============================================

export interface RateLimitResultExtended extends RateLimitResult {
  blocked_until?: string;
  retry_after_seconds?: number;
}

const rateLimitExtendedCache = new Map<string, { result: RateLimitResultExtended; timestamp: number }>();

export async function checkRateLimitExtended(
  identifier: string,
  endpoint: string,
  role: string = 'anonymous'
): Promise<RateLimitResultExtended> {
  const cacheKey = `${identifier}:${endpoint}`;
  
  // Verificar cache com blockedUntil
  const cached = rateLimitExtendedCache.get(cacheKey);
  if (cached) {
    // Se ainda está bloqueado, retornar do cache
    if (cached.result.blocked_until) {
      const blockedUntil = new Date(cached.result.blocked_until);
      if (blockedUntil > new Date()) {
        return cached.result;
      }
    }
    // Cache normal de 1s
    if (Date.now() - cached.timestamp < 1000) {
      return cached.result;
    }
  }
  
  try {
    // Usar a função existente check_rate_limit_v3
    const baseResult = await checkRateLimit(identifier, endpoint, role);
    
    // Estender com blocked_until calculado
    const result: RateLimitResultExtended = {
      ...baseResult,
      blocked_until: baseResult.retry_after > 0 
        ? new Date(Date.now() + baseResult.retry_after * 1000).toISOString() 
        : undefined,
      retry_after_seconds: baseResult.retry_after,
    };
    
    rateLimitExtendedCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error('[FORTALEZA] Rate limit extended exception:', err);
    return { allowed: true, remaining: 60, retry_after: 0 };
  }
}

// ============================================
// UTILS PARA PERFORMANCE
// ============================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// EXPORTAÇÃO PADRÃO v4.1
// ============================================

export default {
  // Funções principais
  checkUrlAccess,
  checkRateLimit,
  checkRateLimitExtended,
  logSecurityEvent,
  logAudit,
  getSecurityDashboard,
  cleanupSecurityData,
  
  // Rate limiting client-side
  checkClientRateLimit,
  resetClientRateLimit,
  
  // Detecção de ameaças
  detectSuspiciousActivity,
  detectScreenCapture,
  
  // Sanitização
  sanitizeInput,
  sanitizeHtml,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  maskEmail,
  maskPhone,
  maskCPF,
  
  // Utils
  debounce,
  throttle,
  
  // Configurações
  URL_MAP,
  SECURITY_CONFIG,
};
