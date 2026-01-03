// ============================================
// 🛡️ BEYOND_THE_3_DEVICES — Store Isolado
// Cenário: Substituição de dispositivo do MESMO TIPO
// REGRA: Desktop↔Desktop, Mobile↔Mobile, Tablet↔Tablet
// NÃO AFETA: deviceGateStore, loginIntent, DeviceGuard
// ============================================

import { create } from 'zustand';

// Dispositivo que será substituído (do mesmo tipo)
export interface SameTypeDevice {
  device_id: string;
  label: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  os_name: string;
  browser_name: string;
  last_seen_at: string;
}

// Payload específico para BEYOND_THE_3_DEVICES
export interface SameTypeReplacementPayload {
  code: 'SAME_TYPE_REPLACEMENT_REQUIRED';
  message: string;
  
  // O tipo do dispositivo atual (novo) que está tentando entrar
  current_device_type: 'mobile' | 'tablet' | 'desktop';
  
  // Info do dispositivo atual
  current_device: {
    device_type: string;
    os_name: string;
    browser_name: string;
    label: string;
  };
  
  // Dispositivo existente do MESMO TIPO que pode ser substituído
  existing_same_type_device: SameTypeDevice;
  
  // Hash do novo dispositivo (para registrar após 2FA)
  new_device_hash: string;
}

interface SameTypeReplacementState {
  // Payload do cenário
  payload: SameTypeReplacementPayload | null;
  
  // Estados de UI
  isGateActive: boolean;
  isProcessing: boolean;
  is2FAVerified: boolean;
  error: string | null;
  
  // Step do fluxo
  step: 'decision' | '2fa_verification' | 'success' | 'cancelled';
  
  // Actions
  setPayload: (payload: SameTypeReplacementPayload) => void;
  clearPayload: () => void;
  setProcessing: (isProcessing: boolean) => void;
  set2FAVerified: (verified: boolean) => void;
  setError: (error: string | null) => void;
  setStep: (step: 'decision' | '2fa_verification' | 'success' | 'cancelled') => void;
  reset: () => void;
}

export const useSameTypeReplacementStore = create<SameTypeReplacementState>((set) => ({
  // Estado inicial
  payload: null,
  isGateActive: false,
  isProcessing: false,
  is2FAVerified: false,
  error: null,
  step: 'decision',
  
  // Actions
  setPayload: (payload) => set({ 
    payload, 
    isGateActive: true,
    error: null,
    step: 'decision',
    is2FAVerified: false,
  }),
  
  clearPayload: () => set({ 
    payload: null, 
    isGateActive: false,
    error: null,
    step: 'decision',
    is2FAVerified: false,
  }),
  
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  set2FAVerified: (verified) => set({ is2FAVerified: verified }),
  
  setError: (error) => set({ error }),
  
  setStep: (step) => set({ step }),
  
  reset: () => set({
    payload: null,
    isGateActive: false,
    isProcessing: false,
    is2FAVerified: false,
    error: null,
    step: 'decision',
  }),
}));
