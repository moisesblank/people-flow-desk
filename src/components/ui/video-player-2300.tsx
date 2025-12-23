// ============================================
// VIDEO PLAYER 2300 - Poster + Play Premium
// Lazy load: vídeo só carrega no clique
// GPU-only animations (LEI I Art.19-21)
// ============================================

import { memo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { useFuturisticUI } from "@/hooks/useFuturisticUI";

interface VideoPlayer2300Props {
  src: string;
  poster: string;
  title?: string;
  className?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "9/16";
  onPlay?: () => void;
}

export const VideoPlayer2300 = memo(function VideoPlayer2300({
  src,
  poster,
  title,
  className,
  aspectRatio = "16/9",
  onPlay,
}: VideoPlayer2300Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { shouldAnimate } = useFuturisticUI();

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const aspectRatioClass = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "9/16": "aspect-[9/16]",
  };

  // Se está tocando, mostra o vídeo
  if (isPlaying) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden bg-black", aspectRatioClass[aspectRatio], className)}>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <iframe
          src={src}
          title={title || "Video"}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    );
  }

  // Poster com botão de play
  return (
    <div
      className={cn(
        "player-2300",
        aspectRatioClass[aspectRatio],
        className
      )}
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      aria-label={`Play ${title || "video"}`}
      onKeyDown={(e) => e.key === "Enter" && handlePlay()}
    >
      {/* Poster image */}
      <img
        src={poster}
        alt={title || "Video thumbnail"}
        className={cn(
          "player-2300-poster",
          !shouldAnimate && "transition-none"
        )}
        loading="lazy"
        decoding="async"
      />
      
      {/* Overlay */}
      <div className="player-2300-overlay">
        {/* Play button */}
        <div className={cn("player-2300-play", !shouldAnimate && "transition-none")}>
          <Play className="fill-current" />
        </div>
      </div>
      
      {/* Title overlay (optional) */}
      {title && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-medium text-sm md:text-base line-clamp-2">
            {title}
          </p>
        </div>
      )}
    </div>
  );
});

VideoPlayer2300.displayName = "VideoPlayer2300";
