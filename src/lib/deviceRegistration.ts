// ============================================
// 🛡️ BLOCO 3: VÍNCULO USUÁRIO × APARELHO
// Registro de dispositivo ANTES da sessão
// Fail-closed: bloqueia login se limite excedido
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { collectFingerprintRawData, generateDeviceName } from '@/lib/deviceFingerprintRaw';
import type { DeviceGatePayload } from '@/state/deviceGateStore';

export interface DeviceRegistrationResult {
  success: boolean;
  error?: string;
  deviceId?: string;
  deviceHash?: string;
  isNewDevice?: boolean;
  deviceCount?: number;
  maxDevices?: number;
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
  // Dispositivo atual tentando entrar (para o Gate)
  currentDevice?: {
    device_type: string;
    os_name?: string;
    browser_name?: string;
    label?: string;
  };
  // Payload completo para o Gate
  gatePayload?: DeviceGatePayload;
}

/**
 * 🔐 BLOCO 3: Registrar dispositivo ANTES de criar sessão
 * 
 * REGRAS:
 * - VINCULO_FEITO_ANTES_DA_CRIACAO_DA_SESSAO
 * - APARELHO_JA_REGISTRADO_NAO_INCREMENTA_CONTADOR
 * - NOVO_APARELHO_INCREMENTA_CONTADOR
 * - VINCULO_PERSISTIDO_NO_BACKEND
 * - IMPOSSIVEL_VINCULO_SEM_AUTENTICACAO
 */
export async function registerDeviceBeforeSession(): Promise<DeviceRegistrationResult> {
  try {
    // 🔐 Coletar dados BRUTOS (sem hash)
    const fingerprintData = await collectFingerprintRawData();
    const deviceName = generateDeviceName(fingerprintData);

    console.log('[BLOCO 3] 🔐 Registrando dispositivo ANTES da sessão...', {
      deviceName,
      deviceType: fingerprintData.deviceType,
      browser: fingerprintData.browser,
      os: fingerprintData.os,
    });

    // 🔐 Chamar Edge Function que gera hash no servidor
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
      console.error('[BLOCO 3] ❌ Erro na Edge Function:', error);
      return { success: false, error: error.message };
    }

    // Tratar resposta
    if (!data.success) {
      if (data.error === 'DEVICE_LIMIT_EXCEEDED' || data.code === 'DEVICE_LIMIT_EXCEEDED') {
        console.warn('[BLOCO 3] ⚠️ LIMITE DE DISPOSITIVOS EXCEDIDO:', data.current_devices || data.currentCount);
        
        // 🛡️ Construir payload completo para o DeviceLimitGate
        const gatePayload: DeviceGatePayload = {
          code: 'DEVICE_LIMIT_EXCEEDED',
          message: data.message || 'Você ultrapassou o limite de dispositivos da sua conta',
          max_devices: data.max_devices || data.maxDevices || 3,
          current_devices: data.current_devices || data.currentCount || 3,
          current_device: data.current_device,
          devices: (data.devices || []).map((d: any) => ({
            device_id: d.device_id || d.id,
            label: d.label || d.device_name || `${d.browser || 'Navegador'} • ${d.os || 'Sistema'}`,
            device_type: d.device_type || 'desktop',
            last_seen_at: d.last_seen_at,
            first_seen_at: d.first_seen_at,
            browser: d.browser,
            os: d.os,
            is_recommended_to_disconnect: d.is_recommended_to_disconnect,
          })),
          action_required: data.action_required || 'REVOKE_ONE_DEVICE_TO_CONTINUE',
        };
        
        return {
          success: false,
          error: 'DEVICE_LIMIT_EXCEEDED',
          maxDevices: gatePayload.max_devices,
          deviceCount: gatePayload.current_devices,
          devices: data.devices || [],
          currentDevice: data.current_device,
          gatePayload,
        };
      }

      if (data.error === 'DEVICE_SPOOF_DETECTED') {
        console.error('[BLOCO 3] 🚨 SPOOF DETECTADO:', data.reason);
        return { success: false, error: 'DEVICE_SPOOF_DETECTED' };
      }

      if (data.error === 'INVALID_FINGERPRINT') {
        console.error('[BLOCO 3] ❌ Fingerprint inválido:', data.reason);
        return { success: false, error: 'INVALID_FINGERPRINT' };
      }

      return { success: false, error: data.error };
    }

    // Sucesso
    const isNewDevice = data.status === 'NEW_DEVICE_REGISTERED';
    
    console.log('[BLOCO 3] ✅ Dispositivo vinculado:', {
      deviceId: data.deviceId,
      isNewDevice,
      deviceHash: data.deviceHash?.slice(0, 16) + '...',
    });

    return {
      success: true,
      deviceId: data.deviceId,
      deviceHash: data.deviceHash,
      isNewDevice,
      deviceCount: data.deviceCount,
    };

  } catch (err) {
    console.error('[BLOCO 3] ❌ Erro inesperado:', err);
    return { success: false, error: 'UNEXPECTED_ERROR' };
  }
}

/**
 * Formatar mensagem de erro para o usuário
 */
export function getDeviceErrorMessage(error: string): { title: string; description: string } {
  switch (error) {
    case 'DEVICE_LIMIT_EXCEEDED':
      return {
        title: 'Limite de Dispositivos',
        description: 'Você atingiu o limite de 3 dispositivos. Remova um dispositivo para continuar.',
      };
    case 'DEVICE_SPOOF_DETECTED':
      return {
        title: 'Dispositivo Bloqueado',
        description: 'Este dispositivo foi bloqueado por motivos de segurança.',
      };
    case 'INVALID_FINGERPRINT':
      return {
        title: 'Erro de Identificação',
        description: 'Não foi possível identificar seu dispositivo. Tente novamente.',
      };
    case 'AUTH_REQUIRED':
      return {
        title: 'Autenticação Necessária',
        description: 'Faça login para registrar seu dispositivo.',
      };
    default:
      return {
        title: 'Erro no Registro',
        description: 'Ocorreu um erro ao registrar seu dispositivo. Tente novamente.',
      };
  }
}
