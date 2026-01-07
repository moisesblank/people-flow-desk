// ============================================
// 🔥 OMEGA FORTRESS PLAYER v3.0 - ULTRA SECURED
// Sistema de Proteção de Vídeos MÁXIMO
// 7 CAMADAS DE PROTEÇÃO + SANCTUM 2.0
// Design 2300 - Futurista
// ============================================

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Settings, Loader2, Volume2, VolumeX, 
  Maximize, Shield, Lock, AlertTriangle, Eye, Zap,
  ChevronRight, Crown, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPandaEmbedUrl } from "@/lib/video/panda";
import { useVideoFortress, VideoViolationType, ViolationAction } from "@/hooks/useVideoFortress";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useDeviceConstitution } from "@/hooks/useDeviceConstitution";
import { supabase } from "@/integrations/supabase/client";
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
  type?: "youtube" | "panda" | "vimeo";
  title?: string;
  thumbnail?: string;
  className?: string;
  autoplay?: boolean;
  lessonId?: string;
  courseId?: string;
  showSecurityBadge?: boolean;
  showWatermark?: boolean;
  showRiskIndicator?: boolean;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
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
  { label: "4K", value: "hd2160" },
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
  cc_load_policy: "0",
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
  showRiskIndicator = false,
  onComplete,
  onProgress,
  onError,
}: OmegaFortressPlayerProps) => {
  const { user } = useAuth();
  const { isOwner, isAdmin, isBeta, roleLabel, isFuncionarioOrAbove } = useRolePermissions();
  const { isMobile, isTouch } = useDeviceConstitution();
  
  // Verificar imunidade
  const isImmuneUser = isOwner || isAdmin || isFuncionarioOrAbove;
  
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
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  // Panda DRM: src assinada (token + expires). Sem isso, o player do Panda falha quando DRM via API está ativo.
  const [pandaSignedSrc, setPandaSignedSrc] = useState<string | null>(null);

  const extractPandaVideoId = useCallback((raw: string): string => {
    // Aceita UUID puro
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) return raw;

    // Aceita URL de embed do Panda (ou qualquer URL com query v=)
    try {
      const u = new URL(raw);
      const v = u.searchParams.get('v');
      if (v) return v;
    } catch {
      // ignore
    }

    // Fallback: regex simples
    const m = raw.match(/[?&]v=([a-zA-Z0-9-]+)/);
    return m?.[1] || raw;
  }, []);

  // Hook de proteção FORTRESS
  const {
    session,
    isLoading: sessionLoading,
    error: sessionError,
    isActive,
    startSession,
    endSession,
    reportViolation,
    sendHeartbeat,
    watermarkData,
    riskScore,
    riskLevel,
    isImmune,
    protectionStats,
  } = useVideoFortress({
    videoId,
    lessonId,
    courseId,
    provider: type,
    enableHeartbeat: true,
    enableViolationDetection: !isImmuneUser,
    enableAntiDevTools: !isImmuneUser,
    enableAntiScreenshot: !isImmuneUser,
    onSessionRevoked: () => {
      setIsPlaying(false);
      setViolationWarning('Sessão encerrada em outro dispositivo');
    },
    onSessionExpired: () => {
      setIsPlaying(false);
      toast.info('Sessão expirada. Recarregue para continuar.');
    },
    onViolation: handleViolation,
    onRiskLevelChange: (level) => {
      if (level === 'critical') {
        toast.error('🚨 Risco crítico detectado!');
      }
    },
  });

  // Patch: se a sessão falhar, nunca deixar o player preso em "Iniciando sessão segura..."
  useEffect(() => {
    if (sessionError) {
      setIsLoading(false);
    }
  }, [sessionError]);

  // Handler de violações
  function handleViolation(violationType: VideoViolationType, action: ViolationAction) {
    if (action === 'pause' || action === 'revoke') {
      setIsPlaying(false);
      pauseVideo();
    }
    if (action === 'warn') {
      setViolationWarning('Atividade suspeita detectada');
      setTimeout(() => setViolationWarning(null), 5000);
    }
  }

  // URLs
  const thumbnailUrl = useMemo(() => {
    if (thumbnail) return thumbnail;
    if (type === "youtube") return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    return null;
  }, [thumbnail, type, videoId]);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      ...FORTRESS_YT_PARAMS,
      autoplay: autoplay ? "1" : "0",
    }).toString();

    switch (type) {
      case "youtube":
        return `https://www.youtube.com/embed/${videoId}?${params}`;
      case "panda": {
        // PATCH P0: se vier embed completo (Excel/legado), usar direto.
        // Se vier UUID, gerar embed canônico.
        if (/^https?:\/\//i.test(videoId)) return videoId;
        return getPandaEmbedUrl(videoId);
      }
      case "vimeo":
        return `https://player.vimeo.com/video/${videoId}?dnt=1&title=0&byline=0&portrait=0`;
      default:
        return "";
    }
  }, [type, videoId, autoplay]);

  // Panda DRM: sempre buscar URL assinada quando for Panda e o player estiver ativo.
  // Sem essa etapa, o embed sem token resulta em "This video encountered an error".
  useEffect(() => {
    if (type !== 'panda') {
      setPandaSignedSrc(null);
      return;
    }

    if (showThumbnail) return; // só quando o usuário iniciou o player

    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        setPandaSignedSrc(null);

        // Preferir lessonId (faz check de acesso + logs + watermark no backend)
        if (lessonId) {
          const { data, error } = await supabase.functions.invoke('get-panda-signed-url', {
            body: { lessonId },
          });
          if (error) throw error;
          if (!data?.signedUrl) throw new Error('signedUrl ausente');
          if (!cancelled) setPandaSignedSrc(String(data.signedUrl));
          return;
        }

        // Fallback: assinar por videoId
        const vId = extractPandaVideoId(videoId);
        const { data, error } = await supabase.functions.invoke('secure-video-url', {
          body: { action: 'get_panda_url', videoId: vId },
        });
        if (error) throw error;
        if (!data?.videoUrl) throw new Error('videoUrl ausente');
        if (!cancelled) setPandaSignedSrc(String(data.videoUrl));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao obter URL DRM do Panda';
        console.error('[OmegaFortressPlayer] Panda DRM URL error:', e);
        toast.error('Erro ao carregar vídeo', { description: msg });
        onError?.(msg);
        if (!cancelled) setPandaSignedSrc(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [type, showThumbnail, lessonId, videoId, extractPandaVideoId, onError]);

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  useEffect(() => {
    if (user && !session && !sessionLoading) {
      // Patch: se falhar, paramos o loading para mostrar erro + retry
      startSession().then((ok) => {
        if (!ok) setIsLoading(false);
      });
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
            e.target.setPlaybackQuality(currentQuality);
            if (autoplay) {
              e.target.playVideo();
              setIsPlaying(true);
            }
          },
          onStateChange: (e: any) => {
            switch (e.data) {
              case 1: setIsPlaying(true); setIsLoading(false); break;
              case 2: setIsPlaying(false); break;
              case 0: 
                setIsPlaying(false); 
                onComplete?.(); 
                endSession(); 
                break;
              case 3: setIsLoading(true); break;
            }
          },
          onError: (e: any) => {
            onError?.(`YouTube Error: ${e.data}`);
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
  }, [videoId, type, showThumbnail, autoplay, session, onComplete, endSession, currentQuality, onError]);

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
      container.addEventListener("touchstart", handleMouseMove, { passive: true });
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
  // ESTILOS DE PROTEÇÃO
  // ============================================
  const protectionStyles: React.CSSProperties = {
    userSelect: "none",
    WebkitUserSelect: "none",
    pointerEvents: "auto",
    WebkitTouchCallout: "none",
  };

  // Risk level colors
  const riskColors = useMemo(() => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  }, [riskLevel]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative group bg-black rounded-xl overflow-hidden",
        "ring-1 ring-white/10",
        className
      )}
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
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-pulse" />
            )}
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-500",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
            
            {/* Play Button - Design 2300 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                className={cn(
                  "w-20 h-20 md:w-24 md:h-24 rounded-full",
                  "bg-gradient-to-br from-primary via-primary/90 to-primary/70",
                  "hover:from-primary/90 hover:to-primary",
                  "flex items-center justify-center",
                  "shadow-[0_0_60px_rgba(var(--primary-rgb),0.4)]",
                  "ring-4 ring-white/20"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
              </motion.button>
            </div>

            {/* Title + Badge Owner/Admin */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-2">
                {isImmune && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full">
                    <Crown className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase">Acesso Master</span>
                  </div>
                )}
              </div>
              <h3 className="text-white font-semibold text-sm md:text-base truncate drop-shadow-lg">
                {title}
              </h3>
            </div>
          </div>
        )}

        {/* Video Player */}
        {!showThumbnail && (
          <>
            {/* YouTube: JS API inicializa no container */}
            {type === "youtube" && <div className="player-container absolute inset-0" />}
            
            {/* PANDA: DRM via API exige URL assinada (token + expires) */}
            {type === "panda" && pandaSignedSrc && (
              <iframe
                key={pandaSignedSrc}
                src={pandaSignedSrc}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                frameBorder="0"
                onLoad={() => setIsLoading(false)}
                title={title}
              />
            )}
            
            {/* Vimeo: iframe básico */}
            {type === "vimeo" && session && (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                frameBorder="0"
                onLoad={() => setIsLoading(false)}
                title={title}
              />
            )}
          </>
        )}

        {/* Loading / Error gate */}
        {/* PATCH: Para Panda, não bloquear por sessionLoading pois o iframe tem sua própria proteção */}
        <AnimatePresence>
          {(isLoading || (type !== "panda" && sessionLoading)) && !showThumbnail && !sessionError && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <span className="text-white/70 text-sm">Iniciando sessão segura...</span>
            </motion.div>
          )}

          {sessionError && !showThumbnail && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 gap-3 p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 text-white">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="font-semibold">Não foi possível iniciar a sessão segura</span>
              </div>
              <p className="text-sm text-white/70 max-w-md break-words">
                {sessionError}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
                  onClick={() => {
                    setIsLoading(true);
                    startSession().then((ok) => {
                      if (!ok) setIsLoading(false);
                    });
                  }}
                >
                  Tentar novamente
                </button>
                <button
                  className="px-3 py-2 rounded-md bg-white/10 text-white text-sm"
                  onClick={() => {
                    onError?.(sessionError);
                  }}
                >
                  Detalhes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Violation Warning */}
        <AnimatePresence>
          {violationWarning && (
            <motion.div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
            >
              <div className="bg-red-600/95 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-sm">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">{violationWarning}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watermark Dinâmica - ULTRA */}
        {/* SEMPRE exibir watermark quando sessão existir, mesmo durante loading do player */}
        {showWatermark && session?.watermark?.text && !showThumbnail && (
          <WatermarkOverlay 
            text={session.watermark.text} 
            mode={(session.watermark.mode || 'moving') as 'moving' | 'static' | 'diagonal'} 
            isImmune={isImmune}
          />
        )}

        {/* Escudos de Proteção - Invisíveis */}
        {/* PATCH: Panda precisa receber clique direto no iframe para dar play */}
        {type !== "panda" && (
          <>
            <div className="absolute top-0 left-0 right-0 h-[60px] z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
            <div className="absolute bottom-0 left-0 right-0 h-[70px] z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
            <div className="absolute top-0 bottom-0 left-0 w-[80px] z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
            <div className="absolute top-0 bottom-0 right-0 w-[80px] z-40 pointer-events-auto" onClick={(e) => e.stopPropagation()} />
          </>
        )}

        {/* Custom Controls */}
        {/* PATCH: não renderizar overlays de controle por cima do Panda */}
        {type !== "panda" && !showThumbnail && (
          <AnimatePresence>
            {showControls && (
              <motion.div
                className="absolute inset-0 z-30 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Top gradient */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
                
                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                    {showSecurityBadge && (
                      <motion.div 
                        className="flex items-center gap-1.5 bg-green-600/90 px-2 py-1 rounded-full cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                      >
                        <ShieldCheck className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-medium">PROTEGIDO</span>
                      </motion.div>
                    )}
                    {session && (
                      <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Lock className="w-3 h-3 text-white/70" />
                        <span className="text-[10px] text-white/70 font-mono">{session.sessionCode}</span>
                      </div>
                    )}
                    {showRiskIndicator && !isImmune && (
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", riskColors)} />
                    )}
                  </div>
                  <span className="text-xs text-white/60 truncate max-w-[200px]">{title}</span>
                </div>

                {/* Security Info Panel */}
                <AnimatePresence>
                  {showSecurityInfo && (
                    <motion.div
                      className="absolute top-14 left-3 bg-black/90 backdrop-blur-md rounded-lg p-3 pointer-events-auto z-50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h4 className="text-white font-semibold text-xs mb-2 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-green-500" />
                        Status de Segurança
                      </h4>
                      <div className="space-y-1 text-[10px] text-white/70">
                        <div className="flex justify-between gap-4">
                          <span>Nível de Risco:</span>
                          <span
                            className={cn("font-medium", {
                              'text-green-400': riskLevel === 'low',
                              'text-yellow-400': riskLevel === 'medium',
                              'text-orange-400': riskLevel === 'high',
                              'text-red-400': riskLevel === 'critical',
                            })}
                          >
                            {riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Heartbeats:</span>
                          <span className="text-white">{protectionStats.heartbeatsSent}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Violações Bloqueadas:</span>
                          <span className="text-white">{protectionStats.violationsBlocked}</span>
                        </div>
                        {isImmune && (
                          <div className="mt-2 pt-2 border-t border-white/10 text-amber-400">
                            <Crown className="w-3 h-3 inline mr-1" />
                            SANCTUM: Imunidade Ativa
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Center play/pause */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                  <motion.button
                    className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center ring-1 ring-white/20"
                    onClick={handlePlayPause}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 text-white" fill="white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" fill="white" />
                    )}
                  </motion.button>
                </div>

                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/90 to-transparent" />

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-auto">
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

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                          <Settings className="w-5 h-5 text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/95 border-white/10 backdrop-blur-md">
                        <DropdownMenuLabel className="text-white/70 text-xs">
                          <Zap className="w-3 h-3 inline mr-1" />
                          Velocidade
                        </DropdownMenuLabel>
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <DropdownMenuItem
                            key={speed.value}
                            onClick={() => handleSpeedChange(speed.value)}
                            className={cn(
                              "text-white hover:bg-white/10",
                              currentSpeed === speed.value && "bg-primary/20 text-primary"
                            )}
                          >
                            <ChevronRight
                              className={cn(
                                "w-3 h-3 mr-2 opacity-0",
                                currentSpeed === speed.value && "opacity-100"
                              )}
                            />
                            {speed.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuLabel className="text-white/70 text-xs">
                          <Eye className="w-3 h-3 inline mr-1" />
                          Qualidade
                        </DropdownMenuLabel>
                        {VIDEO_QUALITIES.map((quality) => (
                          <DropdownMenuItem
                            key={quality.value}
                            onClick={() => handleQualityChange(quality.value)}
                            className={cn(
                              "text-white hover:bg-white/10",
                              currentQuality === quality.value && "bg-primary/20 text-primary"
                            )}
                          >
                            <ChevronRight
                              className={cn(
                                "w-3 h-3 mr-2 opacity-0",
                                currentQuality === quality.value && "opacity-100"
                              )}
                            />
                            {quality.label}
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

      </div>

      {/* CSS de proteção */}
      <style>{`
        .player-container iframe {
          pointer-events: auto !important;
        }
        .player-container iframe::-webkit-media-controls-download-button,
        .player-container iframe::-webkit-media-controls-watch-youtube-button {
          display: none !important;
        }
        @media print {
          .player-container { display: none !important; }
        }
      `}</style>
    </div>
  );
});

OmegaFortressPlayer.displayName = "OmegaFortressPlayer";

// ============================================
// WATERMARK COMPONENT - ULTRA
// ============================================
interface WatermarkProps {
  text: string;
  mode: 'moving' | 'static' | 'diagonal';
  isImmune?: boolean;
}

const WatermarkOverlay = memo(({ text, mode, isImmune }: WatermarkProps) => {
  const [position, setPosition] = useState({ x: 10, y: 15 });

  useEffect(() => {
    if (mode === 'static') return;

    const positions = [
      { x: 10, y: 15 }, { x: 70, y: 20 }, { x: 20, y: 50 },
      { x: 65, y: 55 }, { x: 15, y: 80 }, { x: 75, y: 85 },
      { x: 40, y: 35 }, { x: 55, y: 70 },
    ];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % positions.length;
      setPosition(positions[index]);
    }, 12000); // 12 segundos

    return () => clearInterval(interval);
  }, [mode]);

  if (mode === 'static') {
    return (
      <div className="absolute inset-0 z-50 pointer-events-none select-none overflow-hidden">
        <div className="absolute bottom-4 right-4">
          <span className="font-mono tracking-wider text-sm sm:text-base text-white/20 whitespace-nowrap drop-shadow-md">
            {text}
          </span>
        </div>
      </div>
    );
  }

  if (mode === 'diagonal') {
    return (
      <div className="absolute inset-0 z-50 pointer-events-none select-none overflow-hidden">
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: 'rotate(-30deg)' }}
        >
          <span className="font-mono tracking-[0.3em] text-base sm:text-lg text-white/15 whitespace-nowrap drop-shadow-md">
            {text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute z-50 pointer-events-none select-none"
      animate={{ left: `${position.x}%`, top: `${position.y}%` }}
      transition={{ duration: 4, ease: "easeInOut" }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-mono tracking-[0.15em] text-sm sm:text-base text-white/25 whitespace-nowrap drop-shadow-md">
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
