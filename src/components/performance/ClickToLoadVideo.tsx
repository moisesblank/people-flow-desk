// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - ClickToLoadVideo
// Player lazy nível NASA - Zero download antes do clique
// LEI I Art. 7-9: Otimização de mídia
// 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
// ============================================

import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import { Play, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPandaEmbedUrl } from "@/lib/video/panda";
import { getPerformanceConfig } from "@/lib/performance/performanceFlags";
import { VideoDisclaimer, useVideoDisclaimer } from "@/components/video/VideoDisclaimer";

// ============================================
// TIPOS
// ============================================
interface ClickToLoadVideoProps {
  // Origem
  src?: string;
  embedUrl?: string;
  pandaVideoId?: string;
  youtubeId?: string;
  vimeoId?: string;
  
  // Metadados
  title?: string;
  duration?: string;
  
  // Visual
  poster?: string;
  posterAlt?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "9/16";
  
  // Comportamento
  autoplayOnClick?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  
  // Callbacks
  onPlay?: () => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  
  // Estilo
  className?: string;
  playButtonSize?: "sm" | "md" | "lg" | "xl";
  showDuration?: boolean;
  showTitle?: boolean;
  
  // Proteção
  protectedMode?: boolean;
  watermarkText?: string;
}

// ============================================
// CONSTANTES
// ============================================
const PLAY_BUTTON_SIZES = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
  xl: "w-28 h-28",
};

const PLAY_ICON_SIZES = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const ASPECT_RATIOS = {
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "9/16": "aspect-[9/16]",
};

// Placeholder SVG inline (evita request)
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%230a0a0f' width='16' height='9'/%3E%3Cpolygon fill='%23ffffff15' points='6,2.5 6,6.5 10,4.5'/%3E%3C/svg%3E`;

// ============================================
// GERAR URL DE EMBED
// ============================================
function generateEmbedUrl(props: Pick<ClickToLoadVideoProps, 'embedUrl' | 'youtubeId' | 'vimeoId' | 'pandaVideoId'>): string | null {
  if (props.embedUrl) return props.embedUrl;
  
  if (props.youtubeId) {
    return `https://www.youtube.com/embed/${props.youtubeId}?autoplay=1&rel=0&modestbranding=1`;
  }
  
  if (props.vimeoId) {
    return `https://player.vimeo.com/video/${props.vimeoId}?autoplay=1`;
  }
  
  if (props.pandaVideoId) {
    return getPandaEmbedUrl(props.pandaVideoId);
  }
  
  return null;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ClickToLoadVideo = memo(function ClickToLoadVideo({
  src,
  embedUrl,
  pandaVideoId,
  youtubeId,
  vimeoId,
  title,
  duration,
  poster,
  posterAlt = "Thumbnail do vídeo",
  aspectRatio = "16/9",
  autoplayOnClick = true,
  muted = false,
  controls = true,
  loop = false,
  onPlay,
  onLoad,
  onError,
  className,
  playButtonSize = "lg",
  showDuration = true,
  showTitle = true,
  protectedMode = false,
  watermarkText,
}: ClickToLoadVideoProps) {
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA
  const { 
    showDisclaimer, 
    disclaimerCompleted, 
    startDisclaimer, 
    handleDisclaimerComplete 
  } = useVideoDisclaimer();

  // Config de performance
  const config = getPerformanceConfig();
  const shouldAnimate = config.enableMotion;

  // Determinar tipo de player
  const isEmbed = !!(embedUrl || youtubeId || vimeoId || pandaVideoId);
  const finalEmbedUrl = generateEmbedUrl({ embedUrl, youtubeId, vimeoId, pandaVideoId });
  const finalPoster = poster || PLACEHOLDER_SVG;

  // ============================================
  // HANDLER DE CLIQUE - COM DISCLAIMER OBRIGATÓRIO
  // ============================================
  const handleClick = useCallback(() => {
    if (isLoaded || isLoading) return;
    
    // 🔒 DISCLAIMER OBRIGATÓRIO - Inicia disclaimer primeiro
    if (!disclaimerCompleted) {
      startDisclaimer();
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    // Pequeno delay para feedback visual
    requestAnimationFrame(() => {
      setIsLoaded(true);
      setIsLoading(false);
      onPlay?.();
      onLoad?.();
    });
  }, [isLoaded, isLoading, onPlay, onLoad, disclaimerCompleted, startDisclaimer]);

  // 🔒 Quando disclaimer completar, carrega o vídeo
  useEffect(() => {
    if (disclaimerCompleted && !isLoaded && !isLoading) {
      setIsLoading(true);
      setHasError(false);
      requestAnimationFrame(() => {
        setIsLoaded(true);
        setIsLoading(false);
        onPlay?.();
        onLoad?.();
      });
    }
  }, [disclaimerCompleted, isLoaded, isLoading, onPlay, onLoad]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    setIsLoading(false);
  }, []);

  const handleVideoError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(new Error("Erro ao carregar vídeo"));
  }, [onError]);

  // ============================================
  // RENDER — ESTADO INICIAL (POSTER + BOTÃO)
  // ============================================
  if (!isLoaded) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-background/50 cursor-pointer group",
          ASPECT_RATIOS[aspectRatio],
          className
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`Reproduzir vídeo${title ? `: ${title}` : ""}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* 🔒 DISCLAIMER OBRIGATÓRIO - VERDADE ABSOLUTA */}
        <VideoDisclaimer 
          isVisible={showDisclaimer} 
          onComplete={handleDisclaimerComplete} 
        />

        {/* Poster/Thumbnail */}
        <img
          src={finalPoster}
          alt={posterAlt}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            shouldAnimate && "transition-transform duration-300",
            isHovered && shouldAnimate && "scale-105"
          )}
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_SVG;
          }}
        />

        {/* Overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/40",
            shouldAnimate && "transition-opacity duration-200",
            isHovered && "bg-black/50"
          )}
        />

        {/* Botão de Play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "rounded-full flex items-center justify-center",
              "bg-primary/90 text-primary-foreground",
              shouldAnimate && "transition-all duration-200",
              isHovered && shouldAnimate && "scale-110 bg-primary",
              PLAY_BUTTON_SIZES[playButtonSize]
            )}
          >
            {isLoading ? (
              <Loader2 className={cn(PLAY_ICON_SIZES[playButtonSize], "animate-spin")} />
            ) : (
              <Play className={cn(PLAY_ICON_SIZES[playButtonSize], "ml-1")} />
            )}
          </div>
        </div>

        {/* Título */}
        {showTitle && title && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white font-medium text-sm line-clamp-2">{title}</p>
          </div>
        )}

        {/* Duração */}
        {showDuration && duration && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded text-white text-xs font-medium">
            {duration}
          </div>
        )}

        {/* Indicador de erro */}
        {hasError && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3"
            onClick={(e) => {
              e.stopPropagation();
              handleRetry();
            }}
          >
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-white text-sm">Erro ao carregar</p>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">
              <RotateCcw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER — PLAYER CARREGADO
  // ============================================
  return (
    <div className={cn("relative overflow-hidden bg-black", ASPECT_RATIOS[aspectRatio], className)}>
      {isEmbed && finalEmbedUrl ? (
        <iframe
          src={finalEmbedUrl}
          title={title || "Video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      ) : src ? (
        <video
          ref={videoRef}
          src={src}
          poster={finalPoster}
          autoPlay={autoplayOnClick}
          muted={muted}
          controls={controls}
          loop={loop}
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
          onError={handleVideoError}
        >
          Seu navegador não suporta vídeos HTML5.
        </video>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Nenhuma fonte de vídeo disponível</p>
        </div>
      )}

      {/* Watermark de proteção */}
      {protectedMode && watermarkText && (
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center select-none"
          style={{ zIndex: 10 }}
        >
          <span 
            className="text-white/10 text-2xl font-bold -rotate-[30deg]"
            style={{ textShadow: "0 0 1px rgba(255,255,255,0.1)" }}
          >
            {watermarkText}
          </span>
        </div>
      )}
    </div>
  );
});

ClickToLoadVideo.displayName = "ClickToLoadVideo";

export default ClickToLoadVideo;
