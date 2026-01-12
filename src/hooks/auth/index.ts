// ============================================
// 🔐 AUTH HOOKS — Barrel Export
// Hooks de autenticação desacoplados
// ============================================

export { useHeartbeat } from './useHeartbeat';
export { useDeviceFingerprint, type FingerprintResult } from './useDeviceFingerprint';
// 🔐 v3.0: useSessionManager agora usa hash do servidor (refinamento P0)
export { useSessionManager } from './useSessionManager';

// 🛡️ NUCLEAR LOCKDOWN SYSTEM v1.0
export { useSystemGuard, type AuthGuardError } from './useSystemGuard';

// 2FA Decision Engine (SYNAPSE Ω v10.x) com cache de confiança
export { 
  use2FADecision, 
  decide2FA,
  setTrustCache,
  invalidateTrustCache,
  type TwoFADecisionResult,
  type TwoFADecisionOptions,
  type DeviceValidationSignals 
} from './use2FADecision';

// 🔐 BLOCO 1 FIX: Fingerprint raw data (para servidor gerar hash)
export { collectFingerprintRawData, type FingerprintRawData } from '@/lib/deviceFingerprintRaw';

// 🔐 BLOCO 3: Registro de dispositivo antes da sessão
export { registerDeviceBeforeSession, getDeviceErrorMessage, type DeviceRegistrationResult } from '@/lib/deviceRegistration';

// 🔐 Fingerprint utilities exportados para uso direto
export { 
  getServerDeviceHash, 
  saveServerDeviceHash, 
  clearServerDeviceHash,
  generateDeviceName,
  detectDeviceType 
} from '@/lib/deviceFingerprint';
