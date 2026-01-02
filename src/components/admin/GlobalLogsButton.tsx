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
  
  // Se estiver na página de logs, não mostrar o botão flutuante
  const isOnLogsPage = location.pathname === '/gestaofc/logs';
  
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
      {/* Floating Button - Posicionado à esquerda do TRAMON */}
      <AnimatePresence>
        {!isOnLogsPage && (
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
      
      {/* Modal FULLSCREEN de Logs */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="fixed inset-0 w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-0 text-white flex flex-col"
          aria-describedby="logs-description"
        >
          {/* Header fixo */}
          <DialogHeader className="flex-shrink-0 border-b border-red-500/20 p-6">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <ScrollText className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">🔴 Sistema de Logs - FULLSCREEN</h2>
                <p id="logs-description" className="text-sm text-white/50">Todos os registros em tempo real • Atualização a cada 10s</p>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                  <motion.div
                    className="h-2.5 w-2.5 bg-green-400 rounded-full"
                    animate={{ opacity: [1, 0.5, 1], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  <span className="text-sm text-green-400 font-semibold">LIVE</span>
                </div>
                <span className="text-white/40 text-sm">{recentLogs.length} logs</span>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Lista de Logs - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  className="h-12 w-12 border-3 border-red-500/30 border-t-red-500 rounded-full"
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
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 rounded-2xl border-2 ${getSeverityColor(log.severity)} bg-black/30 backdrop-blur`}
                >
                  {/* Header do Log */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase ${getSeverityColor(log.severity)}`}>
                      {log.severity || 'LOG'}
                    </span>
                    <span className="text-white/60 text-sm font-mono">
                      🕐 {format(new Date(log.timestamp), "HH:mm:ss")} • 📅 {format(new Date(log.timestamp), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="ml-auto text-xs text-white/30 font-mono">ID: {log.id.slice(0, 8)}...</span>
                  </div>
                  
                  {/* Mensagem Completa */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Mensagem de Erro</label>
                      <pre className="text-sm text-white/90 font-mono bg-black/40 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap break-words border border-white/5">
                        {log.error_message || 'Sem mensagem'}
                      </pre>
                    </div>
                    
                    {/* Stack Trace se existir */}
                    {log.stack_trace && (
                      <div>
                        <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Stack Trace</label>
                        <pre className="text-xs text-red-300/80 font-mono bg-red-950/30 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap break-words border border-red-500/10 max-h-60 overflow-y-auto">
                          {log.stack_trace}
                        </pre>
                      </div>
                    )}
                    
                    {/* Metadata se existir */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div>
                        <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Metadata</label>
                        <pre className="text-xs text-blue-300/80 font-mono bg-blue-950/30 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap break-words border border-blue-500/10">
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
          <div className="flex-shrink-0 border-t border-red-500/20 p-6 bg-black/50 flex justify-between items-center">
            <p className="text-sm text-white/40">
              ⚠️ Logs são aniquilados automaticamente a cada 48h
            </p>
            <motion.button
              onClick={handleOpenLogs}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-base transition-all shadow-lg shadow-red-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🔍 Ver Página Completa de Logs →
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default GlobalLogsButton;
