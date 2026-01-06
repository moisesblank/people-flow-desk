// ============================================
// 🛡️ SESSÃO REVOGADA — OVERLAY VISUAL
// Exibe mensagem estilizada quando o usuário é desconectado
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionRevokedOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export function SessionRevokedOverlay({ isVisible, onClose }: SessionRevokedOverlayProps) {
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
                Você conectou em outro dispositivo
              </motion.h2>

              {/* Descrição */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-center mb-6 leading-relaxed"
              >
                Por segurança, permitimos apenas <span className="text-foreground font-medium">uma sessão ativa</span>{" "}
                por vez. Esta sessão foi encerrada porque você fez login em outro aparelho.
              </motion.p>

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

              {/* Botão */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Button
                  onClick={onClose}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Entendi, ir para login
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
