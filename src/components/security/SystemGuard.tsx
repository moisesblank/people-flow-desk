// ============================================
// 🛡️ NUCLEAR LOCKDOWN SYSTEM v1.0
// Componente que monitora estado global de auth
// BLOCO 1: Contenção Imediata
// ============================================

import { useEffect, memo } from 'react';
import { useSystemGuard } from '@/hooks/auth/useSystemGuard';
import { useAuth } from '@/hooks/useAuth';

interface SystemGuardProps {
  children: React.ReactNode;
}

/**
 * SystemGuard: Monitora auth_enabled e auth_epoch globalmente.
 * 
 * Se auth_enabled=false → LOGOUT FORÇADO IMEDIATO
 * Se auth_epoch diverge → LOGOUT FORÇADO IMEDIATO
 * 
 * Este componente é a primeira linha de defesa do NUCLEAR LOCKDOWN.
 */
export const SystemGuard = memo(function SystemGuard({ children }: SystemGuardProps) {
  const { user } = useAuth();
  const { authEnabled, error, forceLogout } = useSystemGuard();

  // Se não há usuário, não precisa guardar
  useEffect(() => {
    if (!user) return;

    // Se auth desabilitado e há usuário, forçar logout
    if (!authEnabled) {
      console.error('[SystemGuard] 🔒 AUTH DESABILITADO - Forçando logout!');
      forceLogout('AUTH_DISABLED');
    }
  }, [user, authEnabled, forceLogout]);

  // Se há erro crítico, já está sendo tratado pelo hook
  useEffect(() => {
    if (error && error !== 'VALID' && error !== 'SESSION_NOT_FOUND') {
      console.error(`[SystemGuard] 🔴 Erro detectado: ${error}`);
    }
  }, [error]);

  return <>{children}</>;
});

export default SystemGuard;
