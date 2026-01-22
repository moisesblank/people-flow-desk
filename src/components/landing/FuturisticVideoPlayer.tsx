// ============================================
// FUTURISTIC VIDEO PLAYER - 2300 ULTRA LITE
// USANDO OMEGA FORTRESS PLAYER (7 CAMADAS)
// Player cinematográfico com proteção MÁXIMA + SANCTUM 2.0
// ============================================

import { memo } from "react";
import { OmegaFortressPlayer } from "@/components/video";
import logoMoises from "@/assets/logo-moises-medeiros.png";

interface FuturisticVideoPlayerProps {
  videoId: string;
  title?: string;
  thumbnail?: string;
  className?: string;
}

// Componente principal usando FortressVideoPlayer
export const FuturisticVideoPlayer = memo(({ 
  videoId, 
  title = "Vídeo", 
  thumbnail,
  className = ""
}: FuturisticVideoPlayerProps) => {
  const thumbnailUrl = thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div className={`relative ${className}`}>
      {/* Borda animada com CSS puro */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-conic from-pink-500 via-purple-500 via-blue-500 via-green-500 to-pink-500 opacity-70 blur-sm animate-spin-slow" />
      
      {/* Container interno com borda gradiente */}
      <div className="absolute -inset-0.5 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-conic from-pink-500 via-purple-500 via-blue-500 to-pink-500 animate-spin-slow" />
      </div>

      {/* OmegaFortressPlayer - 7 Camadas de Proteção */}
      <div className="relative rounded-2xl overflow-hidden">
        <OmegaFortressPlayer
          videoId={videoId}
          type="youtube"
          title={title}
          thumbnail={thumbnailUrl}
          showSecurityBadge
          showWatermark
          autoplay={false}
        />
        
        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-gradient-x z-10" />
      </div>
    </div>
  );
});

FuturisticVideoPlayer.displayName = 'FuturisticVideoPlayer';

// Card simplificado para grid de vídeos
export const FuturisticVideoCard = memo(({ 
  videoId, 
  title,
  onClick
}: { 
  videoId: string; 
  title: string;
  onClick: () => void;
}) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const { Play } = require("lucide-react");

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      <div className="absolute -inset-0.5 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-gradient-x" />
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-transparent transition-colors">
        <img
          src={thumbnailUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/40 group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          </div>
        </div>

        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-bold text-white flex items-center gap-1">
          <span>🔒</span>
          <span>HD</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
          <p className="text-xs text-white font-medium truncate">{title}</p>
        </div>
      </div>
    </div>
  );
});

FuturisticVideoCard.displayName = 'FuturisticVideoCard';
