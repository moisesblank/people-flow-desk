// ============================================
// FUTURISTIC VIDEO PLAYER - 2300 STYLE
// Player de vídeo cinematográfico com bordas futuristas
// COM PROTEÇÃO ANTI-COMPARTILHAMENTO
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  X, 
  Maximize2, 
  Volume2,
  Sparkles,
  Zap,
  Shield
} from "lucide-react";
import { ProtectedVideoWrapper, getProtectedYouTubeUrl } from "@/components/video/ProtectedVideoWrapper";

interface FuturisticVideoPlayerProps {
  videoId: string;
  title?: string;
  thumbnail?: string;
  className?: string;
}

// Componente de player futurista COM PROTEÇÃO
export const FuturisticVideoPlayer = ({ 
  videoId, 
  title = "Vídeo", 
  thumbnail,
  className = ""
}: FuturisticVideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const thumbnailUrl = thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  // YouTube embed com parâmetros de alta qualidade (1080p) e proteção
  const embedUrl = getProtectedYouTubeUrl(videoId, true);

  return (
    <>
      {/* Main Player Container */}
      <div className={`relative group ${className}`}>
        {/* Outer Glow Ring */}
        <motion.div
          className="absolute -inset-3 rounded-3xl opacity-60"
          style={{
            background: 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #ec4899)',
            filter: 'blur(15px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Animated Border */}
        <div className="absolute -inset-1 rounded-2xl overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #ec4899)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Video Container */}
        <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-transparent">
          {/* Top Control Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-yellow-500"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-green-500"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="font-medium text-white/80 truncate max-w-[200px]">{title}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-bold text-white">
                  <Shield className="w-3 h-3" />
                  1080p
                </div>
                <Zap className="w-4 h-4 text-yellow-500" />
              </div>
            </div>

            {/* Scan Line */}
            <motion.div
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
              animate={{ y: [0, 300, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Video Content */}
          {!isPlaying ? (
            <div className="relative aspect-video cursor-pointer" onClick={() => setIsPlaying(true)}>
              {/* Thumbnail */}
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
              
              {/* Holographic Effect */}
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(135deg, transparent 30%, rgba(236,72,153,0.2) 50%, transparent 70%)',
                  backgroundSize: '400% 400%',
                }}
                animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                transition={{ duration: 5, repeat: Infinity }}
              />

              {/* Play Button */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className="relative"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {/* Outer Ring */}
                  <motion.div
                    className="absolute -inset-8 rounded-full border-2 border-pink-500/50"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -inset-4 rounded-full border border-purple-500/30"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  
                  {/* Play Button */}
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-pink-500/50 group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-white ml-2" fill="white" />
                  </div>
                </motion.div>
              </motion.div>

              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-pink-500/50" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-purple-500/50" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-blue-500/50" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-500/50" />

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-white/60" />
                    <span className="text-xs text-white/60">Clique para assistir</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullscreen(true);
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            /* PLAYER COM PROTEÇÃO ANTI-COMPARTILHAMENTO */
            <ProtectedVideoWrapper className="aspect-video">
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 0 }}
              />
            </ProtectedVideoWrapper>
          )}

          {/* Bottom Glow Line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 z-10"
            style={{
              background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #ec4899)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close Button */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 border border-white/20 text-white hover:bg-pink-500/50 transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Fullscreen Video COM PROTEÇÃO */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full max-w-7xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Border */}
              <motion.div
                className="absolute -inset-2 rounded-2xl"
                style={{
                  background: 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #ec4899)',
                  padding: '3px',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-full h-full rounded-2xl bg-black" />
              </motion.div>

              <ProtectedVideoWrapper className="absolute inset-0 rounded-xl overflow-hidden">
                <iframe
                  src={embedUrl}
                  title={title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 0 }}
                />
              </ProtectedVideoWrapper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Componente simplificado para cards de vídeo
export const FuturisticVideoCard = ({ 
  videoId, 
  title,
  onClick
}: { 
  videoId: string; 
  title: string;
  onClick: () => void;
}) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      {/* Animated Border */}
      <div className="absolute -inset-0.5 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #ec4899)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border-2 border-white/10 group-hover:border-transparent transition-colors">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/50 group-hover:scale-110 transition-transform"
            whileHover={{ scale: 1.1 }}
          >
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </motion.div>
        </div>

        {/* HD Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-bold text-white">
          HD
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
          <p className="text-sm text-white font-medium truncate">{title}</p>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
};
