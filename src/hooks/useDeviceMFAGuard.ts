// ============================================
// 🔐 DEVICE MFA GUARD HOOK — 2FA por Dispositivo
// Verifica se o dispositivo atual tem verificação válida (24h)
// NÃO TOCA em login/sessão/dispositivo
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';

export interface DeviceMFAGuardState {
  isChecking: boolean;
  needsMFA: boolean;
  isVerified: boolean;
  error: string | null;
  deviceHash: string | null;
  expiresAt: Date | null;
}

export interface DeviceMFAGuardResult extends DeviceMFAGuardState {
  checkDeviceMFA: () => Promise<boolean>;
  onVerificationComplete: (success: boolean) => void;
  resetState: () => void;
}

const OWNER_EMAIL = 'moisesblank@gmail.com';

/**
 * Hook para gerenciar 2FA por DISPOSITIVO
 * Cada dispositivo diferente precisa verificar 2FA separadamente
 * Cache de 24 horas por dispositivo
 */
export function useDeviceMFAGuard(): DeviceMFAGuardResult {
  const { user } = useAuth();
  const hasChecked = useRef(false);
  
  const [state, setState] = useState<DeviceMFAGuardState>({
    isChecking: true, // Começa verificando
    needsMFA: false,
    isVerified: false,
    error: null,
    deviceHash: null,
    expiresAt: null
  });

  // Owner tem bypass total
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  /**
   * Verifica se o dispositivo atual tem verificação MFA válida
   */
  const checkDeviceMFA = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setState(prev => ({ ...prev, isChecking: false, error: 'Usuário não autenticado' }));
      return false;
    }

    // Owner bypass
    if (isOwner) {
      setState(prev => ({ 
        ...prev, 
        isChecking: false,
        isVerified: true, 
        needsMFA: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }));
      return true;
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      // Gerar fingerprint do dispositivo atual
      const deviceHash = await generateDeviceFingerprint();
      
      setState(prev => ({ ...prev, deviceHash }));

      // Verificar no banco se este dispositivo tem MFA válido
      const { data, error } = await supabase
        .rpc('check_device_mfa_valid', {
          _user_id: user.id,
          _device_hash: deviceHash
        });

      if (error) {
        console.error('[DeviceMFAGuard] Erro ao verificar:', error);
        setState(prev => ({ 
          ...prev, 
          isChecking: false, 
          error: error.message 
        }));
        return false;
      }

      const isValid = data === true;
      
      console.log(`[DeviceMFAGuard] Dispositivo ${deviceHash.slice(0, 8)}... válido: ${isValid}`);
      
      setState(prev => ({ 
        ...prev, 
        isChecking: false,
        isVerified: isValid,
        needsMFA: !isValid
      }));

      return isValid;
    } catch (err) {
      console.error('[DeviceMFAGuard] Erro inesperado:', err);
      setState(prev => ({ 
        ...prev, 
        isChecking: false, 
        error: 'Erro ao verificar dispositivo' 
      }));
      return false;
    }
  }, [user?.id, isOwner]);

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

    // Registra verificação no banco para ESTE dispositivo
    if (user?.id && state.deviceHash) {
      try {
        const { data, error } = await supabase
          .rpc('register_device_mfa_verification', {
            _user_id: user.id,
            _device_hash: state.deviceHash,
            _ip_address: null
          });

        if (error) {
          console.error('[DeviceMFAGuard] Erro ao registrar verificação:', error);
        } else {
          console.log('[DeviceMFAGuard] ✅ Dispositivo verificado por 24h:', data);
        }
      } catch (err) {
        console.error('[DeviceMFAGuard] Erro ao salvar verificação:', err);
      }
    }

    setState(prev => ({ 
      ...prev, 
      needsMFA: false, 
      isVerified: true,
      error: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }));
  }, [user?.id, state.deviceHash]);

  /**
   * Reseta estado do guard
   */
  const resetState = useCallback(() => {
    hasChecked.current = false;
    setState({
      isChecking: true,
      needsMFA: false,
      isVerified: false,
      error: null,
      deviceHash: null,
      expiresAt: null
    });
  }, []);

  // Verifica automaticamente ao montar (apenas uma vez)
  useEffect(() => {
    // Se não há usuário, bypass imediato (não precisa verificar dispositivo)
    if (!user?.id) {
      setState(prev => ({ 
        ...prev, 
        isChecking: false, 
        isVerified: true, // Bypass para páginas públicas
        needsMFA: false 
      }));
      return;
    }

    // Owner bypass
    if (isOwner) {
      setState(prev => ({ 
        ...prev, 
        isChecking: false,
        isVerified: true, 
        needsMFA: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }));
      return;
    }

    // Verificar apenas uma vez
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkDeviceMFA();
    }
  }, [user?.id, isOwner, checkDeviceMFA]);

  return {
    ...state,
    checkDeviceMFA,
    onVerificationComplete,
    resetState
  };
}
