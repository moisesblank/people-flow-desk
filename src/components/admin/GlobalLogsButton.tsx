// ============================================
// 🔴 GLOBAL LOGS BUTTON - Owner Only
// Botão flutuante para acesso rápido aos logs
// Visível em TODA a plataforma para o Owner
// DUAS COLUNAS: Sistema + Console do Navegador
// ============================================

import { useState, memo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { ScrollText, X, Monitor, Server, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * @deprecated P1-2: OWNER_EMAIL mantido apenas como fallback.
 * Verificação primária é via role === 'owner'.
 */
const OWNER_EMAIL = 'moisesblank@gmail.com';

// Interface para os logs do sistema
interface LogEntry {
  id: string;
  timestamp: string;
  severity: string;
  error_message: string;
  stack_trace?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Interface para logs do console do navegador
interface BrowserLog {
  id: string;
  timestamp: Date;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  stack?: string;
}

// Hook para capturar logs do console do navegador
// 🛡️ SYNAPSE Ω: Captura ATIVA mas com guardas anti-cascata
function useBrowserConsoleLogs(enabled: boolean) {
  const [logs, setLogs] = useState<BrowserLog[]>([]);
  const logsRef = useRef<BrowserLog[]>([]);
  const interceptedRef = useRef(false);
  const scheduledRef = useRef<number | null>(null);
  const originalConsoleRef = useRef<{
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  } | null>(null);

  const flush = useCallback(() => {
    if (scheduledRef.current) {
      cancelAnimationFrame(scheduledRef.current);
      scheduledRef.current = null;
    }
    setLogs([...logsRef.current]);
  }, []);

  const scheduleFlush = useCallback(() => {
    if (scheduledRef.current) return;
    scheduledRef.current = requestAnimationFrame(flush);
  }, [flush]);

  const pushLog = useCallback((type: BrowserLog['type'], args: unknown[]) => {
    try {
      const message = args
        .map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
        .join(' ');
      
      // 🛡️ Ignorar logs do próprio sistema de logs para evitar loop
      // + ruído conhecido que pode gerar spam e travar UI do Owner
      const ignorePatterns = [
        '[Logger]',
        '[System-Log]',
        'X-System-Log',
        'log-writer',
        '[PERF-',
        '[ReactiveStore]',
        '[SessionGuard]',
        // React/Radix warnings ruidosos (podem disparar em loop durante render)
        'forwardRef',
        'Function components cannot be given refs',
        'Check the render method of `DialogContent`',
      ];
      if (ignorePatterns.some(p => message.includes(p))) return;

      const newLog: BrowserLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type,
        message,
        stack: type === 'error' ? new Error().stack : undefined,
      };
      logsRef.current = [newLog, ...logsRef.current].slice(0, 100);
      scheduleFlush();
    } catch {
      // silencioso - nunca quebrar
    }
  }, [scheduleFlush]);

  useEffect(() => {
    if (!enabled || interceptedRef.current) return;

    // Salvar originais ANTES de interceptar
    originalConsoleRef.current = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };

    const orig = originalConsoleRef.current;
    interceptedRef.current = true;

    // 🛡️ SYNAPSE Ω: Interceptar com segurança (chama original + captura)
    console.log = (...args: unknown[]) => {
      orig.log(...args);
      pushLog('log', args);
    };
    console.info = (...args: unknown[]) => {
      orig.info(...args);
      pushLog('info', args);
    };
    console.warn = (...args: unknown[]) => {
      orig.warn(...args);
      pushLog('warn', args);
    };
    console.error = (...args: unknown[]) => {
      orig.error(...args);
      pushLog('error', args);
    };

    // Capturar erros não tratados também
    const handleError = (event: ErrorEvent) => {
      pushLog('error', [`[UNCAUGHT] ${event.message}`]);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      pushLog('error', [`[PROMISE REJECTED] ${String(event.reason)}`]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      // Restaurar originais
      if (originalConsoleRef.current) {
        console.log = originalConsoleRef.current.log;
        console.info = originalConsoleRef.current.info;
        console.warn = originalConsoleRef.current.warn;
        console.error = originalConsoleRef.current.error;
      }
      interceptedRef.current = false;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      if (scheduledRef.current) {
        cancelAnimationFrame(scheduledRef.current);
        scheduledRef.current = null;
      }
    };
  }, [enabled, pushLog]);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setLogs([]);
  }, []);

  return { logs, clearLogs };
}

export const GlobalLogsButton = memo(function GlobalLogsButton() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  
  // 🎯 OWNER-ONLY: Verificar se é o proprietário
  const isOwner = role === 'owner' || user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  // 🛡️ P0 anti-tela-preta: nunca deixar overlay preso em troca de rota
  useEffect(() => {
    setIsModalOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // 🛡️ ESC fecha o overlay sempre
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isModalOpen]);

  // 🛡️ P0 anti-tela-preta (hard): clique FORA do conteúdo fecha (capture)
  useEffect(() => {
    if (!isModalOpen) return;

    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const contentEl = modalContentRef.current;
      if (contentEl && contentEl.contains(target)) return;

      setIsModalOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => window.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, [isModalOpen]);
  // Hook para capturar logs do console (sempre ativo para o owner)
  const { logs: browserLogs, clearLogs: clearBrowserLogs } = useBrowserConsoleLogs(isOwner);
  
  // ✅ TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER RETURN CONDICIONAL
  // Query para buscar logs do sistema (últimos 50)
  const { data: systemLogs = [], isLoading } = useQuery({
    queryKey: ['global-logs-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_realtime_logs')
        .select('id, timestamp, severity, error_message, stack_trace, metadata')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as LogEntry[];
    },
    enabled: isOwner,
    // 🚀 PATCH 5K: Aumentado de 10s para 30s (owner-only, baixo impacto mas boa prática)
    staleTime: 15000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });
  
  // Contar erros e detectar emergências
  const systemErrorCount = systemLogs.filter(log => log.severity === 'error').length;
  const criticalCount = systemLogs.filter(log => ['critical', 'emergency'].includes(log.severity)).length;
  const browserErrorCount = browserLogs.filter(log => log.type === 'error').length;
  const totalErrors = systemErrorCount + browserErrorCount + criticalCount;
  const hasEmergency = criticalCount > 0;
  
  const handleOpenLogs = useCallback(() => {
    navigate('/gestaofc/logs');
  }, [navigate]);
  
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);
  
  const getSystemSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'text-red-600 font-black animate-pulse';
      case 'critical': return 'text-red-500 font-bold';
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };
  
  const getBrowserTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-cyan-400';
      default: return 'text-green-400';
    }
  };
  
  // ✅ RETORNO CONDICIONAL APÓS TODOS OS HOOKS
  // Não exibir se não for owner
  if (!isOwner) return null;
  
  // Garantia: renderizar fora de qualquer stacking context transformado
  // (fixed + z-index máximo + portal para document.body)
  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <>
      {/* Floating Button - CSS-only, no framer-motion */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2147483647] pointer-events-none animate-in fade-in zoom-in duration-300"
        data-sovereign="true"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleOpenModal();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`relative h-14 w-14 rounded-2xl flex items-center justify-center group overflow-hidden border-2 pointer-events-auto cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
            hasEmergency
              ? 'border-red-600 shadow-[0_0_30px_rgba(255,0,0,0.8),0_0_60px_rgba(255,0,0,0.5)] animate-pulse'
              : 'border-red-400/60'
          }`}
          style={{
            background: hasEmergency
              ? 'linear-gradient(135deg, #3d0000 0%, #1a0000 50%, #0a0000 100%)'
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: hasEmergency
              ? '0 8px 32px rgba(255, 0, 0, 0.6), 0 0 40px rgba(255, 0, 0, 0.4), inset 0 1px 0 rgba(255, 100, 100, 0.3)'
              : '0 8px 32px rgba(239, 68, 68, 0.3), 0 0 20px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
          aria-label="Abrir logs"
          data-fn="global-logs-button"
        >
          {/* ALARME CRÍTICO - Pulsação CSS */}
          {hasEmergency && (
            <div className="absolute inset-0 rounded-2xl bg-red-600/50 animate-pulse" />
          )}

          {/* Erros normais - Pulsação suave */}
          {totalErrors > 0 && !hasEmergency && (
            <div className="absolute inset-0 rounded-2xl bg-red-500/20 animate-pulse" />
          )}

          <ScrollText className="h-6 w-6 text-red-400 relative z-10 group-hover:scale-110 transition-transform" />

          {totalErrors > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-in zoom-in">
              <span className="text-[10px] font-bold text-white">{totalErrors > 9 ? '9+' : totalErrors}</span>
            </div>
          )}

          <div className="absolute bottom-1 right-1 h-2 w-2 bg-green-400 rounded-full animate-pulse" />
        </button>

        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shadow-lg border border-red-500/30 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          🔴 LOGS
        </span>
      </div>

      {/* Modal FULLSCREEN - CSS-only */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[2147483647] flex flex-col animate-in fade-in duration-200"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div
            ref={modalContentRef}
            data-logs-modal-content="true"
            className="relative flex flex-col w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-red-500/20 px-3 py-2 bg-slate-950/80 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <ScrollText className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-bold text-white">LOGS UNIFICADOS</span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30">
                    <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-400 font-bold">LIVE</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* DUAS COLUNAS */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
              {/* COLUNA 1: LOGS DO SISTEMA (Edge Functions) */}
              <div className="flex flex-col border-r border-white/10 overflow-hidden">
                {/* Header da coluna */}
                <div className="flex-shrink-0 px-3 py-2 bg-blue-950/50 border-b border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-300">SISTEMA (Edge Functions)</span>
                  </div>
                  <span className="text-[10px] text-white/40 bg-blue-500/20 px-2 py-0.5 rounded">
                    {systemLogs.length}
                  </span>
                </div>

                {/* Logs do sistema */}
                <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] leading-tight bg-black/40">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <span className="text-white/50">Carregando...</span>
                    </div>
                  ) : systemLogs.length === 0 ? (
                    <div className="text-center py-10 text-white/40">[VAZIO] Nenhum log do sistema</div>
                  ) : (
                    <div className="space-y-1">
                      {systemLogs.map((log) => {
                        const utcDate = new Date(log.timestamp);
                        const brasiliaDate = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000);
                        const time = format(brasiliaDate, 'HH:mm:ss');
                        const date = format(brasiliaDate, 'dd/MM');
                        const sev = (log.severity || 'log').toUpperCase().padEnd(5);
                        const sevColor = getSystemSeverityColor(log.severity);

                        return (
                          <div key={log.id} className="border-b border-white/5 pb-1 mb-1">
                            <div className="flex gap-2 text-white/80">
                              <span className="text-white/40">[{time}]</span>
                              <span className="text-white/30">{date}</span>
                              <span className={`font-bold ${sevColor}`}>{sev}</span>
                            </div>
                            <pre className="text-white/90 whitespace-pre-wrap break-all ml-2 mt-0.5">{log.error_message || '-'}</pre>
                            {log.stack_trace && (
                              <pre className="text-red-400/70 whitespace-pre-wrap break-all ml-2 mt-0.5 pl-2 border-l border-red-500/20">
                                {log.stack_trace}
                              </pre>
                            )}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <pre className="text-cyan-400/60 whitespace-pre-wrap break-all ml-2 mt-0.5">
                                META: {JSON.stringify(log.metadata)}
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* COLUNA 2: LOGS DO CONSOLE DO BROWSER */}
              <div className="flex flex-col overflow-hidden">
                {/* Header da coluna */}
                <div className="flex-shrink-0 px-3 py-2 bg-purple-950/50 border-b border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-purple-300" />
                    <span className="text-xs font-bold text-purple-200">CONSOLE (Browser)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 bg-purple-500/20 px-2 py-0.5 rounded">
                      {browserLogs.length}
                    </span>
                    <button
                      onClick={clearBrowserLogs}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70"
                      title="Limpar console capturado"
                    >
                      <Trash2 className="h-3 w-3" />
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Logs do console */}
                <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] leading-tight bg-black/30">
                  {browserLogs.length === 0 ? (
                    <div className="text-center py-10 text-white/40">[VAZIO] Nenhum log capturado</div>
                  ) : (
                    <div className="space-y-1">
                      {browserLogs.map((log) => {
                        const time = format(log.timestamp, 'HH:mm:ss');
                        const type = log.type.toUpperCase().padEnd(5);
                        const typeColor = getBrowserTypeColor(log.type);

                        return (
                          <div key={log.id} className="border-b border-white/5 pb-1 mb-1">
                            <div className="flex gap-2 text-white/80">
                              <span className="text-white/40">[{time}]</span>
                              <span className={`font-bold ${typeColor}`}>{type}</span>
                            </div>
                            <pre className="text-white/90 whitespace-pre-wrap break-all ml-2 mt-0.5">{log.message}</pre>
                            {log.stack && (
                              <pre className="text-white/40 whitespace-pre-wrap break-all ml-2 mt-0.5 pl-2 border-l border-white/10">
                                {log.stack}
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-white/10 px-3 py-2 bg-slate-950/80 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] text-white/50 flex items-center gap-3">
                  <span>Sistema: últimos 50</span>
                  <span>Console: sessão atual</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold transition-all"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      handleOpenLogs();
                    }}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-all"
                  >
                    Ver Todos →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    portalTarget
  );
});
