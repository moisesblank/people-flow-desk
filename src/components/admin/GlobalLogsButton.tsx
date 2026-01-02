// ============================================
// 🔴 GLOBAL LOGS BUTTON - Owner Only
// Botão flutuante para acesso rápido aos logs
// Visível em TODA a plataforma para o Owner
// DUAS COLUNAS: Sistema + Console do Navegador
// ============================================

import { useState, memo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, X, Monitor, Server, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
function useBrowserConsoleLogs(enabled: boolean) {
  const [logs, setLogs] = useState<BrowserLog[]>([]);
  const logsRef = useRef<BrowserLog[]>([]);
  const interceptedRef = useRef(false);
  
  useEffect(() => {
    if (!enabled || interceptedRef.current) return;
    
    interceptedRef.current = true;
    
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
    
    const createInterceptor = (type: 'log' | 'info' | 'warn' | 'error') => {
      return (...args: unknown[]) => {
        // Chamar o original
        originalConsole[type](...args);
        
        // Adicionar ao nosso log (evitar logs do próprio sistema de captura)
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
        
        // Ignorar logs internos do sistema de captura
        if (message.includes('[BrowserLogs]')) return;
        
        const newLog: BrowserLog = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type,
          message,
          stack: type === 'error' ? new Error().stack : undefined,
        };
        
        // Manter apenas os últimos 100 logs
        logsRef.current = [newLog, ...logsRef.current].slice(0, 100);
        setLogs([...logsRef.current]);
      };
    };
    
    // Interceptar todos os métodos
    console.log = createInterceptor('log');
    console.info = createInterceptor('info');
    console.warn = createInterceptor('warn');
    console.error = createInterceptor('error');
    
    // Capturar erros não tratados
    const handleError = (event: ErrorEvent) => {
      const newLog: BrowserLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'error',
        message: `[UNCAUGHT] ${event.message}`,
        stack: event.error?.stack,
      };
      logsRef.current = [newLog, ...logsRef.current].slice(0, 100);
      setLogs([...logsRef.current]);
    };
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      const newLog: BrowserLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'error',
        message: `[PROMISE REJECTED] ${event.reason}`,
        stack: event.reason?.stack,
      };
      logsRef.current = [newLog, ...logsRef.current].slice(0, 100);
      setLogs([...logsRef.current]);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      interceptedRef.current = false;
    };
  }, [enabled]);
  
  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setLogs([]);
  }, []);
  
  return { logs, clearLogs };
}

export const GlobalLogsButton = memo(function GlobalLogsButton() {
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 🎯 OWNER-ONLY: Verificar se é o proprietário
  const isOwner = role === 'owner' || user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  
  // Hook para capturar logs do console (sempre ativo para o owner)
  const { logs: browserLogs, clearLogs: clearBrowserLogs } = useBrowserConsoleLogs(isOwner);
  
  // Não exibir se não for owner
  if (!isOwner) return null;
  
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
    staleTime: 5000,
    refetchInterval: 10000,
  });
  
  // Contar erros
  const systemErrorCount = systemLogs.filter(log => log.severity === 'error').length;
  const browserErrorCount = browserLogs.filter(log => log.type === 'error').length;
  const totalErrors = systemErrorCount + browserErrorCount;
  
  const handleOpenLogs = useCallback(() => {
    navigate('/gestaofc/logs');
  }, [navigate]);
  
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);
  
  const getSystemSeverityColor = (severity: string) => {
    switch (severity) {
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
  
  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-8 z-[99]"
          style={{ left: 'calc(50% - 100px)' }}
        >
          <motion.button
            onClick={handleOpenModal}
            className="relative h-14 w-14 rounded-2xl flex items-center justify-center group overflow-hidden border-2 border-red-400/60"
            style={{ 
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3), 0 0 20px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {totalErrors > 0 && (
              <motion.div
                className="absolute inset-0 rounded-2xl bg-red-500/20"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-red-500/20 via-transparent to-transparent"
              animate={{ y: ['100%', '-100%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
            
            <ScrollText className="h-6 w-6 text-red-400 relative z-10 group-hover:scale-110 transition-transform" />
            
            {totalErrors > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="text-[10px] font-bold text-white">{totalErrors > 9 ? '9+' : totalErrors}</span>
              </motion.div>
            )}
            
            <motion.div
              className="absolute bottom-1 right-1 h-2 w-2 bg-green-400 rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </motion.button>
          
          <motion.span 
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shadow-lg border border-red-500/30"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            🔴 LOGS
          </motion.span>
        </motion.div>
      </AnimatePresence>
      
      {/* Modal FULLSCREEN com DUAS COLUNAS */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative flex flex-col w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden"
            >
              {/* Header */}
              <div className="flex-shrink-0 border-b border-red-500/20 px-3 py-2 bg-slate-950/80 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <ScrollText className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-bold text-white">LOGS UNIFICADOS</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30">
                      <motion.div
                        className="h-1.5 w-1.5 bg-green-400 rounded-full"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
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
                
                {/* COLUNA 1: LOGS DO SISTEMA (Supabase) */}
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
                      <div className="text-center py-10 text-white/40">
                        [VAZIO] Nenhum log do sistema
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {systemLogs.map((log) => {
                          const utcDate = new Date(log.timestamp);
                          const brasiliaDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
                          const time = format(brasiliaDate, "HH:mm:ss");
                          const date = format(brasiliaDate, "dd/MM");
                          const sev = (log.severity || 'log').toUpperCase().padEnd(5);
                          const sevColor = getSystemSeverityColor(log.severity);
                          
                          return (
                            <div key={log.id} className="border-b border-white/5 pb-1 mb-1">
                              <div className="flex gap-2 text-white/80">
                                <span className="text-white/40">[{time}]</span>
                                <span className="text-white/30">{date}</span>
                                <span className={`font-bold ${sevColor}`}>{sev}</span>
                              </div>
                              <pre className="text-white/90 whitespace-pre-wrap break-all ml-2 mt-0.5">
                                {log.error_message || '-'}
                              </pre>
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
                
                {/* COLUNA 2: LOGS DO CONSOLE DO NAVEGADOR */}
                <div className="flex flex-col overflow-hidden">
                  {/* Header da coluna */}
                  <div className="flex-shrink-0 px-3 py-2 bg-purple-950/50 border-b border-purple-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-bold text-purple-300">CONSOLE (F12)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40 bg-purple-500/20 px-2 py-0.5 rounded">
                        {browserLogs.length}
                      </span>
                      <button
                        onClick={clearBrowserLogs}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Limpar logs do console"
                      >
                        <Trash2 className="h-3 w-3 text-purple-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Logs do console */}
                  <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] leading-tight bg-black/40">
                    {browserLogs.length === 0 ? (
                      <div className="text-center py-10 text-white/40">
                        [VAZIO] Nenhum log capturado do console
                        <div className="text-[9px] mt-1 text-white/30">
                          Os logs aparecerão aqui em tempo real
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {browserLogs.map((log) => {
                          const time = format(log.timestamp, "HH:mm:ss");
                          const typeLabel = log.type.toUpperCase().padEnd(5);
                          const typeColor = getBrowserTypeColor(log.type);
                          
                          return (
                            <div key={log.id} className="border-b border-white/5 pb-1 mb-1">
                              <div className="flex gap-2 text-white/80">
                                <span className="text-white/40">[{time}]</span>
                                <span className={`font-bold ${typeColor}`}>{typeLabel}</span>
                              </div>
                              <pre className="text-white/90 whitespace-pre-wrap break-all ml-2 mt-0.5 max-h-32 overflow-y-auto">
                                {log.message}
                              </pre>
                              {log.stack && (
                                <pre className="text-red-400/70 whitespace-pre-wrap break-all ml-2 mt-0.5 pl-2 border-l border-red-500/20 text-[9px] max-h-20 overflow-y-auto">
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
              <div className="flex-shrink-0 border-t border-red-500/20 px-3 py-2 bg-slate-950/90 flex justify-between items-center">
                <div className="flex items-center gap-4 text-[9px] text-white/30">
                  <span>Sistema: auto-delete 48h</span>
                  <span>Console: sessão atual</span>
                </div>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default GlobalLogsButton;
