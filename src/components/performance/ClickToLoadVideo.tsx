// ============================================
// 🌌🔥 CLICK TO LOAD VIDEO — PLAYER LAZY NÍVEL NASA 🔥🌌
// ANO 2300 — ZERO DOWNLOAD ANTES DO CLIQUE
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// REGRA DE OURO: O vídeo NUNCA carrega antes do clique do usuário.
// Isso é crítico para performance em 3G.
//
// ============================================

import React, { useState, useCallback, memo, useRef } from "react";
import { Play, Loader2, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

// ============================================
// PLACEHOLDER SVG (evita request de imagem)
// ============================================
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%231a1a2e' width='16' height='9'/%3E%3Cpolygon fill='%23ffffff20' points='6,2.5 6,6.5 10,4.5'/%3E%3C/svg%3E`;

// ============================================
// GERAR URL DE EMBED
// ============================================
function generateEmbedUrl(props: ClickToLoadVideoProps): string | null {
  if (props.embedUrl) return props.embedUrl;
  
  if (props.youtubeId) {
    return `https://www.youtube.com/embed/${props.youtubeId}?autoplay=1&rel=0&modestbranding=1`;
  }
  
  if (props.vimeoId) {
    return `https://player.vimeo.com/video/${props.vimeoId}?autoplay=1`;
  }
  
  if (props.pandaVideoId) {
    return `https://player-vz-*.tv.pandavideo.com.br/embed/?v=${props.pandaVideoId}`;
  }
  
  return null;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ClickToLoadVideo = memo(({
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
}: ClickToLoadVideoProps) => {
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determinar tipo de player
  const isEmbed = !!(embedUrl || youtubeId || vimeoId || pandaVideoId);
  const finalEmbedUrl = generateEmbedUrl({ embedUrl, youtubeId, vimeoId, pandaVideoId });
  const finalPoster = poster || PLACEHOLDER_SVG;

  // ============================================
  // HANDLER DE CLIQUE — CARREGA O PLAYER
  // ============================================
  const handleClick = useCallback(async () => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Simular pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setIsLoaded(true);
      onPlay?.();
      onLoad?.();
      
    } catch (err) {
      setHasError(true);
      onError?.(err instanceof Error ? err : new Error("Erro ao carregar vídeo"));
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading, onPlay, onLoad, onError]);

  // ============================================
  // RENDER — ESTADO INICIAL (POSTER + BOTÃO)
  // ============================================
  if (!isLoaded) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden bg-black rounded-lg cursor-pointer group",
          className
        )}
        style={{ aspectRatio }}
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
        {/* Poster/Thumbnail */}
        <img
          src={finalPoster}
          alt={posterAlt}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-transform duration-300",
            isHovered && "scale-105"
          )}
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_SVG;
          }}
        />

        {/* Overlay escuro */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-300",
            isHovered ? "opacity-30" : "opacity-40"
          )} 
        />

        {/* Botão de Play */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isLoading ? (
            <div className={cn(
              "flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm",
              PLAY_BUTTON_SIZES[playButtonSize]
            )}>
              <Loader2 className={cn("animate-spin text-white", PLAY_ICON_SIZES[playButtonSize])} />
            </div>
          ) : (
            <button
              className={cn(
                "flex items-center justify-center rounded-full",
                "bg-white/20 backdrop-blur-sm",
                "transition-all duration-300 ease-out",
                "hover:bg-white/30 hover:scale-110",
                "focus:outline-none focus:ring-2 focus:ring-white/50",
                PLAY_BUTTON_SIZES[playButtonSize]
              )}
            >
              <Play 
                className={cn("text-white ml-1", PLAY_ICON_SIZES[playButtonSize])} 
                fill="white"
              />
            </button>
          )}
        </div>

        {/* Título */}
        {showTitle && title && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-white text-sm font-medium line-clamp-2">{title}</h3>
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-white text-sm">Erro ao carregar. Clique para tentar novamente.</p>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER — PLAYER CARREGADO
  // ============================================
  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-black rounded-lg", className)}
      style={{ aspectRatio }}
    >
      {isEmbed && finalEmbedUrl ? (
        // Iframe embed (YouTube, Vimeo, Panda, etc.)
        <iframe
          ref={iframeRef}
          src={finalEmbedUrl}
          title={title || "Video Player"}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          data-sanctum-allowed="true"
        />
      ) : src ? (
        // Video nativo
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
          onError={() => {
            setHasError(true);
            onError?.(new Error("Erro ao carregar vídeo"));
          }}
        >
          Seu navegador não suporta vídeos HTML5.
        </video>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white">Nenhuma fonte de vídeo disponível</p>
        </div>
      )}

      {/* Watermark de proteção */}
      {protectedMode && watermarkText && (
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ zIndex: 10 }}
        >
          <span 
            className="text-white/10 text-2xl font-bold rotate-[-30deg] select-none"
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
