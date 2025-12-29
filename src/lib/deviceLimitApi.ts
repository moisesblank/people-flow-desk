// ============================================
// 🛡️ DEVICE LIMIT API
// Chamadas para Edge Functions de controle de dispositivos
// BLOCO 2: Backend Contratos e Funções
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { DeviceGatePayload, DeviceInfo, CurrentDeviceInfo } from '@/state/deviceGateStore';
import { collectFingerprintRawData, generateDeviceName } from '@/lib/deviceFingerprintRaw';

// ============================================
// TIPOS
// ============================================

export interface ListDevicesResult {
  success: boolean;
  devices: DeviceInfo[];
  error?: string;
}

export interface RevokeDeviceResult {
  success: boolean;
  error?: string;
  devices?: DeviceInfo[];
}

export interface RegisterDeviceResult {
  success: boolean;
  error?: string;
  deviceId?: string;
  deviceHash?: string;
  isNewDevice?: boolean;
  deviceCount?: number;
  // Payload para o gate
  gatePayload?: DeviceGatePayload;
}

// ============================================
// FUNÇÕES DE API
// ============================================

/**
 * Listar dispositivos do usuário autenticado
 */
export async function listUserDevices(): Promise<ListDevicesResult> {
  try {
    const { data, error } = await supabase.functions.invoke('revoke-device', {
      body: { action: 'list' },
    });

    if (error) {
      console.error('[DeviceLimitAPI] Erro ao listar dispositivos:', error);
      return { success: false, devices: [], error: error.message };
    }

    if (!data.success) {
      return { success: false, devices: [], error: data.error };
    }

    // Mapear para o formato esperado
    const devices: DeviceInfo[] = (data.devices || []).map((d: any, index: number) => ({
      device_id: d.id,
      label: d.device_name || `${d.os || 'Sistema'} • ${d.browser || 'Navegador'}`,
      device_type: d.device_type || 'desktop',
      os_name: d.os || 'Desconhecido',
      browser_name: d.browser || 'Desconhecido',
      last_seen_at: d.last_seen_at,
      first_seen_at: d.first_seen_at || d.created_at,
      // Recomendar desconectar o mais antigo (último da lista ordenada por last_seen DESC)
      is_recommended_to_disconnect: index === (data.devices?.length || 1) - 1,
    }));

    return { success: true, devices };
  } catch (err) {
    console.error('[DeviceLimitAPI] Erro inesperado:', err);
    return { success: false, devices: [], error: 'Erro ao buscar dispositivos' };
  }
}

/**
 * Revogar dispositivo específico
 */
export async function revokeUserDevice(
  deviceId: string, 
  reason: string = 'user_removed_to_add_new_device'
): Promise<RevokeDeviceResult> {
  try {
    console.log('[DeviceLimitAPI] 🔐 Revogando dispositivo:', deviceId);

    const { data, error } = await supabase.functions.invoke('revoke-device', {
      body: { deviceId, reason },
    });

    if (error) {
      console.error('[DeviceLimitAPI] Erro ao revogar:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      console.error('[DeviceLimitAPI] Falha na revogação:', data.error);
      return { success: false, error: data.error };
    }

    console.log('[DeviceLimitAPI] ✅ Dispositivo revogado com sucesso');
    return { success: true };
  } catch (err) {
    console.error('[DeviceLimitAPI] Erro inesperado:', err);
    return { success: false, error: 'Erro ao revogar dispositivo' };
  }
}

/**
 * Registrar dispositivo atual (retry após revogar)
 */
export async function registerCurrentDevice(): Promise<RegisterDeviceResult> {
  try {
    console.log('[DeviceLimitAPI] 🔐 Registrando dispositivo atual...');

    // Coletar fingerprint
    const fingerprintData = await collectFingerprintRawData();
    const deviceName = generateDeviceName(fingerprintData);

    const { data, error } = await supabase.functions.invoke('register-device-server', {
      body: {
        fingerprintData,
        deviceName,
        deviceType: fingerprintData.deviceType,
        browser: fingerprintData.browser,
        os: fingerprintData.os,
      },
    });

    if (error) {
      console.error('[DeviceLimitAPI] Erro na Edge Function:', error);
      return { success: false, error: error.message };
    }

    // Verificar se ainda há limite excedido
    if (!data.success && data.error === 'DEVICE_LIMIT_EXCEEDED') {
      console.warn('[DeviceLimitAPI] ⚠️ Limite ainda excedido');
      
      // Construir payload para o gate
      const currentDevice: CurrentDeviceInfo = {
        device_type: fingerprintData.deviceType,
        os_name: fingerprintData.os,
        browser_name: fingerprintData.browser,
        label: deviceName,
      };

      const devices: DeviceInfo[] = (data.devices || []).map((d: any, index: number) => ({
        device_id: d.id,
        label: d.device_name || `${d.os || 'Sistema'} • ${d.browser || 'Navegador'}`,
        device_type: d.device_type || 'desktop',
        os_name: d.os || 'Desconhecido',
        browser_name: d.browser || 'Desconhecido',
        last_seen_at: d.last_seen_at,
        first_seen_at: d.first_seen_at || d.last_seen_at,
        is_recommended_to_disconnect: index === (data.devices?.length || 1) - 1,
      }));

      const gatePayload: DeviceGatePayload = {
        code: 'DEVICE_LIMIT_EXCEEDED',
        message: 'Você ultrapassou o limite de dispositivos da sua conta',
        max_devices: data.maxDevices || 3,
        current_devices: data.currentCount || 3,
        current_device: currentDevice,
        devices,
        action_required: 'REVOKE_ONE_DEVICE_TO_CONTINUE',
      };

      return { 
        success: false, 
        error: 'DEVICE_LIMIT_EXCEEDED',
        gatePayload,
      };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    console.log('[DeviceLimitAPI] ✅ Dispositivo registrado:', data.deviceId);
    return {
      success: true,
      deviceId: data.deviceId,
      deviceHash: data.deviceHash,
      isNewDevice: data.status === 'NEW_DEVICE_REGISTERED',
      deviceCount: data.deviceCount,
    };
  } catch (err) {
    console.error('[DeviceLimitAPI] Erro inesperado:', err);
    return { success: false, error: 'Erro ao registrar dispositivo' };
  }
}

/**
 * Fluxo completo: revogar + registrar
 */
export async function revokeAndRegister(deviceIdToRevoke: string): Promise<RegisterDeviceResult> {
  // 1. Revogar dispositivo selecionado
  const revokeResult = await revokeUserDevice(deviceIdToRevoke);
  
  if (!revokeResult.success) {
    return { success: false, error: revokeResult.error || 'Falha ao revogar dispositivo' };
  }

  // 2. Registrar dispositivo atual
  return await registerCurrentDevice();
}

/**
 * Security Lockdown - Revogar TUDO
 */
export async function triggerSecurityLockdown(): Promise<{ success: boolean; error?: string; devicesRevoked?: number; sessionsRevoked?: number }> {
  try {
    console.log('[DeviceLimitAPI] 🚨 SECURITY LOCKDOWN - Revogando tudo...');

    // 🔐 BLOCO 2: Chamar backend para lockdown atômico
    const { data, error } = await supabase.functions.invoke('revoke-device', {
      body: { action: 'security_lockdown' },
    });

    if (error) {
      console.error('[DeviceLimitAPI] Erro no lockdown:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    console.log('[DeviceLimitAPI] ✅ Security Lockdown completo:', data);
    return { 
      success: true, 
      devicesRevoked: data.devicesRevoked,
      sessionsRevoked: data.sessionsRevoked,
    };
  } catch (err) {
    console.error('[DeviceLimitAPI] Erro no lockdown:', err);
    return { success: false, error: 'Erro ao executar lockdown' };
  }
}
