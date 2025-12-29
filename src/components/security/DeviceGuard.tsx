// ============================================
// 🛡️ DOGMA XI v3.1: Device Guard (BLOCO 3 COMPLIANT)
// Agora é FALLBACK VISUAL apenas
// O vínculo real acontece ANTES da sessão no Auth.tsx
// ============================================

import { useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceLimitServer } from '@/hooks/useDeviceLimitServer';
import { DeviceLimitModal } from './DeviceLimitModal';

interface DeviceGuardProps {
  children: ReactNode;
}

/**
 * 🔐 BLOCO 3: DeviceGuard agora é apenas FALLBACK VISUAL
 * 
 * O vínculo real usuário×dispositivo acontece ANTES da sessão ser criada,
 * diretamente no fluxo de login (Auth.tsx).
 * 
 * Este componente serve apenas para:
 * 1. Mostrar modal de gerenciamento caso algo escape (edge case)
 * 2. Atualizar last_seen_at do dispositivo
 */
export function DeviceGuard({ children }: DeviceGuardProps) {
  const { user } = useAuth();
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

  // Verificar dispositivo quando usuário loga (FALLBACK apenas)
  useEffect(() => {
    if (user && !hasChecked) {
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
  }, [user, hasChecked, checkAndRegisterDevice]);

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
