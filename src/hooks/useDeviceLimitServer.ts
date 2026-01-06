// ============================================
// 🔓 useDeviceLimitServer — DESATIVADO
// Limite de dispositivos REMOVIDO
// Retorna sucesso sempre sem verificações
// ============================================

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Device {
  id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  last_seen_at: string;
  first_seen_at?: string;
  is_active?: boolean;
  is_current?: boolean;
}

export interface DeviceLimitResult {
  success: boolean;
  error?: string;
  devices?: Device[];
  message?: string;
  deviceHash?: string;
  deviceId?: string;
}

/**
 * DESATIVADO: Retorna sucesso sempre
 * Nenhuma verificação de limite de dispositivos
 */
export function useDeviceLimitServer() {
  const { user } = useAuth();

  const [state] = useState({
    isChecking: false,
    deviceLimitExceeded: false,
    devices: [] as Device[],
    currentDeviceId: null as string | null,
    currentDeviceHash: null as string | null,
    maxDevices: 999, // Sem limite
    isOwner: true, // Bypass total
  });

  // DESATIVADO: Sempre retorna sucesso
  const checkAndRegisterDevice = useCallback(async (): Promise<DeviceLimitResult> => {
    console.log('[useDeviceLimitServer] 🔓 DESATIVADO - bypass total');
    return { 
      success: true, 
      message: 'Device limit checking disabled',
      deviceHash: crypto.randomUUID(),
      deviceId: crypto.randomUUID(),
    };
  }, []);

  // DESATIVADO: Sempre retorna true
  const deactivateDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    console.log('[useDeviceLimitServer] 🔓 deactivateDevice DESATIVADO');
    return true;
  }, []);

  // DESATIVADO: Retorna lista vazia
  const fetchUserDevices = useCallback(async (): Promise<Device[]> => {
    console.log('[useDeviceLimitServer] 🔓 fetchUserDevices DESATIVADO');
    return [];
  }, []);

  // DESATIVADO: Sem efeito
  const clearLimitExceeded = useCallback(() => {
    console.log('[useDeviceLimitServer] 🔓 clearLimitExceeded DESATIVADO');
  }, []);

  return {
    ...state,
    checkAndRegisterDevice,
    deactivateDevice,
    fetchUserDevices,
    clearLimitExceeded,
  };
}
