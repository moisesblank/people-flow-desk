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
  
  // Query para buscar logs recentes (últimos 10 para preview)
  const { data: recentLogs = [], isLoading } = useQuery({
    queryKey: ['global-logs-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_realtime_logs')
        .select('id, timestamp, severity, error_message, stack_trace, metadata')
        .order('timestamp', { ascending: false })
        .limit(10);
      
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
              {/* Header fixo */}
              <div className="flex-shrink-0 border-b border-red-500/20 p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <ScrollText className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-2xl font-bold truncate">🔴 Sistema de Logs - TELA CHEIA</h2>
                    <p className="text-xs md:text-sm text-white/50">Todos os registros em tempo real • Atualização a cada 10s</p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                      <motion.div
                        className="h-2.5 w-2.5 bg-green-400 rounded-full"
                        animate={{ opacity: [1, 0.5, 1], scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                      <span className="text-sm text-green-400 font-semibold">LIVE</span>
                    </div>
                    <span className="text-white/40 text-xs md:text-sm">{recentLogs.length} logs</span>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 md:p-3 rounded-lg hover:bg-white/10 transition-colors bg-red-500/20 border border-red-500/30"
                    >
                      <X className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Lista de Logs - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <motion.div
                      className="h-12 w-12 border-4 border-red-500/30 border-t-red-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    />
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="text-center py-20 text-white/50">
                    <ScrollText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Nenhum log registrado</p>
                  </div>
                ) : (
                  recentLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 md:p-6 rounded-2xl border-2 ${getSeverityColor(log.severity)} bg-black/30 backdrop-blur`}
                    >
                      {/* Header do Log */}
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 pb-3 border-b border-white/10">
                        <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase ${getSeverityColor(log.severity)}`}>
                          {log.severity || 'LOG'}
                        </span>
                        <span className="text-white/60 text-xs md:text-sm font-mono">
                          🕐 {format(new Date(log.timestamp), "HH:mm:ss")} • 📅 {format(new Date(log.timestamp), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="ml-auto text-xs text-white/30 font-mono">ID: {log.id.slice(0, 8)}...</span>
                      </div>
                      
                      {/* Mensagem Completa - SEM TRUNCAR */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">📝 Mensagem de Erro</label>
                          <pre className="text-xs md:text-sm text-white/90 font-mono bg-black/40 p-3 md:p-4 rounded-xl whitespace-pre-wrap break-all border border-white/5">
                            {log.error_message || 'Sem mensagem'}
                          </pre>
                        </div>
                        
                        {/* Stack Trace Completo */}
                        {log.stack_trace && (
                          <div>
                            <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">🔍 Stack Trace (Completo)</label>
                            <pre className="text-xs text-red-300/80 font-mono bg-red-950/30 p-3 md:p-4 rounded-xl whitespace-pre-wrap break-all border border-red-500/10">
                              {log.stack_trace}
                            </pre>
                          </div>
                        )}
                        
                        {/* Metadata Completo */}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div>
                            <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">📊 Metadata (Completo)</label>
                            <pre className="text-xs text-blue-300/80 font-mono bg-blue-950/30 p-3 md:p-4 rounded-xl whitespace-pre-wrap break-all border border-blue-500/10">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              {/* Footer fixo */}
              <div className="flex-shrink-0 border-t border-red-500/20 p-4 md:p-6 bg-slate-950/90 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs md:text-sm text-white/40 text-center md:text-left">
                  ⚠️ Logs são aniquilados automaticamente a cada 48h
                </p>
                <motion.button
                  onClick={() => {
                    setIsModalOpen(false);
                    handleOpenLogs();
                  }}
                  className="w-full md:w-auto px-6 md:px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-sm md:text-base transition-all shadow-lg shadow-red-500/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🔍 Ver Página Completa de Logs →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default GlobalLogsButton;
