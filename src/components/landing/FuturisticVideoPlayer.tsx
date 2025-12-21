// ============================================
// FUTURISTIC VIDEO PLAYER - 2300 ULTRA LITE
// Player cinematográfico OTIMIZADO para mobile
// Animações leves com CSS + Logo do curso épica
// ============================================

import { useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Maximize2, Shield } from "lucide-react";
import { ProtectedVideoWrapper, getProtectedYouTubeUrl } from "@/components/video/ProtectedVideoWrapper";
import logoMoises from "@/assets/logo-moises-medeiros.png";

interface FuturisticVideoPlayerProps {
  videoId: string;
  title?: string;
  thumbnail?: string;
  className?: string;
}

// Componente OTIMIZADO - menos animações pesadas
export const FuturisticVideoPlayer = memo(({ 
  videoId, 
  title = "Vídeo", 
  thumbnail,
  className = ""
}: FuturisticVideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const thumbnailUrl = thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = getProtectedYouTubeUrl(videoId, true);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(true);
  }, []);

  return (
    <>
      {/* Main Player Container */}
      <div className={`relative group ${className}`}>
        {/* Borda animada com CSS puro - muito mais leve */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-conic from-pink-500 via-purple-500 via-blue-500 via-green-500 to-pink-500 opacity-70 blur-sm animate-spin-slow" />
        
        {/* Container interno com borda gradiente */}
        <div className="absolute -inset-0.5 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-conic from-pink-500 via-purple-500 via-blue-500 to-pink-500 animate-spin-slow" />
        </div>

        {/* Video Container */}
        <div className="relative rounded-2xl overflow-hidden bg-black">
          {/* Top Control Bar - simplificado */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 to-transparent px-3 py-2 md:px-4 md:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-xs font-medium text-white/70 truncate max-w-[150px] md:max-w-[250px]">{title}</span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-bold text-white">
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">1080p</span>
              </div>
            </div>
          </div>

          {/* Video Content */}
          {!isPlaying ? (
            <div className="relative aspect-video cursor-pointer" onClick={handlePlay}>
              {/* Skeleton loader */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black animate-pulse" />
              )}
              
              {/* Thumbnail - carrega lazy */}
              <img
                src={thumbnailUrl}
                alt={title}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {/* Overlay escuro */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
              
              {/* Logo do curso centralizada - ÉPICA */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Glow atrás da logo - CSS puro */}
                <div className="absolute w-48 h-48 md:w-72 md:h-72 rounded-full bg-red-600/30 blur-3xl animate-pulse-slow" />
                
                {/* Logo flutuante */}
                <div className="relative animate-float">
                  <img 
                    src={logoMoises} 
                    alt="Moisés Medeiros"
                    className="w-32 md:w-48 lg:w-56 drop-shadow-[0_0_30px_rgba(220,38,38,0.6)] mb-4"
                    loading="lazy"
                  />
                </div>

                {/* Play Button épico mas leve */}
                <div className="relative mt-4">
                  {/* Anéis pulsantes - CSS puro */}
                  <div className="absolute -inset-6 rounded-full border-2 border-pink-500/40 animate-ping-slow" />
                  <div className="absolute -inset-10 rounded-full border border-purple-500/20 animate-ping-slower" />
                  
                  {/* Botão play */}
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-pink-500/50 group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-7 h-7 md:w-9 md:h-9 text-white ml-1" fill="white" />
                  </div>
                </div>

                {/* Texto épico */}
                <p className="mt-6 text-white/80 text-sm md:text-base font-medium tracking-wide">
                  ▶ ASSISTIR APRESENTAÇÃO
                </p>
              </div>

              {/* Cantos decorativos - mais simples */}
              <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-pink-500/60" />
              <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-purple-500/60" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-blue-500/60" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-cyan-500/60" />

              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Clique para assistir</span>
                  <button
                    onClick={handleFullscreen}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ProtectedVideoWrapper className="aspect-video">
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </ProtectedVideoWrapper>
          )}

          {/* Bottom glow line - CSS animation */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-gradient-x" />
        </div>
      </div>

      {/* Fullscreen Modal - otimizado */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 md:p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 rounded-full bg-white/10 border border-white/20 text-white hover:bg-pink-500/50 transition-colors z-50"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-7xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Borda animada simples */}
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-gradient-x" />
              
              <div className="absolute inset-0 rounded-xl overflow-hidden bg-black">
                <ProtectedVideoWrapper className="w-full h-full">
                  <iframe
                    src={embedUrl}
                    title={title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </ProtectedVideoWrapper>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

FuturisticVideoPlayer.displayName = 'FuturisticVideoPlayer';

// Card simplificado
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

        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-bold text-white">
          HD
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
          <p className="text-xs text-white font-medium truncate">{title}</p>
        </div>
      </div>
    </div>
  );
});

FuturisticVideoCard.displayName = 'FuturisticVideoCard';
