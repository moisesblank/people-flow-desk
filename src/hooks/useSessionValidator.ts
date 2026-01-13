// ============================================
// 🛡️ SESSION VALIDATOR v2.0 — ANTI FALSE-POSITIVE
// Verifica no DB ANTES de mostrar overlay
// Diferencia: NETWORK_ERROR, STALE, TOKEN_MISMATCH, REVOKED_REAL
// ============================================

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SessionCheckReason = 
  | 'VALID'
  | 'TOKEN_MISMATCH'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_REVOKED'
  | 'NETWORK_UNAVAILABLE'
  | 'STALE_SESSION'
  | 'USER_LOGOUT'
  | 'ADMIN_REVOKE'
  | 'DEVICE_REPLACED';

export interface SessionValidationResult {
  isValid: boolean;
  reason: SessionCheckReason;
  canRetry: boolean;
  shouldShowOverlay: boolean;
  revokedAt?: string;
  revokedReason?: string;
}

const SESSION_TOKEN_KEY = 'matriz_session_token';
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Hook para validar sessão com retry e diagnóstico detalhado
 * Só mostra overlay se DB confirmar revogação REAL
 */
export function useSessionValidator() {
  const retryCountRef = useRef(0);
  const lastValidationRef = useRef<number>(0);
  const MIN_VALIDATION_INTERVAL = 5000; // 5s mínimo entre validações

  /**
   * Verifica sessão diretamente no banco de dados
   * Retorna diagnóstico detalhado do estado da sessão
   */
  const checkSessionInDatabase = useCallback(async (
    sessionToken: string
  ): Promise<SessionValidationResult> => {
    try {
      // 1. Verificar se há conexão de rede
      if (!navigator.onLine) {
        return {
          isValid: true, // Assume válido se sem rede
          reason: 'NETWORK_UNAVAILABLE',
          canRetry: true,
          shouldShowOverlay: false,
        };
      }

      // 2. Consultar a sessão no banco
      const { data: session, error } = await supabase
        .from('active_sessions')
        .select('id, status, revoked_at, revoked_reason, last_activity_at, user_id')
        .eq('session_token', sessionToken)
        .maybeSingle();

      // 3. Erro de rede/query
      if (error) {
        console.warn('[SessionValidator] Erro ao verificar sessão:', error.message);
        return {
          isValid: true, // Não bloquear por erro de rede
          reason: 'NETWORK_UNAVAILABLE',
          canRetry: true,
          shouldShowOverlay: false,
        };
      }

      // 4. Sessão não encontrada
      if (!session) {
        // Pode ser: token expirou, foi deletado, ou nunca existiu
        // Tentar recovery antes de mostrar overlay
        return {
          isValid: false,
          reason: 'SESSION_NOT_FOUND',
          canRetry: retryCountRef.current < MAX_RETRY_ATTEMPTS,
          shouldShowOverlay: false, // Não mostrar overlay imediato, tentar recovery
        };
      }

      // 5. Sessão existe mas foi revogada
      if (session.status === 'revoked') {
        const revokedReason = session.revoked_reason || 'unknown';
        
        // Diferenciar tipos de revogação
        if (revokedReason === 'user_logout') {
          return {
            isValid: false,
            reason: 'USER_LOGOUT',
            canRetry: false,
            shouldShowOverlay: false, // Logout manual não mostra overlay
            revokedAt: session.revoked_at,
            revokedReason,
          };
        }

        if (revokedReason === 'admin_revoke' || revokedReason === 'security_threat') {
          return {
            isValid: false,
            reason: 'ADMIN_REVOKE',
            canRetry: false,
            shouldShowOverlay: true, // Revogação admin mostra overlay
            revokedAt: session.revoked_at,
            revokedReason,
          };
        }

        // Revogação por novo dispositivo
        return {
          isValid: false,
          reason: 'DEVICE_REPLACED',
          canRetry: false,
          shouldShowOverlay: true, // Conflito de sessão mostra overlay
          revokedAt: session.revoked_at,
          revokedReason,
        };
      }

      // 6. Sessão ativa e válida
      return {
        isValid: true,
        reason: 'VALID',
        canRetry: false,
        shouldShowOverlay: false,
      };

    } catch (err) {
      console.error('[SessionValidator] Erro inesperado:', err);
      return {
        isValid: true, // Não bloquear por erro inesperado
        reason: 'NETWORK_UNAVAILABLE',
        canRetry: true,
        shouldShowOverlay: false,
      };
    }
  }, []);

  /**
   * Validação completa com retry automático
   */
  const validateSessionWithRetry = useCallback(async (): Promise<SessionValidationResult> => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (!sessionToken) {
      return {
        isValid: false,
        reason: 'SESSION_NOT_FOUND',
        canRetry: false,
        shouldShowOverlay: false, // Sem token = redireciona para login, sem overlay
      };
    }

    // Throttle: evitar validações muito frequentes
    const now = Date.now();
    if (now - lastValidationRef.current < MIN_VALIDATION_INTERVAL) {
      return {
        isValid: true,
        reason: 'VALID',
        canRetry: false,
        shouldShowOverlay: false,
      };
    }
    lastValidationRef.current = now;

    // Primeira tentativa
    let result = await checkSessionInDatabase(sessionToken);

    // Retry se permitido e necessário
    while (result.canRetry && retryCountRef.current < MAX_RETRY_ATTEMPTS) {
      retryCountRef.current++;
      console.log(`[SessionValidator] Retry ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}...`);
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      result = await checkSessionInDatabase(sessionToken);
    }

    // Reset contador após validação bem-sucedida
    if (result.isValid) {
      retryCountRef.current = 0;
    }

    return result;
  }, [checkSessionInDatabase]);

  /**
   * Logar evento de overlay para diagnóstico
   */
  const logOverlayEvent = useCallback(async (
    userId: string | undefined,
    result: SessionValidationResult,
    trigger: string
  ) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'session_overlay_triggered',
        table_name: 'active_sessions',
        metadata: {
          trigger_reason: result.reason,
          should_show_overlay: result.shouldShowOverlay,
          can_retry: result.canRetry,
          revoked_at: result.revokedAt,
          revoked_reason: result.revokedReason,
          trigger_source: trigger,
          network_online: navigator.onLine,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      // Silently fail - não bloquear UI por falha de log
      console.warn('[SessionValidator] Falha ao logar evento:', err);
    }
  }, []);

  /**
   * Força revalidação limpando token e tentando novamente
   */
  const forceRevalidation = useCallback(async (): Promise<SessionValidationResult> => {
    retryCountRef.current = 0;
    lastValidationRef.current = 0;
    return validateSessionWithRetry();
  }, [validateSessionWithRetry]);

  return {
    validateSessionWithRetry,
    checkSessionInDatabase,
    logOverlayEvent,
    forceRevalidation,
    resetRetryCount: () => { retryCountRef.current = 0; },
  };
}
