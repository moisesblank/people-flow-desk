// ============================================
// 🛡️ DEVICE LIMIT LIST
// Lista de dispositivos para seleção
// BLOCO 1: UX tipo JusBrasil
// ============================================

import { memo } from 'react';
import { DeviceItemRow } from './DeviceItemRow';
import { DeviceInfo } from '@/state/deviceGateStore';
import { AlertTriangle } from 'lucide-react';

interface DeviceLimitListProps {
  devices: DeviceInfo[];
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
  isDisabled?: boolean;
}

export const DeviceLimitList = memo(function DeviceLimitList({
  devices,
  selectedDeviceId,
  onSelectDevice,
  isDisabled = false,
}: DeviceLimitListProps) {
  if (devices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
        <p>Nenhum dispositivo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Selecione um dispositivo para desconectar">
      {devices.map((device) => (
        <DeviceItemRow
          key={device.device_id}
          device={device}
          isSelected={selectedDeviceId === device.device_id}
          onSelect={() => !isDisabled && onSelectDevice(device.device_id)}
        />
      ))}
    </div>
  );
});
