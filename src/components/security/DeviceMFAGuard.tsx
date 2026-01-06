// ============================================
// 🔓 DeviceMFAGuard — DESATIVADO
// 2FA por dispositivo REMOVIDO
// Renderiza children diretamente
// ============================================

import { ReactNode } from "react";

interface DeviceMFAGuardProps {
  children: ReactNode;
}

/**
 * DESATIVADO: Apenas renderiza children
 * Nenhuma verificação de MFA por dispositivo
 */
export function DeviceMFAGuard({ children }: DeviceMFAGuardProps) {
  console.log('[DeviceMFAGuard] 🔓 DESATIVADO - bypass total');
  return <>{children}</>;
}
