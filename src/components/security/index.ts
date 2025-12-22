// ============================================
// 🛡️ FORTALEZA DIGITAL ULTRA v2.0
// SECURITY COMPONENTS - EXPORTS
// ============================================

// Componentes de guarda
export { SessionGuard } from './SessionGuard';
export { DeviceGuard } from './DeviceGuard';
export { DeviceLimitModal } from './DeviceLimitModal';
export { default as BetaAccessGuard } from './BetaAccessGuard';

// Componentes de autenticação
export { MFASetup } from './MFASetup';

// Componentes de proteção de conteúdo
export { ProtectedPDFViewer } from './ProtectedPDFViewer';

// Componentes de dashboard
export { SecurityStatusWidget } from './SecurityStatusWidget';
export { SecurityDashboard } from './SecurityDashboard';

// Re-export hooks de segurança
export { useSecurityGuard, useRateLimitGuard, useContentProtection } from '@/hooks/useSecurityGuard';
export { useSecurity, SecurityProvider } from '@/contexts/SecurityContext';
