// ============================================
// 🔓 deviceRegistration — DESATIVADO
// Registro de dispositivos REMOVIDO
// Retorna sucesso sempre
// ============================================

import type { DeviceGatePayload } from '@/state/deviceGateStore';
import type { SameTypeReplacementPayload } from '@/state/sameTypeReplacementStore';

export interface DeviceNotice {
  level: 'INFO' | 'WARNING' | 'HARD_WARNING' | null;
  message: string | null;
}

export interface DeviceRegistrationResult {
  success: boolean;
  error?: string;
  deviceId?: string;
  deviceHash?: string;
  isNewDevice?: boolean;
  deviceCount?: number;
  maxDevices?: number;
  notice?: DeviceNotice;
  devices?: Array<{
    id?: string;
    device_id?: string;
    device_name?: string;
    label?: string;
    device_type: string;
    browser?: string;
    os?: string;
    last_seen_at: string;
    first_seen_at?: string;
    is_recommended_to_disconnect?: boolean;
  }>;
  currentDevice?: {
    device_type: string;
    os_name?: string;
    browser_name?: string;
    label?: string;
  };
  gatePayload?: DeviceGatePayload;
  sameTypePayload?: SameTypeReplacementPayload;
}

/**
 * DESATIVADO: Retorna sucesso sempre
 * Nenhum registro de dispositivo
 */
export async function registerDeviceBeforeSession(): Promise<DeviceRegistrationResult> {
  console.log('[deviceRegistration] 🔓 DESATIVADO - bypass total');
  
  return {
    success: true,
    deviceId: crypto.randomUUID(),
    deviceHash: crypto.randomUUID(),
    isNewDevice: false,
    deviceCount: 1,
    maxDevices: 999,
  };
}

/**
 * DESATIVADO: Retorna mensagem genérica
 */
export function getDeviceErrorMessage(error: string): { title: string; description: string } {
  return {
    title: 'Dispositivo não verificado',
    description: 'Verificação de dispositivo desativada.',
  };
}
