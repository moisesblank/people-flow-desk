// ============================================
// SYSTEM REALTIME LOGS HOOK v1.0
// Hook para captura e visualização de logs em tempo real
// REGRA PERMANENTE: Todo erro deve ser visível ao owner
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

export type LogSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SystemLog {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  category: string;
  source: string;
  affected_url: string | null;
  triggered_action: string | null;
  error_message: string;
  stack_trace: string | null;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  metadata: Record<string, unknown>;
  session_id: string | null;
  device_info: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

interface UseSystemLogsReturn {
  logs: SystemLog[];
  isLoading: boolean;
  error: string | null;
  stats: {
    total: number;
    info: number;
    warning: number;
    error: number;
    critical: number;
  };
  refetch: () => Promise<void>;
  clearLogs: () => void;
}

// Singleton para captura global de erros
let globalLoggerInitialized = false;
let sessionId: string | null = null;

// Gerar session ID único
function getSessionId(): string {
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

// Função global para enviar logs (TXT + banco para realtime)
export async function sendSystemLog(
  severity: LogSeverity,
  category: string,
  errorMessage: string,
  options: {
    source?: string;
    affectedUrl?: string;
    triggeredAction?: string;
    stackTrace?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    const now = new Date();
    const deviceInfo = navigator.userAgent;
    
    // Enviar para edge function que salva em TXT + banco
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-writer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          timestamp: now.toISOString(),
          severity,
          affected_url_or_area: options.affectedUrl || window.location.pathname,
          triggered_action: options.triggeredAction || category,
          error_message: errorMessage.slice(0, 2000),
        }),
      }
    );

    if (!response.ok) {
      // Fallback: enviar direto ao banco se edge function falhar
      await supabase.rpc('insert_system_log', {
        p_severity: severity,
        p_category: category,
        p_source: options.source || 'frontend',
        p_affected_url: options.affectedUrl || window.location.pathname,
        p_triggered_action: options.triggeredAction || null,
        p_error_message: errorMessage.slice(0, 2000),
        p_stack_trace: options.stackTrace?.slice(0, 5000) || null,
        p_metadata: (options.metadata || {}) as unknown as Record<string, never>,
        p_session_id: getSessionId(),
        p_device_info: deviceInfo,
      });
    }
  } catch (err) {
    // Fallback final: log no console se tudo falhar
    console.error('[SystemLog] Failed to send log:', err);
  }
}

// Inicializar captura global de erros
export function initGlobalErrorCapture(): void {
  if (globalLoggerInitialized) return;
  globalLoggerInitialized = true;

  // Capturar erros JavaScript não tratados
  window.addEventListener('error', (event) => {
    sendSystemLog('error', 'javascript_error', event.message, {
      affectedUrl: window.location.pathname,
      stackTrace: event.error?.stack,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Capturar promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason);
    sendSystemLog('error', 'unhandled_rejection', message, {
      affectedUrl: window.location.pathname,
      stackTrace: event.reason?.stack,
      metadata: {
        type: 'unhandledrejection',
      },
    });
  });

  // Interceptar fetch para capturar erros de API
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Logar erros HTTP (4xx, 5xx)
      if (!response.ok && response.status >= 400) {
        const url = typeof args[0] === 'string' ? args[0] : args[0].toString();
        sendSystemLog(
          response.status >= 500 ? 'error' : 'warning',
          'api_error',
          `HTTP ${response.status}: ${response.statusText}`,
          {
            source: 'fetch_interceptor',
            affectedUrl: url,
            metadata: {
              status: response.status,
              statusText: response.statusText,
              method: (args[1] as RequestInit)?.method || 'GET',
            },
          }
        );
      }
      
      return response;
    } catch (err) {
      const url = typeof args[0] === 'string' ? args[0] : args[0].toString();
      sendSystemLog('error', 'network_error', (err as Error).message, {
        source: 'fetch_interceptor',
        affectedUrl: url,
        stackTrace: (err as Error).stack,
      });
      throw err;
    }
  };

  // Capturar erros do console
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError.apply(console, args);
    
    // Filtrar logs do próprio sistema para evitar loop
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    if (!message.includes('[SystemLog]')) {
      sendSystemLog('error', 'console_error', message.slice(0, 1000), {
        source: 'console_interceptor',
        affectedUrl: window.location.pathname,
      });
    }
  };

  console.log('[SystemLog] ✅ Global error capture initialized');
}

// Hook para visualização de logs
export function useSystemLogs(limit: number = 100): UseSystemLogsReturn {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { user } = useAuth();

  // Calcular estatísticas
  const stats = {
    total: logs.length,
    info: logs.filter(l => l.severity === 'info').length,
    warning: logs.filter(l => l.severity === 'warning').length,
    error: logs.filter(l => l.severity === 'error').length,
    critical: logs.filter(l => l.severity === 'critical').length,
  };

  // Buscar logs iniciais
  const fetchLogs = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('system_realtime_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setLogs((data as SystemLog[]) || []);
    } catch (err) {
      setError((err as Error).message);
      console.error('[useSystemLogs] Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  // Limpar logs do estado (não do banco)
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Configurar realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchLogs();

    // Subscrever para updates em tempo real
    channelRef.current = supabase
      .channel('system-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_realtime_logs',
        },
        (payload) => {
          const newLog = payload.new as SystemLog;
          setLogs(prev => [newLog, ...prev.slice(0, limit - 1)]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, limit, fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    stats,
    refetch: fetchLogs,
    clearLogs,
  };
}

// Exportar helpers para uso em outros lugares
export const logInfo = (message: string, category = 'general', metadata?: Record<string, unknown>) => 
  sendSystemLog('info', category, message, { metadata });

export const logWarning = (message: string, category = 'general', metadata?: Record<string, unknown>) => 
  sendSystemLog('warning', category, message, { metadata });

export const logError = (message: string, category = 'general', metadata?: Record<string, unknown>) => 
  sendSystemLog('error', category, message, { metadata });

export const logCritical = (message: string, category = 'general', metadata?: Record<string, unknown>) => 
  sendSystemLog('critical', category, message, { metadata });
