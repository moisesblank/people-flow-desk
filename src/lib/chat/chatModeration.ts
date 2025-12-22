// ============================================
// 🛡️ SISTEMA DE MODERAÇÃO DE CHAT - MATRIZ 2300
// Sanitização, Filtros e Controles de Moderação
// ============================================

import { LIVE_5K_CONFIG } from '@/config/performance-5k';

// ============================================
// LISTA DE PALAVRAS PROIBIDAS (expandível)
// ============================================
const BLOCKED_WORDS = [
  // Palavrões e ofensas (adicionar conforme necessário)
  'merda', 'porra', 'caralho', 'puta', 'viado', 'buceta', 'cu', 'foda',
  'arrombado', 'corno', 'otario', 'idiota', 'babaca', 'imbecil',
  // Spam
  'compre agora', 'clique aqui', 'ganhe dinheiro', 'trabalhe em casa',
  // URLs suspeitas
  'bit.ly', 'tinyurl', 't.co',
];

// Regex para detectar URLs
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

// Regex para detectar emails
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

// Regex para detectar números de telefone
const PHONE_REGEX = /(\+?55\s?)?(\(?\d{2}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}/g;

// ============================================
// TIPOS
// ============================================

export interface ModerationResult {
  isAllowed: boolean;
  sanitizedMessage: string;
  violations: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
}

export interface UserModerationState {
  isBanned: boolean;
  banExpiresAt?: number;
  banReason?: string;
  timeoutUntil?: number;
  warningCount: number;
}

export interface ChatModerationConfig {
  slowModeEnabled: boolean;
  slowModeInterval: number;
  blockUrls: boolean;
  blockEmails: boolean;
  blockPhones: boolean;
  maxMessageLength: number;
  requireApproval: boolean;
}

// Estado de moderação por usuário (em memória)
const userModerationStates = new Map<string, UserModerationState>();

// Configuração padrão de moderação
let moderationConfig: ChatModerationConfig = {
  slowModeEnabled: false,
  slowModeInterval: LIVE_5K_CONFIG.CHAT.MIN_MESSAGE_INTERVAL,
  blockUrls: true,
  blockEmails: true,
  blockPhones: true,
  maxMessageLength: LIVE_5K_CONFIG.CHAT.MAX_MESSAGE_LENGTH,
  requireApproval: false,
};

// ============================================
// FUNÇÕES DE SANITIZAÇÃO
// ============================================

/**
 * Remove caracteres perigosos e sanitiza HTML
 */
export function sanitizeHtml(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/\\/g, '&#92;');
}

/**
 * Remove espaços excessivos
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Censura palavras bloqueadas
 */
export function censorBlockedWords(text: string): { result: string; found: string[] } {
  let result = text;
  const found: string[] = [];
  
  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(result)) {
      found.push(word);
      result = result.replace(regex, '*'.repeat(word.length));
    }
  }
  
  return { result, found };
}

/**
 * Remove ou censura URLs
 */
export function processUrls(text: string, block: boolean): { result: string; found: boolean } {
  const hasUrls = URL_REGEX.test(text);
  if (hasUrls && block) {
    return {
      result: text.replace(URL_REGEX, '[link removido]'),
      found: true
    };
  }
  return { result: text, found: hasUrls };
}

/**
 * Remove ou censura emails
 */
export function processEmails(text: string, block: boolean): { result: string; found: boolean } {
  const hasEmails = EMAIL_REGEX.test(text);
  if (hasEmails && block) {
    return {
      result: text.replace(EMAIL_REGEX, '[email removido]'),
      found: true
    };
  }
  return { result: text, found: hasEmails };
}

/**
 * Remove ou censura telefones
 */
export function processPhones(text: string, block: boolean): { result: string; found: boolean } {
  const hasPhones = PHONE_REGEX.test(text);
  if (hasPhones && block) {
    return {
      result: text.replace(PHONE_REGEX, '[telefone removido]'),
      found: true
    };
  }
  return { result: text, found: hasPhones };
}

// ============================================
// FUNÇÃO PRINCIPAL DE MODERAÇÃO
// ============================================

/**
 * Processa e modera uma mensagem
 */
export function moderateMessage(
  message: string,
  userId: string,
  config: Partial<ChatModerationConfig> = {}
): ModerationResult {
  const cfg = { ...moderationConfig, ...config };
  const violations: string[] = [];
  let severity: ModerationResult['severity'] = 'none';
  
  // Verificar se usuário está banido
  const userState = userModerationStates.get(userId);
  if (userState?.isBanned) {
    if (!userState.banExpiresAt || userState.banExpiresAt > Date.now()) {
      return {
        isAllowed: false,
        sanitizedMessage: '',
        violations: ['Usuário banido: ' + (userState.banReason || 'Violação das regras')],
        severity: 'high'
      };
    } else {
      // Ban expirou, limpar
      userModerationStates.set(userId, { ...userState, isBanned: false });
    }
  }
  
  // Verificar timeout
  if (userState?.timeoutUntil && userState.timeoutUntil > Date.now()) {
    const remaining = Math.ceil((userState.timeoutUntil - Date.now()) / 1000);
    return {
      isAllowed: false,
      sanitizedMessage: '',
      violations: [`Timeout ativo: aguarde ${remaining}s`],
      severity: 'medium'
    };
  }
  
  // Verificar tamanho
  if (message.length > cfg.maxMessageLength) {
    violations.push(`Mensagem muito longa (máx: ${cfg.maxMessageLength})`);
    message = message.substring(0, cfg.maxMessageLength);
    severity = 'low';
  }
  
  // Sanitizar HTML
  let sanitized = sanitizeHtml(message);
  
  // Normalizar espaços
  sanitized = normalizeWhitespace(sanitized);
  
  // Processar palavras bloqueadas
  const { result: afterWords, found: blockedWords } = censorBlockedWords(sanitized);
  sanitized = afterWords;
  if (blockedWords.length > 0) {
    violations.push('Palavras inadequadas detectadas');
    severity = severity === 'none' ? 'medium' : severity;
  }
  
  // Processar URLs
  const { result: afterUrls, found: hasUrls } = processUrls(sanitized, cfg.blockUrls);
  sanitized = afterUrls;
  if (hasUrls && cfg.blockUrls) {
    violations.push('URLs não permitidas');
    severity = severity === 'none' ? 'low' : severity;
  }
  
  // Processar emails
  const { result: afterEmails, found: hasEmails } = processEmails(sanitized, cfg.blockEmails);
  sanitized = afterEmails;
  if (hasEmails && cfg.blockEmails) {
    violations.push('Emails não permitidos');
    severity = severity === 'none' ? 'low' : severity;
  }
  
  // Processar telefones
  const { result: afterPhones, found: hasPhones } = processPhones(sanitized, cfg.blockPhones);
  sanitized = afterPhones;
  if (hasPhones && cfg.blockPhones) {
    violations.push('Telefones não permitidos');
    severity = severity === 'none' ? 'low' : severity;
  }
  
  // Atualizar warning count se houver violações
  if (violations.length > 0 && userState) {
    const newWarningCount = (userState.warningCount || 0) + 1;
    userModerationStates.set(userId, { ...userState, warningCount: newWarningCount });
    
    // Auto-timeout após 3 warnings
    if (newWarningCount >= 3) {
      userModerationStates.set(userId, {
        ...userState,
        warningCount: 0,
        timeoutUntil: Date.now() + 60000 // 1 minuto de timeout
      });
      return {
        isAllowed: false,
        sanitizedMessage: '',
        violations: ['Timeout automático: muitas violações'],
        severity: 'high'
      };
    }
  }
  
  return {
    isAllowed: sanitized.trim().length > 0,
    sanitizedMessage: sanitized,
    violations,
    severity
  };
}

// ============================================
// FUNÇÕES DE CONTROLE DE MODERAÇÃO
// ============================================

/**
 * Bane um usuário
 */
export function banUser(userId: string, reason: string, durationMs?: number): void {
  userModerationStates.set(userId, {
    isBanned: true,
    banReason: reason,
    banExpiresAt: durationMs ? Date.now() + durationMs : undefined,
    warningCount: 0
  });
  console.log(`[MODERAÇÃO] Usuário ${userId} banido: ${reason}`);
}

/**
 * Desbanir um usuário
 */
export function unbanUser(userId: string): void {
  const state = userModerationStates.get(userId);
  if (state) {
    userModerationStates.set(userId, { ...state, isBanned: false, banReason: undefined });
  }
  console.log(`[MODERAÇÃO] Usuário ${userId} desbanido`);
}

/**
 * Timeout temporário
 */
export function timeoutUser(userId: string, durationMs: number): void {
  const state = userModerationStates.get(userId) || { isBanned: false, warningCount: 0 };
  userModerationStates.set(userId, {
    ...state,
    timeoutUntil: Date.now() + durationMs
  });
  console.log(`[MODERAÇÃO] Timeout de ${durationMs/1000}s para usuário ${userId}`);
}

/**
 * Atualiza configuração de moderação
 */
export function updateModerationConfig(config: Partial<ChatModerationConfig>): void {
  moderationConfig = { ...moderationConfig, ...config };
  console.log('[MODERAÇÃO] Configuração atualizada:', moderationConfig);
}

/**
 * Ativa slow mode baseado em número de viewers
 */
export function checkAutoSlowMode(viewerCount: number): boolean {
  if (viewerCount >= LIVE_5K_CONFIG.CHAT.SLOW_MODE_THRESHOLD_VIEWERS) {
    if (!moderationConfig.slowModeEnabled) {
      moderationConfig.slowModeEnabled = true;
      moderationConfig.slowModeInterval = LIVE_5K_CONFIG.CHAT.SLOW_MODE_INTERVAL;
      console.log(`[MODERAÇÃO] SLOW MODE ATIVADO automaticamente (${viewerCount} viewers)`);
      return true;
    }
  }
  return moderationConfig.slowModeEnabled;
}

/**
 * Obtém intervalo atual de mensagens
 */
export function getCurrentMessageInterval(): number {
  return moderationConfig.slowModeEnabled 
    ? moderationConfig.slowModeInterval 
    : LIVE_5K_CONFIG.CHAT.MIN_MESSAGE_INTERVAL;
}

/**
 * Obtém estado de moderação de um usuário
 */
export function getUserModerationState(userId: string): UserModerationState {
  return userModerationStates.get(userId) || { isBanned: false, warningCount: 0 };
}

/**
 * Limpa estados expirados
 */
export function cleanupExpiredStates(): void {
  const now = Date.now();
  for (const [userId, state] of userModerationStates) {
    let needsUpdate = false;
    const newState = { ...state };
    
    if (state.banExpiresAt && state.banExpiresAt < now) {
      newState.isBanned = false;
      newState.banExpiresAt = undefined;
      needsUpdate = true;
    }
    
    if (state.timeoutUntil && state.timeoutUntil < now) {
      newState.timeoutUntil = undefined;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      userModerationStates.set(userId, newState);
    }
  }
}

// Limpar estados expirados a cada minuto
setInterval(cleanupExpiredStates, 60000);

console.log('[MODERAÇÃO 2300] ⚔️ Sistema de moderação carregado');
