// ============================================
// 📚 LIVROS DO MOISA - NETFLIX ULTRA PREMIUM v16.0
// PERFORMANCE ADAPTATIVA — 5000+ USUÁRIOS
// Year 2300 Cinematic + GPU Optimized
// ============================================

import React, { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useWebBookLibrary, WebBookListItem } from '@/hooks/useWebBook';
import { AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  CheckCircle,
  Play,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
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
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';

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
// CSS KEYFRAMES — GPU OPTIMIZED
// ============================================

const OPTIMIZED_STYLES = `
  @keyframes netflix-grain {
    0%, 100% { transform: translate3d(0, 0, 0); }
    25% { transform: translate3d(-1%, -1%, 0); }
    50% { transform: translate3d(1%, 1%, 0); }
    75% { transform: translate3d(-1%, 1%, 0); }
  }
  @keyframes netflix-glow {
    0%, 100% { opacity: 0.03; }
    50% { opacity: 0.08; }
  }
  @keyframes netflix-float {
    0% { transform: translate3d(0, 0, 0); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translate3d(var(--tx), -120vh, 0); opacity: 0; }
  }
  @keyframes netflix-ken-burns {
    0% { transform: scale(1) translate3d(0,0,0); }
    100% { transform: scale(1.08) translate3d(0,0,0); }
  }
  @keyframes netflix-pulse {
    0%, 100% { box-shadow: 0 0 60px rgba(229,9,20,0.4); }
    50% { box-shadow: 0 0 100px rgba(229,9,20,0.6); }
  }
  @keyframes netflix-orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
  .netflix-card { transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease; }
  .netflix-card:hover { transform: scale(1.25) translateY(-20px); z-index: 50; }
  .netflix-card-info { opacity: 0; transform: translateY(10px); transition: all 0.2s ease; }
  .netflix-card:hover .netflix-card-info { opacity: 1; transform: translateY(0); }
  .perf-reduced .netflix-card:hover { transform: scale(1.05) translateY(-5px); }
  .perf-reduced .netflix-ken-burns { animation: none !important; }
  .perf-reduced .netflix-particles { display: none !important; }
  .perf-reduced .netflix-grain { display: none !important; }
  .perf-reduced .netflix-glow { display: none !important; }
`;

// ============================================
// NETFLIX LOGO ANIMATION (CSS Only)
// ============================================

const NetflixLogoIntro = memo(function NetflixLogoIntro({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-out" style={{ animationDelay: '1.8s', animationDuration: '0.4s', animationFillMode: 'forwards' }}>
      <div className="relative animate-scale-in" style={{ animationDuration: '1s' }}>
        <div 
          className="text-6xl md:text-8xl font-black tracking-tighter"
          style={{
            background: 'linear-gradient(180deg, #E50914 0%, #B81D24 50%, #831010 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 60px rgba(229,9,20,0.8))',
          }}
        >
          MOISA
        </div>
        <div className="text-center text-white/60 text-sm tracking-[0.3em] uppercase mt-2 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          Biblioteca Digital
        </div>
      </div>
    </div>
  );
});

// ============================================
// FLOATING PARTICLES — CSS ONLY (PERFORMANT)
// ============================================

const FloatingParticles = memo(function FloatingParticles({ count = 20, isHighEnd }: { count?: number; isHighEnd: boolean }) {
  if (!isHighEnd) return null;
  
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * 5) % 100}%`,
      delay: `${(i * 0.5) % 8}s`,
      duration: `${10 + (i % 5) * 2}s`,
      tx: `${((i % 2 === 0 ? 1 : -1) * (10 + i % 30))}px`,
      size: 2 + (i % 2),
      color: i % 3 === 0 ? 'rgba(229,9,20,0.6)' : i % 3 === 1 ? 'rgba(255,255,255,0.4)' : 'rgba(255,215,0,0.4)'
    })), [count]
  );

  return (
    <div className="netflix-particles absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            bottom: '-5%',
            background: p.color,
            animation: `netflix-float ${p.duration} linear infinite`,
            animationDelay: p.delay,
            '--tx': p.tx,
            willChange: 'transform, opacity'
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});

// ============================================
// HERO BILLBOARD — Performance Optimized
// ============================================

interface HeroBillboardProps {
  book: WebBookListItem | null;
  onClick: () => void;
  categoryCoverUrl?: string | null;
  isHighEnd: boolean;
}

const HeroBillboard = memo(function HeroBillboard({ book, onClick, categoryCoverUrl, isHighEnd }: HeroBillboardProps) {
  const [isMuted, setIsMuted] = useState(true);
  
  if (!book) return null;
  
  const coverImage = book.coverUrl || categoryCoverUrl || getCategoryConfig(book.category)?.cover;
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;

  return (
    <div className="relative w-full h-[75vh] min-h-[550px] max-h-[850px] overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0">
        {coverImage && (
          <img
            src={coverImage}
            alt={book.title}
            className={cn(
              "w-full h-full object-cover",
              isHighEnd && "netflix-ken-burns"
            )}
            style={isHighEnd ? { animation: 'netflix-ken-burns 20s ease-in-out infinite alternate' } : undefined}
            loading="eager"
          />
        )}
        
        {/* Netflix Gradients */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.3) 50%, transparent 70%),
              linear-gradient(to top, rgb(0,0,0) 0%, rgba(0,0,0,0.9) 10%, rgba(0,0,0,0.4) 30%, transparent 50%),
              linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 15%)
            `
          }}
        />

        {/* Animated Glow (High-End only) */}
        {isHighEnd && (
          <div 
            className="netflix-glow absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(229,9,20,0.05) 100%)',
              animation: 'netflix-glow 4s ease-in-out infinite'
            }}
          />
        )}

        {/* Film Grain (High-End only) */}
        {isHighEnd && (
          <div 
            className="netflix-grain absolute inset-0 opacity-[0.012] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              animation: 'netflix-grain 0.8s steps(1) infinite'
            }}
          />
        )}

        {/* Scanlines */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)`
          }}
        />
      </div>

      {/* Floating Particles */}
      <FloatingParticles count={isHighEnd ? 25 : 0} isHighEnd={isHighEnd} />

      {/* CONTENT */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-16 max-w-4xl">
        
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{ background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)', boxShadow: '0 4px 20px rgba(229,9,20,0.4)' }}
          >
            <span className="text-white text-xs font-black tracking-wide">M</span>
            <span className="text-white text-xs font-bold uppercase tracking-wider">SERIES</span>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 backdrop-blur-sm">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">Top 1 Hoje</span>
          </div>
          
          {isCompleted && (
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 20px rgba(16,185,129,0.4)' }}
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">Concluído</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.95] mb-6 max-w-3xl animate-fade-up"
          style={{
            textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 8px 40px rgba(0,0,0,0.6), 0 0 80px rgba(229,9,20,0.2)',
            letterSpacing: '-0.02em',
            animationDelay: '0.4s'
          }}
        >
          {book.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
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
        </div>

        {/* Author & Stats */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-white/70 animate-fade-in" style={{ animationDelay: '0.55s' }}>
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
        </div>

        {/* Description */}
        {book.subtitle && (
          <p className="text-white/80 text-lg lg:text-xl max-w-2xl mb-8 line-clamp-3 leading-relaxed animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {book.subtitle}
          </p>
        )}

        {/* Progress */}
        {progress > 0 && !isCompleted && (
          <div className="mb-8 max-w-lg animate-fade-in" style={{ animationDelay: '0.65s' }}>
            <div className="flex items-center justify-between text-sm text-white/50 mb-2">
              <span className="font-medium">Continuar de onde parou</span>
              <span className="text-red-500 font-bold">{progress.toFixed(0)}% concluído</span>
            </div>
            <div className="h-1 rounded-full bg-white/20 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000"
                style={{ 
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #E50914 0%, #FF3D47 100%)',
                  boxShadow: '0 0 20px rgba(229,9,20,0.6)'
                }}
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-4 animate-fade-up" style={{ animationDelay: '0.7s' }}>
          <button
            onClick={onClick}
            className="group flex items-center gap-3 px-8 py-4 rounded-md font-bold text-lg transition-all duration-200 bg-white text-black hover:bg-white/90 active:scale-95"
            style={{ boxShadow: '0 8px 30px rgba(255,255,255,0.2)' }}
          >
            <Play className="w-7 h-7 fill-black group-hover:scale-110 transition-transform" />
            <span>{progress > 0 ? 'Continuar' : 'Ler Agora'}</span>
          </button>

          <button className="flex items-center gap-3 px-6 py-4 rounded-md font-bold text-lg transition-all duration-200 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white active:scale-95">
            <Info className="w-6 h-6" />
            <span>Mais Informações</span>
          </button>

          <button className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm border-2 border-white/40 hover:border-white transition-colors active:scale-95">
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Mute Button */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute bottom-8 right-8 lg:right-16 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/30 hover:bg-black/50 transition-colors animate-fade-in"
        style={{ animationDelay: '1s' }}
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>

      {/* Age Rating */}
      <div className="absolute bottom-8 right-24 lg:right-32 z-20 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm border-l-4 border-white/60 animate-fade-in" style={{ animationDelay: '1s' }}>
        <span className="text-white text-sm font-medium">L</span>
      </div>
    </div>
  );
});

// ============================================
// TOP 10 CARD — CSS Optimized
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

  return (
    <div
      className="relative flex-shrink-0 flex items-end cursor-pointer group animate-fade-in"
      style={{ width: '280px', height: '200px', animationDelay: `${rank * 0.08}s` }}
      onClick={onClick}
    >
      {/* Giant Number */}
      <div 
        className="absolute left-0 bottom-0 z-10 select-none transition-transform duration-300 group-hover:scale-105"
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
      <div
        className="relative ml-auto rounded-md overflow-hidden transition-all duration-300 group-hover:translate-x-2"
        style={{ 
          width: '140px', 
          height: '190px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.5)'
        }}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-red-500/30" />
          </div>
        )}

        {/* Hover Overlay */}
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
            <div className="h-full bg-red-600" style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(229,9,20,0.5)' }} />
          </div>
        )}

        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// NETFLIX BOOK CARD — CSS Hover (No Framer)
// ============================================

const NetflixBookCard = memo(function NetflixBookCard({
  book,
  onClick,
  categoryCoverUrl,
  index,
  size = 'normal'
}: {
  book: WebBookListItem;
  onClick: () => void;
  categoryCoverUrl?: string | null;
  index: number;
  size?: 'normal' | 'large';
}) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const coverImage = book.coverUrl || categoryCoverUrl || getCategoryConfig(book.category)?.cover;
  
  const cardWidth = size === 'large' ? 'w-[280px]' : 'w-[200px]';

  return (
    <div
      className={cn("relative flex-shrink-0 netflix-card animate-fade-in", cardWidth)}
      style={{ animationDelay: `${index * 0.03}s`, transformOrigin: 'center bottom' }}
    >
      <button
        onClick={onClick}
        className="relative w-full focus:outline-none"
        style={{ aspectRatio: '2/3' }}
      >
        {/* Main Card */}
        <div className="w-full h-full rounded-md overflow-hidden shadow-lg">
          {coverImage ? (
            <img
              src={coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
              draggable={false}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <BookOpen className="w-14 h-14 text-red-500/20" />
            </div>
          )}

          {/* Gradient */}
          <div 
            className="absolute inset-0 transition-opacity duration-300"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }}
          />

          {/* Progress Bar */}
          {hasStarted && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/50">
              <div className="h-full bg-red-600" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Completed Badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2 z-10">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 2px 10px rgba(16,185,129,0.5)' }}
              >
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          )}

          {/* Hover Play */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 netflix-card-info">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
            </div>
          </div>
        </div>

        {/* Expanded Info */}
        <div className="netflix-card-info absolute left-0 right-0 top-full pt-2 px-1">
          <div className="p-3 rounded-b-md bg-zinc-900/95 shadow-2xl">
            {/* Actions */}
            <div className="flex items-center gap-2 mb-2">
              <button 
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
              >
                <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
              </button>
              <button className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center hover:border-white transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
              <button className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center hover:border-white transition-colors ml-auto">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs mb-1.5">
              <span className="text-emerald-400 font-bold">98%</span>
              {book.totalPages > 0 && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-white/70">{book.totalPages} pág</span>
                </>
              )}
              <span className="px-1 py-0.5 border border-white/30 rounded text-[9px] text-white/70">HD</span>
            </div>

            {/* Title */}
            <h4 className="text-white font-bold text-xs leading-tight line-clamp-2">{book.title}</h4>
          </div>
        </div>
      </button>
    </div>
  );
});

// ============================================
// CAROUSEL ROW — Optimized
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
    ref?.addEventListener('scroll', updateScrollState, { passive: true });
    return () => ref?.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState, books.length]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  }, []);

  if (books.length === 0) return null;

  return (
    <div className="relative group/row py-6">
      {/* Title */}
      <div className="flex items-center gap-3 px-6 lg:px-16 mb-4 animate-fade-in">
        <div 
          className="p-2 rounded-lg"
          style={{ background: 'linear-gradient(135deg, rgba(229,9,20,0.2) 0%, rgba(229,9,20,0.05) 100%)', boxShadow: '0 0 20px rgba(229,9,20,0.1)' }}
        >
          {icon}
        </div>
        <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight group-hover/row:text-red-500 transition-colors duration-300">
          {title}
        </h2>
        <div className="flex items-center gap-1 text-red-500 text-sm font-medium opacity-0 group-hover/row:opacity-100 transition-opacity">
          <span>Explorar Todos</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-30 w-16 lg:w-20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, transparent 100%)' }}
          >
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:border-white/50 hover:scale-110 transition-all">
              <ChevronLeft className="w-7 h-7 text-white" />
            </div>
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-30 w-16 lg:w-20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.95) 0%, transparent 100%)' }}
          >
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:border-white/50 hover:scale-110 transition-all">
              <ChevronRight className="w-7 h-7 text-white" />
            </div>
          </button>
        )}

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scroll-smooth px-6 lg:px-16 pb-32 pt-4 hide-scrollbar"
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
// LOADING STATE — Optimized
// ============================================

const LoadingState = memo(function LoadingState({ isHighEnd }: { isHighEnd: boolean }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div 
            className="w-28 h-28 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
              animation: isHighEnd ? 'netflix-pulse 2s ease-in-out infinite' : undefined,
              boxShadow: '0 0 60px rgba(229,9,20,0.4)'
            }}
          >
            <Library className="w-14 h-14 text-white" />
          </div>
          
          {/* Orbital Rings */}
          {isHighEnd && [1, 2, 3].map((ring) => (
            <div 
              key={ring}
              className="absolute rounded-full border pointer-events-none"
              style={{
                inset: `${-ring * 20}px`,
                borderColor: `rgba(229,9,20,${0.4 - ring * 0.1})`,
                borderWidth: ring === 1 ? '2px' : '1px',
                animation: `netflix-orbit ${4 + ring * 2}s linear infinite${ring % 2 === 0 ? ' reverse' : ''}`
              }}
            />
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-white text-2xl font-bold tracking-wide animate-pulse">
            Carregando...
          </p>
          <p className="text-white/40 text-sm mt-2">Preparando sua experiência</p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// COMPONENTE PRINCIPAL — PERFORMANCE ADAPTIVE
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
  
  // Performance tier detection
  const { tier, isLowEnd, isCritical } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural' || tier === 'enhanced';

  // Skip intro on subsequent visits
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('moisa_library_intro');
    if (hasSeenIntro) setShowIntro(false);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    sessionStorage.setItem('moisa_library_intro', 'true');
  }, []);

  // Category cover map
  const categoryCoverMap = useMemo(() => {
    const map: Record<string, string> = {};
    dbCategories.forEach(cat => {
      if (cat.effectiveCover) map[cat.id] = cat.effectiveCover;
    });
    return map;
  }, [dbCategories]);

  const getCoverForBook = useCallback((book: WebBookListItem): string | null => {
    const normalizedCatId = normalizeCategoryId(book.category);
    if (normalizedCatId && categoryCoverMap[normalizedCatId]) return categoryCoverMap[normalizedCatId];
    return null;
  }, [categoryCoverMap]);

  useEffect(() => {
    if (externalCategory !== undefined) {
      const category = externalCategory || 'all';
      setSelectedCategory(category);
      loadBooks(externalCategory || undefined);
    }
  }, [externalCategory, loadBooks]);

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = !searchQuery || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  // Categorize books
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
    loadBooks(category === 'all' ? undefined : category);
  }, [loadBooks]);

  // Loading
  if (isLoading && books.length === 0) {
    return <LoadingState isHighEnd={isHighEnd} />;
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div 
            className="w-24 h-24 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)', boxShadow: '0 0 40px rgba(153,27,27,0.5)' }}
          >
            <BookOpen className="w-12 h-12 text-white" />
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
    <div className={cn("min-h-screen bg-black", !isHighEnd && "perf-reduced", className)}>
      {/* Intro Animation */}
      <AnimatePresence>
        {showIntro && <NetflixLogoIntro onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* Optimized Styles */}
      <style>{OPTIMIZED_STYLES}</style>

      {/* Fixed Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-16 py-4 animate-fade-down"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
          animationDelay: showIntro ? '2.2s' : '0s'
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

          {/* Category */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px] h-10 bg-black/50 border-white/20 text-white rounded focus:ring-red-500/50">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white">
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value} className="text-white/80 focus:bg-red-600/40 focus:text-white">
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
      </nav>

      {/* Hero */}
      {heroBook && (
        <div className="animate-fade-in" style={{ animationDelay: showIntro ? '2.2s' : '0s' }}>
          <HeroBillboard 
            book={heroBook} 
            onClick={() => onBookSelect(heroBook.id)}
            categoryCoverUrl={getCoverForBook(heroBook)}
            isHighEnd={isHighEnd}
          />
        </div>
      )}

      {/* Content Rows */}
      <div 
        className="relative z-10 -mt-40 pb-20 space-y-2 animate-fade-in"
        style={{ animationDelay: showIntro ? '2.5s' : '0.3s' }}
      >
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

        {categorizedBooks.completed.length > 0 && (
          <CarouselRow
            title="Concluídos"
            icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
            books={categorizedBooks.completed}
            onBookSelect={onBookSelect}
            getCoverForBook={getCoverForBook}
          />
        )}

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
              className="w-24 h-24 rounded-xl flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(229,9,20,0.2) 0%, rgba(229,9,20,0.05) 100%)' }}
            >
              <Search className="w-12 h-12 text-red-500/50" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Nenhum livro encontrado</h2>
            <p className="text-white/50 max-w-md">
              Tente ajustar sua busca ou filtros para encontrar o que procura.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
