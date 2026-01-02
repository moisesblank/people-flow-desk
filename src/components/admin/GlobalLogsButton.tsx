// ============================================
// 🔴 GLOBAL LOGS BUTTON - Owner Only
// Botão flutuante para acesso rápido aos logs
// Visível em TODA a plataforma para o Owner
// ============================================

import { useState, memo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const OWNER_EMAIL = 'moisesblank@gmail.com';

// Interface para os logs
interface LogEntry {
  id: string;
  timestamp: string;
  severity: string;
  error_message: string;
  stack_trace?: string | null;
  metadata?: Record<string, unknown> | null;
}

export const GlobalLogsButton = memo(function GlobalLogsButton() {
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 🎯 OWNER-ONLY: Verificar se é o proprietário
  const isOwner = role === 'owner' || user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  
  // Não exibir se não for owner ou se estiver na página de logs
  if (!isOwner) return null;
  
  // REMOVIDO: Condição que escondia o botão na página de logs
  // O botão SEMPRE aparece para o Owner abrir o modal
  
  // Query para buscar logs recentes (últimos 50 para preview compacto)
  const { data: recentLogs = [], isLoading } = useQuery({
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
    refetchInterval: 10000, // Atualiza a cada 10s
  });
  
  // Contar logs de erro nas últimas 24h
  const errorCount = recentLogs.filter(log => log.severity === 'error').length;
  
  const handleOpenLogs = useCallback(() => {
    navigate('/gestaofc/logs');
  }, [navigate]);
  
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warn': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  return (
    <>
      {/* Floating Button - SEMPRE visível para o Owner */}
      <AnimatePresence>
        {true && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-8 z-[99]"
            style={{ left: 'calc(50% - 100px)' }} // À esquerda do TRAMON
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
              {/* Pulse effect quando há erros */}
              {errorCount > 0 && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-red-500/20"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-red-500/20 via-transparent to-transparent"
                animate={{ y: ['100%', '-100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
              
              <ScrollText className="h-6 w-6 text-red-400 relative z-10 group-hover:scale-110 transition-transform" />
              
              {/* Badge de contagem de erros */}
              {errorCount > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <span className="text-[10px] font-bold text-white">{errorCount > 9 ? '9+' : errorCount}</span>
                </motion.div>
              )}
              
              {/* Live indicator */}
              <motion.div
                className="absolute bottom-1 right-1 h-2 w-2 bg-green-400 rounded-full"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            </motion.button>
            
            {/* Label */}
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
        )}
      </AnimatePresence>
      
      {/* Modal FULLSCREEN de Logs - Portal separado para evitar problemas de posicionamento */}
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
              {/* Header fixo - COMPACTO */}
              <div className="flex-shrink-0 border-b border-red-500/20 px-3 py-2 bg-slate-950/80 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-bold text-white">LOGS</span>
                    <span className="text-[10px] text-white/40">tempo real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30">
                      <motion.div
                        className="h-1.5 w-1.5 bg-green-400 rounded-full"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                      <span className="text-[10px] text-green-400 font-bold">LIVE</span>
                    </div>
                    <span className="text-white/30 text-[10px]">{recentLogs.length}</span>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Lista de Logs - Scrollable - FORMATO TXT COMPACTO */}
              <div className="flex-1 overflow-y-auto p-2 md:p-3 font-mono text-[10px] leading-tight bg-black/60">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <span className="text-white/50">Carregando...</span>
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="text-center py-10 text-white/40">
                    [VAZIO] Nenhum log registrado
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentLogs.map((log) => {
                      // Converter UTC para horário de Brasília (GMT-3)
                      const utcDate = new Date(log.timestamp);
                      const brasiliaDate = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
                      const time = format(brasiliaDate, "HH:mm:ss");
                      const date = format(brasiliaDate, "dd/MM");
                      const sev = (log.severity || 'log').toUpperCase().padEnd(5);
                      const sevColor = log.severity === 'error' ? 'text-red-400' : log.severity === 'warn' ? 'text-yellow-400' : 'text-blue-400';
                      
                      return (
                        <div key={log.id} className="border-b border-white/5 pb-1 mb-1">
                          {/* Linha principal */}
                          <div className="flex gap-2 text-white/80">
                            <span className="text-white/40">[{time}]</span>
                            <span className="text-white/30">{date}</span>
                            <span className={`font-bold ${sevColor}`}>{sev}</span>
                            <span className="text-white/50">#{log.id.slice(0, 6)}</span>
                          </div>
                          
                          {/* Mensagem */}
                          <pre className="text-white/90 whitespace-pre-wrap break-all ml-2 mt-0.5">
                            {log.error_message || '-'}
                          </pre>
                          
                          {/* Stack (colapsado) */}
                          {log.stack_trace && (
                            <pre className="text-red-400/70 whitespace-pre-wrap break-all ml-2 mt-0.5 pl-2 border-l border-red-500/20">
                              {log.stack_trace}
                            </pre>
                          )}
                          
                          {/* Metadata inline */}
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
              
              {/* Footer fixo - COMPACTO */}
              <div className="flex-shrink-0 border-t border-red-500/20 px-3 py-2 bg-slate-950/90 flex justify-between items-center">
                <span className="text-[9px] text-white/30">auto-delete 48h</span>
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
