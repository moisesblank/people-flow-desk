// ============================================
// 🛡️ FORTALEZA SUPREME v3.0
// SISTEMA DE SEGURANÇA PHD-LEVEL 2300
// Preparado para 5000+ usuários simultâneos
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

// ============================================
// MAPA DEFINITIVO DE URLs
// ============================================

export const URL_MAP = {
  // 🌐 NÃO PAGANTE - pro.moisesmedeiros.com.br/
  PUBLIC: {
    domain: 'pro.moisesmedeiros.com.br',
    paths: ['/', '/auth', '/auth/*'],
    roles: ['anonymous', 'beta', 'funcionario', 'owner'],
    requireSubscription: false,
  },
  
  // 👨‍🎓 ALUNO BETA - pro.moisesmedeiros.com.br/alunos
  ALUNO_BETA: {
    domain: 'pro.moisesmedeiros.com.br',
    paths: ['/alunos', '/alunos/*', '/aulas', '/aulas/*', '/materiais', '/materiais/*'],
    roles: ['beta', 'owner'],
    requireSubscription: true,
  },
  
  // 👔 FUNCIONÁRIO - gestao.moisesmedeiros.com.br/
  FUNCIONARIO: {
    domain: 'gestao.moisesmedeiros.com.br',
    paths: ['/', '/*', '/dashboard', '/alunos-gestao'],
    roles: ['funcionario', 'coordenacao', 'admin', 'owner'],
    requireSubscription: false,
  },
  
  // 👑 OWNER - TODAS
  OWNER: {
    domain: '*',
    paths: ['/*'],
    roles: ['owner'],
    requireSubscription: false,
  },
} as const;

// ============================================
// FUNÇÕES DE VERIFICAÇÃO DE ACESSO
// ============================================

/**
 * Verifica se usuário pode acessar URL conforme MAPA DEFINITIVO
 */
export async function checkUrlAccess(
  userId: string,
  url: string,
  domain: string = 'pro.moisesmedeiros.com.br'
): Promise<UrlAccessResult> {
  try {
    const { data, error } = await supabase.rpc('check_url_access_v3', {
      p_user_id: userId,
      p_url: url,
      p_domain: domain,
    });

    if (error) {
      console.error('[FORTALEZA] Erro ao verificar acesso:', error);
      return { allowed: false, reason: 'Error checking access', redirect_to: '/auth' };
    }

    if (data && data.length > 0) {
      return {
        allowed: data[0].allowed,
        reason: data[0].reason,
        redirect_to: data[0].redirect_to,
      };
    }

    return { allowed: false, reason: 'No access rule found', redirect_to: '/auth' };
  } catch (err) {
    console.error('[FORTALEZA] Exceção ao verificar acesso:', err);
    return { allowed: false, reason: 'Exception', redirect_to: '/auth' };
  }
}

/**
 * Verifica rate limit para endpoint
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  role: string = 'anonymous'
): Promise<RateLimitResult> {
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
      return {
        allowed: data[0].allowed,
        remaining: data[0].remaining,
        retry_after: data[0].retry_after,
      };
    }

    return { allowed: true, remaining: 60, retry_after: 0 };
  } catch (err) {
    console.error('[FORTALEZA] Exceção rate limit:', err);
    return { allowed: true, remaining: 60, retry_after: 0 };
  }
}

/**
 * Registra evento de segurança
 */
export async function logSecurityEvent(
  eventType: string,
  userId?: string,
  severity: string = 'info',
  details: Record<string, unknown> = {}
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('log_security_v3', {
      p_event_type: eventType,
      p_user_id: userId || null,
      p_severity: severity,
      p_details: JSON.parse(JSON.stringify(details)),
    });

    if (error) {
      console.error('[FORTALEZA] Erro ao logar evento:', error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error('[FORTALEZA] Exceção ao logar evento:', err);
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
      return null;
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
// ============================================

const clientRateLimits = new Map<string, { count: number; windowStart: number }>();

export function checkClientRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = clientRateLimits.get(key);

  if (!record || now - record.windowStart > windowMs) {
    clientRateLimits.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
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

  // Detectar DevTools aberto
  const devToolsOpen = window.outerWidth - window.innerWidth > 160 ||
                       window.outerHeight - window.innerHeight > 160;
  if (devToolsOpen) {
    reasons.push('DevTools detected');
    riskScore += 20;
  }

  // Detectar automação
  if ((navigator as any).webdriver) {
    reasons.push('Automation detected');
    riskScore += 50;
  }

  // Detectar múltiplas abas
  const tabCount = parseInt(sessionStorage.getItem('_tabCount') || '0', 10);
  if (tabCount > 5) {
    reasons.push('Multiple tabs detected');
    riskScore += 10;
  }

  // Detectar manipulação de DOM
  const bodyModified = document.body.getAttribute('data-integrity') !== 'valid';
  if (bodyModified) {
    reasons.push('DOM manipulation detected');
    riskScore += 30;
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
    .trim()
    .substring(0, 10000);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// ============================================
// CONFIGURAÇÕES DE SEGURANÇA
// ============================================

export const SECURITY_CONFIG = {
  // Rate Limiting
  RATE_LIMIT: {
    AUTH: { requests: 5, windowMs: 60000 },
    API: { requests: 100, windowMs: 60000 },
    UPLOAD: { requests: 10, windowMs: 60000 },
    SEARCH: { requests: 20, windowMs: 60000 },
  },
  
  // Sessão
  SESSION: {
    CHECK_INTERVAL_MS: 30000,
    MAX_DEVICES: 3,
    IDLE_TIMEOUT_MS: 1800000, // 30 min
  },
  
  // Bloqueio
  LOCKOUT: {
    MAX_ATTEMPTS: 5,
    DURATION_MS: 900000, // 15 min
    PROGRESSIVE: true,
  },
  
  // Tokens
  TOKEN: {
    REFRESH_THRESHOLD_MS: 300000, // 5 min antes de expirar
  },
} as const;

// ============================================
// EXPORTAÇÃO PADRÃO
// ============================================

export default {
  checkUrlAccess,
  checkRateLimit,
  logSecurityEvent,
  getSecurityDashboard,
  cleanupSecurityData,
  checkClientRateLimit,
  detectSuspiciousActivity,
  sanitizeInput,
  isValidUUID,
  isValidEmail,
  URL_MAP,
  SECURITY_CONFIG,
};
