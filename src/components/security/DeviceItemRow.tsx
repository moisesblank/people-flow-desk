// ============================================
// 🛡️ DEVICE ITEM ROW
// Componente de item de dispositivo para a lista
// BLOCO 1: UX tipo JusBrasil
// ============================================

import { memo } from 'react';
import { Monitor, Smartphone, Tablet, Clock, Check, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DeviceInfo } from '@/state/deviceGateStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeviceItemRowProps {
  device: DeviceInfo;
  isSelected: boolean;
  onSelect: () => void;
}

function getDeviceIcon(type: string) {
  switch (type) {
    case 'mobile':
      return <Smartphone className="w-6 h-6" />;
    case 'tablet':
      return <Tablet className="w-6 h-6" />;
    default:
      return <Monitor className="w-6 h-6" />;
  }
}

function getDeviceTypeName(type: string) {
  switch (type) {
    case 'mobile':
      return 'Celular';
    case 'tablet':
      return 'Tablet';
    default:
      return 'Computador';
  }
}

function formatDate(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return 'Data desconhecida';
  }
}

export const DeviceItemRow = memo(function DeviceItemRow({
  device,
  isSelected,
  onSelect,
}: DeviceItemRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200',
        'touch-manipulation min-h-[80px]', // Touch target >= 44px
        isSelected
          ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
          : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
    >
      {/* Ícone do dispositivo */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {getDeviceIcon(device.device_type)}
      </div>

      {/* Informações */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-foreground truncate">
            {device.label}
          </span>
          <Badge variant="secondary" className="text-xs shrink-0">
            {getDeviceTypeName(device.device_type)}
          </Badge>
          {device.is_recommended_to_disconnect && (
            <Badge variant="outline" className="text-xs shrink-0 border-amber-500/50 text-amber-600 dark:text-amber-400">
              <Star className="w-3 h-3 mr-1" />
              Recomendado
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{device.os_name}</span>
          <span>•</span>
          <span>{device.browser_name}</span>
        </div>

        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Último acesso {formatDate(device.last_seen_at)}</span>
        </div>
      </div>

      {/* Indicador de seleção (radio visual) */}
      <div
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
          isSelected
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/30'
        )}
      >
        {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
      </div>
    </button>
  );
});
