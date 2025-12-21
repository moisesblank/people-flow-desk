// ============================================
// 🛡️ DOGMA XI: Device Guard
// Verifica limite de dispositivos no login
// ============================================

import { useEffect, useState, ReactNode } from 'react';
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
    checkAndRegisterDevice, 
    deactivateDevice,
    clearLimitExceeded 
  } = useDeviceLimit();
  
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (user && !hasChecked) {
      checkAndRegisterDevice().then(() => {
        setHasChecked(true);
      });
    }
    
    if (!user) {
      setHasChecked(false);
    }
  }, [user, hasChecked, checkAndRegisterDevice]);

  // Se não tem usuário, renderizar children normalmente
  if (!user) {
    return <>{children}</>;
  }

  // Mostrar modal se limite excedido
  if (deviceLimitExceeded) {
    return (
      <>
        {children}
        <DeviceLimitModal
          isOpen={true}
          devices={devices}
          onDeactivate={async (deviceId) => {
            const success = await deactivateDevice(deviceId);
            if (success) {
              clearLimitExceeded();
            }
            return success;
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}
