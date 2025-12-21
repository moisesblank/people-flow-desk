// ============================================
// 🔥 FORTRESS PLAYER WRAPPER - FORTALEZA DIGITAL
// 5 CAMADAS DE PROTEÇÃO MÁXIMA
// Tolerância ZERO a roubo de conteúdo
// ============================================

import { ReactNode, useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";

interface UserWatermarkData {
  nome?: string;
  cpf?: string;
  email?: string;
}

interface FortressPlayerWrapperProps {
  children: ReactNode;
  className?: string;
  showSecurityBadge?: boolean;
  allowFullscreen?: boolean;
  allowPlayPause?: boolean;
  allowSettings?: boolean;
  /** Dados do usuário para marca d'água dinâmica */
  userData?: UserWatermarkData;
  /** Mostrar marca d'água com dados do usuário */
  showWatermark?: boolean;
}

// ============================================
// CAMADA 4: O DETECTOR DE DEVTOOLS (A Armadilha Final)
// Detecta DevTools e pausa o vídeo imediatamente
// ============================================
const useDevToolsDetector = (
  containerRef: React.RefObject<HTMLDivElement>,
  onDevToolsDetected?: () => void
) => {
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const hasShownWarning = useRef(false);

  useEffect(() => {
    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;

      if (widthDiff || heightDiff) {
        setDevToolsOpen(true);

        // Pausar TODOS os vídeos/iframes no container
        if (containerRef.current) {
          // Pausar vídeos HTML5
          const videos = containerRef.current.querySelectorAll("video");
          videos.forEach((video) => {
            if (!video.paused) {
              video.pause();
            }
          });

          // Tentar pausar iframes do YouTube via postMessage
          const iframes = containerRef.current.querySelectorAll("iframe");
          iframes.forEach((iframe) => {
            try {
              iframe.contentWindow?.postMessage(
                '{"event":"command","func":"pauseVideo","args":""}',
                "*"
              );
            } catch (e) {
              // Ignorar erros de cross-origin
            }
          });
        }

        // Mostrar aviso apenas uma vez por sessão
        if (!hasShownWarning.current) {
          hasShownWarning.current = true;
          
          // Limpar console e mostrar aviso
          console.clear();
          console.log(
            "%c🚨 ATIVIDADE SUSPEITA DETECTADA 🚨",
            "color: red; font-size: 30px; font-weight: bold; background: black; padding: 10px;"
          );
          console.log(
            "%cO conteúdo está protegido. Feche as ferramentas de desenvolvedor.",
            "color: orange; font-size: 16px;"
          );

          // Toast de aviso
          toast.error("⚠️ Atividade suspeita detectada", {
            description: "O vídeo foi pausado. Feche as ferramentas de desenvolvedor para continuar.",
            duration: 10000,
          });

          onDevToolsDetected?.();
        }
      } else {
        setDevToolsOpen(false);
      }
    };

    // Verificar imediatamente e a cada segundo
    checkDevTools();
    const interval = setInterval(checkDevTools, 1000);
    window.addEventListener("resize", checkDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkDevTools);
    };
  }, [containerRef, onDevToolsDetected]);

  return devToolsOpen;
};

// ============================================
// CAMADA 2: O GUARDIÃO DA INTERAÇÃO (JavaScript)
// Bloqueia todas as tentativas de interação maliciosa
// ============================================
const useInteractionGuardian = (containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const wrapper = containerRef.current;
    if (!wrapper) return;

    // 1. Bloquear menu de contexto (botão direito)
    const blockContextMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 2. Bloquear arrastar e soltar
    const blockDrag = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 3. Bloquear seleção de texto
    const blockSelect = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 4. Bloquear cópia
    const blockCopy = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 5. Bloquear atalhos de teclado perigosos
    const blockShortcuts = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Ctrl+S (Salvar), Ctrl+P (Print), Ctrl+C (Copiar), Ctrl+U (View Source)
      if (isCtrl && (key === "s" || key === "p" || key === "c" || key === "u")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Select Element)
      if (isCtrl && isShift && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+K (Firefox Console)
      if (isCtrl && isShift && key === "k") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Alt+Cmd+I (Mac DevTools)
      if (e.altKey && e.metaKey && key === "i") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Adicionar listeners ao wrapper
    wrapper.addEventListener("contextmenu", blockContextMenu);
    wrapper.addEventListener("dragstart", blockDrag);
    wrapper.addEventListener("selectstart", blockSelect);
    wrapper.addEventListener("copy", blockCopy);

    // Adicionar listener global para atalhos de teclado
    window.addEventListener("keydown", blockShortcuts);

    // Cleanup
    return () => {
      wrapper.removeEventListener("contextmenu", blockContextMenu);
      wrapper.removeEventListener("dragstart", blockDrag);
      wrapper.removeEventListener("selectstart", blockSelect);
      wrapper.removeEventListener("copy", blockCopy);
      window.removeEventListener("keydown", blockShortcuts);
    };
  }, [containerRef]);
};

// ============================================
// CAMADA 3: MARCA D'ÁGUA DINÂMICA (Anti-Gravação)
// ============================================
const DynamicWatermark = ({ userData }: { userData: UserWatermarkData }) => {
  const maskCPF = (cpf: string) => {
    if (!cpf || cpf.length < 6) return cpf;
    return `${cpf.slice(0, 3)}.***.***-${cpf.slice(-2)}`;
  };

  const watermarkText = [
    userData.nome || "",
    userData.cpf ? maskCPF(userData.cpf) : "",
    userData.email || "",
  ].filter(Boolean).join(" • ");

  if (!watermarkText) return null;

  return (
    <>
      {/* Marca d'água posição 1 - Superior esquerda, movimento diagonal */}
      <motion.div
        className="absolute z-[55] pointer-events-none select-none"
        initial={{ x: "5%", y: "15%" }}
        animate={{
          x: ["5%", "15%", "5%"],
          y: ["15%", "25%", "15%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          textShadow: "0 0 2px rgba(0,0,0,0.5)",
        }}
      >
        <span className="text-white/20 text-[10px] sm:text-xs font-mono tracking-widest whitespace-nowrap">
          {watermarkText}
        </span>
      </motion.div>

      {/* Marca d'água posição 2 - Centro direita, movimento vertical */}
      <motion.div
        className="absolute z-[55] pointer-events-none select-none"
        initial={{ x: "60%", y: "45%" }}
        animate={{
          x: ["60%", "65%", "60%"],
          y: ["45%", "55%", "45%"],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        style={{
          textShadow: "0 0 2px rgba(0,0,0,0.5)",
        }}
      >
        <span className="text-white/15 text-[10px] sm:text-xs font-mono tracking-widest whitespace-nowrap transform rotate-[-5deg]">
          {watermarkText}
        </span>
      </motion.div>

      {/* Marca d'água posição 3 - Inferior central, movimento horizontal */}
      <motion.div
        className="absolute z-[55] pointer-events-none select-none"
        initial={{ x: "25%", y: "75%" }}
        animate={{
          x: ["25%", "40%", "25%"],
          y: ["75%", "70%", "75%"],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
        style={{
          textShadow: "0 0 2px rgba(0,0,0,0.5)",
        }}
      >
        <span className="text-white/18 text-[9px] sm:text-[11px] font-mono tracking-widest whitespace-nowrap transform rotate-[3deg]">
          {watermarkText}
        </span>
      </motion.div>

      {/* Marca d'água posição 4 - Centro, muito sutil */}
      <motion.div
        className="absolute z-[55] pointer-events-none select-none"
        initial={{ x: "35%", y: "50%" }}
        animate={{
          opacity: [0.08, 0.12, 0.08],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span className="text-white/10 text-sm sm:text-base font-mono tracking-[0.3em] whitespace-nowrap">
          {userData.nome?.toUpperCase() || ""}
        </span>
      </motion.div>
    </>
  );
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
  userData,
  showWatermark = false,
}: FortressPlayerWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ativar todas as camadas de proteção
  const devToolsOpen = useDevToolsDetector(containerRef);
  useInteractionGuardian(containerRef);

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
          CAMADA 3: MARCA D'ÁGUA DINÂMICA (Anti-Gravação)
          ═══════════════════════════════════════════════════════ */}
      {showWatermark && userData && (
        <DynamicWatermark userData={userData} />
      )}

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
