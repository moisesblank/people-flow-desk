// ============================================
// 📚 LIVROS DO MOISA - NETFLIX ULTRA PREMIUM v15.0
// MÁXIMO IMPACTO CINEMATOGRÁFICO — Disney+ / HBO Max Level
// Experiência Imersiva Total — Year 2300 Cinematic
// ============================================

import React, { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useWebBookLibrary, WebBookListItem } from '@/hooks/useWebBook';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Loader2, 
  Search, 
  CheckCircle,
  Play,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  Crown,
  Eye,
  BookMarked,
  Library,
  Flame,
  Award,
  Info,
  Plus,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getCategoryConfig, normalizeCategoryId } from './CategoryCover';
import { useBookCategories } from '@/hooks/useBookCategories';

// ============================================
// TIPOS
// ============================================

interface WebBookLibraryProps {
  onBookSelect: (bookId: string) => void;
  externalCategory?: string | null;
  className?: string;
}

// ============================================
// CATEGORIAS
// ============================================

const CATEGORIES = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'quimica_geral', label: '⚗️ Química Geral' },
  { value: 'quimica_organica', label: '🧪 Química Orgânica' },
  { value: 'fisico_quimica', label: '📊 Físico-Química' },
  { value: 'quimica_ambiental', label: '🌍 Química Ambiental' },
  { value: 'bioquimica', label: '🧬 Bioquímica' },
  { value: 'revisao_ciclica', label: '🔄 Revisão Cíclica' },
  { value: 'previsao_final', label: '🎯 Previsão Final' },
  { value: 'exercicios', label: '✏️ Exercícios' },
  { value: 'simulados', label: '📝 Simulados' },
  { value: 'resumos', label: '📋 Resumos' },
  { value: 'mapas_mentais', label: '🧠 Mapas Mentais' },
  { value: 'outros', label: '📚 Outros' },
];

// ============================================
// NETFLIX LOGO ANIMATION
// ============================================

const NetflixLogoIntro = memo(function NetflixLogoIntro({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ 
          scale: [0.3, 1.2, 1],
          opacity: [0, 1, 1]
        }}
        transition={{ duration: 1.5, times: [0, 0.6, 1], ease: "easeOut" }}
        className="relative"
      >
        {/* Main Logo */}
        <div 
          className="text-6xl md:text-8xl font-black tracking-tighter"
          style={{
            background: 'linear-gradient(180deg, #E50914 0%, #B81D24 50%, #831010 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 60px rgba(229,9,20,0.8))',
            textShadow: '0 0 100px rgba(229,9,20,0.5)'
          }}
        >
          MOISA
        </div>
        
        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center text-white/60 text-sm tracking-[0.3em] uppercase mt-2"
        >
          Biblioteca Digital
        </motion.div>

        {/* Glow Ring */}
        <motion.div
          className="absolute -inset-20 rounded-full"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 0.5, 0],
            scale: [0.5, 1.5, 2]
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            background: 'radial-gradient(circle, rgba(229,9,20,0.3) 0%, transparent 70%)'
          }}
        />
      </motion.div>
    </motion.div>
  );
});

// ============================================
// HERO BILLBOARD — Netflix Cinematic
// ============================================

interface HeroBillboardProps {
  book: WebBookListItem | null;
  onClick: () => void;
  categoryCoverUrl?: string | null;
}

const HeroBillboard = memo(function HeroBillboard({ book, onClick, categoryCoverUrl }: HeroBillboardProps) {
  const [isMuted, setIsMuted] = useState(true);
  
  if (!book) return null;
  
  const coverImage = book.coverUrl || categoryCoverUrl || getCategoryConfig(book.category)?.cover;
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full h-[75vh] min-h-[600px] max-h-[900px] overflow-hidden"
    >
      {/* ═══════════════════════════════════════════════════════════════
          LAYER 1: BACKGROUND WITH KEN BURNS EFFECT
      ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0">
        {coverImage && (
          <motion.img
            src={coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          />
        )}
        
        {/* Netflix Signature Gradients */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to right, 
                rgba(0,0,0,0.95) 0%, 
                rgba(0,0,0,0.7) 30%, 
                rgba(0,0,0,0.3) 50%, 
                transparent 70%
              ),
              linear-gradient(to top, 
                rgb(0,0,0) 0%, 
                rgba(0,0,0,0.9) 10%,
                rgba(0,0,0,0.4) 30%,
                transparent 50%
              ),
              linear-gradient(to bottom,
                rgba(0,0,0,0.6) 0%,
                transparent 15%
              )
            `
          }}
        />

        {/* Animated Vignette Pulse */}
        <motion.div 
          className="absolute inset-0"
          animate={{ 
            background: [
              'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(229,9,20,0.03) 100%)',
              'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(229,9,20,0.08) 100%)',
              'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(229,9,20,0.03) 100%)'
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Cinematic Film Grain */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            animation: 'grain 0.5s steps(1) infinite'
          }}
        />

        {/* Horizontal Scanlines */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            )`
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LAYER 2: FLOATING PARTICLES
      ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              bottom: '-5%',
              background: i % 3 === 0 
                ? 'rgba(229,9,20,0.6)' 
                : i % 3 === 1 
                  ? 'rgba(255,255,255,0.4)' 
                  : 'rgba(255,215,0,0.4)',
              boxShadow: i % 3 === 0 
                ? '0 0 10px rgba(229,9,20,0.5)' 
                : '0 0 6px rgba(255,255,255,0.3)'
            }}
            animate={{
              y: [0, -window.innerHeight * 1.2],
              x: [0, (Math.random() - 0.5) * 200],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 8 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LAYER 3: CONTENT
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-16 max-w-4xl">
        
        {/* Top Badges Row */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          {/* Netflix N Logo Style */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{
              background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
              boxShadow: '0 4px 20px rgba(229,9,20,0.4)'
            }}
          >
            <span className="text-white text-xs font-black tracking-wide">M</span>
            <span className="text-white text-xs font-bold uppercase tracking-wider">SERIES</span>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 backdrop-blur-sm">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">Top 1 Hoje</span>
          </div>
          
          {isCompleted && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.4)'
              }}
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">Concluído</span>
            </motion.div>
          )}
        </motion.div>

        {/* Title with Netflix Typography */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.95] mb-6 max-w-3xl"
          style={{
            textShadow: `
              0 2px 10px rgba(0,0,0,0.8),
              0 8px 40px rgba(0,0,0,0.6),
              0 0 80px rgba(229,9,20,0.2)
            `,
            letterSpacing: '-0.02em'
          }}
        >
          {book.title}
        </motion.h1>

        {/* Metadata Row - Netflix Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <span className="text-emerald-400 font-bold text-sm">98% Relevante</span>
          <span className="text-white/60">•</span>
          <span className="text-white/80 text-sm font-medium">2024</span>
          <span className="text-white/60">•</span>
          {book.totalPages > 0 && (
            <>
              <span className="text-white/80 text-sm font-medium">{book.totalPages} páginas</span>
              <span className="text-white/60">•</span>
            </>
          )}
          <span className="px-1.5 py-0.5 border border-white/40 rounded text-[10px] text-white/80 font-medium">HD</span>
          <span className="px-1.5 py-0.5 border border-white/40 rounded text-[10px] text-white/80 font-medium">PDF</span>
        </motion.div>

        {/* Author & Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="flex flex-wrap items-center gap-4 mb-6 text-white/70"
        >
          {book.author && (
            <span className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">{book.author}</span>
            </span>
          )}
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">{book.viewCount || 0} leitores</span>
          </span>
          <span className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium">4.9</span>
          </span>
        </motion.div>

        {/* Description */}
        {book.subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-white/80 text-lg lg:text-xl max-w-2xl mb-8 line-clamp-3 leading-relaxed"
          >
            {book.subtitle}
          </motion.p>
        )}

        {/* Progress Bar */}
        {progress > 0 && !isCompleted && (
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="mb-8 max-w-lg origin-left"
          >
            <div className="flex items-center justify-between text-sm text-white/50 mb-2">
              <span className="font-medium">Continuar de onde parou</span>
              <span className="text-red-500 font-bold">{progress.toFixed(0)}% concluído</span>
            </div>
            <div className="h-1 rounded-full bg-white/20 overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
                style={{ 
                  background: 'linear-gradient(90deg, #E50914 0%, #FF3D47 100%)',
                  boxShadow: '0 0 20px rgba(229,9,20,0.6), 0 0 40px rgba(229,9,20,0.3)'
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Action Buttons - Netflix Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-wrap items-center gap-4"
        >
          {/* Primary Play Button */}
          <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center gap-3 px-8 py-4 rounded-md font-bold text-lg transition-all duration-300"
            style={{
              background: 'white',
              color: 'black',
              boxShadow: '0 8px 30px rgba(255,255,255,0.2)'
            }}
          >
            <Play className="w-7 h-7 fill-black group-hover:scale-110 transition-transform" />
            <span>{progress > 0 ? 'Continuar' : 'Ler Agora'}</span>
          </motion.button>

          {/* Info Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-6 py-4 rounded-md font-bold text-lg transition-all duration-300 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
          >
            <Info className="w-6 h-6" />
            <span>Mais Informações</span>
          </motion.button>

          {/* Add to List */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm border-2 border-white/40 hover:border-white transition-colors"
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.button>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LAYER 4: MUTE BUTTON (Bottom Right)
      ═══════════════════════════════════════════════════════════════ */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setIsMuted(!isMuted)}
        className="absolute bottom-8 right-8 lg:right-16 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/30 hover:bg-black/50 transition-colors"
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </motion.button>

      {/* Age Rating Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 right-24 lg:right-32 z-20 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm border-l-4 border-white/60"
      >
        <span className="text-white text-sm font-medium">L</span>
      </motion.div>
    </motion.div>
  );
});

// ============================================
// TOP 10 CARD — Netflix Ranking Style
// ============================================

const Top10Card = memo(function Top10Card({
  book,
  rank,
  onClick,
  categoryCoverUrl
}: {
  book: WebBookListItem;
  rank: number;
  onClick: () => void;
  categoryCoverUrl?: string | null;
}) {
  const coverImage = book.coverUrl || categoryCoverUrl || getCategoryConfig(book.category)?.cover;
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1, duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex-shrink-0 flex items-end cursor-pointer group"
      style={{ width: '280px', height: '200px' }}
      onClick={onClick}
    >
      {/* Giant Number */}
      <div 
        className="absolute left-0 bottom-0 z-10 select-none"
        style={{
          fontSize: '180px',
          fontWeight: 900,
          lineHeight: 0.8,
          color: 'transparent',
          WebkitTextStroke: '4px rgba(255,255,255,0.3)',
          textShadow: '4px 4px 0 rgba(0,0,0,0.8)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-0.05em'
        }}
      >
        {rank}
      </div>

      {/* Book Cover */}
      <motion.div
        animate={{ x: isHovered ? 10 : 0 }}
        transition={{ duration: 0.3 }}
        className="relative ml-auto rounded-md overflow-hidden"
        style={{ 
          width: '140px', 
          height: '190px',
          boxShadow: isHovered 
            ? '0 10px 40px rgba(0,0,0,0.8), -10px 0 30px rgba(0,0,0,0.5)'
            : '0 5px 20px rgba(0,0,0,0.5)'
        }}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-red-500/30" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Completed Badge */}
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: '#10B981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}
            >
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Progress */}
        {progress > 0 && !isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-red-600" 
              style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(229,9,20,0.5)' }} 
            />
          </div>
        )}

        {/* Hover Play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

// ============================================
// NETFLIX BOOK CARD — Premium Hover Experience
// ============================================

interface BookCardProps {
  book: WebBookListItem;
  onClick: () => void;
  categoryCoverUrl?: string | null;
  index: number;
  size?: 'normal' | 'large';
}

const NetflixBookCard = memo(function NetflixBookCard({
  book,
  onClick,
  categoryCoverUrl,
  index,
  size = 'normal'
}: BookCardProps) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const isPdfMode = book.totalPages === 0;
  const coverImage = book.coverUrl || categoryCoverUrl || getCategoryConfig(book.category)?.cover;
  const [isHovered, setIsHovered] = useState(false);
  
  const cardWidth = size === 'large' ? '280px' : '200px';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex-shrink-0 group"
      style={{ width: cardWidth }}
    >
      <motion.button
        onClick={onClick}
        animate={{
          scale: isHovered ? 1.3 : 1,
          y: isHovered ? -30 : 0,
          zIndex: isHovered ? 50 : 1
        }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full rounded-md overflow-visible focus:outline-none"
        style={{ 
          aspectRatio: '2/3',
          transformOrigin: 'center bottom'
        }}
      >
        {/* Main Card */}
        <div 
          className="w-full h-full rounded-md overflow-hidden"
          style={{
            boxShadow: isHovered 
              ? '0 20px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.1)'
              : '0 4px 20px rgba(0,0,0,0.4)'
          }}
        >
          {/* Cover Image */}
          {coverImage ? (
            <img
              src={coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <BookOpen className="w-14 h-14 text-red-500/20" />
            </div>
          )}

          {/* Gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: isHovered 
                ? 'linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0.8) 30%, transparent 60%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)'
            }}
          />

          {/* Progress Bar (Always Visible) */}
          {hasStarted && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/50">
              <div 
                className="h-full bg-red-600" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          {/* Completed Badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2 z-10">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 2px 10px rgba(16,185,129,0.5)'
                }}
              >
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Expanded Info on Hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full pt-3 px-1"
            >
              <div 
                className="p-4 rounded-b-md"
                style={{ 
                  background: 'rgb(20,20,20)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
                }}
              >
                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-3">
                  <button 
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                  >
                    <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center hover:border-white transition-colors">
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center hover:border-white transition-colors ml-auto">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-emerald-400 font-bold">98% Relevante</span>
                  {book.totalPages > 0 && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="text-white/70">{book.totalPages} pág</span>
                    </>
                  )}
                  <span className="px-1 py-0.5 border border-white/30 rounded text-[9px] text-white/70">HD</span>
                </div>

                {/* Title */}
                <h4 className="text-white font-bold text-sm leading-tight line-clamp-2">
                  {book.title}
                </h4>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
});

// ============================================
// HORIZONTAL CAROUSEL — Netflix Row
// ============================================

interface CarouselRowProps {
  title: string;
  icon: React.ReactNode;
  books: WebBookListItem[];
  onBookSelect: (bookId: string) => void;
  getCoverForBook: (book: WebBookListItem) => string | null;
  variant?: 'normal' | 'top10' | 'large';
}

const CarouselRow = memo(function CarouselRow({ 
  title, 
  icon, 
  books, 
  onBookSelect,
  getCoverForBook,
  variant = 'normal'
}: CarouselRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    const ref = scrollRef.current;
    ref?.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      ref?.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, books]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (books.length === 0) return null;

  return (
    <div className="relative group/row py-6">
      {/* Row Title */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 px-6 lg:px-16 mb-4"
      >
        <div 
          className="p-2 rounded-lg"
          style={{ 
            background: 'linear-gradient(135deg, rgba(229,9,20,0.2) 0%, rgba(229,9,20,0.05) 100%)',
            boxShadow: '0 0 20px rgba(229,9,20,0.1)'
          }}
        >
          {icon}
        </div>
        <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight group-hover/row:text-red-500 transition-colors duration-300">
          {title}
        </h2>
        <motion.div 
          className="flex items-center gap-1 text-red-500 text-sm font-medium opacity-0 group-hover/row:opacity-100 transition-opacity"
          whileHover={{ x: 5 }}
        >
          <span>Explorar Todos</span>
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </motion.div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 z-30 w-16 lg:w-20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, transparent 100%)'
              }}
            >
              <motion.div 
                whileHover={{ scale: 1.2 }}
                className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:border-white/50 transition-colors"
              >
                <ChevronLeft className="w-7 h-7 text-white" />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right Arrow */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 z-30 w-16 lg:w-20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(to left, rgba(0,0,0,0.95) 0%, transparent 100%)'
              }}
            >
              <motion.div 
                whileHover={{ scale: 1.2 }}
                className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:border-white/50 transition-colors"
              >
                <ChevronRight className="w-7 h-7 text-white" />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scroll-smooth px-6 lg:px-16 pb-32 pt-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {variant === 'top10' ? (
            books.slice(0, 10).map((book, index) => (
              <Top10Card
                key={book.id}
                book={book}
                rank={index + 1}
                onClick={() => onBookSelect(book.id)}
                categoryCoverUrl={getCoverForBook(book)}
              />
            ))
          ) : (
            books.map((book, index) => (
              <NetflixBookCard
                key={book.id}
                book={book}
                onClick={() => onBookSelect(book.id)}
                categoryCoverUrl={getCoverForBook(book)}
                index={index}
                size={variant === 'large' ? 'large' : 'normal'}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================
// COMPONENTE PRINCIPAL — NETFLIX ULTRA PREMIUM
// ============================================

export const WebBookLibrary = memo(function WebBookLibrary({
  onBookSelect,
  externalCategory,
  className
}: WebBookLibraryProps) {
  const { books, isLoading, error, loadBooks } = useWebBookLibrary();
  const { categories: dbCategories } = useBookCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showIntro, setShowIntro] = useState(true);

  // Skip intro on subsequent visits
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('moisa_library_intro');
    if (hasSeenIntro) setShowIntro(false);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    sessionStorage.setItem('moisa_library_intro', 'true');
  }, []);

  // Mapa de categoria → capa do banco
  const categoryCoverMap = useMemo(() => {
    const map: Record<string, string> = {};
    dbCategories.forEach(cat => {
      if (cat.effectiveCover) {
        map[cat.id] = cat.effectiveCover;
      }
    });
    return map;
  }, [dbCategories]);

  const getCoverForBook = useCallback((book: WebBookListItem): string | null => {
    const normalizedCatId = normalizeCategoryId(book.category);
    if (normalizedCatId && categoryCoverMap[normalizedCatId]) {
      return categoryCoverMap[normalizedCatId];
    }
    return null;
  }, [categoryCoverMap]);

  useEffect(() => {
    if (externalCategory !== undefined) {
      const category = externalCategory || 'all';
      setSelectedCategory(category);
      loadBooks(externalCategory || undefined);
    }
  }, [externalCategory, loadBooks]);

  // Filtrar livros
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = !searchQuery || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  // Categorizar livros para rows
  const categorizedBooks = useMemo(() => {
    const inProgress = filteredBooks.filter(b => (b.progress?.progressPercent || 0) > 0 && !b.progress?.isCompleted);
    const completed = filteredBooks.filter(b => b.progress?.isCompleted);
    const trending = [...filteredBooks].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 15);
    
    return { inProgress, completed, trending, all: filteredBooks };
  }, [filteredBooks]);

  // Hero book
  const heroBook = useMemo(() => {
    if (categorizedBooks.inProgress.length > 0) return categorizedBooks.inProgress[0];
    if (categorizedBooks.trending.length > 0) return categorizedBooks.trending[0];
    return filteredBooks[0] || null;
  }, [categorizedBooks, filteredBooks]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    const backendCategory = category === 'all' ? undefined : category;
    loadBooks(backendCategory);
  }, [loadBooks]);

  // Loading State
  if (isLoading && books.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <motion.div 
              className="w-28 h-28 rounded-xl flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
                boxShadow: '0 0 100px rgba(229,9,20,0.5)'
              }}
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 0 60px rgba(229,9,20,0.4)',
                  '0 0 120px rgba(229,9,20,0.6)',
                  '0 0 60px rgba(229,9,20,0.4)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Library className="w-14 h-14 text-white" />
            </motion.div>
            
            {/* Orbital Rings */}
            {[1, 2, 3].map((ring) => (
              <motion.div 
                key={ring}
                className="absolute rounded-full border"
                style={{
                  inset: `${-ring * 20}px`,
                  borderColor: `rgba(229,9,20,${0.4 - ring * 0.1})`,
                  borderWidth: ring === 1 ? '2px' : '1px'
                }}
                animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 4 + ring * 2, repeat: Infinity, ease: "linear" }}
              />
            ))}
          </div>
          
          <div className="text-center">
            <motion.p 
              className="text-white text-2xl font-bold tracking-wide"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Carregando...
            </motion.p>
            <p className="text-white/40 text-sm mt-2">Preparando sua experiência</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div 
            className="w-24 h-24 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)',
              boxShadow: '0 0 40px rgba(153,27,27,0.5)'
            }}
          >
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Ops!</h2>
          <p className="text-white/60">{error}</p>
          <button
            onClick={() => loadBooks()}
            className="px-8 py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-black", className)}>
      {/* Intro Animation */}
      <AnimatePresence>
        {showIntro && <NetflixLogoIntro onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* Global Styles */}
      <style>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -2%); }
          20% { transform: translate(2%, 2%); }
          30% { transform: translate(-1%, 1%); }
          40% { transform: translate(1%, -1%); }
          50% { transform: translate(-2%, 2%); }
          60% { transform: translate(2%, -2%); }
          70% { transform: translate(-1%, -1%); }
          80% { transform: translate(1%, 1%); }
          90% { transform: translate(-2%, -2%); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Fixed Navigation Bar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: showIntro ? 2.5 : 0, duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-16 py-4"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)'
        }}
      >
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div 
            className="text-2xl font-black tracking-tighter"
            style={{
              background: 'linear-gradient(180deg, #E50914 0%, #B81D24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            MOISA
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              type="text"
              placeholder="Buscar livros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-10 bg-black/50 border-white/20 text-white placeholder:text-white/50 rounded focus:bg-black/80 focus:border-white/40 transition-all"
            />
          </div>

          {/* Category Select */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px] h-10 bg-black/50 border-white/20 text-white rounded focus:ring-red-500/50">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white">
              {CATEGORIES.map(cat => (
                <SelectItem 
                  key={cat.value} 
                  value={cat.value}
                  className="text-white/80 focus:bg-red-600/40 focus:text-white"
                >
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stats */}
          <div className="hidden lg:flex items-center gap-4 ml-auto text-sm">
            <div className="flex items-center gap-2 text-white/70">
              <Library className="w-4 h-4 text-red-500" />
              <span>{filteredBooks.length}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>{categorizedBooks.completed.length}</span>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Billboard */}
      {heroBook && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: showIntro ? 2.5 : 0, duration: 0.8 }}
        >
          <HeroBillboard 
            book={heroBook} 
            onClick={() => onBookSelect(heroBook.id)}
            categoryCoverUrl={getCoverForBook(heroBook)}
          />
        </motion.div>
      )}

      {/* Content Rows */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: showIntro ? 2.8 : 0.3, duration: 0.8 }}
        className="relative z-10 -mt-40 pb-20 space-y-2"
      >
        {/* Continue Watching */}
        {categorizedBooks.inProgress.length > 0 && (
          <CarouselRow
            title="Continuar Lendo"
            icon={<Clock className="w-5 h-5 text-red-500" />}
            books={categorizedBooks.inProgress}
            onBookSelect={onBookSelect}
            getCoverForBook={getCoverForBook}
            variant="large"
          />
        )}

        {/* Top 10 */}
        {categorizedBooks.trending.length > 0 && (
          <CarouselRow
            title="Top 10 da Semana no Brasil"
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            books={categorizedBooks.trending}
            onBookSelect={onBookSelect}
            getCoverForBook={getCoverForBook}
            variant="top10"
          />
        )}

        {/* Completed */}
        {categorizedBooks.completed.length > 0 && (
          <CarouselRow
            title="Concluídos"
            icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
            books={categorizedBooks.completed}
            onBookSelect={onBookSelect}
            getCoverForBook={getCoverForBook}
          />
        )}

        {/* All Books */}
        <CarouselRow
          title="Todos os Livros"
          icon={<Library className="w-5 h-5 text-blue-500" />}
          books={filteredBooks}
          onBookSelect={onBookSelect}
          getCoverForBook={getCoverForBook}
        />

        {/* Empty State */}
        {filteredBooks.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <div 
              className="w-32 h-32 rounded-xl flex items-center justify-center mb-8"
              style={{ 
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                boxShadow: '0 0 60px rgba(0,0,0,0.5)'
              }}
            >
              <Search className="w-16 h-16 text-white/10" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">Nenhum resultado</h3>
            <p className="text-white/50 max-w-md text-lg">
              Tente ajustar sua busca ou filtros
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
});

WebBookLibrary.displayName = 'WebBookLibrary';
