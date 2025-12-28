// ============================================
// 🔐 AUTH HOOKS — Barrel Export
// Hooks de autenticação desacoplados
// ============================================

export { useHeartbeat } from './useHeartbeat';
export { useDeviceFingerprint, type FingerprintResult } from './useDeviceFingerprint';
export { useSessionManager } from './useSessionManager';

// 2FA Decision Engine (SYNAPSE Ω v10.x)
export { 
  use2FADecision, 
  decide2FA,
  type TwoFADecisionResult,
  type TwoFADecisionOptions,
  type DeviceValidationSignals 
} from './use2FADecision';
