// ============================================
// 🔓 useDeviceMFAGuard — DESATIVADO
// 2FA por dispositivo REMOVIDO
// Retorna isVerified=true sempre
// ============================================

import { useState, useCallback } from "react";

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

/**
 * DESATIVADO: Retorna isVerified=true sempre
 * Nenhuma verificação de MFA por dispositivo
 */
export function useDeviceMFAGuard(): DeviceMFAGuardResult {
  const [state] = useState<DeviceMFAGuardState>({
    isChecking: false,
    needsMFA: false,
    isVerified: true, // Sempre verificado
    error: null,
    deviceHash: null,
    expiresAt: null,
  });

  const checkDeviceMFA = useCallback(async (): Promise<boolean> => {
    console.log('[useDeviceMFAGuard] 🔓 DESATIVADO - bypass total');
    return true;
  }, []);

  const onVerificationComplete = useCallback((success: boolean) => {
    console.log('[useDeviceMFAGuard] 🔓 onVerificationComplete DESATIVADO');
  }, []);

  const resetState = useCallback(() => {
    console.log('[useDeviceMFAGuard] 🔓 resetState DESATIVADO');
  }, []);

  return {
    ...state,
    checkDeviceMFA,
    onVerificationComplete,
    resetState,
  };
}
