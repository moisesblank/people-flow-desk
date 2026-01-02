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
      
      {/* Modal de Preview dos Logs */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-red-500/20 text-white overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <ScrollText className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Sistema de Logs</h2>
                <p className="text-sm text-white/50">Últimos 10 registros em tempo real</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <motion.div
                  className="h-2 w-2 bg-green-400 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <span className="text-xs text-green-400">LIVE</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  className="h-8 w-8 border-2 border-red-500/30 border-t-red-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                />
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum log registrado</p>
              </div>
            ) : (
              recentLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-xl border ${getSeverityColor(log.severity)} bg-white/5`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getSeverityColor(log.severity)}>
                          {log.severity?.toUpperCase() || 'LOG'}
                        </Badge>
                        <span className="text-xs text-white/40">
                          {format(new Date(log.timestamp), "HH:mm:ss - dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 font-mono truncate">
                        {log.error_message || 'Sem mensagem'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          <div className="border-t border-white/10 pt-4 flex justify-between items-center">
            <p className="text-xs text-white/40">
              Logs são limpos automaticamente a cada 48h
            </p>
            <motion.button
              onClick={handleOpenLogs}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium text-sm transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Ver Todos os Logs →
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default GlobalLogsButton;
