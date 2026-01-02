// ============================================
// 🛡️ DOGMA XI v3.2: Device Guard (BLOCO 3 COMPLIANT)
// FAIL-CLOSED: Se isGateActive=true, bloqueia e redireciona
// O vínculo real acontece ANTES da sessão no Auth.tsx
// ============================================

import { useEffect, useState, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceLimitServer } from '@/hooks/useDeviceLimitServer';
import { useDeviceGateStore } from '@/state/deviceGateStore';
import { DeviceLimitModal } from './DeviceLimitModal';

interface DeviceGuardProps {
  children: ReactNode;
}

/**
 * 🔐 BLOCO 3: DeviceGuard - FAIL-CLOSED
 * 
 * O vínculo real usuário×dispositivo acontece ANTES da sessão ser criada,
 * diretamente no fluxo de login (Auth.tsx).
 * 
 * Este componente serve para:
 * 1. BLOQUEAR e redirecionar se isGateActive=true (fail-closed)
 * 2. Mostrar modal de gerenciamento como fallback (edge case)
 * 3. Atualizar last_seen_at do dispositivo
 */
export function DeviceGuard({ children }: DeviceGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isGateActive, payload } = useDeviceGateStore();
  const { 
    isChecking, 
    deviceLimitExceeded, 
    devices,
    maxDevices,
    isOwner,
    checkAndRegisterDevice, 
    deactivateDevice,
    clearLimitExceeded 
  } = useDeviceLimitServer();
  
  const [hasChecked, setHasChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🛡️ BLOCO 3: FAIL-CLOSED - Se gate está ativo, redirecionar IMEDIATAMENTE
  useEffect(() => {
    // Não redirecionar se já estamos na página do gate
    if (location.pathname === '/security/device-limit') {
      return;
    }

    // Se o gate está ativo (vindo do Auth.tsx), forçar redirecionamento
    if (isGateActive && payload) {
      console.log('[DeviceGuard] 🛡️ FAIL-CLOSED: Gate ativo, redirecionando para /security/device-limit');
      navigate('/security/device-limit', { replace: true });

      // 🧯 P0 anti-tela-preta: fallback HARD redirect caso o router esteja travado
      const t = window.setTimeout(() => {
        if (window.location.pathname !== '/security/device-limit') {
          window.location.assign('/security/device-limit');
        }
      }, 600);

      return () => window.clearTimeout(t);
    }
  }, [isGateActive, payload, location.pathname, navigate]);

  // Verificar dispositivo quando usuário loga (FALLBACK apenas)
  useEffect(() => {
    if (user && !hasChecked && !isOwner) {
      // 🔐 BLOCO 3: Apenas atualiza last_seen, não bloqueia
      // O bloqueio real já aconteceu no Auth.tsx
      console.log('[DeviceGuard] 🔐 Verificação de fallback...');

      checkAndRegisterDevice().then((result) => {
        setHasChecked(true);

        if (!result.success && result.error === 'DEVICE_LIMIT_EXCEEDED') {
          // Isso só deve acontecer se o login não passou pelo fluxo correto
          console.warn('[DeviceGuard] ⚠️ Limite excedido (edge case) - mostrando modal');
          setIsModalOpen(true);
        }
      });
    }

    // Reset quando usuário desloga
    if (!user) {
      setHasChecked(false);
      setIsModalOpen(false);
    }
  }, [user, hasChecked, checkAndRegisterDevice, isOwner]);

  // Abrir modal quando limite é excedido
  useEffect(() => {
    if (deviceLimitExceeded && !isModalOpen) {
      setIsModalOpen(true);
    }
  }, [deviceLimitExceeded, isModalOpen]);

  // Handler para desativar dispositivo
  const handleDeactivate = useCallback(async (deviceId: string) => {
    const success = await deactivateDevice(deviceId);
    if (success) {
      setIsModalOpen(false);
      clearLimitExceeded();
    }
    return success;
  }, [deactivateDevice, clearLimitExceeded]);

  // 🛡️ BLOCO 3: Se gate está ativo, NÃO renderizar children (fail-closed)
  // P0 anti-tela-preta: nunca retornar null (exibe tela de bloqueio enquanto redireciona)
  if (isGateActive && payload && location.pathname !== '/security/device-limit') {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-3 text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-foreground/50 border-t-transparent animate-spin" />
          <h1 className="text-base font-semibold">Validando dispositivo…</h1>
          <p className="text-sm text-muted-foreground">
            Sua sessão precisa confirmar o dispositivo antes de acessar esta área.
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            onClick={() => window.location.assign('/security/device-limit')}
          >
            Ir para verificação
          </button>
        </div>
      </div>
    );
  }

  // Se não tem usuário, renderizar normalmente
  if (!user) {
    return <>{children}</>;
  }

  // Owner bypassa tudo
  if (isOwner) {
    return <>{children}</>;
  }

  // Renderizar children + modal se necessário
  return (
    <>
      {children}
      
      <DeviceLimitModal
        isOpen={isModalOpen && deviceLimitExceeded}
        devices={devices}
        maxDevices={maxDevices}
        onDeactivate={handleDeactivate}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
