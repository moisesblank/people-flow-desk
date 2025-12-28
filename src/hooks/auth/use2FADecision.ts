// ============================================
// 🔐 2FA DECISION ENGINE — SYNAPSE Ω v10.x
// Decisão DETERMINÍSTICA de quando solicitar 2FA
// Anti-compartilhamento + Redução de atrito legítimo
// OTIMIZADO: Cache local para reduzir latência
// ============================================

import { supabase } from '@/integrations/supabase/client';

/**
 * Sinais coletados do validate-device
 */
export interface DeviceValidationSignals {
  isNewDevice: boolean;
  countryChanged: boolean;
  rapidChange: boolean;
  riskScore: number;
  deviceHash: string;
}

/**
 * Resultado da decisão de 2FA
 */
export interface TwoFADecisionResult {
  requires2FA: boolean;
  reason: string;
  signals: {
    firstLogin: boolean;
    passwordReset: boolean;
    isNewDevice: boolean;
    countryChanged: boolean;
    highRisk: boolean;
    trustWindowExpired: boolean;
  };
}

/**
 * Opções para a decisão de 2FA
 */
export interface TwoFADecisionOptions {
  userId: string;
  email: string;
  deviceHash: string;
  deviceSignals: DeviceValidationSignals;
  isPasswordReset?: boolean;
}

// ============================================
// CONSTANTES DO ENGINE
// ============================================

const TRUST_WINDOW_HOURS = 24; // 24 horas por dispositivo
const HIGH_RISK_THRESHOLD = 60; // risk_score >= 60 = alto risco
const TRUST_CACHE_KEY = 'mfa_trust_cache';

// ============================================
// CACHE LOCAL — OTIMIZAÇÃO DE LATÊNCIA
// ============================================

interface TrustCacheEntry {
  userId: string;
  deviceHash: string;
  verifiedAt: number; // timestamp em ms
  everVerified: boolean; // indica se já passou por 2FA alguma vez
}

/**
 * Obtém cache de confiança do localStorage
 */
function getTrustCache(): TrustCacheEntry | null {
  try {
    const cached = localStorage.getItem(TRUST_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as TrustCacheEntry;
  } catch {
    return null;
  }
}

/**
 * Salva cache de confiança no localStorage
 */
export function setTrustCache(userId: string, deviceHash: string): void {
  try {
    const entry: TrustCacheEntry = {
      userId,
      deviceHash,
      verifiedAt: Date.now(),
      everVerified: true,
    };
    localStorage.setItem(TRUST_CACHE_KEY, JSON.stringify(entry));
    console.log('[2FA-CACHE] ✅ Trust cache salvo:', { userId, deviceHash });
  } catch (err) {
    console.warn('[2FA-CACHE] Erro ao salvar cache:', err);
  }
}

/**
 * Invalida cache de confiança (para reset de senha, novo dispositivo, etc)
 */
export function invalidateTrustCache(): void {
  try {
    localStorage.removeItem(TRUST_CACHE_KEY);
    console.log('[2FA-CACHE] 🗑️ Trust cache invalidado');
  } catch {
    // Silencioso
  }
}

/**
 * Verifica se o cache é válido para este usuário/dispositivo
 * Retorna: { isTrusted: boolean, everVerified: boolean }
 */
function checkTrustCache(userId: string, deviceHash: string): { 
  isTrusted: boolean; 
  everVerified: boolean;
  hoursSinceVerification: number;
} {
  const cache = getTrustCache();
  
  if (!cache) {
    return { isTrusted: false, everVerified: false, hoursSinceVerification: Infinity };
  }
  
  // Usuário ou dispositivo diferente = cache inválido
  if (cache.userId !== userId || cache.deviceHash !== deviceHash) {
    console.log('[2FA-CACHE] Cache inválido - usuário/dispositivo diferente');
    return { isTrusted: false, everVerified: false, hoursSinceVerification: Infinity };
  }
  
  // Calcular horas desde verificação
  const now = Date.now();
  const hoursSinceVerification = (now - cache.verifiedAt) / (1000 * 60 * 60);
  
  // Dentro da janela de 24h?
  const isTrusted = hoursSinceVerification <= TRUST_WINDOW_HOURS;
  
  console.log('[2FA-CACHE] Cache encontrado:', {
    hoursSinceVerification: hoursSinceVerification.toFixed(2),
    isTrusted,
    everVerified: cache.everVerified,
  });
  
  return { 
    isTrusted, 
    everVerified: cache.everVerified,
    hoursSinceVerification,
  };
}

// ============================================
// FUNÇÃO PRINCIPAL: decide2FA
// ============================================

/**
 * Decide se 2FA é necessário baseado nos sinais do dispositivo
 * 
 * REGRAS (qualquer uma dispara 2FA):
 * 1. first_login == true → Primeiro acesso sempre exige verificação
 * 2. password_reset == true → Reset de senha invalida confiança
 * 3. is_new_device == true → Novo dispositivo = sinal de compartilhamento
 * 4. country_changed == true → Mudança geográfica invalida confiança
 * 5. risk_score >= 60 → Nível de risco elevado
 * 6. last_2fa_at > 24_hours → Revalidação periódica obrigatória
 * 
 * TRUST WINDOW:
 * - Duração: 24 horas por dispositivo
 * - Reset em: new_device, country_change, high_risk, password_reset
 * 
 * OTIMIZAÇÃO:
 * - Cache local para evitar queries redundantes
 * - Fallback para banco se cache inválido
 */
export async function decide2FA(options: TwoFADecisionOptions): Promise<TwoFADecisionResult> {
  const { userId, email, deviceHash, deviceSignals, isPasswordReset = false } = options;

  console.log('[2FA-DECISION] Iniciando decisão para:', { userId, email, deviceHash });
  console.log('[2FA-DECISION] Sinais recebidos:', deviceSignals);

  // ============================================
  // FAST PATH: Verificar cache local primeiro
  // ============================================
  const cacheResult = checkTrustCache(userId, deviceHash);

  // Inicializar sinais
  const signals = {
    firstLogin: false,
    passwordReset: isPasswordReset,
    isNewDevice: deviceSignals.isNewDevice,
    countryChanged: deviceSignals.countryChanged,
    highRisk: deviceSignals.riskScore >= HIGH_RISK_THRESHOLD,
    trustWindowExpired: false,
  };

  // ============================================
  // INVALIDADORES IMEDIATOS (bypass do cache)
  // ============================================
  const hasImmediateInvalidator = 
    signals.passwordReset || 
    signals.isNewDevice || 
    signals.countryChanged || 
    signals.highRisk;

  if (hasImmediateInvalidator) {
    // Invalidar cache por segurança
    invalidateTrustCache();
    console.log('[2FA-DECISION] Invalidador imediato detectado, cache limpo');
  }

  // ============================================
  // REGRA 1: Primeiro login (nunca teve 2FA verificado)
  // OTIMIZAÇÃO: Usar cache se disponível
  // ============================================
  if (cacheResult.everVerified) {
    // Cache indica que já passou por 2FA antes = não é primeiro login
    signals.firstLogin = false;
    console.log('[2FA-DECISION] First login (via cache): false');
  } else {
    // Sem cache ou cache não confirma = verificar no banco
    try {
      const { data: anySession, error: sessionError } = await supabase
        .from('active_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('mfa_verified', true)
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.warn('[2FA-DECISION] Erro ao verificar first_login:', sessionError);
      }

      // Se nunca teve sessão com 2FA verificado = primeiro login
      signals.firstLogin = !anySession;
      console.log('[2FA-DECISION] First login (via banco):', signals.firstLogin);
    } catch (err) {
      console.error('[2FA-DECISION] Erro ao verificar first_login:', err);
      // Em caso de erro, assumir que é primeiro login (segurança)
      signals.firstLogin = true;
    }
  }

  // ============================================
  // REGRA 6: Trust window expirada (last_2fa_at > 24h)
  // OTIMIZAÇÃO: Usar cache se disponível
  // ============================================
  if (!signals.firstLogin && !hasImmediateInvalidator) {
    // FAST PATH: Cache válido dentro da janela
    if (cacheResult.isTrusted) {
      signals.trustWindowExpired = false;
      console.log('[2FA-DECISION] Trust window OK (via cache)');
    } else if (cacheResult.everVerified && cacheResult.hoursSinceVerification > TRUST_WINDOW_HOURS) {
      // Cache existe mas expirou
      signals.trustWindowExpired = true;
      console.log('[2FA-DECISION] Trust window expirada (via cache):', cacheResult.hoursSinceVerification.toFixed(2), 'horas');
    } else {
      // Sem cache confiável = verificar no banco
      try {
        const { data: lastSession, error: lastError } = await supabase
          .from('active_sessions')
          .select('last_activity_at, mfa_verified')
          .eq('user_id', userId)
          .eq('device_hash', deviceHash)
          .eq('mfa_verified', true)
          .eq('status', 'active')
          .order('last_activity_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastError) {
          console.warn('[2FA-DECISION] Erro ao verificar trust window:', lastError);
        }

        if (lastSession?.last_activity_at) {
          const lastVerified = new Date(lastSession.last_activity_at);
          const now = new Date();
          const hoursSinceVerification = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60);
          
          signals.trustWindowExpired = hoursSinceVerification > TRUST_WINDOW_HOURS;
          console.log('[2FA-DECISION] Horas desde última verificação (via banco):', hoursSinceVerification.toFixed(2));
          console.log('[2FA-DECISION] Trust window expirada:', signals.trustWindowExpired);
        } else {
          // Sem sessão prévia para este dispositivo = trust window "expirada"
          signals.trustWindowExpired = true;
          console.log('[2FA-DECISION] Sem sessão prévia para este dispositivo');
        }
      } catch (err) {
        console.error('[2FA-DECISION] Erro ao verificar trust window:', err);
        // Em caso de erro, considerar expirada (segurança)
        signals.trustWindowExpired = true;
      }
    }
  }

  // ============================================
  // DECISÃO FINAL
  // ============================================

  // Qualquer sinal ativo = requer 2FA
  const requires2FA = 
    signals.firstLogin ||
    signals.passwordReset ||
    signals.isNewDevice ||
    signals.countryChanged ||
    signals.highRisk ||
    signals.trustWindowExpired;

  // Determinar razão principal (prioridade)
  let reason = 'Dispositivo confiável';
  if (signals.firstLogin) {
    reason = 'Primeiro acesso - verificação obrigatória';
  } else if (signals.passwordReset) {
    reason = 'Reset de senha - revalidação obrigatória';
  } else if (signals.isNewDevice) {
    reason = 'Novo dispositivo detectado';
  } else if (signals.countryChanged) {
    reason = 'Mudança de localização detectada';
  } else if (signals.highRisk) {
    reason = `Risco elevado (score: ${deviceSignals.riskScore})`;
  } else if (signals.trustWindowExpired) {
    reason = 'Revalidação periódica (24h)';
  }

  console.log('[2FA-DECISION] ===== DECISÃO FINAL =====');
  console.log('[2FA-DECISION] Requer 2FA:', requires2FA);
  console.log('[2FA-DECISION] Razão:', reason);
  console.log('[2FA-DECISION] Sinais:', signals);

  return {
    requires2FA,
    reason,
    signals,
  };
}

/**
 * Hook wrapper para uso em componentes React
 */
export function use2FADecision() {
  return {
    decide2FA,
    setTrustCache,
    invalidateTrustCache,
    TRUST_WINDOW_HOURS,
    HIGH_RISK_THRESHOLD,
  };
}
