// ============================================
// 🔥 OMEGA FORTRESS PLAYER - O PLAYER DEFINITIVO
// Sistema de Proteção de Vídeos ULTRA v2.0
// 7 CAMADAS DE PROTEÇÃO
// ============================================

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Settings, Loader2, Volume2, VolumeX, 
  Maximize, Shield, Lock, AlertTriangle, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoFortress, VideoViolationType } from "@/hooks/useVideoFortress";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================
// TIPOS
// ============================================
export interface OmegaFortressPlayerProps {
  videoId: string;
  type?: "youtube" | "panda";
  title?: string;
  thumbnail?: string;
  className?: string;
  autoplay?: boolean;
  lessonId?: string;
  courseId?: string;
  showSecurityBadge?: boolean;
  showWatermark?: boolean;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

// Velocidades e qualidades
const PLAYBACK_SPEEDS = [
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "Normal", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 },
];

const VIDEO_QUALITIES = [
  { label: "Auto", value: "auto" },
  { label: "1080p HD", value: "hd1080" },
  { label: "720p", value: "hd720" },
  { label: "480p", value: "large" },
];

// Parâmetros FORTRESS para YouTube
const FORTRESS_YT_PARAMS = {
  rel: "0",
  modestbranding: "1",
  showinfo: "0",
  iv_load_policy: "3",
  disablekb: "1",
  fs: "1",
  playsinline: "1",
  vq: "hd1080",
  enablejsapi: "1",
  origin: typeof window !== 'undefined' ? window.location.origin : '',
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const OmegaFortressPlayer = memo(({
  videoId,
  type = "youtube",
  title = "Aula Protegida",
  thumbnail,
  className = "",
  autoplay = false,
  lessonId,
  courseId,
  showSecurityBadge = true,
  showWatermark = true,
  onComplete,
  onProgress,
}: OmegaFortressPlayerProps) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  // Estados
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnail, setShowThumbnail] = useState(!autoplay);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentQuality, setCurrentQuality] = useState("hd1080");
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [violationWarning, setViolationWarning] = useState<string | null>(null);

  // Hook de proteção
  const {
    session,
    isLoading: sessionLoading,
    isActive,
    startSession,
    endSession,
    reportViolation,
    sendHeartbeat,
    watermarkData,
    riskScore,
  } = useVideoFortress({
    videoId,
    lessonId,
    courseId,
    provider: type,
    enableHeartbeat: true,
    enableViolationDetection: true,
    onSessionRevoked: () => {
      setIsPlaying(false);
      setViolationWarning('Sessão encerrada em outro dispositivo');
    },
    onSessionExpired: () => {
      setIsPlaying(false);
      toast.info('Sessão expirada. Recarregue para continuar.');
    },
    onViolation: (violationType, action) => {
      if (action === 'pause' || action === 'revoke') {
        setIsPlaying(false);
        pauseVideo();
      }
      if (action === 'warn') {
        setViolationWarning('Atividade suspeita detectada');
        setTimeout(() => setViolationWarning(null), 5000);
      }
    },
  });

  // URLs
  const thumbnailUrl = thumbnail || 
    (type === "youtube" ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);

  const embedUrl = type === "youtube"
    ? `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
        ...FORTRESS_YT_PARAMS,
        autoplay: autoplay ? "1" : "0",
      }).toString()}`
    : `https://player-vz-${videoId.split('-')[0]}.tv.pandavideo.com.br/embed/?v=${videoId}`;

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  useEffect(() => {
    if (user && !session && !sessionLoading) {
      startSession();
    }
  }, [user, session, sessionLoading, startSession]);

  // YouTube IFrame API
  useEffect(() => {
    if (type !== "youtube" || showThumbnail || !session) return;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = initPlayer;
    };

    const initPlayer = () => {
      if (playerRef.current || !containerRef.current) return;

      const playerId = `omega-player-${videoId}-${Date.now()}`;
      const container = containerRef.current.querySelector('.player-container');
      if (!container) return;

      const playerDiv = document.createElement("div");
      playerDiv.id = playerId;
      playerDiv.className = "w-full h-full";
      container.innerHTML = '';
      container.appendChild(playerDiv);

      playerRef.current = new window.YT.Player(playerId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { ...FORTRESS_YT_PARAMS, controls: 0, autoplay: autoplay ? 1 : 0 },
        events: {
          onReady: (e: any) => {
            setIsLoading(false);
            e.target.setPlaybackQuality("hd1080");
            if (autoplay) {
              e.target.playVideo();
              setIsPlaying(true);
            }
          },
          onStateChange: (e: any) => {
            switch (e.data) {
              case 1: setIsPlaying(true); setIsLoading(false); break;
              case 2: setIsPlaying(false); break;
              case 0: setIsPlaying(false); onComplete?.(); endSession(); break;
              case 3: setIsLoading(true); break;
            }
          },
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, type, showThumbnail, autoplay, session, onComplete, endSession]);

  // Progress tracking
  useEffect(() => {
    if (!isPlaying || !playerRef.current) return;

    const interval = setInterval(() => {
      const current = playerRef.current?.getCurrentTime?.() || 0;
      const duration = playerRef.current?.getDuration?.() || 1;
      const progress = (current / duration) * 100;
      onProgress?.(progress);
      sendHeartbeat(Math.floor(current));
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, onProgress, sendHeartbeat]);

  // Auto-hide controls
  useEffect(() => {
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
  }, []);

  // ============================================
  // CONTROLES
  // ============================================
  const handlePlayPause = useCallback(() => {
    if (showThumbnail) {
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
    }
  }, [showThumbnail, isPlaying]);

  const pauseVideo = useCallback(() => {
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setCurrentSpeed(speed);
    playerRef.current?.setPlaybackRate?.(speed);
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    setCurrentQuality(quality);
    playerRef.current?.setPlaybackQuality?.(quality);
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) playerRef.current.unMute?.();
      else playerRef.current.mute?.();
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) document.exitFullscreen();
      else containerRef.current.requestFullscreen();
    }
  }, []);

  // ============================================
  // PROTEÇÕES CSS
  // ============================================
  const protectionStyles: React.CSSProperties = {
    userSelect: "none",
    WebkitUserSelect: "none",
    pointerEvents: "auto",
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      ref={containerRef}
      className={cn("relative group bg-black rounded-xl overflow-hidden", className)}
      style={protectionStyles}
      onContextMenu={(e) => { e.preventDefault(); reportViolation('context_menu', 1); }}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* Aspect Ratio Container */}
      <div className="aspect-video relative">
        
        {/* Thumbnail State */}
        {showThumbnail && thumbnailUrl && (
          <div className="absolute inset-0 cursor-pointer z-10" onClick={handlePlayPause}>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black animate-pulse" />
            )}
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={cn("w-full h-full object-cover transition-opacity", imageLoaded ? "opacity-100" : "opacity-0")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
            
            {/* Play Button */}
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
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold text-sm md:text-base truncate">{title}</h3>
            </div>
          </div>
        )}

        {/* Video Player */}
        {!showThumbnail && (
          <div className="player-container absolute inset-0" />
        )}

        {/* Loading */}
        <AnimatePresence>
          {(isLoading || sessionLoading) && !showThumbnail && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/70 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Violation Warning */}
        <AnimatePresence>
          {violationWarning && (
            <motion.div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{violationWarning}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watermark Dinâmica */}
        {showWatermark && watermarkData && !showThumbnail && (
          <WatermarkOverlay text={watermarkData.text} />
        )}

        {/* Escudos de Proteção */}
        <div className="absolute top-0 left-0 right-0 h-[60px] z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
        <div className="absolute bottom-0 left-0 right-0 h-[70px] z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
        <div className="absolute top-0 bottom-0 left-0 w-[80px] z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
        <div className="absolute top-0 bottom-0 right-0 w-[80px] z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />

        {/* Custom Controls */}
        {!showThumbnail && (
          <AnimatePresence>
            {showControls && (
              <motion.div
                className="absolute inset-0 z-30 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Top gradient */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />
                
                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                    {showSecurityBadge && (
                      <div className="flex items-center gap-1.5 bg-green-600/80 px-2 py-1 rounded-full">
                        <Shield className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-medium">PROTEGIDO</span>
                      </div>
                    )}
                    {session && (
                      <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                        <Lock className="w-3 h-3 text-white/70" />
                        <span className="text-[10px] text-white/70">{session.sessionCode}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-white/60 truncate max-w-[200px]">{title}</span>
                </div>

                {/* Center play/pause */}
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

                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <button onClick={handlePlayPause} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                      {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                    </button>
                    <button onClick={handleMuteToggle} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                      {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                          <Settings className="w-5 h-5 text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/90 border-white/10">
                        <DropdownMenuLabel className="text-white/70 text-xs">Velocidade</DropdownMenuLabel>
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <DropdownMenuItem
                            key={speed.value}
                            onClick={() => handleSpeedChange(speed.value)}
                            className={cn("text-white hover:bg-white/10", currentSpeed === speed.value && "bg-primary/20")}
                          >
                            {speed.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuLabel className="text-white/70 text-xs">Qualidade</DropdownMenuLabel>
                        {VIDEO_QUALITIES.map((quality) => (
                          <DropdownMenuItem
                            key={quality.value}
                            onClick={() => handleQualityChange(quality.value)}
                            className={cn("text-white hover:bg-white/10", currentQuality === quality.value && "bg-primary/20")}
                          >
                            {quality.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <button onClick={handleFullscreen} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                      <Maximize className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* CSS de proteção específico */}
      <style>{`
        .player-container iframe {
          pointer-events: auto !important;
        }
        .player-container iframe::-webkit-media-controls-download-button,
        .player-container iframe::-webkit-media-controls-watch-youtube-button {
          display: none !important;
        }
      `}</style>
    </div>
  );
});

OmegaFortressPlayer.displayName = "OmegaFortressPlayer";

// ============================================
// WATERMARK COMPONENT
// ============================================
const WatermarkOverlay = memo(({ text }: { text: string }) => {
  const [position, setPosition] = useState({ x: 10, y: 15 });

  useEffect(() => {
    const positions = [
      { x: 10, y: 15 }, { x: 70, y: 20 }, { x: 20, y: 50 },
      { x: 65, y: 55 }, { x: 15, y: 80 }, { x: 75, y: 85 },
    ];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % positions.length;
      setPosition(positions[index]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="absolute z-50 pointer-events-none select-none"
      animate={{ left: `${position.x}%`, top: `${position.y}%` }}
      transition={{ duration: 3, ease: "easeInOut" }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-mono tracking-[0.15em] text-[10px] sm:text-xs text-white/10 whitespace-nowrap">
          {text}
        </span>
      </div>
    </motion.div>
  );
});

WatermarkOverlay.displayName = "WatermarkOverlay";

export default OmegaFortressPlayer;

// ============================================
// DECLARAÇÃO GLOBAL
// ============================================
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
