// ============================================
// 🔐 2FA DECISION ENGINE — SYNAPSE Ω v10.x
// Decisão DETERMINÍSTICA de quando solicitar 2FA
// Anti-compartilhamento + Redução de atrito legítimo
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
 */
export async function decide2FA(options: TwoFADecisionOptions): Promise<TwoFADecisionResult> {
  const { userId, email, deviceHash, deviceSignals, isPasswordReset = false } = options;

  console.log('[2FA-DECISION] Iniciando decisão para:', { userId, email, deviceHash });
  console.log('[2FA-DECISION] Sinais recebidos:', deviceSignals);

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
  // REGRA 1: Primeiro login (nunca teve 2FA verificado)
  // ============================================
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
    console.log('[2FA-DECISION] First login:', signals.firstLogin);
  } catch (err) {
    console.error('[2FA-DECISION] Erro ao verificar first_login:', err);
    // Em caso de erro, assumir que é primeiro login (segurança)
    signals.firstLogin = true;
  }

  // ============================================
  // REGRA 6: Trust window expirada (last_2fa_at > 24h)
  // Verificar última verificação 2FA para este dispositivo específico
  // ============================================
  if (!signals.firstLogin && !signals.passwordReset && !signals.isNewDevice && 
      !signals.countryChanged && !signals.highRisk) {
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
        console.log('[2FA-DECISION] Horas desde última verificação:', hoursSinceVerification.toFixed(2));
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
    TRUST_WINDOW_HOURS,
    HIGH_RISK_THRESHOLD,
  };
}
