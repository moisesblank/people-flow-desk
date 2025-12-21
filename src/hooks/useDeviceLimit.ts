// ============================================
// 🛡️ DOGMA XI: Hook de Controle de Dispositivos
// Máximo 3 dispositivos (exceto owner)
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { generateDeviceFingerprint, generateDeviceName, detectDeviceType } from '@/lib/deviceFingerprint';

export interface Device {
  id: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  last_seen_at: string;
  first_seen_at?: string;
  is_active?: boolean;
}

interface DeviceLimitState {
  isChecking: boolean;
  deviceLimitExceeded: boolean;
  devices: Device[];
  currentDeviceId: string | null;
  maxDevices: number;
}

export function useDeviceLimit() {
  const { user } = useAuth();
  const [state, setState] = useState<DeviceLimitState>({
    isChecking: true,
    deviceLimitExceeded: false,
    devices: [],
    currentDeviceId: null,
    maxDevices: 3,
  });

  // Verificar/registrar dispositivo no login
  const checkAndRegisterDevice = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
    devices?: Device[];
  }> => {
    if (!user) return { success: false, error: 'NOT_AUTHENTICATED' };

    try {
      setState(prev => ({ ...prev, isChecking: true }));
      
      const fingerprint = await generateDeviceFingerprint();
      const deviceName = generateDeviceName();
      const deviceType = detectDeviceType();
      
      const ua = navigator.userAgent;
      let browser = 'unknown';
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edg')) browser = 'Edge';
      else if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Safari')) browser = 'Safari';
      
      let os = 'unknown';
      if (ua.includes('Windows')) os = 'Windows';
      else if (ua.includes('Mac')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iOS')) os = 'iOS';

      const { data, error } = await supabase.rpc('register_device_with_limit', {
        p_device_fingerprint: fingerprint,
        p_device_name: deviceName,
        p_device_type: deviceType,
        p_browser: browser,
        p_os: os,
      });

      if (error) {
        console.error('[DOGMA XI] Erro ao registrar dispositivo:', error);
        setState(prev => ({ ...prev, isChecking: false }));
        return { success: false, error: error.message };
      }

      const result = data as any;
      
      if (result.error === 'DEVICE_LIMIT_EXCEEDED') {
        setState({
          isChecking: false,
          deviceLimitExceeded: true,
          devices: result.devices || [],
          currentDeviceId: null,
          maxDevices: result.max_devices || 3,
        });
        return { success: false, error: 'DEVICE_LIMIT_EXCEEDED', devices: result.devices };
      }

      setState({
        isChecking: false,
        deviceLimitExceeded: false,
        devices: [],
        currentDeviceId: result.device_id || null,
        maxDevices: 3,
      });
      
      console.log('[DOGMA XI] ✅ Dispositivo verificado:', result.status);
      return { success: true };
    } catch (err) {
      console.error('[DOGMA XI] Erro:', err);
      setState(prev => ({ ...prev, isChecking: false }));
      return { success: false, error: 'UNKNOWN_ERROR' };
    }
  }, [user]);

  // Desativar um dispositivo
  const deactivateDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('deactivate_device', {
        p_device_id: deviceId,
      });

      if (error) {
        console.error('[DOGMA XI] Erro ao desativar dispositivo:', error);
        return false;
      }

      const result = data as any;
      if (result.success) {
        console.log('[DOGMA XI] ✅ Dispositivo desativado:', result.device_name);
        // Tentar registrar novamente após desativar
        await checkAndRegisterDevice();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[DOGMA XI] Erro:', err);
      return false;
    }
  }, [checkAndRegisterDevice]);

  // Listar dispositivos do usuário
  const fetchUserDevices = useCallback(async (): Promise<Device[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_devices');
      
      if (error) {
        console.error('[DOGMA XI] Erro ao buscar dispositivos:', error);
        return [];
      }

      const result = data as any;
      return result.devices || [];
    } catch (err) {
      console.error('[DOGMA XI] Erro:', err);
      return [];
    }
  }, []);

  // Limpar estado de limite excedido
  const clearLimitExceeded = useCallback(() => {
    setState(prev => ({ ...prev, deviceLimitExceeded: false, devices: [] }));
  }, []);

  return {
    ...state,
    checkAndRegisterDevice,
    deactivateDevice,
    fetchUserDevices,
    clearLimitExceeded,
  };
}
