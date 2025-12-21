// ============================================
// 🔥 FORTRESS PLAYER WRAPPER - FORTALEZA DIGITAL
// 5 CAMADAS DE PROTEÇÃO MÁXIMA
// Tolerância ZERO a roubo de conteúdo
// ============================================

import { ReactNode, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";

interface FortressPlayerWrapperProps {
  children: ReactNode;
  className?: string;
  showSecurityBadge?: boolean;
  allowFullscreen?: boolean;
  allowPlayPause?: boolean;
  allowSettings?: boolean;
}

// ============================================
// CAMADA 5: DETECÇÃO DE DEVTOOLS (Anti-Inspeção)
// ============================================
const useDevToolsProtection = () => {
  useEffect(() => {
    // Detectar DevTools pelo tamanho da janela
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        console.clear();
        console.log(
          "%c⚠️ SISTEMA PROTEGIDO ⚠️",
          "color: red; font-size: 40px; font-weight: bold;"
        );
        console.log(
          "%cA inspeção deste conteúdo viola os termos de uso.",
          "color: orange; font-size: 16px;"
        );
      }
    };

    // Checar periodicamente
    const interval = setInterval(detectDevTools, 1000);
    window.addEventListener("resize", detectDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", detectDevTools);
    };
  }, []);
};

// ============================================
// CAMADA 4: BLOQUEIO DE ATALHOS (JavaScript)
// ============================================
const useKeyboardProtection = (containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquear Ctrl+S (Salvar)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        return false;
      }
      
      // Bloquear Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return false;
      }
      
      // Bloquear Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
        e.preventDefault();
        return false;
      }
      
      // Bloquear Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        return false;
      }
      
      // Bloquear F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      
      // Bloquear Ctrl+Shift+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        return false;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
    }
    
    // Também no document para captura global
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (container) {
        container.removeEventListener("keydown", handleKeyDown);
      }
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef]);
};

// ============================================
// CAMADA 3: BLOQUEIO DE CLIQUES (JavaScript)
// ============================================
const useClickProtection = (containerRef: React.RefObject<HTMLDivElement>) => {
  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  const handleDragStart = useCallback((e: Event) => {
    e.preventDefault();
    return false;
  }, []);

  const handleSelectStart = useCallback((e: Event) => {
    e.preventDefault();
    return false;
  }, []);

  const handleCopy = useCallback((e: Event) => {
    e.preventDefault();
    return false;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("contextmenu", handleContextMenu);
    container.addEventListener("dragstart", handleDragStart);
    container.addEventListener("selectstart", handleSelectStart);
    container.addEventListener("copy", handleCopy);

    return () => {
      container.removeEventListener("contextmenu", handleContextMenu);
      container.removeEventListener("dragstart", handleDragStart);
      container.removeEventListener("selectstart", handleSelectStart);
      container.removeEventListener("copy", handleCopy);
    };
  }, [containerRef, handleContextMenu, handleDragStart, handleSelectStart, handleCopy]);
};

// ============================================
// COMPONENTE PRINCIPAL: FORTRESS PLAYER WRAPPER
// ============================================
export const FortressPlayerWrapper = ({
  children,
  className = "",
  showSecurityBadge = false,
  allowFullscreen = true,
  allowPlayPause = true,
  allowSettings = true,
}: FortressPlayerWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ativar todas as camadas de proteção
  useDevToolsProtection();
  useKeyboardProtection(containerRef);
  useClickProtection(containerRef);

  return (
    <div
      ref={containerRef}
      className={`fortress-player-wrapper relative ${className}`}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* ═══════════════════════════════════════════════════════
          CAMADA 1: VÍDEO/CONTEÚDO
          ═══════════════════════════════════════════════════════ */}
      {children}

      {/* ═══════════════════════════════════════════════════════
          CAMADA 2: ESCUDO DE CLIQUES (CSS Shield)
          Sobreposição que captura cliques indesejados
          ═══════════════════════════════════════════════════════ */}

      {/* ESCUDO SUPERIOR COMPLETO - Bloqueia info/share */}
      <div
        className="absolute top-0 left-0 right-0 z-50 cursor-default"
        style={{
          height: "60px",
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
      />

      {/* ESCUDO INFERIOR COMPLETO - Bloqueia controles do YT/Panda */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 cursor-default"
        style={{
          height: "70px",
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
      />

      {/* ESCUDO LATERAL ESQUERDO - Logo/Branding */}
      <div
        className="absolute top-0 bottom-0 left-0 z-50 cursor-default"
        style={{
          width: "80px",
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
      />

      {/* ESCUDO LATERAL DIREITO - Share/Config */}
      <div
        className="absolute top-0 bottom-0 right-0 z-50 cursor-default"
        style={{
          width: "80px",
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
      />

      {/* ═══════════════════════════════════════════════════════
          ÁREA CENTRAL PERMITIDA - Play/Pause
          ═══════════════════════════════════════════════════════ */}
      {allowPlayPause && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          style={{
            // Área central onde cliques são permitidos para play/pause
            // O pointer-events: none permite que o clique passe para o player
          }}
        >
          <div
            className="pointer-events-auto"
            style={{
              width: "30%",
              height: "40%",
              maxWidth: "200px",
              maxHeight: "150px",
              background: "transparent",
            }}
          />
        </div>
      )}

      {/* Badge de Segurança (opcional) */}
      {showSecurityBadge && (
        <motion.div
          className="absolute top-3 left-3 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-green-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Shield className="w-3.5 h-3.5 text-green-500" />
          <span className="text-[11px] text-green-400 font-semibold tracking-wide">
            FORTALEZA ATIVA
          </span>
          <Lock className="w-3 h-3 text-green-500 animate-pulse" />
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ESTILOS GLOBAIS DE PROTEÇÃO (Injetados via CSS)
          ═══════════════════════════════════════════════════════ */}
      <style>{`
        .fortress-player-wrapper {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        .fortress-player-wrapper * {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
        
        .fortress-player-wrapper iframe {
          pointer-events: auto;
        }
        
        /* Ocultar controles específicos do Panda Video */
        .fortress-player-wrapper .panda-video-player .download-button,
        .fortress-player-wrapper .panda-video-player .share-button,
        .fortress-player-wrapper .panda-video-player .pip-button,
        .fortress-player-wrapper .panda-video-player [data-action="download"],
        .fortress-player-wrapper .panda-video-player [data-action="share"],
        .fortress-player-wrapper .panda-video-player [data-action="pip"] {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        
        /* Ocultar controles do YouTube que podem ser acessados */
        .fortress-player-wrapper .ytp-chrome-top,
        .fortress-player-wrapper .ytp-title,
        .fortress-player-wrapper .ytp-share-button,
        .fortress-player-wrapper .ytp-watch-later-button,
        .fortress-player-wrapper .ytp-youtube-button {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
};

// ============================================
// UTILITÁRIOS EXPORTADOS
// ============================================

/**
 * URL protegida para embed de vídeos YouTube
 */
export const getFortressYouTubeUrl = (videoId: string, autoplay = false): string => {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    controls: "1",
    showinfo: "0",
    fs: "1",
    vq: "hd1080",
    iv_load_policy: "3",
    disablekb: "0",
    cc_load_policy: "0",
    // Parâmetros extras de segurança
    origin: window.location.origin,
    enablejsapi: "0", // Desabilitar API JS para evitar manipulação
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

/**
 * URL protegida para Panda Video
 */
export const getFortressPandaUrl = (videoId: string, autoplay = false): string => {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    loop: "0",
    muted: "0",
    controls: "1",
    // Desabilitar recursos de compartilhamento
    share: "0",
    download: "0",
    pip: "0",
  });

  return `https://player-vz-${videoId}.tv.pandavideo.com.br/embed/?${params.toString()}`;
};

/**
 * Configuração padrão para YouTube IFrame API
 */
export const FORTRESS_PLAYER_VARS = {
  autoplay: 0,
  controls: 1,
  modestbranding: 1,
  rel: 0,
  showinfo: 0,
  fs: 1,
  playsinline: 1,
  vq: "hd1080",
  iv_load_policy: 3,
  cc_load_policy: 0,
  enablejsapi: 0,
  origin: typeof window !== "undefined" ? window.location.origin : "",
};

export default FortressPlayerWrapper;
