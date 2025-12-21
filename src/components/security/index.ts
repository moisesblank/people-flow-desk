// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.0
// MATRIZ DIGITAL 2300 - Fortaleza de Segurança
// INDEX - Exportações de Segurança
// ============================================

// DOGMA I - Sessão Única (Nenhuma simultaneidade)
export { SessionGuard } from './SessionGuard';

// DOGMA XI - Controle de Dispositivos (Máx 3 por usuário)
export { DeviceGuard } from './DeviceGuard';
export { DeviceLimitModal } from './DeviceLimitModal';

// DOGMA III - Proteção de Conteúdo (DRM)
export { ProtectedPDFViewer } from './ProtectedPDFViewer';

// Utilitários de Segurança
export * from '@/lib/security/securityEvangelism';

// Fingerprinting
export { 
  generateDeviceFingerprint, 
  generateDeviceName, 
  detectDeviceType,
  clearFingerprintCache,
  isFingerprintCached 
} from '@/lib/deviceFingerprint';
