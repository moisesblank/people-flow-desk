// ============================================
// VIDEO FEEDBACK CAROUSEL - EX-ALUNOS REAIS
// Carrossel automático horizontal com vídeos do YouTube
// COM PROTEÇÃO FORTALEZA DIGITAL
// 🏛️ LEI I: useQuantumReactivity aplicado
// ============================================

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePerformance } from "@/hooks/usePerformance";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Video,
  Sparkles,
  Users,
  X,
  ExternalLink,
  Shield
} from "lucide-react";
import { OmegaFortressPlayer } from "@/components/video";

// Lista de vídeos de feedback dos ex-alunos
const feedbackVideos = [
  { 
    id: "F7twHUDZFYc", 
    title: "Depoimento 1 - Aprovação Real",
    type: "video"
  },
  { 
    id: "e-T_GYpSPYc", 
    title: "Depoimento 2 - Transformação",
    type: "video"
  },
  { 
    id: "KhyJWa8oKfQ", 
    title: "Depoimento 3 - Resultado Incrível",
    type: "video"
  },
  { 
    id: "rXrAj3OXinE", 
    title: "Depoimento 4 - Short de Sucesso",
    type: "short"
  },
  { 
    id: "-ojJ301Jfvc", 
    title: "Depoimento 5 - Conquista",
    type: "short"
  },
  { 
    id: "dLxpccfiy1I", 
    title: "Depoimento 6 - Vitória",
    type: "short"
  },
  { 
    id: "fP2kuADAWyA", 
    title: "Depoimento 7 - Aprovado!",
    type: "video"
  },
  { 
    id: "bYR2Gzfkfk8", 
    title: "Depoimento 8 - Gratidão",
    type: "short"
  },
  { 
    id: "_MRvdEnooA0", 
    title: "Depoimento 9 - Missão Cumprida",
    type: "short"
  },
  { 
    id: "jveZvOCVjQ8", 
    title: "Depoimento 10 - Sonho Realizado",
    type: "short"
  },
];

// Thumbnail do YouTube
const getYouTubeThumbnail = (videoId: string) => 
  `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

// Card de vídeo individual
const VideoCard = ({ 
  video, 
  index, 
  onClick 
}: { 
  video: typeof feedbackVideos[0]; 
  index: number;
  onClick: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      viewport={{ once: true }}
      onClick={onClick}
      className="flex-shrink-0 w-[280px] md:w-[320px] cursor-pointer group"
    >
      {/* Animated Border Glow */}
      <div className="relative">
        <motion.div
          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #ec4899)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 bg-black/90 transition-all duration-500 group-hover:border-transparent group-hover:shadow-2xl group-hover:shadow-pink-500/30">
          {/* Thumbnail */}
          <div className="aspect-video relative">
            <img
              src={getYouTubeThumbnail(video.id)}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Holographic Overlay */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-30"
              style={{
                background: 'linear-gradient(135deg, transparent 30%, rgba(236,72,153,0.3) 50%, transparent 70%)',
                backgroundSize: '400% 400%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            
            {/* Play Button */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-pink-500/50 group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </motion.div>
            </motion.div>

            {/* Badge */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-sm border border-pink-500/50 text-xs text-pink-400 font-medium flex items-center gap-1">
              <Star className="w-3 h-3" fill="currentColor" />
              Ex-Aluno Real
            </div>

            {/* HD Badge */}
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-xs text-white font-bold">
              {video.type === "short" ? "SHORT" : "FULL HD"}
            </div>

            {/* Corner Decorations */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Info */}
          <div className="p-4 bg-gradient-to-b from-black/80 to-black relative overflow-hidden">
            {/* Scan Line */}
            <motion.div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
              }}
            />
            
            <p className="text-sm text-gray-300 line-clamp-1 group-hover:text-white transition-colors relative z-10">
              {video.title}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-pink-400 relative z-10">
              <Video className="w-3 h-3" />
              <span>Clique para assistir</span>
            </div>

            {/* Animated Bottom Line */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              transition={{ duration: 1, delay: index * 0.1 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Modal de vídeo com FortressVideoPlayer
const VideoModal = ({ 
  video, 
  onClose 
}: { 
  video: typeof feedbackVideos[0] | null;
  onClose: () => void;
}) => {
  if (!video) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated Border */}
          <motion.div
            className="absolute -inset-2 rounded-2xl"
            style={{
              background: 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #ec4899)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          
          {/* OmegaFortressPlayer - 7 Camadas de Proteção */}
          <div className="relative rounded-xl overflow-hidden bg-black">
            <OmegaFortressPlayer
              videoId={video.id}
              type="youtube"
              title={video.title}
              autoplay
              showSecurityBadge
              showWatermark
            />
          </div>
          
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="absolute -top-4 -right-4 p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/50 z-50"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Componente principal
export const VideoFeedbackCarousel = () => {
  const { isSlowConnection } = usePerformance();
  const { shouldAnimate, gpuAnimationProps } = useQuantumReactivity();
  const [selectedVideo, setSelectedVideo] = useState<typeof feedbackVideos[0] | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto-scroll
  useEffect(() => {
    if (!isAutoPlay || !containerRef.current) return;

    const interval = setInterval(() => {
      if (containerRef.current) {
        const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
        const newPosition = scrollPosition + 340;
        
        if (newPosition >= maxScroll) {
          containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          setScrollPosition(0);
        } else {
          containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
          setScrollPosition(newPosition);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [scrollPosition, isAutoPlay]);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    setIsAutoPlay(false);
    const amount = direction === 'left' ? -340 : 340;
    containerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950/50 to-black" />
      
      {/* Glow Effects - Disabled on slow connections (blur-[150px] is CPU-heavy) */}
      {!isSlowConnection && shouldAnimate && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pink-500/10 blur-[150px] pointer-events-none" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-4 text-center mb-12">
          <motion.div
            {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-6"
          >
            <Video className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-300">Depoimentos em Vídeo</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </motion.div>

          <motion.h2
            {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-4"
          >
            <span className="text-white">Feedback de </span>
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Ex-Alunos Reais
            </span>
          </motion.h2>

          <motion.p
            {...(shouldAnimate ? gpuAnimationProps.fadeIn : {})}
            viewport={{ once: true }}
            className="text-gray-400 max-w-2xl mx-auto flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5 text-pink-500" />
            Veja o que nossos alunos aprovados têm a dizer sobre a experiência
          </motion.p>
        </div>

        {/* Navigation Buttons */}
        <div className="container mx-auto px-4 flex justify-end gap-3 mb-6">
          <button
            onClick={() => scroll('left')}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-pink-500/20 hover:border-pink-500/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-pink-500/20 hover:border-pink-500/50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel */}
        <div 
          ref={containerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          {feedbackVideos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              index={index}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </div>

        {/* Auto-play indicator */}
        <div className="container mx-auto px-4 mt-6">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAutoPlay ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-gray-400">
              {isAutoPlay ? 'Reprodução automática ativa' : 'Passe o mouse para pausar'}
            </span>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 mt-10 text-center"
        >
          <a
            href="https://www.youtube.com/@moisesmedeiros"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <Play className="w-5 h-5" />
            Ver mais no YouTube
            <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </section>
  );
};
