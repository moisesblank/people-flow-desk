// ============================================
// 📚 LIVROS DO MOISA — NETFLIX ULTRA PREMIUM v17.0
// Year 2300 Cinematic + Spider-Man Red (#E23636)
// PERFORMANCE ADAPTATIVA — 5000+ USUÁRIOS
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
  Sparkles,
  GraduationCap,
  Layers,
  PlayCircle,
  Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCategoryConfig, normalizeCategoryId } from './CategoryCover';
import { useBookCategories } from '@/hooks/useBookCategories';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { CyberBackground } from '@/components/ui/cyber-background';
import { FuturisticPageHeader } from '@/components/ui/futuristic-page-header';

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
// CSS KEYFRAMES — GPU OPTIMIZED + YEAR 2300
// ============================================

const CINEMATIC_STYLES = `
  @keyframes cinematic-pulse {
    0%, 100% { box-shadow: 0 0 40px rgba(226,54,54,0.3), inset 0 0 20px rgba(226,54,54,0.1); }
    50% { box-shadow: 0 0 80px rgba(226,54,54,0.5), inset 0 0 40px rgba(226,54,54,0.2); }
  }
  @keyframes cinematic-glow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
  @keyframes cinematic-orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes cinematic-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes cinematic-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes cinematic-scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
  .cinematic-card { 
    transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), 
                box-shadow 0.4s ease,
                border-color 0.3s ease; 
  }
  .cinematic-card:hover { 
    transform: scale(1.08) translateY(-8px); 
    z-index: 30;
    border-color: rgba(226,54,54,0.8);
    box-shadow: 0 20px 60px rgba(226,54,54,0.4), 0 0 100px rgba(226,54,54,0.2);
  }
  .perf-reduced .cinematic-card:hover { 
    transform: scale(1.03) translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
  .perf-reduced .cinematic-pulse { animation: none !important; }
  .perf-reduced .cinematic-glow { display: none !important; }
  .perf-reduced .cinematic-particles { display: none !important; }
  .perf-reduced .cinematic-scanline { display: none !important; }
`;

// ============================================
// 🎯 HUD STAT ORB — YEAR 2300 CINEMATIC
// Orbes flutuantes com glow holográfico intenso
// ============================================

const HudStatOrb = memo(function HudStatOrb({ 
  icon, 
  value, 
  label, 
  color,
  glowColor
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: string;
  glowColor?: string;
}) {
  return (
    <div className={cn(
      "group relative p-4 md:p-5 rounded-2xl border-2 backdrop-blur-xl transition-all duration-500",
      "bg-gradient-to-br hover:scale-[1.03] hover:shadow-2xl",
      "cursor-default select-none",
      color
    )}>
      {/* Outer glow ring */}
      <div className={cn(
        "absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500 -z-10",
        glowColor || "bg-[#E23636]"
      )} />
      
      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-current opacity-50 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-current opacity-50 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-current opacity-50 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-current opacity-50 rounded-br-lg" />
      
      <div className="flex items-center gap-3">
        {/* Icon container with pulse */}
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-current opacity-20 blur-md animate-pulse" />
          <div className="relative p-2.5 rounded-xl bg-background/30 backdrop-blur-sm border border-current/30 shadow-inner">
            {icon}
          </div>
        </div>
        
        {/* Value and label */}
        <div>
          <p className="text-2xl md:text-3xl font-black tracking-tight tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 🎨 HIERARCHY LEGEND — NETFLIX PREMIUM CINEMATIC
// ============================================

const HierarchyLegend = memo(function HierarchyLegend() {
  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-r from-[#1a0a0a]/60 via-[#0a0e14]/80 to-[#1a0a0a]/60 border-2 border-[#E23636]/30 backdrop-blur-xl overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#E23636]/15 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-[#E23636]/10 rounded-full blur-3xl -z-10" />
      
      <div className="flex flex-wrap items-center gap-3 justify-center">
        <span className="text-sm font-bold text-slate-300 mr-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#E23636]" />
          BIBLIOTECA:
        </span>
        
        {/* Categorias */}
        <Badge className="px-3 py-1.5 text-xs bg-[#E23636]/25 text-[#FF6B6B] border-2 border-[#E23636]/50 shadow-lg shadow-[#E23636]/30 hover:scale-105 transition-transform">
          <Layers className="h-3.5 w-3.5 mr-1.5" />
          Categoria
        </Badge>
        
        <ChevronRight className="h-4 w-4 text-[#E23636]/70" />
        
        {/* Livros */}
        <Badge className="px-3 py-1.5 text-xs bg-slate-700/50 text-slate-200 border-2 border-slate-500/40 shadow-lg hover:scale-105 transition-transform">
          <BookOpen className="h-3.5 w-3.5 mr-1.5" />
          Livros
        </Badge>
        
        <ChevronRight className="h-4 w-4 text-slate-500" />
        
        {/* Leitura */}
        <Badge className="px-3 py-1.5 text-xs bg-[#E23636]/25 text-[#FF6B6B] border-2 border-[#E23636]/50 shadow-lg shadow-[#E23636]/30 hover:scale-105 transition-transform">
          <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
          Leitura
        </Badge>
      </div>
    </div>
  );
});

// ============================================
// 📊 STATS PANEL — YEAR 2300 HUD
// ============================================

interface StatsPanelProps {
  totalBooks: number;
  inProgress: number;
  completed: number;
  trending: number;
}

const StatsPanel = memo(function StatsPanel({ 
  totalBooks, 
  inProgress, 
  completed, 
  trending 
}: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <HudStatOrb
        icon={<Library className="h-5 w-5 md:h-6 md:w-6 text-[#E23636]" />}
        value={totalBooks}
        label="Total"
        color="from-[#E23636]/15 to-[#E23636]/5 border-[#E23636]/40 text-[#FF6B6B]"
        glowColor="bg-[#E23636]"
      />
      <HudStatOrb
        icon={<Clock className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />}
        value={inProgress}
        label="Lendo"
        color="from-amber-500/15 to-amber-500/5 border-amber-500/40 text-amber-300"
        glowColor="bg-amber-500"
      />
      <HudStatOrb
        icon={<CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-emerald-400" />}
        value={completed}
        label="Concluídos"
        color="from-emerald-500/15 to-emerald-500/5 border-emerald-500/40 text-emerald-300"
        glowColor="bg-emerald-500"
      />
      <HudStatOrb
        icon={<Flame className="h-5 w-5 md:h-6 md:w-6 text-orange-400" />}
        value={trending}
        label="Trending"
        color="from-orange-500/15 to-orange-500/5 border-orange-500/40 text-orange-300"
        glowColor="bg-orange-500"
      />
    </div>
  );
});

// ============================================
// 🎬 CINEMATIC BOOK CARD — YEAR 2300 DESIGN
// ============================================

const CinematicBookCard = memo(function CinematicBookCard({
  book,
  onClick,
  categoryCoverUrl,
  index,
  isHighEnd
}: {
  book: WebBookListItem;
  onClick: () => void;
  categoryCoverUrl?: string | null;
  index: number;
  isHighEnd: boolean;
}) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const coverImage = book.coverUrl || categoryCoverUrl || getCategoryConfig(book.category)?.cover;

  return (
    <div
      className="relative flex-shrink-0 w-[180px] md:w-[200px] cinematic-card animate-fade-in group"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
    >
      <button
        onClick={onClick}
        className={cn(
          "relative w-full rounded-2xl overflow-hidden transition-all duration-500",
          "bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#1a0a0a]",
          "border-2 border-[#E23636]/30 hover:border-[#E23636]/80",
          "shadow-xl shadow-black/50 hover:shadow-[#E23636]/30",
          "focus:outline-none focus:ring-2 focus:ring-[#E23636]/50"
        )}
        style={{ aspectRatio: '2/3' }}
      >
        {/* Spider-Man corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-3 border-t-3 border-[#E23636]/50 rounded-tl-2xl pointer-events-none z-20 group-hover:border-[#E23636] transition-colors" />
        <div className="absolute top-0 right-0 w-8 h-8 border-r-3 border-t-3 border-[#E23636]/40 rounded-tr-2xl pointer-events-none z-20 group-hover:border-[#E23636] transition-colors" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-3 border-b-3 border-[#E23636]/40 rounded-bl-2xl pointer-events-none z-20 group-hover:border-[#E23636] transition-colors" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-3 border-b-3 border-[#E23636]/50 rounded-br-2xl pointer-events-none z-20 group-hover:border-[#E23636] transition-colors" />

        {/* Cover Image */}
        {coverImage ? (
          <img
            src={coverImage}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <BookOpen className="w-14 h-14 text-[#E23636]/30" />
          </div>
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#E23636]/0 via-transparent to-[#E23636]/0 group-hover:from-[#E23636]/10 group-hover:to-[#E23636]/5 transition-all duration-500" />

        {/* Scanline Effect (High-End) */}
        {isHighEnd && (
          <div 
            className="cinematic-scanline absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`
            }}
          />
        )}

        {/* Completed Badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3 z-30">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-emerald-400/50"
              style={{ 
                background: 'linear-gradient(135deg, rgba(16,185,129,0.9) 0%, rgba(5,150,105,0.9) 100%)', 
                boxShadow: '0 0 20px rgba(16,185,129,0.5)' 
              }}
            >
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {/* Progress Badge */}
        {hasStarted && !isCompleted && (
          <div className="absolute top-3 left-3 z-30">
            <div 
              className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-amber-400/50"
              style={{ 
                background: 'linear-gradient(135deg, rgba(245,158,11,0.9) 0%, rgba(217,119,6,0.9) 100%)',
                boxShadow: '0 0 15px rgba(245,158,11,0.4)'
              }}
            >
              <Clock className="w-3 h-3" />
              {progress.toFixed(0)}%
            </div>
          </div>
        )}

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          {/* Progress Bar */}
          {hasStarted && !isCompleted && (
            <div className="mb-3">
              <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #E23636 0%, #FF6B6B 100%)',
                    boxShadow: '0 0 10px rgba(226,54,54,0.6)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-2 group-hover:text-[#FF6B6B] transition-colors">
            {book.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-2 text-[10px] text-white/60">
            {book.totalPages > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {book.totalPages} pág
              </span>
            )}
            {book.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {book.viewCount}
              </span>
            )}
          </div>
        </div>

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-25">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-white/80 backdrop-blur-sm"
            style={{ 
              background: 'linear-gradient(135deg, rgba(226,54,54,0.95) 0%, rgba(180,30,30,0.95) 100%)',
              boxShadow: '0 0 30px rgba(226,54,54,0.6)'
            }}
          >
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </div>
        </div>

        {/* Glow Effect (High-End) */}
        {isHighEnd && (
          <div 
            className="cinematic-glow absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 -z-10 pointer-events-none transition-opacity duration-500"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(226,54,54,0.3) 0%, transparent 70%)',
              filter: 'blur(20px)'
            }}
          />
        )}
      </button>
    </div>
  );
});

// ============================================
// 📚 CAROUSEL ROW — NETFLIX PREMIUM CINEMATIC
// ============================================

interface CarouselRowProps {
  title: string;
  icon: React.ReactNode;
  books: WebBookListItem[];
  onBookSelect: (bookId: string) => void;
  getCoverForBook: (book: WebBookListItem) => string | null;
  isHighEnd: boolean;
  accentColor?: string;
}

const CarouselRow = memo(function CarouselRow({ 
  title, 
  icon, 
  books, 
  onBookSelect,
  getCoverForBook,
  isHighEnd,
  accentColor = '#E23636'
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
    <div className="relative group/row">
      {/* Section Card with Corner Accents */}
      <div className={cn(
        "relative overflow-hidden transition-all duration-500",
        "bg-gradient-to-br from-[#0a0e14]/80 via-[#0f1419]/60 to-[#1a0a0a]/80",
        "border-2 border-[#E23636]/20 hover:border-[#E23636]/40",
        "rounded-3xl p-6",
        "shadow-xl shadow-black/30"
      )}>
        {/* Spider-Man style corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-[#E23636]/40 rounded-tl-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-[#E23636]/30 rounded-tr-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-[#E23636]/30 rounded-bl-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-[#E23636]/40 rounded-br-3xl pointer-events-none" />

        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-10 group-hover/row:opacity-20 transition-opacity pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top left, ${accentColor}30 0%, transparent 50%)` }}
        />

        {/* Title Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            {/* Icon Orb */}
            <div className="relative">
              <div 
                className="absolute inset-0 rounded-xl blur-xl opacity-50"
                style={{ background: accentColor }}
              />
              <div 
                className="relative p-3 rounded-xl border-2"
                style={{ 
                  background: `linear-gradient(135deg, ${accentColor}40 0%, ${accentColor}20 100%)`,
                  borderColor: `${accentColor}60`,
                  boxShadow: `0 0 20px ${accentColor}30`
                }}
              >
                {icon}
              </div>
            </div>
            
            {/* Title & Count */}
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                {title}
                <Badge 
                  className="px-2.5 py-1 text-xs font-bold"
                  style={{ 
                    background: `${accentColor}30`,
                    color: accentColor,
                    borderColor: `${accentColor}50`
                  }}
                >
                  {books.length}
                </Badge>
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                {books.length === 1 ? '1 livro disponível' : `${books.length} livros disponíveis`}
              </p>
            </div>
          </div>

          {/* Explore Link */}
          <div className="hidden md:flex items-center gap-1.5 text-[#E23636] text-sm font-medium opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer hover:text-[#FF6B6B]">
            <span>Ver Todos</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 -translate-x-2 group-hover/row:translate-x-0"
              style={{
                background: 'linear-gradient(135deg, rgba(226,54,54,0.9) 0%, rgba(180,30,30,0.9) 100%)',
                boxShadow: '0 0 30px rgba(226,54,54,0.5)'
              }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 translate-x-2 group-hover/row:translate-x-0"
              style={{
                background: 'linear-gradient(135deg, rgba(226,54,54,0.9) 0%, rgba(180,30,30,0.9) 100%)',
                boxShadow: '0 0 30px rgba(226,54,54,0.5)'
              }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Scrollable Row */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar py-2"
          >
            {books.map((book, index) => (
              <CinematicBookCard
                key={book.id}
                book={book}
                onClick={() => onBookSelect(book.id)}
                categoryCoverUrl={getCoverForBook(book)}
                index={index}
                isHighEnd={isHighEnd}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 🔍 SEARCH BAR — YEAR 2300 CINEMATIC
// ============================================

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}

const SearchBar = memo(function SearchBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange
}: SearchBarProps) {
  return (
    <div className={cn(
      "relative p-4 rounded-2xl overflow-hidden",
      "bg-gradient-to-r from-[#1a0a0a]/80 via-[#0a0e14]/90 to-[#1a0a0a]/80",
      "border-2 border-[#E23636]/25 backdrop-blur-xl"
    )}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-3 border-t-3 border-[#E23636]/40 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-3 border-t-3 border-[#E23636]/40 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-3 border-b-3 border-[#E23636]/40 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-3 border-b-3 border-[#E23636]/40 rounded-br-2xl" />

      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-40 h-20 bg-[#E23636]/10 rounded-full blur-3xl -z-10" />

      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E23636]/70" />
          <Input
            type="text"
            placeholder="Buscar livros, autores..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "pl-12 h-12 rounded-xl",
              "bg-slate-900/60 border-2 border-slate-600/30",
              "text-white placeholder:text-white/40",
              "focus:bg-slate-900/80 focus:border-[#E23636]/50 focus:ring-2 focus:ring-[#E23636]/20",
              "transition-all duration-300"
            )}
          />
        </div>

        {/* Category Select */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger 
            className={cn(
              "w-full md:w-[220px] h-12 rounded-xl",
              "bg-slate-900/60 border-2 border-slate-600/30 text-white",
              "focus:ring-2 focus:ring-[#E23636]/30"
            )}
          >
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 text-white rounded-xl">
            {CATEGORIES.map(cat => (
              <SelectItem 
                key={cat.value} 
                value={cat.value} 
                className="text-white/80 focus:bg-[#E23636]/30 focus:text-white rounded-lg"
              >
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

// ============================================
// 🎬 LOADING STATE — YEAR 2300 CINEMATIC
// ============================================

const LoadingState = memo(function LoadingState({ isHighEnd }: { isHighEnd: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#1a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div 
            className="w-28 h-28 rounded-2xl flex items-center justify-center border-2 border-[#E23636]/50"
            style={{ 
              background: 'linear-gradient(135deg, rgba(226,54,54,0.3) 0%, rgba(180,30,30,0.2) 100%)',
              animation: isHighEnd ? 'cinematic-pulse 2s ease-in-out infinite' : undefined,
              boxShadow: '0 0 60px rgba(226,54,54,0.4)'
            }}
          >
            <Library className="w-14 h-14 text-[#E23636]" />
          </div>
          
          {/* Orbital Rings */}
          {isHighEnd && [1, 2, 3].map((ring) => (
            <div 
              key={ring}
              className="absolute rounded-full border pointer-events-none"
              style={{
                inset: `${-ring * 20}px`,
                borderColor: `rgba(226,54,54,${0.4 - ring * 0.1})`,
                borderWidth: ring === 1 ? '2px' : '1px',
                animation: `cinematic-orbit ${4 + ring * 2}s linear infinite${ring % 2 === 0 ? ' reverse' : ''}`
              }}
            />
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-white text-2xl font-bold tracking-wide animate-pulse">
            Carregando Biblioteca...
          </p>
          <p className="text-white/40 text-sm mt-2">Preparando sua experiência Year 2300</p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 🚀 COMPONENTE PRINCIPAL — YEAR 2300 CINEMATIC
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
  
  // Performance tier detection
  const { tier, isLowEnd, isCritical } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural' || tier === 'enhanced';

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
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#1a0a0a] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div 
            className="w-24 h-24 rounded-2xl flex items-center justify-center border-2 border-red-500/50"
            style={{ 
              background: 'linear-gradient(135deg, rgba(153,27,27,0.4) 0%, rgba(127,29,29,0.3) 100%)', 
              boxShadow: '0 0 40px rgba(153,27,27,0.5)' 
            }}
          >
            <BookOpen className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Ops!</h2>
          <p className="text-white/60">{error}</p>
          <button
            onClick={() => loadBooks()}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#E23636] to-[#B41E1E] hover:from-[#FF4444] hover:to-[#E23636] text-white font-bold transition-all duration-300 shadow-lg shadow-[#E23636]/30"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-screen", !isHighEnd && "perf-reduced", className)}>
      {/* Cinematic Background */}
      <CyberBackground variant="grid" intensity="medium" />
      
      {/* Cinematic Styles */}
      <style>{CINEMATIC_STYLES}</style>

      <div className="relative z-10 p-3 md:p-4 lg:p-6">
        <div className="mx-auto max-w-[98vw] space-y-6">
          
          {/* Futuristic Header */}
          <FuturisticPageHeader
            title="Livros do Moisa"
            subtitle="Biblioteca digital completa com materiais exclusivos"
            icon={BookOpen}
            accentColor="primary"
          />

          {/* Stats Panel */}
          <StatsPanel
            totalBooks={filteredBooks.length}
            inProgress={categorizedBooks.inProgress.length}
            completed={categorizedBooks.completed.length}
            trending={categorizedBooks.trending.length}
          />

          {/* Hierarchy Legend */}
          <HierarchyLegend />

          {/* Search Bar */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          {/* Content Rows */}
          <div className="space-y-6">
            {categorizedBooks.inProgress.length > 0 && (
              <CarouselRow
                title="Continuar Lendo"
                icon={<Clock className="w-6 h-6 text-amber-400" />}
                books={categorizedBooks.inProgress}
                onBookSelect={onBookSelect}
                getCoverForBook={getCoverForBook}
                isHighEnd={isHighEnd}
                accentColor="#F59E0B"
              />
            )}

            {categorizedBooks.completed.length > 0 && (
              <CarouselRow
                title="Concluídos"
                icon={<CheckCircle className="w-6 h-6 text-emerald-400" />}
                books={categorizedBooks.completed}
                onBookSelect={onBookSelect}
                getCoverForBook={getCoverForBook}
                isHighEnd={isHighEnd}
                accentColor="#10B981"
              />
            )}

            {categorizedBooks.trending.length > 0 && (
              <CarouselRow
                title="Mais Populares"
                icon={<Flame className="w-6 h-6 text-orange-400" />}
                books={categorizedBooks.trending}
                onBookSelect={onBookSelect}
                getCoverForBook={getCoverForBook}
                isHighEnd={isHighEnd}
                accentColor="#F97316"
              />
            )}

            <CarouselRow
              title="Todos os Livros"
              icon={<Library className="w-6 h-6 text-[#E23636]" />}
              books={filteredBooks}
              onBookSelect={onBookSelect}
              getCoverForBook={getCoverForBook}
              isHighEnd={isHighEnd}
              accentColor="#E23636"
            />

            {/* Empty State */}
            {filteredBooks.length === 0 && !isLoading && (
              <div className={cn(
                "relative p-12 rounded-3xl overflow-hidden text-center",
                "bg-gradient-to-br from-[#0a0e14]/80 via-[#0f1419]/60 to-[#1a0a0a]/80",
                "border-2 border-[#E23636]/20"
              )}>
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-[#E23636]/40 rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-[#E23636]/40 rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-[#E23636]/40 rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-[#E23636]/40 rounded-br-3xl" />

                <div 
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center border-2 border-[#E23636]/40"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(226,54,54,0.2) 0%, rgba(180,30,30,0.1) 100%)',
                    boxShadow: '0 0 40px rgba(226,54,54,0.2)'
                  }}
                >
                  <Search className="w-10 h-10 text-[#E23636]/60" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Nenhum livro encontrado</h3>
                <p className="text-white/50">Tente ajustar seus filtros de busca</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default WebBookLibrary;
