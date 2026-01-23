// ============================================
// 🛡️ Ω3: SANCTUM THREAT SCORE OMEGA v2.0
// SISTEMA DE PONTUAÇÃO DE AMEAÇAS GRADUAL
// ============================================
// RESPOSTA GRADUAL:
// L1 (10-29): Aviso + Log
// L2 (30-49): Blur + Oculta + Log  
// L3 (50-79): Logout + Cooldown 10min
// L4 (80+): Bloqueio 24h (owner pode reverter)
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// CONSTANTES
// ============================================

export const THREAT_THRESHOLDS = {
  L1_WARNING: 10,
  L2_BLUR: 30,
  L3_LOGOUT: 50,
  L4_BLOCK: 80,
  MAX_SCORE: 100,
} as const;

export const THREAT_DECAY_RATE = 1; // pontos por minuto
export const COOLDOWN_MINUTES = 10;
export const BLOCK_HOURS = 24;

// ============================================
// TIPOS
// ============================================

export type ThreatLevel = 'none' | 'L1_warning' | 'L2_blur' | 'L3_logout' | 'L4_block';

export interface ThreatEvent {
  type: string;
  severity: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ThreatState {
  score: number;
  level: ThreatLevel;
  events: ThreatEvent[];
  lastDecay: number;
  cooldownUntil?: number;
  blockedUntil?: number;
}

export interface ThreatResponse {
  action: 'none' | 'warn' | 'blur' | 'logout' | 'block';
  message?: string;
  shouldLogout: boolean;
  shouldBlur: boolean;
}

// ============================================
// SEVERIDADES DE EVENTOS
// ============================================

export const EVENT_SEVERITIES: Record<string, number> = {
  // Detecção de DevTools (alta prioridade)
  devtools_open: 15,
  devtools_shortcut: 10,
  debugger_detected: 20,
  
  // Tentativas de cópia/captura
  copy_attempt: 5,
  paste_attempt: 3,
  cut_attempt: 5,
  print_attempt: 15,
  screenshot_attempt: 20,
  print_screen: 15,
  
  // Manipulação de DOM
  dom_mutation: 8,
  element_removal: 10,
  watermark_tamper: 25,
  
  // Automação/Bot
  // ⚠️ DESATIVADO 2026-01-22: automation_detected causava falsos positivos no fluxo de 2FA
  bot_like_behavior: 12,
  impossible_speed: 15,
  automation_detected: 0, // Desativado - era 20
  
  // Violações de sessão
  multiple_tabs: 5,
  session_hijack: 30,
  fingerprint_mismatch: 25,
  
  // Contexto suspeito
  context_menu: 2,
  drag_attempt: 3,
  selection_attempt: 2,
  
  // Rede
  request_flood: 10,
  replay_attack: 25,
};

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Calcula o nível de ameaça baseado no score
 */
export function calculateThreatLevel(score: number): ThreatLevel {
  if (score >= THREAT_THRESHOLDS.L4_BLOCK) return 'L4_block';
  if (score >= THREAT_THRESHOLDS.L3_LOGOUT) return 'L3_logout';
  if (score >= THREAT_THRESHOLDS.L2_BLUR) return 'L2_blur';
  if (score >= THREAT_THRESHOLDS.L1_WARNING) return 'L1_warning';
  return 'none';
}

/**
 * Determina a resposta apropriada para o nível de ameaça
 */
export function getThreatResponse(level: ThreatLevel): ThreatResponse {
  switch (level) {
    case 'L4_block':
      return {
        action: 'block',
        message: 'Atividade maliciosa detectada. Acesso bloqueado por 24 horas.',
        shouldLogout: true,
        shouldBlur: true,
      };
    case 'L3_logout':
      return {
        action: 'logout',
        message: 'Atividade suspeita detectada. Sessão encerrada. Aguarde 10 minutos.',
        shouldLogout: true,
        shouldBlur: true,
      };
    case 'L2_blur':
      return {
        action: 'blur',
        message: 'Comportamento incomum detectado. Conteúdo temporariamente oculto.',
        shouldLogout: false,
        shouldBlur: true,
      };
    case 'L1_warning':
      return {
        action: 'warn',
        message: 'Ação não permitida detectada.',
        shouldLogout: false,
        shouldBlur: false,
      };
    default:
      return {
        action: 'none',
        shouldLogout: false,
        shouldBlur: false,
      };
  }
}

/**
 * Aplica decay ao score baseado no tempo
 */
export function applyScoreDecay(state: ThreatState): ThreatState {
  const now = Date.now();
  const minutesPassed = (now - state.lastDecay) / 60000;
  const decayAmount = Math.floor(minutesPassed * THREAT_DECAY_RATE);
  
  if (decayAmount > 0) {
    const newScore = Math.max(0, state.score - decayAmount);
    return {
      ...state,
      score: newScore,
      level: calculateThreatLevel(newScore),
      lastDecay: now,
    };
  }
  
  return state;
}

/**
 * Registra um evento de ameaça e retorna o novo estado
 */
export function recordThreatEvent(
  state: ThreatState,
  eventType: string,
  metadata?: Record<string, unknown>
): ThreatState {
  const severity = EVENT_SEVERITIES[eventType] || 5;
  const now = Date.now();
  
  // Aplicar decay primeiro
  const decayedState = applyScoreDecay(state);
  
  // Adicionar evento
  const newEvent: ThreatEvent = {
    type: eventType,
    severity,
    timestamp: now,
    metadata,
  };
  
  // Calcular novo score (máximo 100)
  const newScore = Math.min(
    THREAT_THRESHOLDS.MAX_SCORE,
    decayedState.score + severity
  );
  
  // Manter apenas últimos 50 eventos
  const events = [...decayedState.events, newEvent].slice(-50);
  
  return {
    score: newScore,
    level: calculateThreatLevel(newScore),
    events,
    lastDecay: now,
    cooldownUntil: decayedState.cooldownUntil,
    blockedUntil: decayedState.blockedUntil,
  };
}

/**
 * Verifica se o usuário está em cooldown ou bloqueado
 */
export function checkAccessStatus(state: ThreatState): {
  canAccess: boolean;
  reason?: string;
  remainingTime?: number;
} {
  const now = Date.now();
  
  if (state.blockedUntil && now < state.blockedUntil) {
    return {
      canAccess: false,
      reason: 'blocked',
      remainingTime: Math.ceil((state.blockedUntil - now) / 60000),
    };
  }
  
  if (state.cooldownUntil && now < state.cooldownUntil) {
    return {
      canAccess: false,
      reason: 'cooldown',
      remainingTime: Math.ceil((state.cooldownUntil - now) / 60000),
    };
  }
  
  return { canAccess: true };
}

/**
 * Aplica penalidade de cooldown ou bloqueio
 */
export function applyPenalty(state: ThreatState, level: ThreatLevel): ThreatState {
  const now = Date.now();
  
  if (level === 'L4_block') {
    return {
      ...state,
      blockedUntil: now + (BLOCK_HOURS * 60 * 60 * 1000),
    };
  }
  
  if (level === 'L3_logout') {
    return {
      ...state,
      cooldownUntil: now + (COOLDOWN_MINUTES * 60 * 1000),
    };
  }
  
  return state;
}

// ============================================
// LOGGING NO BANCO
// ============================================

/**
 * Loga evento de ameaça no banco de dados
 */
export async function logThreatEvent(
  userId: string | undefined,
  userEmail: string | undefined,
  eventType: string,
  severity: number,
  threatScore: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('security_events').insert({
      event_type: `threat_${eventType}`,
      severity: severity >= 15 ? 'error' : severity >= 10 ? 'warn' : 'info',
      source: 'sanctum_threat_score',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      payload: {
        userId,
        userEmail,
        eventType,
        eventSeverity: severity,
        threatScore,
        level: calculateThreatLevel(threatScore),
        metadata,
      },
    } as any);
  } catch (err) {
    console.error('[THREAT-SCORE] Erro ao logar:', err);
  }
}

/**
 * Loga penalidade aplicada
 */
export async function logPenalty(
  userId: string | undefined,
  userEmail: string | undefined,
  level: ThreatLevel,
  threatScore: number
): Promise<void> {
  try {
    await supabase.from('security_events').insert({
      event_type: `penalty_${level}`,
      severity: 'error',
      source: 'sanctum_threat_score',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      payload: {
        userId,
        userEmail,
        level,
        threatScore,
        penaltyApplied: level === 'L4_block' ? `${BLOCK_HOURS}h block` : `${COOLDOWN_MINUTES}min cooldown`,
      },
    } as any);
  } catch (err) {
    console.error('[THREAT-SCORE] Erro ao logar penalidade:', err);
  }
}

// ============================================
// ESTADO INICIAL
// ============================================

export function createInitialThreatState(): ThreatState {
  return {
    score: 0,
    level: 'none',
    events: [],
    lastDecay: Date.now(),
  };
}

// ============================================
// EXPORTS
// ============================================

export const SANCTUM_THREAT_VERSION = '2.0.0';
