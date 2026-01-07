// ============================================
// 🔥 FORTRESS PLAYER WRAPPER - FORTALEZA DIGITAL
// 5 CAMADAS DE PROTEÇÃO MÁXIMA
// Tolerância ZERO a roubo de conteúdo
// ============================================

import { ReactNode, useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";
import { getPandaEmbedUrl } from "@/lib/video/panda";

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

      // 🚨 PROTEÇÃO DEVTOOLS DESATIVADA POR ORDEM DO OWNER (2026-01-06)
      // F12 (DevTools) - PERMITIDO
      // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Select Element) - PERMITIDO
      // Ctrl+Shift+K (Firefox Console) - PERMITIDO
      // Alt+Cmd+I (Mac DevTools) - PERMITIDO
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
// CAMADA 3: MARCA D'ÁGUA DINÂMICA v2.0 (Anti-Gravação AVANÇADA)
// CPF translúcido + posições variáveis + tempos aleatórios
// Autorização do Arquiteto: 21/12/2024
// ============================================

interface WatermarkPosition {
  x: string;
  y: string;
  rotation: number;
  opacity: number;
}

// Gera posições aleatórias para a marca d'água
const generateRandomPositions = (): WatermarkPosition[] => {
  const positions: WatermarkPosition[] = [
    { x: "5%", y: "10%", rotation: -5, opacity: 0.12 },
    { x: "70%", y: "15%", rotation: 3, opacity: 0.10 },
    { x: "15%", y: "45%", rotation: -3, opacity: 0.08 },
    { x: "60%", y: "50%", rotation: 5, opacity: 0.11 },
    { x: "25%", y: "75%", rotation: -2, opacity: 0.09 },
    { x: "75%", y: "80%", rotation: 4, opacity: 0.10 },
    { x: "40%", y: "25%", rotation: 0, opacity: 0.07 },
    { x: "50%", y: "65%", rotation: -4, opacity: 0.08 },
  ];
  return positions;
};

// Tempos de transição variáveis (10, 20, 30 segundos alternados)
const TRANSITION_TIMES = [10, 20, 30];

const DynamicWatermark = ({ userData }: { userData: UserWatermarkData }) => {
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [positions] = useState(generateRandomPositions);
  const [transitionTimeIndex, setTransitionTimeIndex] = useState(0);
  
  // Formatação do CPF - translúcido mas visível para identificação
  const formatCPFForWatermark = (cpf: string) => {
    if (!cpf || cpf.length < 11) return cpf;
    // Formato: 123.456.789-00 (completo para identificação anti-pirataria)
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    }
    return cpf;
  };

  // Timer para mudar posição em tempos variáveis (10, 20, 30 segundos)
  useEffect(() => {
    const currentTime = TRANSITION_TIMES[transitionTimeIndex];
    
    const timer = setTimeout(() => {
      setCurrentPositionIndex((prev) => (prev + 1) % positions.length);
      setTransitionTimeIndex((prev) => (prev + 1) % TRANSITION_TIMES.length);
    }, currentTime * 1000);

    return () => clearTimeout(timer);
  }, [currentPositionIndex, transitionTimeIndex, positions.length]);

  const watermarkCPF = userData.cpf ? formatCPFForWatermark(userData.cpf) : "";
  const watermarkName = userData.nome || "";
  const watermarkEmail = userData.email || "";

  if (!watermarkCPF && !watermarkName && !watermarkEmail) return null;

  const currentPos = positions[currentPositionIndex];
  const nextPos = positions[(currentPositionIndex + 1) % positions.length];

  return (
    <>
      {/* Marca d'água principal com CPF - Move entre posições */}
      <motion.div
        className="absolute z-[55] pointer-events-none select-none"
        initial={{ x: currentPos.x, y: currentPos.y, rotate: currentPos.rotation }}
        animate={{
          x: [currentPos.x, nextPos.x],
          y: [currentPos.y, nextPos.y],
          rotate: [currentPos.rotation, nextPos.rotation],
        }}
        transition={{
          duration: TRANSITION_TIMES[transitionTimeIndex],
          ease: "easeInOut",
        }}
        key={`main-${currentPositionIndex}`}
      >
        <div className="flex flex-col items-center gap-0.5">
          {/* CPF - Principal identificador */}
          {watermarkCPF && (
            <span 
              className="font-mono tracking-[0.2em] whitespace-nowrap text-[11px] sm:text-sm"
              style={{
                color: `rgba(255, 255, 255, ${currentPos.opacity + 0.05})`,
                textShadow: "0 0 3px rgba(0,0,0,0.4)",
              }}
            >
              {watermarkCPF}
            </span>
          )}
          {/* Nome do usuário */}
          {watermarkName && (
            <span 
              className="font-mono tracking-widest whitespace-nowrap text-[9px] sm:text-[10px]"
              style={{
                color: `rgba(255, 255, 255, ${currentPos.opacity})`,
                textShadow: "0 0 2px rgba(0,0,0,0.3)",
              }}
            >
              {watermarkName.toUpperCase()}
            </span>
          )}
        </div>
      </motion.div>

      {/* Segunda marca d'água - posição oposta, tempo diferente */}
      <motion.div
        className="absolute z-[55] pointer-events-none select-none"
        initial={{ 
          x: positions[(currentPositionIndex + 4) % positions.length].x, 
          y: positions[(currentPositionIndex + 4) % positions.length].y 
        }}
        animate={{
          x: [
            positions[(currentPositionIndex + 4) % positions.length].x,
            positions[(currentPositionIndex + 5) % positions.length].x,
          ],
          y: [
            positions[(currentPositionIndex + 4) % positions.length].y,
            positions[(currentPositionIndex + 5) % positions.length].y,
          ],
          opacity: [0.06, 0.10, 0.06],
        }}
        transition={{
          duration: TRANSITION_TIMES[(transitionTimeIndex + 1) % TRANSITION_TIMES.length] * 1.5,
          ease: "easeInOut",
        }}
      >
        <span 
          className="font-mono tracking-[0.15em] whitespace-nowrap text-[10px] sm:text-xs transform rotate-[-3deg]"
          style={{
            color: "rgba(255, 255, 255, 0.08)",
            textShadow: "0 0 2px rgba(0,0,0,0.3)",
          }}
        >
          {watermarkCPF || watermarkEmail}
        </span>
      </motion.div>

      {/* Terceira marca d'água - Centro, pulsa suavemente */}
      <motion.div
        className="absolute z-[55] pointer-events-none select-none"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        animate={{
          opacity: [0.04, 0.08, 0.04],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span 
          className="font-mono tracking-[0.4em] whitespace-nowrap text-sm sm:text-base"
          style={{
            color: "rgba(255, 255, 255, 0.06)",
            textShadow: "0 0 4px rgba(0,0,0,0.2)",
          }}
        >
          {watermarkName.toUpperCase()}
        </span>
      </motion.div>

      {/* Quarta marca d'água - Canto inferior, alterna com delay */}
      <motion.div
        className="absolute z-[55] pointer-events-none select-none"
        initial={{ x: "80%", y: "85%" }}
        animate={{
          x: ["80%", "10%", "80%"],
          y: ["85%", "88%", "85%"],
          opacity: [0.07, 0.11, 0.07],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 15,
        }}
      >
        <span 
          className="font-mono tracking-widest whitespace-nowrap text-[8px] sm:text-[9px]"
          style={{
            color: "rgba(255, 255, 255, 0.09)",
            textShadow: "0 0 2px rgba(0,0,0,0.3)",
          }}
        >
          {watermarkCPF} • {new Date().toLocaleDateString('pt-BR')}
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

  return getPandaEmbedUrl(videoId, params);

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
