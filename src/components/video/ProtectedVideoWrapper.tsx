// ============================================
// PROTECTED VIDEO WRAPPER - SISTEMA DE PROTEÇÃO
// Bloqueia botões de compartilhar e "Assistir no YouTube"
// Força 1080p automaticamente
// ============================================

import { ReactNode, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface ProtectedVideoWrapperProps {
  children: ReactNode;
  className?: string;
  showBadge?: boolean;
}

/**
 * MÁSCARAS DE PROTEÇÃO:
 * 
 * 1. CANTO INFERIOR ESQUERDO: Bloqueia "Assistir no YouTube" e logo
 *    - Área: 180px x 60px
 * 
 * 2. CANTO SUPERIOR DIREITO: Bloqueia botões de compartilhar/config
 *    - Área: 150px x 50px
 * 
 * 3. BARRA INFERIOR COMPLETA: Bloqueia toda a área de controles do YT
 *    - Área: 100% x 50px (apenas bordas)
 */

export const ProtectedVideoWrapper = ({
  children,
  className = "",
  showBadge = false
}: ProtectedVideoWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Bloquear clique direito no container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    container.addEventListener("contextmenu", handleContextMenu);
    return () => container.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Vídeo/Conteúdo */}
      {children}

      {/* ═══════════════════════════════════════════════════════════════
          MÁSCARAS DE PROTEÇÃO - INVISÍVEIS MAS BLOQUEIAM CLIQUES
          ═══════════════════════════════════════════════════════════════ */}

      {/* MÁSCARA 1: Canto inferior esquerdo - "Assistir no YouTube" */}
      <div 
        className="absolute bottom-0 left-0 z-50 cursor-default"
        style={{
          width: "200px",
          height: "65px",
          background: "transparent",
          // Força que nenhum clique passe
          pointerEvents: "auto",
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        title=""
      />

      {/* MÁSCARA 2: Canto superior direito - Compartilhar/Qualidade */}
      <div 
        className="absolute top-0 right-0 z-50 cursor-default"
        style={{
          width: "160px",
          height: "55px",
          background: "transparent",
          pointerEvents: "auto",
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        title=""
      />

      {/* MÁSCARA 3: Canto inferior direito - Configurações/Fullscreen área */}
      <div 
        className="absolute bottom-0 right-0 z-50 cursor-default"
        style={{
          width: "60px",
          height: "50px",
          background: "transparent",
          pointerEvents: "auto",
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        title=""
      />

      {/* MÁSCARA 4: Borda lateral esquerda inferior - Logo YouTube */}
      <div 
        className="absolute bottom-0 left-0 z-50 cursor-default"
        style={{
          width: "50px",
          height: "100px",
          background: "transparent",
          pointerEvents: "auto",
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        title=""
      />

      {/* Badge de proteção (opcional) */}
      {showBadge && (
        <motion.div
          className="absolute top-2 left-2 z-40 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-white/80 font-medium">PROTEGIDO</span>
        </motion.div>
      )}
    </div>
  );
};

/**
 * CONFIGURAÇÃO PADRÃO PARA EMBED YOUTUBE PROTEGIDO
 * Use esses parâmetros em todas as URLs de embed
 */
export const getProtectedYouTubeUrl = (videoId: string, autoplay = false): string => {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    rel: "0",                    // Não mostrar vídeos relacionados
    modestbranding: "1",         // Minimizar branding do YouTube
    playsinline: "1",            // Não abrir em fullscreen no mobile
    controls: "1",               // Mostrar controles
    showinfo: "0",               // Não mostrar info do canal
    fs: "1",                     // Permitir fullscreen
    vq: "hd1080",               // FORÇAR 1080p
    iv_load_policy: "3",         // Ocultar anotações
    disablekb: "0",              // Permitir teclado
    cc_load_policy: "0",         // Não carregar legendas automaticamente
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

/**
 * PARÂMETROS RECOMENDADOS PARA YOUTUBE IFRAME API
 */
export const PROTECTED_PLAYER_VARS = {
  autoplay: 0,
  controls: 1,
  modestbranding: 1,
  rel: 0,
  showinfo: 0,
  fs: 1,
  playsinline: 1,
  vq: "hd1080",           // Força 1080p
  iv_load_policy: 3,      // Oculta anotações
  cc_load_policy: 0,      // Não carrega legendas auto
};

export default ProtectedVideoWrapper;
