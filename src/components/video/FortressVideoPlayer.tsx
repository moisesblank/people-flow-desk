// ============================================
// 🔥 FORTRESS VIDEO PLAYER - O PLAYER DEFINITIVO
// Player de vídeo FORTALEZA com proteção máxima
// Suporta YouTube e Panda Video via embed/URL
// Controles: APENAS Play/Pause + Engrenagem (velocidade/qualidade)
// 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
// ============================================

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Settings, 
  Loader2,
  Volume2,
  VolumeX,
  Maximize,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  FortressPlayerWrapper, 
  getFortressYouTubeUrl,
  getFortressPandaUrl,
  FORTRESS_PLAYER_VARS 
} from "./FortressPlayerWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VideoDisclaimer, useVideoDisclaimer } from "@/components/video/VideoDisclaimer";

// ============================================
// TIPOS E INTERFACES
// ============================================
interface UserWatermarkData {
  nome?: string;
  cpf?: string;
  email?: string;
}

export interface FortressVideoPlayerProps {
  /** ID do vídeo YouTube ou Panda */
  videoId: string;
  /** Tipo de player: youtube ou panda */
  type?: "youtube" | "panda";
  /** Título do vídeo (opcional) */
  title?: string;
  /** Thumbnail customizada (opcional) */
  thumbnail?: string;
  /** Classes CSS extras */
  className?: string;
  /** Autoplay ao carregar */
  autoplay?: boolean;
  /** Mostrar marca d'água com dados do usuário */
  showWatermark?: boolean;
  /** Dados do usuário para marca d'água */
  userData?: UserWatermarkData;
  /** Mostrar badge de segurança */
  showSecurityBadge?: boolean;
  /** Callback quando vídeo completar */
  onComplete?: () => void;
  /** Callback de progresso */
  onProgress?: (progress: number) => void;
  /** Mostrar controles customizados */
  showCustomControls?: boolean;
}

// Velocidades disponíveis
const PLAYBACK_SPEEDS = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "Normal", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "1.75x", value: 1.75 },
  { label: "2x", value: 2 },
];

// Qualidades disponíveis
const VIDEO_QUALITIES = [
  { label: "Auto", value: "auto" },
  { label: "1080p HD", value: "hd1080" },
  { label: "720p", value: "hd720" },
  { label: "480p", value: "large" },
  { label: "360p", value: "medium" },
  { label: "240p", value: "small" },
];

// Declaração do tipo do YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const FortressVideoPlayer = memo(({
  videoId,
  type = "youtube",
  title = "Vídeo Protegido",
  thumbnail,
  className = "",
  autoplay = false,
  showWatermark = false,
  userData,
  showSecurityBadge = true,
  onComplete,
  onProgress,
  showCustomControls = true,
}: FortressVideoPlayerProps) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
  const { showDisclaimer, disclaimerCompleted, startDisclaimer, handleDisclaimerComplete } = useVideoDisclaimer();

  // Estados
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  // 🔥 FIX v16.0: SEMPRE mostrar thumbnail primeiro para garantir disclaimer
  // O autoplay só acontece APÓS o disclaimer de 3 segundos
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentQuality, setCurrentQuality] = useState("hd1080");
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 🔥 FIX v16.0: AUTOPLAY COM DISCLAIMER OBRIGATÓRIO
  // Se autoplay=true, iniciar disclaimer automaticamente
  useEffect(() => {
    if (autoplay && !disclaimerCompleted) {
      console.log('[FortressVideoPlayer] 🔒 Disclaimer automático iniciado (autoplay=true)');
      startDisclaimer();
    }
  }, [autoplay, disclaimerCompleted, startDisclaimer]);

  // URL do thumbnail
  const thumbnailUrl = thumbnail || 
    (type === "youtube" 
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : null);

  // URL do embed
  const embedUrl = type === "youtube" 
    ? getFortressYouTubeUrl(videoId, autoplay)
    : getFortressPandaUrl(videoId, autoplay);

  // ============================================
  // YOUTUBE IFRAME API
  // ============================================
  useEffect(() => {
    if (type !== "youtube" || !videoId || showThumbnail) return;

    // Se já existe a API, inicializar player
    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
      return;
    }

    // Carregar script da API
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initYouTubePlayer();
    };

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, type, showThumbnail]);

  const initYouTubePlayer = useCallback(() => {
    if (!containerRef.current || !videoId || playerRef.current) return;

    const playerId = `fortress-player-${videoId}-${Date.now()}`;
    let playerDiv = document.getElementById(playerId);
    
    if (!playerDiv) {
      playerDiv = document.createElement("div");
      playerDiv.id = playerId;
      playerDiv.className = "w-full h-full";
      
      // Limpar container
      const container = containerRef.current.querySelector('.player-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(playerDiv);
      }
    }

    playerRef.current = new window.YT.Player(playerId, {
      videoId: videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        ...FORTRESS_PLAYER_VARS,
        autoplay: autoplay ? 1 : 0,
        controls: 0, // Desabilitar controles nativos
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handleStateChange,
      }
    });
  }, [videoId, autoplay]);

  const handlePlayerReady = useCallback((event: any) => {
    // 🔥 FIX v15.0: Salvar a referência REAL do player (event.target) para que
    // setPlaybackRate e outras APIs funcionem corretamente nos controles customizados
    playerRef.current = event.target; // CRÍTICO: sobrescrever com player funcional
    console.log('[FortressVideoPlayer] 🎬 Player YouTube pronto, ref atualizada');
    
    setIsReady(true);
    setIsLoading(false);
    
    // Aplicar qualidade 1080p
    if (event.target.setPlaybackQuality) {
      event.target.setPlaybackQuality("hd1080");
    }
    
    if (autoplay) {
      event.target.playVideo();
      setIsPlaying(true);
    }
  }, [autoplay]);

  const handleStateChange = useCallback((event: any) => {
    switch (event.data) {
      case 1: // Playing
        setIsPlaying(true);
        setIsLoading(false);
        break;
      case 2: // Paused
        setIsPlaying(false);
        break;
      case 0: // Ended
        setIsPlaying(false);
        onComplete?.();
        break;
      case 3: // Buffering
        setIsLoading(true);
        break;
    }
  }, [onComplete]);

  // ============================================
  // CONTROLES
  // ============================================
  const handlePlayPause = useCallback(() => {
    if (showThumbnail) {
      // 🔒 DISCLAIMER: Exibir aviso legal por 3 segundos antes de iniciar
      if (startDisclaimer()) {
        return; // Aguardar disclaimer completar
      }
      setShowThumbnail(false);
      setIsLoading(true);
      return;
    }

    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo?.();
      } else {
        playerRef.current.playVideo?.();
      }
      setIsPlaying(!isPlaying);
    } else if (iframeRef.current) {
      // Para iframe simples, usar postMessage
      const action = isPlaying ? "pauseVideo" : "playVideo";
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: action, args: "" }),
        "*"
      );
      setIsPlaying(!isPlaying);
    }
  }, [showThumbnail, isPlaying, startDisclaimer]);

  // Callback quando disclaimer completar
  const onDisclaimerComplete = useCallback(() => {
    handleDisclaimerComplete();
    setShowThumbnail(false);
    setIsLoading(true);
  }, [handleDisclaimerComplete]);

  const handleSpeedChange = useCallback((speed: number) => {
    setCurrentSpeed(speed);
    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(speed);
    }
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    setCurrentQuality(quality);
    if (playerRef.current?.setPlaybackQuality) {
      playerRef.current.setPlaybackQuality(quality);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute?.();
      } else {
        playerRef.current.mute?.();
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (!showCustomControls) return;
    
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("touchstart", handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("touchstart", handleMouseMove);
      }
      clearTimeout(timeout);
    };
  }, [showCustomControls]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div 
      ref={containerRef}
      className={cn("relative group", className)}
    >
      <FortressPlayerWrapper
        className="aspect-video rounded-xl overflow-hidden bg-black"
        showSecurityBadge={showSecurityBadge}
        showWatermark={showWatermark}
        userData={userData}
      >
        {/* 🔒 DISCLAIMER OVERLAY - OBRIGATÓRIO EM TODOS OS VÍDEOS */}
        <VideoDisclaimer 
          isVisible={showDisclaimer} 
          onComplete={onDisclaimerComplete} 
        />
        
        {/* Thumbnail State */}
        {showThumbnail && !showDisclaimer && thumbnailUrl && (
          <div 
            className="absolute inset-0 cursor-pointer z-10"
            onClick={handlePlayPause}
          >
            {/* Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black animate-pulse" />
            )}
            
            {/* Thumbnail Image - Otimizado */}
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              onLoad={() => setImageLoaded(true)}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
            
            {/* Play Button Central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
              </motion.button>
            </div>

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
              <h3 className="text-white font-semibold text-sm md:text-base truncate">
                {title}
              </h3>
            </div>
          </div>
        )}

        {/* Video Player */}
        {!showThumbnail && (
          <div className="player-container absolute inset-0">
            {type === "youtube" && !playerRef.current && (
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
                onLoad={() => setIsLoading(false)}
              />
            )}
          </div>
        )}

        {/* Loading Spinner */}
        <AnimatePresence>
          {isLoading && !showThumbnail && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Controls Overlay */}
        {showCustomControls && !showThumbnail && (
          <AnimatePresence>
            {showControls && (
              <motion.div
                className="absolute inset-0 z-30 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Gradient overlays para controles */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-white/80 font-medium">PROTEGIDO</span>
                  </div>
                  <span className="text-xs text-white/60 truncate max-w-[200px]">{title}</span>
                </div>

                {/* Center Play/Pause */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                  <motion.button
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center"
                    onClick={handlePlayPause}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" fill="white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" fill="white" />
                    )}
                  </motion.button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-auto">
                  {/* Left Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayPause}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>

                    <button
                      onClick={handleMuteToggle}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Right Controls - Engrenagem */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                          <Settings className="w-5 h-5 text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-48 bg-black/95 backdrop-blur-md border-white/10"
                      >
                        {/* Velocidade */}
                        <DropdownMenuLabel className="text-white/60 text-xs">
                          Velocidade
                        </DropdownMenuLabel>
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <DropdownMenuItem
                            key={speed.value}
                            onClick={() => handleSpeedChange(speed.value)}
                            className={cn(
                              "text-white/80 hover:text-white cursor-pointer",
                              currentSpeed === speed.value && "bg-white/10 text-white"
                            )}
                          >
                            {speed.label}
                            {currentSpeed === speed.value && " ✓"}
                          </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator className="bg-white/10" />

                        {/* Qualidade */}
                        <DropdownMenuLabel className="text-white/60 text-xs">
                          Qualidade
                        </DropdownMenuLabel>
                        {VIDEO_QUALITIES.map((quality) => (
                          <DropdownMenuItem
                            key={quality.value}
                            onClick={() => handleQualityChange(quality.value)}
                            className={cn(
                              "text-white/80 hover:text-white cursor-pointer",
                              currentQuality === quality.value && "bg-white/10 text-white"
                            )}
                          >
                            {quality.label}
                            {currentQuality === quality.value && " ✓"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                      onClick={handleFullscreen}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Maximize className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </FortressPlayerWrapper>
    </div>
  );
});

FortressVideoPlayer.displayName = "FortressVideoPlayer";

export default FortressVideoPlayer;
