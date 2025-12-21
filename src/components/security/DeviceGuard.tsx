// ============================================
// 🛡️ DOGMA XI v2.0: Device Guard
// Verifica limite de dispositivos no login
// Integrado com Single Session (DOGMA I)
// ============================================

import { useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceLimit } from '@/hooks/useDeviceLimit';
import { DeviceLimitModal } from './DeviceLimitModal';

interface DeviceGuardProps {
  children: ReactNode;
}

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
  } = useDeviceLimit();
  
  const [hasChecked, setHasChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Verificar dispositivo quando usuário loga
  useEffect(() => {
    if (user && !hasChecked) {
      console.log('[DeviceGuard] 🔐 Iniciando verificação de dispositivo...');
      
      checkAndRegisterDevice().then((result) => {
        setHasChecked(true);
        
        if (!result.success && result.error === 'DEVICE_LIMIT_EXCEEDED') {
          console.log('[DeviceGuard] ⚠️ Abrindo modal de limite');
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
