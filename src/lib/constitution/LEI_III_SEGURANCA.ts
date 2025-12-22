// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - LEI III: SEGURANÇA
// FORTALEZA DIGITAL ULTRA v3.0
// 43 Artigos - OBRIGATÓRIO em TODO código
// Objetivo: Segurança nível NASA + Zero Trust
// ============================================

/*
═══ DOGMA I - SESSÃO ÚNICA (1-3) ═══
• UMA sessão ativa por usuário, sempre
• Token em localStorage + validação no banco
• Logout automático se sessão invalidada em outro device
• Validar sessão a cada 30s e em visibility change

═══ DOGMA II - CONTROLE DE DISPOSITIVOS (4-6) ═══
• Máximo 3 dispositivos por usuário (configurável por role)
• Fingerprint único: canvas + audio + WebGL + fonts + plugins
• device_hash SHA-256 do fingerprint
• Registro: device_type, browser, OS, IP, city, country

═══ DOGMA III - PROTEÇÃO DE CONTEÚDO (7-10) ═══
• PDFs: watermark dinâmico com nome + CPF + email
• Vídeos: URLs assinadas com expiração (15-60min)
• Bloquear: contextmenu, selectstart, copy, print, F12, Ctrl+S/P/U
• Anti-screenshot: padrão de overlay CSS

═══ DOGMA IV - RATE LIMITING (11-14) ═══
• Níveis: login=5/5min, signup=3/10min, 2fa=5/5min, api=100/min
• Cache em memória + persistência no banco
• Headers: Retry-After, X-RateLimit-Remaining
• Bloquear IP após 10 violações consecutivas

═══ DOGMA V - VALIDAÇÃO DE ENTRADA (15-18) ═══
• NUNCA confiar em input do cliente
• sanitizeInput(): remove < > " ' ` $ { } \ ; --
• sanitizeHtml(): DOMPurify ou regex rígido
• Validar: UUID, email, telefone, CPF antes de usar

═══ DOGMA VI - CONTROLE DE ACESSO (19-22) ═══
• Roles em tabela separada (NUNCA em profiles)
• has_role() function com SECURITY DEFINER
• URL_MAP: definir roles permitidos por rota
• checkUrlAccess() antes de renderizar rotas protegidas

═══ DOGMA VII - LOGS E AUDITORIA (23-26) ═══
• security_events: TODA ação sensível logada
• Campos: event_type, severity, user_id, ip, user_agent, payload
• Severidades: info, warn, error, critical
• Retenção: 90 dias mínimo, críticos = permanente

═══ DOGMA VIII - PROTEÇÃO RLS (27-30) ═══
• TODAS tabelas com RLS habilitado
• Políticas específicas: SELECT, INSERT, UPDATE, DELETE
• NUNCA usar auth.users diretamente, usar auth.uid()
• Funções SECURITY DEFINER para queries complexas

═══ DOGMA IX - WEBHOOKS SEGUROS (31-33) ═══
• HMAC-SHA256 para validação de origem
• Verificar X-Hotmart-Hottok ou equivalente
• Logar TODA requisição (sucesso e falha)
• Idempotency: verificar transaction_id duplicado

═══ DOGMA X - DETECÇÃO DE AMEAÇAS (34-37) ═══
• detectSuspiciousActivity(): DevTools, automação, debugger
• Sinais: outerHeight-innerHeight > 200, automation flags
• Risk score: 0-100, bloquear > 80
• Fingerprint mismatch = sessão revogada

═══ DOGMA XI - TOKENS E SESSÕES (38-40) ═══
• session_token: crypto.randomUUID() no login
• Expiração: 24h padrão, 7d com "lembrar-me"
• Refresh: 5min antes de expirar
• Revogar TODAS sessões em troca de senha

═══ DOGMA XII - FINAL (41-43) ═══
• Aplicar em TODO código, sem exceção
• Segurança > Conveniência (mantendo UX)
• NUNCA remover ou enfraquecer artigos
• Audit semestral obrigatório
*/

// ============================================
// IMPLEMENTAÇÃO DA LEI III
// ============================================

import { supabase } from '@/integrations/supabase/client';

// ═══ CONFIGURAÇÕES SOBERANAS ═══
export const SECURITY_CONSTITUTION = {
  // DOGMA I - Sessão
  session: {
    validateIntervalMs: 30000,
    defaultExpirationHours: 24,
    rememberMeExpirationDays: 7,
    refreshBeforeExpiryMinutes: 5,
  },
  
  // DOGMA II - Dispositivos
  devices: {
    maxPerUser: 3,
    maxByRole: {
      owner: 10,
      admin: 5,
      user: 3,
      free: 1,
    },
    fingerprintComponents: ['canvas', 'audio', 'webgl', 'fonts', 'plugins', 'screen', 'timezone'],
  },
  
  // DOGMA III - Conteúdo
  content: {
    pdfWatermarkOpacity: 0.15,
    videoUrlExpirationMinutes: 30,
    blockedKeys: ['F12', 'F5', 'PrintScreen'],
    blockedCombos: ['Ctrl+S', 'Ctrl+P', 'Ctrl+U', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C'],
  },
  
  // DOGMA IV - Rate Limiting
  rateLimits: {
    login: { limit: 5, windowSeconds: 300 },
    signup: { limit: 3, windowSeconds: 600 },
    passwordReset: { limit: 3, windowSeconds: 3600 },
    '2fa': { limit: 5, windowSeconds: 300 },
    apiCall: { limit: 100, windowSeconds: 60 },
    webhook: { limit: 50, windowSeconds: 60 },
    default: { limit: 30, windowSeconds: 60 },
  },
  
  // DOGMA V - Validação
  validation: {
    dangerousChars: /[<>"'`${}\\;]|--/g,
    uuidRegex: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phoneRegex: /^\+?[\d\s()-]{10,}$/,
    cpfRegex: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  },
  
  // DOGMA VI - Acesso
  access: {
    publicRoutes: ['/', '/auth', '/landing', '/certificado'],
    staffRoles: ['owner', 'admin'],
    cacheTtlMs: 60000,
  },
  
  // DOGMA VII - Logs
  logging: {
    retentionDays: 90,
    criticalRetentionDays: 365,
    severities: ['info', 'warn', 'error', 'critical'] as const,
  },
  
  // DOGMA X - Ameaças
  threats: {
    devToolsThreshold: 200,
    riskScoreBlockThreshold: 80,
    suspiciousSignals: [
      'webdriver',
      '__selenium_unwrapped',
      '__webdriver_evaluate',
      '__driver_evaluate',
      'callPhantom',
      '_phantom',
    ],
  },
  
  // DOGMA XI - Tokens
  tokens: {
    lockoutAttempts: 5,
    lockoutDurationMinutes: 15,
    mfaCodeValiditySeconds: 300,
  },
} as const;

// ═══ TIPOS ═══
export type Severity = typeof SECURITY_CONSTITUTION.logging.severities[number];
export type RateLimitEndpoint = keyof typeof SECURITY_CONSTITUTION.rateLimits;

export interface SecurityEvent {
  eventType: string;
  severity: Severity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  payload?: Record<string, unknown> | null;
}

export interface ThreatAnalysis {
  suspicious: boolean;
  riskScore: number;
  reasons: string[];
}

// ═══ DOGMA V - SANITIZAÇÃO ═══
export function sanitizeInput(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(SECURITY_CONSTITUTION.validation.dangerousChars, '').trim();
}

export function sanitizeForDisplay(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function isValidUUID(uuid: string): boolean {
  return SECURITY_CONSTITUTION.validation.uuidRegex.test(uuid);
}

export function isValidEmail(email: string): boolean {
  return SECURITY_CONSTITUTION.validation.emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  return SECURITY_CONSTITUTION.validation.phoneRegex.test(phone);
}

export function isValidCPF(cpf: string): boolean {
  return SECURITY_CONSTITUTION.validation.cpfRegex.test(cpf);
}

// ═══ DOGMA V - MASCARAMENTO ═══
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return '***@***.***';
  const visible = Math.min(2, Math.floor(user.length / 2));
  return `${user.slice(0, visible)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return '****-****';
  return `${digits.slice(0, 2)}****${digits.slice(-4)}`;
}

export function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return '***.***.**-**';
  return `${digits.slice(0, 3)}.***.**-${digits.slice(-2)}`;
}

// ═══ DOGMA VII - LOGGING ═══
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const payload = event.payload ? JSON.parse(JSON.stringify(event.payload)) : null;
    
    await supabase.from('security_events').insert([{
      event_type: event.eventType,
      severity: event.severity,
      user_id: event.userId,
      ip_address: event.ipAddress,
      user_agent: event.userAgent || navigator.userAgent.substring(0, 500),
      payload: payload,
      source: 'constitution-law-iii',
    }]);
  } catch (error) {
    console.error('🛡️ LEI III - Erro ao logar evento:', error);
  }
}

// ═══ DOGMA X - DETECÇÃO DE AMEAÇAS ═══
export function detectSuspiciousActivity(): ThreatAnalysis {
  const reasons: string[] = [];
  let riskScore = 0;
  
  // DevTools aberto
  const devToolsOpen = window.outerHeight - window.innerHeight > SECURITY_CONSTITUTION.threats.devToolsThreshold;
  if (devToolsOpen) {
    reasons.push('DevTools detectado');
    riskScore += 30;
  }
  
  // Automação/Bot
  const nav = navigator as Navigator & { webdriver?: boolean };
  if (nav.webdriver) {
    reasons.push('WebDriver detectado');
    riskScore += 50;
  }
  
  // Sinais suspeitos no window
  for (const signal of SECURITY_CONSTITUTION.threats.suspiciousSignals) {
    if (signal in window) {
      reasons.push(`Sinal suspeito: ${signal}`);
      riskScore += 20;
    }
  }
  
  // Debugger statement detection
  const startTime = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  if (performance.now() - startTime > 100) {
    reasons.push('Debugger ativo');
    riskScore += 25;
  }
  
  return {
    suspicious: riskScore >= SECURITY_CONSTITUTION.threats.riskScoreBlockThreshold,
    riskScore: Math.min(100, riskScore),
    reasons,
  };
}

// ═══ DOGMA IV - RATE LIMITING (Client-Side) ═══
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

export function checkClientRateLimit(
  key: string,
  endpoint: RateLimitEndpoint = 'default'
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = SECURITY_CONSTITUTION.rateLimits[endpoint];
  const now = Date.now();
  const cacheKey = `${key}:${endpoint}`;
  
  let entry = rateLimitCache.get(cacheKey);
  
  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + config.windowSeconds * 1000 };
    rateLimitCache.set(cacheKey, entry);
  } else {
    entry.count++;
  }
  
  return {
    allowed: entry.count <= config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function resetClientRateLimit(key: string, endpoint?: RateLimitEndpoint): void {
  if (endpoint) {
    rateLimitCache.delete(`${key}:${endpoint}`);
  } else {
    for (const k of rateLimitCache.keys()) {
      if (k.startsWith(`${key}:`)) {
        rateLimitCache.delete(k);
      }
    }
  }
}

// ═══ DOGMA III - BLOQUEIO DE AÇÕES ═══
export function blockDangerousActions(): () => void {
  const handlers: { event: string; handler: EventListener }[] = [];
  
  const blockedKeys = ['F12', 'F5', 'PRINTSCREEN'];
  const blockedCombos = ['Ctrl+S', 'Ctrl+P', 'Ctrl+U', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C'];
  
  // Bloquear teclas
  const keyHandler = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase();
    const combo = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${key}`;
    
    if (blockedKeys.includes(key) || blockedCombos.includes(combo)) {
      e.preventDefault();
      e.stopPropagation();
      logSecurityEvent({
        eventType: 'BLOCKED_KEY',
        severity: 'warn',
        payload: { key, combo },
      });
    }
  };
  
  // Bloquear menu de contexto
  const contextHandler = (e: Event) => {
    e.preventDefault();
    logSecurityEvent({
      eventType: 'BLOCKED_CONTEXT_MENU',
      severity: 'info',
    });
  };
  
  // Bloquear seleção
  const selectHandler = (e: Event) => {
    e.preventDefault();
  };
  
  // Bloquear cópia
  const copyHandler = (e: Event) => {
    e.preventDefault();
    logSecurityEvent({
      eventType: 'BLOCKED_COPY',
      severity: 'warn',
    });
  };
  
  // Bloquear print
  const printHandler = (e: Event) => {
    e.preventDefault();
    logSecurityEvent({
      eventType: 'BLOCKED_PRINT',
      severity: 'warn',
    });
  };
  
  document.addEventListener('keydown', keyHandler);
  document.addEventListener('contextmenu', contextHandler);
  document.addEventListener('selectstart', selectHandler);
  document.addEventListener('copy', copyHandler);
  window.addEventListener('beforeprint', printHandler);
  
  handlers.push(
    { event: 'keydown', handler: keyHandler as EventListener },
    { event: 'contextmenu', handler: contextHandler },
    { event: 'selectstart', handler: selectHandler },
    { event: 'copy', handler: copyHandler },
  );
  
  // Cleanup function
  return () => {
    document.removeEventListener('keydown', keyHandler);
    document.removeEventListener('contextmenu', contextHandler);
    document.removeEventListener('selectstart', selectHandler);
    document.removeEventListener('copy', copyHandler);
    window.removeEventListener('beforeprint', printHandler);
  };
}

// ═══ DOGMA II - FINGERPRINT ═══
export async function generateDeviceFingerprint(): Promise<string> {
  const components: string[] = [];
  
  // Screen
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Language
  components.push(navigator.language);
  
  // Platform
  components.push(navigator.platform);
  
  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('🛡️ SYNAPSE CONSTITUTION', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    components.push('canvas-blocked');
  }
  
  // WebGL
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch {
    components.push('webgl-blocked');
  }
  
  // Hash
  const data = components.join('|');
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ═══ HOOK PRINCIPAL ═══
export function useSecurityConstitution() {
  return {
    // Config
    config: SECURITY_CONSTITUTION,
    
    // Sanitização
    sanitizeInput,
    sanitizeForDisplay,
    isValidUUID,
    isValidEmail,
    isValidPhone,
    isValidCPF,
    maskEmail,
    maskPhone,
    maskCPF,
    
    // Rate Limiting
    checkClientRateLimit,
    resetClientRateLimit,
    
    // Ameaças
    detectSuspiciousActivity,
    
    // Proteção
    blockDangerousActions,
    
    // Fingerprint
    generateDeviceFingerprint,
    
    // Logging
    logSecurityEvent,
  };
}

// ═══ EXPORT DEFAULT ═══
export default {
  SECURITY_CONSTITUTION,
  sanitizeInput,
  sanitizeForDisplay,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  isValidCPF,
  maskEmail,
  maskPhone,
  maskCPF,
  checkClientRateLimit,
  resetClientRateLimit,
  detectSuspiciousActivity,
  blockDangerousActions,
  generateDeviceFingerprint,
  logSecurityEvent,
  useSecurityConstitution,
};
