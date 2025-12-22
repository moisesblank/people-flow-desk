// ============================================
// 🛡️ FORTALEZA SUPREME v4.0 FINAL
// SISTEMA DE SEGURANÇA PHD-LEVEL 2300
// Exportações Centralizadas
// ============================================

// ============================================
// COMPONENTES DE GUARDA
// ============================================

// DOGMA I - Sessão Única
export { SessionGuard } from './SessionGuard';

// DOGMA XI - Controle de Dispositivos
export { DeviceGuard } from './DeviceGuard';
export { DeviceLimitModal } from './DeviceLimitModal';

// DOGMA III - Proteção de Conteúdo
export { ProtectedPDFViewer } from './ProtectedPDFViewer';

// Beta Access Guard
export { BetaAccessGuard } from './BetaAccessGuard';

// ============================================
// COMPONENTES DE DASHBOARD
// ============================================

export { SecurityDashboard } from './SecurityDashboard';
export { SecurityStatusWidget } from './SecurityStatusWidget';

// ============================================
// 🛡️ FORTALEZA SUPREME v4.0 (API Principal)
// ============================================

export {
  // Funções principais
  checkUrlAccess,
  checkRateLimit,
  logSecurityEvent as logSecuritySupreme,
  getSecurityDashboard,
  cleanupSecurityData,
  
  // Rate limiting client-side
  checkClientRateLimit,
  resetClientRateLimit,
  
  // Detecção de ameaças
  detectSuspiciousActivity,
  
  // Sanitização e validação
  sanitizeInput,
  sanitizeHtml,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  maskEmail,
  maskPhone,
  maskCPF,
  
  // Utils
  debounce,
  throttle,
  
  // Configurações
  URL_MAP,
  SECURITY_CONFIG as FORTALEZA_CONFIG,
  
  // Tipos
  type ThreatLevel,
  type SecurityAction,
  type AttackType,
  type UrlAccessResult,
  type RateLimitResult,
  type SecurityDashboard as SecurityDashboardType,
  type ThreatIntelligence,
  type SecurityEvent,
} from '@/lib/security/fortalezaSupreme';

// ============================================
// HOOKS DE SEGURANÇA
// ============================================

export {
  useUrlAccessGuard,
  useRateLimiter,
  useSecurityDashboard,
  useThreatDetection,
  useSecurityLogger,
  useSessionSecurity,
  useSecurityStatus,
} from '@/hooks/useFortalezaSupreme';

// ============================================
// FINGERPRINTING
// ============================================

export { 
  generateDeviceFingerprint, 
  generateDeviceName, 
  detectDeviceType,
  clearFingerprintCache,
  isFingerprintCached 
} from '@/lib/deviceFingerprint';

// ============================================
// RE-EXPORTS PARA COMPATIBILIDADE
// ============================================

// Alias para manter compatibilidade com código antigo
export { 
  logSecurityEvent as logSecurityEvent,
  SECURITY_CONFIG,
} from '@/lib/security/fortalezaSupreme';
