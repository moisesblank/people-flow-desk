// ============================================
// 🔥 PLANO DE CONTINGÊNCIA - MATRIZ 2300
// Fallbacks e recuperação automática
// ============================================

import React, { memo, useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

export interface ContingencyAction {
  id: string;
  trigger: 'connection_lost' | 'high_latency' | 'server_error' | 'capacity_exceeded';
  action: string;
  description: string;
  automated: boolean;
}

export interface SystemStatus {
  isOnline: boolean;
  latency: number;
  serverStatus: 'ok' | 'degraded' | 'down';
  viewerCapacity: number;
  currentViewers: number;
}

// ============================================
// PLANO DE CONTINGÊNCIA
// ============================================

export const CONTINGENCY_PLAN: ContingencyAction[] = [
  {
    id: 'conn_lost_1',
    trigger: 'connection_lost',
    action: 'Reconexão automática',
    description: 'Tentar reconectar automaticamente em 3s, 5s, 10s',
    automated: true,
  },
  {
    id: 'conn_lost_2',
    trigger: 'connection_lost',
    action: 'Fallback para YouTube',
    description: 'Se Panda Video falhar, usar embed do YouTube',
    automated: true,
  },
  {
    id: 'high_lat_1',
    trigger: 'high_latency',
    action: 'Ativar Slow Mode',
    description: 'Aumentar intervalo entre mensagens do chat',
    automated: true,
  },
  {
    id: 'high_lat_2',
    trigger: 'high_latency',
    action: 'Reduzir qualidade',
    description: 'Sugerir qualidade menor de vídeo',
    automated: false,
  },
  {
    id: 'server_err_1',
    trigger: 'server_error',
    action: 'Retry exponencial',
    description: 'Retentar com backoff: 1s, 2s, 4s, 8s',
    automated: true,
  },
  {
    id: 'server_err_2',
    trigger: 'server_error',
    action: 'Modo offline',
    description: 'Usar dados em cache, desabilitar funcionalidades em tempo real',
    automated: true,
  },
  {
    id: 'capacity_1',
    trigger: 'capacity_exceeded',
    action: 'Slow mode agressivo',
    description: 'Limitar chat a 1 msg/10s',
    automated: true,
  },
  {
    id: 'capacity_2',
    trigger: 'capacity_exceeded',
    action: 'Desabilitar reações',
    description: 'Pausar envio de reactions para reduzir carga',
    automated: true,
  },
];

// ============================================
// HOOK DE STATUS DO SISTEMA
// ============================================

export function useSystemStatus(): SystemStatus {
  const [status, setStatus] = useState<SystemStatus>({
    isOnline: navigator.onLine,
    latency: 0,
    serverStatus: 'ok',
    viewerCapacity: 5000,
    currentViewers: 0,
  });

  useEffect(() => {
    const handleOnline = () => setStatus(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setStatus(s => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}

// ============================================
// COMPONENTE BANNER DE INSTABILIDADE
// ============================================

interface InstabilityBannerProps {
  type: 'warning' | 'error' | 'info';
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const InstabilityBanner = memo(function InstabilityBanner({
  type,
  message,
  onDismiss,
  onRetry,
}: InstabilityBannerProps) {
  const colors = {
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
    error: 'bg-red-500/20 border-red-500/50 text-red-200',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-200',
  };

  const icons = {
    warning: <AlertTriangle className="w-4 h-4" />,
    error: <WifiOff className="w-4 h-4" />,
    info: <Radio className="w-4 h-4" />,
  };

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-4 py-2 border rounded-lg",
      colors[type]
    )}>
      <div className="flex items-center gap-2">
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            className="h-7 px-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Tentar novamente
          </Button>
        )}
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-7 px-2"
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  );
});

// ============================================
// COMPONENTE STATUS BADGE
// ============================================

interface StatusBadgeProps {
  isOnline: boolean;
  latency?: number;
}

export const StatusBadge = memo(function StatusBadge({ isOnline, latency }: StatusBadgeProps) {
  const getLatencyColor = () => {
    if (!latency) return 'text-muted-foreground';
    if (latency < 100) return 'text-green-400';
    if (latency < 300) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {isOnline ? (
        <Wifi className="w-3 h-3 text-green-400" />
      ) : (
        <WifiOff className="w-3 h-3 text-red-400" />
      )}
      <span className={cn("font-mono", getLatencyColor())}>
        {isOnline ? (latency ? `${latency}ms` : 'Online') : 'Offline'}
      </span>
    </div>
  );
});

// ============================================
// HOOK DE AUTO-RETRY
// ============================================

interface UseAutoRetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

export function useAutoRetry(options: UseAutoRetryOptions = {}) {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 30000,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const scheduleRetry = useCallback((fn: () => Promise<void>) => {
    if (retryCount >= maxRetries) {
      onMaxRetriesReached?.();
      return;
    }

    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    setIsRetrying(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        await fn();
        setRetryCount(0);
        setIsRetrying(false);
      } catch {
        setRetryCount(c => c + 1);
        onRetry?.(retryCount + 1);
        scheduleRetry(fn);
      }
    }, delay);
  }, [retryCount, maxRetries, baseDelay, maxDelay, onRetry, onMaxRetriesReached]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    retryCount,
    isRetrying,
    scheduleRetry,
    reset,
  };
}

console.log('[CONTINGÊNCIA] ⚡ Plano de contingência carregado - Matriz 2300');
