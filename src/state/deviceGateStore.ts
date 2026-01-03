// ============================================
// 🛡️ DEVICE GATE STORE
// Estado global para controle de dispositivos
// BLOCO 3: Frontend Gate de Segurança
// ============================================

import { create } from 'zustand';

export interface DeviceInfo {
  device_id: string;
  label: string;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os_name: string;
  browser_name: string;
  last_seen_at: string;
  first_seen_at: string;
  is_recommended_to_disconnect: boolean;
}

export interface CurrentDeviceInfo {
  device_type: string;
  os_name?: string;
  browser_name?: string;
  label?: string;
}

export interface DeviceGatePayload {
  code: 'DEVICE_LIMIT_EXCEEDED';
  message: string;
  max_devices: number;
  current_devices: number;
  current_device: CurrentDeviceInfo;
  devices: DeviceInfo[];
  action_required: 'REVOKE_ONE_DEVICE_TO_CONTINUE';
}

interface DeviceGateState {
  // Payload recebido do backend
  payload: DeviceGatePayload | null;
  
  // Estado de UI
  isGateActive: boolean;
  isRevoking: boolean;
  selectedDeviceId: string | null;
  error: string | null;
  retryCount: number;
  
  // 🛡️ CRITÉRIO EXPLÍCITO: loginIntent flag
  // Nenhuma UI de device limit pode ser renderizada enquanto loginIntent !== true
  loginIntent: boolean;
  
  // Actions
  setPayload: (payload: DeviceGatePayload) => void;
  clearPayload: () => void;
  setSelectedDevice: (deviceId: string | null) => void;
  setRevoking: (isRevoking: boolean) => void;
  setError: (error: string | null) => void;
  incrementRetry: () => void;
  reset: () => void;
  
  // 🛡️ loginIntent lifecycle
  setLoginIntent: (intent: boolean) => void;
}

const MAX_RETRIES = 3;

export const useDeviceGateStore = create<DeviceGateState>((set, get) => ({
  // Estado inicial
  payload: null,
  isGateActive: false,
  isRevoking: false,
  selectedDeviceId: null,
  error: null,
  retryCount: 0,
  loginIntent: false, // 🛡️ Inicia false - só true ao clicar "Entrar"
  
  // Actions
  setPayload: (payload) => {
    const { loginIntent } = get();
    
    // 🛡️ REGRA INVIOLÁVEL: Só ativar gate se loginIntent === true
    if (!loginIntent) {
      console.warn('[SECURITY] ⚠️ Device gate triggered without loginIntent - BLOCKED (state leak prevention)');
      return; // Ignora silenciosamente
    }
    
    set({ 
      payload, 
      isGateActive: true,
      error: null,
      retryCount: 0,
    });
  },
  
  clearPayload: () => set({ 
    payload: null, 
    isGateActive: false,
    selectedDeviceId: null,
    error: null,
  }),
  
  setSelectedDevice: (deviceId) => set({ 
    selectedDeviceId: deviceId,
    error: null,
  }),
  
  setRevoking: (isRevoking) => set({ isRevoking }),
  
  setError: (error) => set({ error }),
  
  incrementRetry: () => {
    const current = get().retryCount;
    if (current >= MAX_RETRIES) {
      set({ 
        error: 'Limite de tentativas excedido. Saia e entre novamente.',
        retryCount: current + 1,
      });
    } else {
      set({ retryCount: current + 1 });
    }
  },
  
  reset: () => set({
    payload: null,
    isGateActive: false,
    isRevoking: false,
    selectedDeviceId: null,
    error: null,
    retryCount: 0,
    loginIntent: false, // 🛡️ Reset completo inclui loginIntent
  }),
  
  // 🛡️ loginIntent lifecycle control
  setLoginIntent: (intent) => set({ loginIntent: intent }),
}));
