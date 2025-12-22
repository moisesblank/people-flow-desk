// ============================================
// 🛡️ FORTALEZA DIGITAL ULTRA v2.0 + SANCTUM 3.0
// SECURITY COMPONENTS - EXPORTS
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

// Componentes de guarda
export { SessionGuard } from './SessionGuard';
export { DeviceGuard } from './DeviceGuard';
export { DeviceLimitModal } from './DeviceLimitModal';
export { default as BetaAccessGuard } from './BetaAccessGuard';

// Componentes de autenticação
export { MFASetup } from './MFASetup';

// Componentes de proteção de conteúdo (DOGMA III)
export { ProtectedPDFViewer } from './ProtectedPDFViewer';

// 🌌 SANCTUM 3.0 — Componentes de proteção avançada
export { SanctumWatermark } from './SanctumWatermark';
export { SanctumProtectedContent } from './SanctumProtectedContent';
export { HologramText } from './HologramText';

// Componentes de dashboard
export { SecurityStatusWidget } from './SecurityStatusWidget';
export { SecurityDashboard } from './SecurityDashboard';

// Re-export hooks de segurança
export { useSecurityGuard, useRateLimitGuard, useContentProtection } from '@/hooks/useSecurityGuard';
export { useSecurity, SecurityProvider } from '@/contexts/SecurityContext';

// 🌌 SANCTUM 3.0 — Hook principal
export { useSanctumCore } from '@/hooks/useSanctumCore';
