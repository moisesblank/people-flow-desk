// ============================================
// 🔒 VIDEO DISCLAIMER OVERLAY
// COMPONENTE OBRIGATÓRIO EM TODOS OS PLAYERS DE VÍDEO
// VERDADE ABSOLUTA - ATÉ O FIM DO SISTEMA
// ============================================

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import disclaimerImage from "@/assets/disclaimer_nobotao.png";

// Duração obrigatória do disclaimer em milissegundos
const DISCLAIMER_DURATION_MS = 3000;

interface VideoDisclaimerProps {
  /** Se o disclaimer está visível */
  isVisible: boolean;
  /** Callback quando o disclaimer terminar */
  onComplete: () => void;
  /** Duração customizada (opcional, padrão 3s) */
  duration?: number;
}

/**
 * 🔒 COMPONENTE OBRIGATÓRIO
 * 
 * Este componente DEVE ser usado em TODOS os players de vídeo do sistema.
 * Exibe o aviso legal por 3 segundos antes de permitir a reprodução do vídeo.
 * 
 * REGRA ABSOLUTA: Nenhum vídeo pode ser reproduzido sem antes exibir este disclaimer.
 * Esta é uma VERDADE ABSOLUTA que deve ser mantida até o fim do sistema.
 */
export function VideoDisclaimer({ 
  isVisible, 
  onComplete, 
  duration = DISCLAIMER_DURATION_MS 
}: VideoDisclaimerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Imagem do Disclaimer - Asset local obrigatório */}
            <img
              src={disclaimerImage}
              alt="Aviso Legal - Uso Restrito e Rastreável"
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Barra de progresso visual */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: duration / 1000, ease: "linear" }}
                  onAnimationComplete={onComplete}
                />
              </div>
              <span className="text-white/60 text-xs font-mono">Iniciando...</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 🔒 HOOK OBRIGATÓRIO PARA GERENCIAR O DISCLAIMER
 * 
 * Use este hook em qualquer componente de vídeo para gerenciar
 * o estado do disclaimer de forma consistente.
 */
export function useVideoDisclaimer() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerCompleted, setDisclaimerCompleted] = useState(false);

  /**
   * Inicia a exibição do disclaimer.
   * Deve ser chamado quando o usuário clicar para reproduzir o vídeo.
   */
  const startDisclaimer = useCallback(() => {
    if (disclaimerCompleted) return false;
    setShowDisclaimer(true);
    return true;
  }, [disclaimerCompleted]);

  /**
   * Callback para quando o disclaimer terminar.
   */
  const handleDisclaimerComplete = useCallback(() => {
    setShowDisclaimer(false);
    setDisclaimerCompleted(true);
  }, []);

  /**
   * Reseta o estado do disclaimer (para novo vídeo).
   */
  const resetDisclaimer = useCallback(() => {
    setShowDisclaimer(false);
    setDisclaimerCompleted(false);
  }, []);

  return {
    showDisclaimer,
    disclaimerCompleted,
    startDisclaimer,
    handleDisclaimerComplete,
    resetDisclaimer,
  };
}

export default VideoDisclaimer;
