// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.0
// A DIRETRIZ SUPREMA DA FORTALEZA DIGITAL
// ============================================

import { supabase } from '@/integrations/supabase/client';

// ============================================
// DOGMA II: LITURGIA DO ACESSO MÍNIMO
// ============================================

export type SystemArea = 
  | 'dashboard'
  | 'alunos'
  | 'cursos'
  | 'financeiro'
  | 'contabilidade'
  | 'equipe'
  | 'tarefas'
  | 'ponto'
  | 'perfil'
  | 'relatorios'
  | 'configuracoes'
  | 'god_mode'
  | 'personal_finance';

// Mapeamento de áreas por role
export const ROLE_AREA_PERMISSIONS: Record<string, SystemArea[]> = {
  owner: [
    'dashboard', 'alunos', 'cursos', 'financeiro', 'contabilidade',
    'equipe', 'tarefas', 'ponto', 'perfil', 'relatorios', 'configuracoes',
    'god_mode', 'personal_finance'
  ],
  admin: [
    'dashboard', 'alunos', 'cursos', 'financeiro', 'contabilidade',
    'equipe', 'tarefas', 'ponto', 'perfil', 'relatorios', 'configuracoes'
  ],
  contabilidade: [
    'dashboard', 'financeiro', 'contabilidade', 'relatorios', 'perfil'
  ],
  coordenacao: [
    'dashboard', 'alunos', 'cursos', 'equipe', 'tarefas', 'perfil'
  ],
  employee: [
    'dashboard', 'tarefas', 'ponto', 'perfil'
  ],
};

// Verificar permissão de área localmente
export function hasAreaPermission(role: string | null, area: SystemArea): boolean {
  if (!role) return false;
  const allowedAreas = ROLE_AREA_PERMISSIONS[role] || [];
  return allowedAreas.includes(area);
}

// ============================================
// LOGGING DE SEGURANÇA
// ============================================

export interface SecurityEvent {
  event_type: 'access_blocked' | 'session_invalid' | 'suspicious_activity' | 'rate_limit_exceeded';
  resource: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await supabase.rpc('log_security_event', {
      p_event_type: event.event_type,
      p_severity: event.severity === 'critical' ? 'error' : event.severity === 'high' ? 'warn' : 'info',
      p_source: 'frontend',
      p_description: event.reason,
      p_payload: { resource: event.resource },
    });
  } catch (err) {
    console.error('[SEGURANÇA] Erro ao logar evento:', err);
  }
}

export async function logBlockedAccess(resource: string, reason: string): Promise<void> {
  try {
    await supabase.rpc('log_blocked_access', {
      p_resource: resource,
      p_reason: reason,
    });
    
    console.warn(`[SEGURANÇA] 🔴 Acesso bloqueado: ${resource} - ${reason}`);
  } catch (err) {
    console.error('[SEGURANÇA] Erro ao logar bloqueio:', err);
  }
}

// ============================================
// SANITIZAÇÃO DE DADOS
// ============================================

// Sanitizar dados antes de exibir (prevenção de XSS)
export function sanitizeForDisplay(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validar UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// ============================================
// RATE LIMITING (FRONTEND)
// ============================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkFrontendRateLimit(key: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (entry.count >= limit) {
    logSecurityEvent({
      event_type: 'rate_limit_exceeded',
      resource: key,
      reason: `Rate limit exceeded: ${entry.count}/${limit} in window`,
      severity: 'medium',
    });
    return false;
  }
  
  entry.count++;
  return true;
}

// ============================================
// PROTEÇÃO CONTRA MANIPULAÇÃO DE DOM
// ============================================

export function detectDOMManipulation(): boolean {
  // Verificar se elementos críticos foram alterados
  const criticalElements = document.querySelectorAll('[data-security="critical"]');
  
  for (const el of criticalElements) {
    const hash = el.getAttribute('data-security-hash');
    if (hash && hash !== computeElementHash(el as HTMLElement)) {
      logSecurityEvent({
        event_type: 'suspicious_activity',
        resource: 'dom_manipulation',
        reason: 'Critical element was modified',
        severity: 'high',
      });
      return true;
    }
  }
  
  return false;
}

function computeElementHash(el: HTMLElement): string {
  // Hash simples do conteúdo do elemento
  const content = el.innerHTML;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// ============================================
// CONSTANTES DE SEGURANÇA
// ============================================

export const SECURITY_CONFIG = {
  // Sessão
  SESSION_CHECK_INTERVAL: 30000,
  SESSION_TOKEN_KEY: 'matriz_session_token',
  
  // Rate limiting
  API_RATE_LIMIT: 100,
  API_RATE_WINDOW: 60000,
  
  // Proteção
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15 minutos
  
  // Logs
  LOG_SENSITIVE_ACTIONS: true,
};

console.log('[EVANGELHO DA SEGURANÇA] 🛡️ v2.0 carregado - Fortaleza Digital ativa');
