// ============================================
// 🛡️ SESSÃO REVOGADA — OVERLAY VISUAL v2.0
// Com botão "Tentar novamente" para recovery gracioso
// ============================================

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, LogOut, Shield, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionRevokedOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onRetry?: () => Promise<boolean>; // Retorna true se recovery bem-sucedido
  reason?: string; // Motivo da revogação para exibir ao usuário
}

export function SessionRevokedOverlay({ 
  isVisible, 
  onClose, 
  onRetry,
  reason 
}: SessionRevokedOverlayProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryError, setRetryError] = useState<string | null>(null);

  const MAX_RETRIES = 1; // Limite de tentativas

  const handleRetry = useCallback(async () => {
    if (!onRetry || retryCount >= MAX_RETRIES) return;

    setIsRetrying(true);
    setRetryError(null);

    try {
      const success = await onRetry();
      if (success) {
        // Recovery bem-sucedido - overlay será fechado pelo parent
        return;
      }
      setRetryError("Sessão realmente revogada. Faça login novamente.");
    } catch {
      setRetryError("Erro ao verificar. Faça login novamente.");
    } finally {
      setIsRetrying(false);
      setRetryCount(prev => prev + 1);
    }
  }, [onRetry, retryCount]);

  const canRetry = onRetry && retryCount < MAX_RETRIES;

  // Mensagem baseada no motivo
  const getReasonMessage = () => {
    if (reason === 'admin_revoke' || reason === 'security_threat') {
      return "Sua sessão foi encerrada por um administrador.";
    }
    if (reason === 'device_replaced') {
      return "Você conectou em outro dispositivo.";
    }
    return "Sua sessão foi encerrada por motivos de segurança.";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, type: "spring", damping: 25 }}
            className="relative mx-4 max-w-md w-full"
          >
            {/* Card principal */}
            <div className="bg-gradient-to-b from-card to-card/95 border border-destructive/30 rounded-2xl p-8 shadow-2xl shadow-destructive/20">
              {/* Ícone animado */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-gradient-to-br from-destructive/20 to-destructive/10 p-5 rounded-full border border-destructive/30">
                    <Smartphone className="w-10 h-10 text-destructive" />
                  </div>
                  {/* Badge de alerta */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <Shield className="w-4 h-4" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Título */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-center text-foreground mb-3"
              >
                Sessão Encerrada
              </motion.h2>

              {/* Descrição */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-center mb-6 leading-relaxed"
              >
                {getReasonMessage()}{" "}
                <span className="text-foreground font-medium">
                  Por segurança, permitimos apenas uma sessão ativa por vez.
                </span>
              </motion.p>

              {/* Erro de retry */}
              {retryError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 text-center"
                >
                  <p className="text-sm text-destructive">{retryError}</p>
                </motion.div>
              )}

              {/* Info box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-muted/50 border border-border rounded-lg p-4 mb-6"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Proteção ativa</p>
                    <p>Caso não tenha sido você, altere sua senha imediatamente.</p>
                  </div>
                </div>
              </motion.div>

              {/* Botões */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                {/* Botão de retry (se disponível) */}
                {canRetry && (
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    variant="outline"
                    className="w-full h-12 text-base font-semibold border-primary/50 hover:bg-primary/10"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Tentar novamente
                      </>
                    )}
                  </Button>
                )}

                {/* Botão principal */}
                <Button
                  onClick={onClose}
                  disabled={isRetrying}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Ir para login
                </Button>
              </motion.div>
            </div>

            {/* Decoração de fundo */}
            <div className="absolute -z-10 inset-0 bg-gradient-to-r from-destructive/5 via-transparent to-destructive/5 rounded-2xl blur-3xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SessionRevokedOverlay;
