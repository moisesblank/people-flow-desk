// ============================================
// 🛡️ BLOCO 1 FIX: useDeviceLimitServer
// Hook que usa Edge Function para registro server-side
// Cliente envia dados BRUTOS, servidor gera hash final
// ============================================

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { collectFingerprintRawData, generateDeviceName, FingerprintRawData } from '@/lib/deviceFingerprintRaw';
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
  currentDeviceHash: string | null;
  maxDevices: number;
  isOwner: boolean;
}

export interface DeviceLimitResult {
  success: boolean;
  error?: string;
  devices?: Device[];
  message?: string;
  deviceHash?: string;
  deviceId?: string;
}

export function useDeviceLimitServer() {
  const { user } = useAuth();
  const isCheckingRef = useRef(false);
  
  const [state, setState] = useState<DeviceLimitState>({
    isChecking: false,
    deviceLimitExceeded: false,
    devices: [],
    currentDeviceId: null,
    currentDeviceHash: null,
    maxDevices: 3,
    isOwner: false,
  });

  // Verificar/registrar dispositivo no login (SERVER-SIDE)
  const checkAndRegisterDevice = useCallback(async (): Promise<DeviceLimitResult> => {
    if (!user) return { success: false, error: 'NOT_AUTHENTICATED' };
    if (isCheckingRef.current) return { success: false, error: 'ALREADY_CHECKING' };

    isCheckingRef.current = true;
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      // 🔐 BLOCO 1: Coletar dados BRUTOS (sem hash)
      const fingerprintData = await collectFingerprintRawData();
      const deviceName = generateDeviceName(fingerprintData);

      console.log('[DOGMA XI] 🔐 Registrando dispositivo via servidor...', {
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
        console.error('[DOGMA XI] ❌ Erro na Edge Function:', error);
        setState(prev => ({ ...prev, isChecking: false }));
        isCheckingRef.current = false;
        return { success: false, error: error.message };
      }

      // Tratar resposta
      if (!data.success) {
        if (data.error === 'DEVICE_LIMIT_EXCEEDED') {
          console.warn('[DOGMA XI] ⚠️ Limite de dispositivos excedido:', data.currentCount);
          
          setState({
            isChecking: false,
            deviceLimitExceeded: true,
            devices: (data.devices || []).map((d: any) => ({
              ...d,
              device_type: d.device_type || 'desktop'
            })),
            currentDeviceId: null,
            currentDeviceHash: null,
            maxDevices: data.maxDevices || 3,
            isOwner: false,
          });
          
          isCheckingRef.current = false;
          return { 
            success: false, 
            error: 'DEVICE_LIMIT_EXCEEDED', 
            devices: data.devices,
          };
        }

        if (data.error === 'DEVICE_SPOOF_DETECTED') {
          console.error('[DOGMA XI] 🚨 SPOOF DETECTADO:', data.reason);
          toast.error('Dispositivo não reconhecido', {
            description: 'Este dispositivo foi bloqueado por motivos de segurança.',
          });
          isCheckingRef.current = false;
          return { success: false, error: 'DEVICE_SPOOF_DETECTED' };
        }

        if (data.error === 'INVALID_FINGERPRINT') {
          console.error('[DOGMA XI] ❌ Fingerprint inválido:', data.reason);
          isCheckingRef.current = false;
          return { success: false, error: 'INVALID_FINGERPRINT' };
        }

        // Outro erro
        isCheckingRef.current = false;
        return { success: false, error: data.error };
      }

      // Sucesso - dispositivo registrado ou reconhecido
      setState({
        isChecking: false,
        deviceLimitExceeded: false,
        devices: [],
        currentDeviceId: data.deviceId,
        currentDeviceHash: data.deviceHash,
        maxDevices: 3,
        isOwner: data.isOwner || false,
      });

      console.log('[DOGMA XI] ✅ Dispositivo registrado (server-side):', {
        deviceId: data.deviceId,
        status: data.status,
        deviceHash: data.deviceHash?.slice(0, 16) + '...',
      });

      isCheckingRef.current = false;
      return { 
        success: true, 
        deviceId: data.deviceId,
        deviceHash: data.deviceHash,
      };

    } catch (err) {
      console.error('[DOGMA XI] ❌ Erro inesperado:', err);
      setState(prev => ({ ...prev, isChecking: false }));
      isCheckingRef.current = false;
      return { success: false, error: 'UNEXPECTED_ERROR' };
    }
  }, [user]);

  // Desativar dispositivo
  const deactivateDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_devices')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivated_by: user.id,
        })
        .eq('id', deviceId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[DOGMA XI] Erro ao desativar dispositivo:', error);
        return false;
      }

      // Atualizar lista local
      setState(prev => ({
        ...prev,
        devices: prev.devices.filter(d => d.id !== deviceId),
        deviceLimitExceeded: prev.devices.length - 1 < prev.maxDevices,
      }));

      toast.success('Dispositivo removido', {
        description: 'Você pode registrar um novo dispositivo agora.',
      });

      return true;
    } catch {
      return false;
    }
  }, [user]);

  // Buscar dispositivos do usuário
  const fetchUserDevices = useCallback(async (): Promise<Device[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('id, device_name, device_type, browser, os, last_seen_at, first_seen_at, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_seen_at', { ascending: false });

      if (error) {
        console.error('[DOGMA XI] Erro ao buscar dispositivos:', error);
        return [];
      }

      const devices = (data || []).map(d => ({
        ...d,
        device_type: (d.device_type || 'desktop') as 'desktop' | 'mobile' | 'tablet',
      }));

      setState(prev => ({ ...prev, devices }));
      return devices;
    } catch {
      return [];
    }
  }, [user]);

  // Limpar estado de limite excedido
  const clearLimitExceeded = useCallback(() => {
    setState(prev => ({ ...prev, deviceLimitExceeded: false }));
  }, []);

  return {
    ...state,
    checkAndRegisterDevice,
    deactivateDevice,
    fetchUserDevices,
    clearLimitExceeded,
  };
}
