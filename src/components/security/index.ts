// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v3.0
// FORTALEZA SUPREME 2300 - Exportações
// ============================================

// DOGMA I - Sessão Única
export { SessionGuard } from './SessionGuard';

// DOGMA XI - Controle de Dispositivos
export { DeviceGuard } from './DeviceGuard';
export { DeviceLimitModal } from './DeviceLimitModal';

// DOGMA III - Proteção de Conteúdo
export { ProtectedPDFViewer } from './ProtectedPDFViewer';

// Dashboard de Segurança
export { SecurityDashboard } from './SecurityDashboard';

// 🛡️ FORTALEZA SUPREME v3.0 (Nova API)
export {
  checkUrlAccess,
  checkRateLimit,
  logSecurityEvent as logSecuritySupreme,
  getSecurityDashboard,
  cleanupSecurityData,
  URL_MAP,
  SECURITY_CONFIG as FORTALEZA_CONFIG,
} from '@/lib/security/fortalezaSupreme';

// Hooks
export {
  useUrlAccessGuard,
  useRateLimiter,
  useSecurityDashboard,
  useThreatDetection,
  useSecurityLogger,
} from '@/hooks/useFortalezaSupreme';

// Fingerprinting
export { 
  generateDeviceFingerprint, 
  generateDeviceName, 
  detectDeviceType,
  clearFingerprintCache,
  isFingerprintCached 
} from '@/lib/deviceFingerprint';
