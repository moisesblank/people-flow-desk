// ============================================
// 🔐 MFA GUARD HOOK — 2FA Isolado por Ação
// NÃO TOCA em login/sessão/dispositivo
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Ações que requerem 2FA
export type MFAProtectedAction = 
  | 'change_password'
  | 'change_email'
  | 'register_new_device'
  | 'device_verification'  // 🆕 2FA por dispositivo
  | 'change_subscription'
  | 'access_admin'
  | 'manage_users'
  | 'financial_access'
  | 'delete_account';

export interface MFAGuardState {
  isChecking: boolean;
  needsMFA: boolean;
  isVerified: boolean;
  error: string | null;
  expiresAt: Date | null;
}

export interface MFAGuardResult extends MFAGuardState {
  checkMFA: () => Promise<boolean>;
  requestMFA: () => void;
  onVerificationComplete: (success: boolean) => void;
  resetState: () => void;
}

// P1-2 FIX: OWNER_EMAIL removido - usar role='owner' via useAuth()

/**
 * Hook para gerenciar 2FA por ação sensível
 * TOTALMENTE ISOLADO do fluxo de login
 */
export function useMFAGuard(action: MFAProtectedAction): MFAGuardResult {
  const { user, role } = useAuth();
  
  const [state, setState] = useState<MFAGuardState>({
    isChecking: false,
    needsMFA: false,
    isVerified: false,
    error: null,
    expiresAt: null
  });

  // P1-2 FIX: Owner bypass via role (não email)
  const isOwner = role === 'owner';

  /**
   * Verifica se já existe verificação MFA válida para esta ação
   */
  const checkMFA = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setState(prev => ({ ...prev, error: 'Usuário não autenticado' }));
      return false;
    }

    // Owner bypass (pode ser removido se quiser 2FA para owner também)
    if (isOwner) {
      setState(prev => ({ 
        ...prev, 
        isVerified: true, 
        needsMFA: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }));
      return true;
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const { data, error } = await supabase
        .rpc('check_mfa_valid', {
          _user_id: user.id,
          _action: action
        });

      if (error) {
        console.error('[MFAGuard] Erro ao verificar MFA:', error);
        setState(prev => ({ 
          ...prev, 
          isChecking: false, 
          error: error.message 
        }));
        return false;
      }

      const isValid = data === true;
      
      setState(prev => ({ 
        ...prev, 
        isChecking: false,
        isVerified: isValid,
        needsMFA: !isValid
      }));

      return isValid;
    } catch (err) {
      console.error('[MFAGuard] Erro inesperado:', err);
      setState(prev => ({ 
        ...prev, 
        isChecking: false, 
        error: 'Erro ao verificar 2FA' 
      }));
      return false;
    }
  }, [user?.id, action, isOwner]);

  /**
   * Dispara solicitação de 2FA (abre modal)
   */
  const requestMFA = useCallback(() => {
    setState(prev => ({ ...prev, needsMFA: true, isVerified: false }));
  }, []);

  /**
   * Callback chamado após verificação do código 2FA
   */
  const onVerificationComplete = useCallback(async (success: boolean) => {
    if (!success) {
      setState(prev => ({ 
        ...prev, 
        needsMFA: true, 
        isVerified: false,
        error: 'Código inválido ou expirado'
      }));
      return;
    }

    // Registra verificação no banco
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .rpc('register_mfa_verification', {
            _user_id: user.id,
            _action: action,
            _ip_address: null,
            _device_hash: null
          });

        if (error) {
          console.error('[MFAGuard] Erro ao registrar verificação:', error);
        } else {
          console.log('[MFAGuard] ✅ Verificação registrada:', data);
        }
      } catch (err) {
        console.error('[MFAGuard] Erro ao salvar verificação:', err);
      }
    }

    setState(prev => ({ 
      ...prev, 
      needsMFA: false, 
      isVerified: true,
      error: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }));
  }, [user?.id, action]);

  /**
   * Reseta estado do guard
   */
  const resetState = useCallback(() => {
    setState({
      isChecking: false,
      needsMFA: false,
      isVerified: false,
      error: null,
      expiresAt: null
    });
  }, []);

  // Verifica MFA automaticamente ao montar (se usuário autenticado)
  useEffect(() => {
    if (user?.id) {
      checkMFA();
    }
  }, [user?.id, action]);

  return {
    ...state,
    checkMFA,
    requestMFA,
    onVerificationComplete,
    resetState
  };
}

/**
 * Hook simplificado para verificação rápida
 */
export function useQuickMFACheck(action: MFAProtectedAction) {
  const { isVerified, needsMFA, checkMFA, requestMFA } = useMFAGuard(action);
  
  const executeWithMFA = useCallback(async (callback: () => void | Promise<void>) => {
    const valid = await checkMFA();
    if (valid) {
      await callback();
    } else {
      requestMFA();
    }
  }, [checkMFA, requestMFA]);

  return { isVerified, needsMFA, executeWithMFA };
}
