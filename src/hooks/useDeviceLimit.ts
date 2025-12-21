// ============================================
// 🛡️ DOGMA XI v2.0: Hook de Controle de Dispositivos
// Máximo 3 dispositivos (exceto owner)
// Sessão única por vez (sem simultaneidade)
// ============================================

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { generateDeviceFingerprint, generateDeviceName, detectDeviceType } from '@/lib/deviceFingerprint';
import { toast } from 'sonner';

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

interface DeviceLimitState {
  isChecking: boolean;
  deviceLimitExceeded: boolean;
  devices: Device[];
  currentDeviceId: string | null;
  currentFingerprint: string | null;
  maxDevices: number;
  isOwner: boolean;
}

export interface DeviceLimitResult {
  success: boolean;
  error?: string;
  devices?: Device[];
  message?: string;
}

export function useDeviceLimit() {
  const { user } = useAuth();
  const isCheckingRef = useRef(false);
  
  const [state, setState] = useState<DeviceLimitState>({
    isChecking: false,
    deviceLimitExceeded: false,
    devices: [],
    currentDeviceId: null,
    currentFingerprint: null,
    maxDevices: 3,
    isOwner: false,
  });

  // Detectar informações do navegador
  const detectBrowserInfo = useCallback(() => {
    const ua = navigator.userAgent;
    
    let browser = 'Outro';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    
    let os = 'Outro';
    if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('CrOS')) os = 'Chrome OS';
    
    return { browser, os };
  }, []);

  // Verificar/registrar dispositivo no login
  const checkAndRegisterDevice = useCallback(async (): Promise<DeviceLimitResult> => {
    if (!user) return { success: false, error: 'NOT_AUTHENTICATED' };
    if (isCheckingRef.current) return { success: false, error: 'ALREADY_CHECKING' };

    isCheckingRef.current = true;
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      // Gerar fingerprint único do dispositivo
      const fingerprint = await generateDeviceFingerprint();
      const deviceName = generateDeviceName();
      const deviceType = detectDeviceType();
      const { browser, os } = detectBrowserInfo();

      console.log('[DOGMA XI] 🔐 Verificando dispositivo:', { deviceName, deviceType, browser, os });

      const { data, error } = await supabase.rpc('register_device_with_limit', {
        p_device_fingerprint: fingerprint,
        p_device_name: deviceName,
        p_device_type: deviceType,
        p_browser: browser,
        p_os: os,
      });

      if (error) {
        console.error('[DOGMA XI] ❌ Erro ao registrar dispositivo:', error);
        setState(prev => ({ ...prev, isChecking: false }));
        isCheckingRef.current = false;
        return { success: false, error: error.message };
      }

      const result = data as any;
      
      // Limite de dispositivos excedido
      if (result.error === 'DEVICE_LIMIT_EXCEEDED') {
        console.warn('[DOGMA XI] ⚠️ Limite de dispositivos excedido:', result.current_count);
        
        setState({
          isChecking: false,
          deviceLimitExceeded: true,
          devices: (result.devices || []).map((d: any) => ({
            ...d,
            device_type: d.device_type || 'desktop'
          })),
          currentDeviceId: null,
          currentFingerprint: fingerprint,
          maxDevices: result.max_devices || 3,
          isOwner: false,
        });
        
        isCheckingRef.current = false;
        return { 
          success: false, 
          error: 'DEVICE_LIMIT_EXCEEDED', 
          devices: result.devices,
          message: result.message 
        };
      }

      // Sucesso - dispositivo registrado ou reconhecido
      setState({
        isChecking: false,
        deviceLimitExceeded: false,
        devices: [],
        currentDeviceId: result.device_id || null,
        currentFingerprint: fingerprint,
        maxDevices: result.max_devices || 3,
        isOwner: result.is_owner || false,
      });
      
      console.log('[DOGMA XI] ✅ Dispositivo verificado:', result.status, result.message);
      
      if (result.status === 'NEW_DEVICE_REGISTERED') {
        toast.success('Novo dispositivo registrado', {
          description: `${deviceName} foi adicionado à sua conta.`
        });
      }
      
      isCheckingRef.current = false;
      return { success: true, message: result.message };
    } catch (err) {
      console.error('[DOGMA XI] ❌ Erro inesperado:', err);
      setState(prev => ({ ...prev, isChecking: false }));
      isCheckingRef.current = false;
      return { success: false, error: 'UNKNOWN_ERROR' };
    }
  }, [user, detectBrowserInfo]);

  // Desativar um dispositivo específico
  const deactivateDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      console.log('[DOGMA XI] 🗑️ Desativando dispositivo:', deviceId);
      
      const { data, error } = await supabase.rpc('deactivate_device', {
        p_device_id: deviceId,
      });

      if (error) {
        console.error('[DOGMA XI] ❌ Erro ao desativar dispositivo:', error);
        toast.error('Erro ao desativar dispositivo');
        return false;
      }

      const result = data as any;
      
      if (result.success) {
        console.log('[DOGMA XI] ✅ Dispositivo desativado:', result.device_name);
        toast.success('Dispositivo desativado', {
          description: `${result.device_name} foi removido da sua conta.`
        });
        
        // Tentar registrar o dispositivo atual novamente
        await checkAndRegisterDevice();
        return true;
      }
      
      toast.error(result.error || 'Erro ao desativar');
      return false;
    } catch (err) {
      console.error('[DOGMA XI] ❌ Erro:', err);
      toast.error('Erro ao desativar dispositivo');
      return false;
    }
  }, [checkAndRegisterDevice]);

  // Listar todos os dispositivos do usuário
  const fetchUserDevices = useCallback(async (): Promise<Device[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_devices');
      
      if (error) {
        console.error('[DOGMA XI] ❌ Erro ao buscar dispositivos:', error);
        return [];
      }

      const result = data as any;
      
      if (result.success) {
        return (result.devices || []).map((d: any) => ({
          ...d,
          is_current: d.device_fingerprint === state.currentFingerprint
        }));
      }
      
      return [];
    } catch (err) {
      console.error('[DOGMA XI] ❌ Erro:', err);
      return [];
    }
  }, [state.currentFingerprint]);

  // Limpar estado de limite excedido
  const clearLimitExceeded = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      deviceLimitExceeded: false, 
      devices: [] 
    }));
  }, []);

  // Forçar recheck do dispositivo
  const recheckDevice = useCallback(async () => {
    isCheckingRef.current = false;
    return checkAndRegisterDevice();
  }, [checkAndRegisterDevice]);

  return {
    ...state,
    checkAndRegisterDevice,
    deactivateDevice,
    fetchUserDevices,
    clearLimitExceeded,
    recheckDevice,
  };
}
