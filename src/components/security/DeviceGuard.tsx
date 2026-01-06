// ============================================
// 🔓 DeviceGuard — DESATIVADO
// Limite de dispositivos REMOVIDO
// Renderiza children diretamente
// ============================================

import { ReactNode } from 'react';

interface DeviceGuardProps {
  children: ReactNode;
}

/**
 * DESATIVADO: Apenas renderiza children
 * Nenhuma verificação de dispositivo
 */
export function DeviceGuard({ children }: DeviceGuardProps) {
  console.log('[DeviceGuard] 🔓 DESATIVADO - bypass total');
  return <>{children}</>;
}
