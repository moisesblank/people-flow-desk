// ============================================
// LAZY VIDEO PLAYER 2300
// Click-to-load: NO iframe/video before click
// Performance-first, accessible, mobile-optimized
// 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
// ============================================

import { memo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Loader2, Volume2, VolumeX, Maximize, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFuturisticUI } from "@/hooks/useFuturisticUI";
import { Button } from "@/components/ui/button";
import { VideoDisclaimer, useVideoDisclaimer } from "@/components/video/VideoDisclaimer";
import { SacredImage } from "@/components/performance/SacredImage";

// ============================================
// TYPES
// ============================================
export interface LazyVideoPlayerProps {
  videoId: string;
  type?: "youtube" | "panda" | "vimeo";
  title?: string;
  thumbnail?: string;
  className?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
  onPlay?: () => void;
  onError?: (error: string) => void;
}

// ============================================
// YOUTUBE PARAMS (minimal, privacy-focused)
// ============================================
const YT_PARAMS = new URLSearchParams({
  rel: "0",
  modestbranding: "1",
  iv_load_policy: "3",
  playsinline: "1",
  autoplay: "1", // Autoplay after click
}).toString();

// ============================================
// THUMBNAIL GENERATOR
// ============================================
function getYouTubeThumbnail(videoId: string, quality: "default" | "hq" | "maxres" = "hq"): string {
  const qualityMap = {
    default: "hqdefault",
    hq: "hqdefault",
    maxres: "maxresdefault",
  };
  return `https://i.ytimg.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

// ============================================
// MAIN COMPONENT
// ============================================
export const LazyVideoPlayer = memo(function LazyVideoPlayer({
  videoId,
  type = "youtube",
  title = "Vídeo",
  thumbnail,
  className,
  aspectRatio = "16/9",
  onPlay,
  onError,
}: LazyVideoPlayerProps) {
  const ui = useFuturisticUI();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
  const { showDisclaimer, disclaimerCompleted, startDisclaimer, handleDisclaimerComplete } = useVideoDisclaimer();
  
  // States
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Get thumbnail URL
  const posterUrl = thumbnail || (type === "youtube" ? getYouTubeThumbnail(videoId) : undefined);
  
  // Build embed URL (only when activated)
  const getEmbedUrl = useCallback(() => {
    switch (type) {
      case "youtube":
        return `https://www.youtube.com/embed/${videoId}?${YT_PARAMS}`;
      case "panda":
        // 🐼 Panda Video: Usar Library ID canônico (src/lib/video/panda.ts)
        return `https://player-vz-c3e3c21e-7ce.tv.pandavideo.com.br/embed/?v=${videoId}`;
      case "vimeo":
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&dnt=1`;
      default:
        return "";
    }
  }, [videoId, type]);
  
  // 🔥 AUTO-FULLSCREEN v17.0: Ativar fullscreen ao iniciar vídeo
  const requestAutoFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    // Detectar iOS/Safari que não suporta requestFullscreen em elementos
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS || (isSafari && !document.fullscreenEnabled)) {
      console.log('[LazyVideoPlayer] ⚠️ iOS/Safari detectado - fullscreen nativo não suportado');
      return;
    }
    
    try {
      const container = containerRef.current;
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          console.log('[LazyVideoPlayer] ⚠️ Fullscreen recusado pelo navegador');
        });
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
    } catch (e) {
      console.log('[LazyVideoPlayer] ⚠️ Erro ao solicitar fullscreen:', e);
    }
  }, []);

  // Handle play button click - COM DISCLAIMER OBRIGATÓRIO
  const handlePlay = useCallback(() => {
    // 🔒 DISCLAIMER: Exibir aviso legal por 3 segundos antes de iniciar
    if (startDisclaimer()) {
      return; // Aguardar disclaimer completar
    }
    
    setIsLoading(true);
    setIsActivated(true);
    onPlay?.();
    
    // 🔥 AUTO-FULLSCREEN: Ativar após iniciar vídeo
    requestAutoFullscreen();
  }, [onPlay, startDisclaimer, requestAutoFullscreen]);
  
  // Callback quando disclaimer completar
  const onDisclaimerComplete = useCallback(() => {
    handleDisclaimerComplete();
    setIsLoading(true);
    setIsActivated(true);
    onPlay?.();
    
    // 🔥 AUTO-FULLSCREEN: Ativar após disclaimer completar
    requestAutoFullscreen();
  }, [handleDisclaimerComplete, onPlay, requestAutoFullscreen]);
  
  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.("Failed to load video");
  }, [onError]);
  
  // Aspect ratio classes
  const aspectClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
  };
  
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl bg-black",
        aspectClasses[aspectRatio],
        className
      )}
      role="region"
      aria-label={`Video player: ${title}`}
    >
      {/* 🔒 DISCLAIMER OVERLAY - OBRIGATÓRIO EM TODOS OS VÍDEOS */}
      <VideoDisclaimer 
        isVisible={showDisclaimer} 
        onComplete={onDisclaimerComplete} 
      />
      
      {/* State: Not activated - Show poster + play button */}
      {!isActivated && !showDisclaimer && (
        <>
          {/* Poster image (lazy loaded) */}
          {posterUrl && (
            <div className={cn(
              "absolute inset-0 transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}>
              <SacredImage
                src={posterUrl}
                alt={`Thumbnail: ${title}`}
                className="w-full h-full"
                objectFit="cover"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </div>
          )}
          
          {/* Placeholder while image loads */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-ai-surface to-background animate-pulse" />
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          {/* Play button - ACCESSIBLE */}
          <button
            onClick={handlePlay}
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "group cursor-pointer focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-holo-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            )}
            aria-label={`Reproduzir vídeo: ${title}`}
          >
            <motion.div
              className={cn(
                "flex items-center justify-center",
                "w-16 h-16 md:w-20 md:h-20 rounded-full",
                "bg-holo-cyan/90 text-black",
                "shadow-[0_0_30px_hsl(var(--holo-cyan)/0.4)]",
                "transition-transform duration-200"
              )}
              whileHover={ui.shouldAnimate ? { scale: 1.1 } : undefined}
              whileTap={ui.shouldAnimate ? { scale: 0.95 } : undefined}
            >
              <Play className="w-8 h-8 md:w-10 md:h-10 ml-1" fill="currentColor" />
            </motion.div>
          </button>
          
          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white text-sm md:text-base font-medium line-clamp-2 drop-shadow-lg">
              {title}
            </p>
          </div>
        </>
      )}
      
      {/* State: Activated - Load iframe */}
      {isActivated && !hasError && (
        <>
          {/* Loading spinner */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-black z-10"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-holo-cyan animate-spin" />
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Iframe - Only rendered after click */}
          <iframe
            src={getEmbedUrl()}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title}
            loading="lazy"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </>
      )}
      
      {/* State: Error */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4">
          <AlertCircle className="w-12 h-12 text-destructive mb-3" />
          <p className="text-foreground font-medium mb-2">Erro ao carregar vídeo</p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Verifique sua conexão e tente novamente
          </p>
          <Button
            variant="holo"
            size="sm"
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
});

LazyVideoPlayer.displayName = "LazyVideoPlayer";
