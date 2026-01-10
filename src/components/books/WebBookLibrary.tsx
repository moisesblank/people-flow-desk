// ============================================
// 📚 LIVROS DO MOISA — NETFLIX ULTRA PREMIUM
// LAYOUT: CAPA CENTRALIZADA + INFOS NAS LATERAIS
// EXATAMENTE como AlunoCoursesHierarchy/NetflixModuleSection
// Spider-Man Red (#E23636) + Year 2300 Cinematic
// ============================================

import React, { memo, useState, useCallback, useMemo } from 'react';
import { useWebBookLibrary, WebBookListItem } from '@/hooks/useWebBook';
import { 
  BookOpen, 
  CheckCircle,
  Play,
  Clock,
  Library,
  Flame,
  BookMarked,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  Zap,
  Target,
  Crown,
  Star,
  TrendingUp,
  GraduationCap,
  Rocket,
  Timer,
  Book,
  ArrowRight,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCategoryConfig, normalizeCategoryId } from './CategoryCover';
import { useBookCategories } from '@/hooks/useBookCategories';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { CyberBackground } from '@/components/ui/cyber-background';
import { FuturisticPageHeader } from '@/components/ui/futuristic-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import '@/styles/dashboard-2300.css';

// ============================================
// 🖼️ CAPAS PERMANENTES DOS LIVROS
// ============================================

import capa1RevisaoCiclica from '@/assets/book-covers/capa-1-revisao-ciclica.png';
import capa2FisicoQuimica from '@/assets/book-covers/capa-2-fisico-quimica.png';
import capa3PrevisaoFinal from '@/assets/book-covers/capa-3-previsao-final.png';
import capa4QuimicaOrganica from '@/assets/book-covers/capa-4-quimica-organica.png';
import capa5QuimicaGeral from '@/assets/book-covers/capa-5-quimica-geral.png';

// Mapa de capas por índice (ordem de exibição)
const BOOK_COVERS_BY_INDEX: Record<number, string> = {
  0: capa1RevisaoCiclica,
  1: capa2FisicoQuimica,
  2: capa3PrevisaoFinal,
  3: capa4QuimicaOrganica,
  4: capa5QuimicaGeral,
};

// ============================================
// TIPOS
// ============================================

interface WebBookLibraryProps {
  onBookSelect: (bookId: string) => void;
  externalCategory?: string | null;
  className?: string;
}

// ============================================
// 🎯 HUD STAT ORB — NETFLIX PREMIUM
// ============================================

const HudStatOrb = memo(function HudStatOrb({ 
  icon, 
  value, 
  label, 
  color,
  glowColor,
  isHighEnd
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: string;
  glowColor?: string;
  isHighEnd: boolean;
}) {
  return (
    <div className={cn(
      "group relative p-5 md:p-6 rounded-2xl border-2 backdrop-blur-xl transition-all duration-500",
      "bg-gradient-to-br hover:scale-[1.03] hover:shadow-2xl",
      "cursor-default select-none",
      color
    )}>
      {isHighEnd && (
        <div className={cn(
          "absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500 -z-10",
          glowColor || "bg-primary"
        )} />
      )}
      
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-current opacity-50 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-current opacity-50 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-current opacity-50 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-current opacity-50 rounded-br-xl" />
      
      <div className="flex items-center gap-4">
        <div className="relative">
          {isHighEnd && (
            <div className="absolute inset-0 rounded-xl bg-current opacity-20 blur-md animate-pulse" />
          )}
          <div className="relative p-3 rounded-xl bg-background/30 backdrop-blur-sm border border-current/30 shadow-inner">
            {icon}
          </div>
        </div>
        
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest opacity-80">{label}</p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 📊 STATS PANEL — NETFLIX PREMIUM TRIPLE ORB
// ============================================

const StatsPanel = memo(function StatsPanel({ 
  totalBooks, 
  inProgress, 
  completed,
  isHighEnd
}: { 
  totalBooks: number;
  inProgress: number;
  completed: number;
  isHighEnd: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
      <HudStatOrb
        icon={<Library className="h-6 w-6 md:h-7 md:w-7 text-[#E23636]" />}
        value={totalBooks}
        label="Biblioteca"
        color="from-[#E23636]/20 to-[#E23636]/5 border-[#E23636]/50 text-[#FF6B6B]"
        glowColor="bg-[#E23636]"
        isHighEnd={isHighEnd}
      />
      <HudStatOrb
        icon={<Flame className="h-6 w-6 md:h-7 md:w-7 text-amber-400" />}
        value={inProgress}
        label="Em Leitura"
        color="from-amber-500/20 to-amber-500/5 border-amber-500/50 text-amber-300"
        glowColor="bg-amber-500"
        isHighEnd={isHighEnd}
      />
      <HudStatOrb
        icon={<Crown className="h-6 w-6 md:h-7 md:w-7 text-emerald-400" />}
        value={completed}
        label="Dominados"
        color="from-emerald-500/20 to-emerald-500/5 border-emerald-500/50 text-emerald-300"
        glowColor="bg-emerald-500"
        isHighEnd={isHighEnd}
      />
    </div>
  );
});

// ============================================
// 🎬 XP POWER BANNER — SIMULADOS STYLE
// ============================================

const XPPowerBanner = memo(function XPPowerBanner({ isHighEnd }: { isHighEnd: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="dashboard-hero-2300 p-5 md:p-6">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#E23636] via-red-500 to-amber-500 flex items-center justify-center shadow-lg">
            <BookMarked className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1">
              Biblioteca <span className="text-[#E23636]">Premium</span> do MOISA
            </h3>
            <p className="text-cyan-100/70 text-sm md:text-base max-w-xl">
              Materiais exclusivos para sua aprovação. Cada página te aproxima do sonho!
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E23636] to-red-500 shadow-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  <span className="text-xl md:text-2xl font-bold text-white">+XP</span>
                </div>
              </div>
              <span className="text-[10px] text-cyan-200/50 uppercase tracking-wider">por livro</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  <span className="text-xl md:text-2xl font-bold text-white">100%</span>
                </div>
              </div>
              <span className="text-[10px] text-cyan-200/50 uppercase tracking-wider">exclusivo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 📚 NETFLIX BOOK SECTION — CAPA CENTRALIZADA
// EXATAMENTE COMO NetflixModuleSection em Cursos
// Infos ESQUERDA + CAPA CENTRO + Ações DIREITA
// ============================================

interface NetflixBookSectionProps {
  book: WebBookListItem;
  index: number;
  coverUrl: string;
  onSelect: () => void;
  isHighEnd: boolean;
}

const NetflixBookSection = memo(function NetflixBookSection({
  book,
  index,
  coverUrl,
  onSelect,
  isHighEnd
}: NetflixBookSectionProps) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const isReading = hasStarted && !isCompleted;
  const isNew = !hasStarted && !isCompleted;

  // Status colors
  const statusColors = {
    completed: {
      border: "border-emerald-500/40 hover:border-emerald-500/70",
      glow: "shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]",
      accent: "text-emerald-400",
      bgAccent: "bg-emerald-500",
      badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
    },
    reading: {
      border: "border-amber-500/40 hover:border-amber-500/70",
      glow: "shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]",
      accent: "text-amber-400",
      bgAccent: "bg-amber-500",
      badge: "bg-amber-500/20 text-amber-400 border-amber-500/40"
    },
    new: {
      border: "border-[#E23636]/40 hover:border-[#E23636]/70",
      glow: "shadow-[0_0_40px_-10px_rgba(226,54,54,0.4)]",
      accent: "text-[#E23636]",
      bgAccent: "bg-[#E23636]",
      badge: "bg-[#E23636]/20 text-[#E23636] border-[#E23636]/40"
    }
  };

  const currentStatus = isCompleted ? statusColors.completed 
    : isReading ? statusColors.reading 
    : statusColors.new;

  return (
    <div 
      className={cn(
        "group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500",
        "bg-gradient-to-br from-black/95 via-card/90 to-black/95",
        "border-2",
        currentStatus.border,
        isHighEnd && "hover:" + currentStatus.glow
      )}
      onClick={onSelect}
    >
      {/* 🎬 NETFLIX ULTRA PREMIUM LAYOUT: 3 COLUNAS */}
      <div className="flex flex-col lg:flex-row items-stretch">
        
        {/* 📋 COLUNA ESQUERDA — INFOS DO LIVRO */}
        <div className="lg:w-[35%] p-5 md:p-6 lg:p-8 flex flex-col justify-center order-2 lg:order-1">
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-4">
            {isCompleted ? (
              <span className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border",
                currentStatus.badge
              )}>
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                Dominado
              </span>
            ) : isReading ? (
              <span className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border",
                currentStatus.badge
              )}>
                <Timer className="w-3.5 h-3.5 mr-1.5" />
                Lendo • {progress.toFixed(0)}%
              </span>
            ) : (
              <span className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border",
                currentStatus.badge
              )}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Novo
              </span>
            )}
          </div>

          {/* Número + Título */}
          <div className="mb-4">
            <div className={cn(
              "inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 mb-3 font-black text-lg",
              "bg-black/50 backdrop-blur-sm",
              isCompleted ? "text-emerald-400 border-emerald-500/50" 
                : isReading ? "text-amber-400 border-amber-500/50"
                : "text-[#E23636] border-[#E23636]/50"
            )}>
              {String(index + 1).padStart(2, '0')}
            </div>
            <h3 className={cn(
              "text-xl md:text-2xl lg:text-3xl font-black tracking-tight mb-2 transition-colors duration-300",
              "text-white group-hover:" + currentStatus.accent.replace("text-", "text-")
            )}>
              {book.title}
            </h3>
            {book.author && (
              <p className="text-sm text-muted-foreground/80 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                {book.author}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-bold text-white">{book.totalPages || 0}</span>
              <span className="text-[10px] text-slate-500 uppercase">páginas</span>
            </div>
            
            {(book.viewCount || 0) > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Eye className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-white">{book.viewCount}</span>
              </div>
            )}
          </div>

          {/* Progress Bar (If reading) */}
          {isReading && (
            <div className="mt-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 🖼️ COLUNA CENTRAL — CAPA GRANDE CENTRALIZADA */}
        <div className="lg:w-[30%] flex-shrink-0 flex items-center justify-center p-4 lg:py-6 order-1 lg:order-2">
          <div className="relative group/cover">
            {/* Capa com aspect ratio 3:4 */}
            <div 
              className={cn(
                "relative w-48 md:w-56 lg:w-64 aspect-[3/4] rounded-xl overflow-hidden",
                "border-4 transition-all duration-500",
                "shadow-2xl",
                isCompleted ? "border-emerald-500/50 group-hover/cover:border-emerald-500" 
                  : isReading ? "border-amber-500/50 group-hover/cover:border-amber-500"
                  : "border-[#E23636]/50 group-hover/cover:border-[#E23636]",
                isHighEnd && "group-hover/cover:scale-[1.02]"
              )}
            >
              <img 
                src={coverUrl} 
                alt={book.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              
              {/* Overlay Glow */}
              {isHighEnd && (
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-500 pointer-events-none",
                  isCompleted ? "bg-gradient-to-t from-emerald-500/20 via-transparent to-transparent"
                    : isReading ? "bg-gradient-to-t from-amber-500/20 via-transparent to-transparent"
                    : "bg-gradient-to-t from-[#E23636]/20 via-transparent to-transparent"
                )} />
              )}

              {/* Scanlines (High-End) */}
              {isHighEnd && (
                <div 
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)`
                  }}
                />
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-all duration-300 bg-black/30 backdrop-blur-sm">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center border-2",
                  "bg-black/60 backdrop-blur-md",
                  isCompleted ? "border-emerald-500 text-emerald-400" 
                    : isReading ? "border-amber-500 text-amber-400"
                    : "border-[#E23636] text-[#E23636]"
                )}>
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
              </div>
            </div>

            {/* Shadow beneath cover */}
            <div className={cn(
              "absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-8 rounded-full blur-2xl -z-10",
              isCompleted ? "bg-emerald-500/30" 
                : isReading ? "bg-amber-500/30"
                : "bg-[#E23636]/30"
            )} />
          </div>
        </div>

        {/* 🚀 COLUNA DIREITA — AÇÕES */}
        <div className="lg:w-[35%] p-5 md:p-6 lg:p-8 flex flex-col items-center lg:items-end justify-center order-3">
          {/* XP Badge */}
          <div className="flex flex-col items-center lg:items-end gap-4 mb-6">
            <div className={cn(
              "px-6 py-3 rounded-xl shadow-lg",
              "bg-gradient-to-r",
              isCompleted ? "from-emerald-600 to-green-600"
                : isReading ? "from-amber-600 to-orange-600"
                : "from-[#E23636] to-red-600"
            )}>
              <div className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5" />
                <span className="text-lg font-bold">+50 XP</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">ao completar</span>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-2 text-muted-foreground/70 mb-6">
            <Clock className="w-4 h-4" />
            <span className="text-sm">~{Math.max(15, Math.ceil((book.totalPages || 50) * 0.5))} min de leitura</span>
          </div>

          {/* Main Action Button */}
          <Button 
            size="lg"
            className={cn(
              "w-full lg:w-auto px-8 font-bold shadow-xl gap-3 text-lg transition-all duration-300",
              "hover:scale-105 hover:shadow-2xl",
              isCompleted 
                ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white"
                : isReading
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
                  : "bg-gradient-to-r from-[#E23636] to-red-600 hover:from-[#FF4444] hover:to-red-500 text-white"
            )}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Revisar Livro
              </>
            ) : isReading ? (
              <>
                <Play className="w-5 h-5" />
                Continuar Leitura
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Iniciar Leitura
              </>
            )}
          </Button>

          {/* Category Tag */}
          {book.category && (
            <div className="mt-4">
              <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                {book.category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ✨ CORNER ACCENTS — CSS only */}
      <div className={cn(
        "absolute top-0 left-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
        "border-l-2 border-t-2 rounded-tl-2xl",
        isCompleted ? "border-emerald-500/60" 
          : isReading ? "border-amber-500/60"
          : "border-[#E23636]/60"
      )} />
      <div className={cn(
        "absolute bottom-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
        "border-r-2 border-b-2 rounded-br-2xl",
        isCompleted ? "border-emerald-500/60" 
          : isReading ? "border-amber-500/60"
          : "border-[#E23636]/60"
      )} />
    </div>
  );
});

// ============================================
// 🔄 LOADING STATE — CINEMATIC
// ============================================

const UltimateLoadingState = memo(function UltimateLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-[#E23636]/20 border-t-[#E23636] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Book className="w-8 h-8 text-[#E23636]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-white">Carregando Biblioteca...</p>
        <p className="text-sm text-muted-foreground/60">Preparando sua experiência premium</p>
      </div>
    </div>
  );
});

// ============================================
// 🚫 EMPTY STATE
// ============================================

const UltimateEmptyState = memo(function UltimateEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#E23636]/20 to-[#E23636]/5 border-2 border-[#E23636]/30 flex items-center justify-center">
          <Library className="w-10 h-10 text-[#E23636]/60" />
        </div>
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-xl font-bold text-white mb-2">Biblioteca em Construção</h3>
        <p className="text-muted-foreground/70">
          Os livros exclusivos do MOISA estão sendo preparados. Em breve você terá acesso a materiais incríveis!
        </p>
      </div>
    </div>
  );
});

// ============================================
// 📚 MAIN COMPONENT — WEB BOOK LIBRARY
// ============================================

function WebBookLibrary({ 
  onBookSelect,
  externalCategory,
  className 
}: WebBookLibraryProps) {
  const { books, isLoading, error } = useWebBookLibrary();
  const perfConfig = useConstitutionPerformance();
  const isHighEnd = perfConfig.tier === 'quantum' || perfConfig.tier === 'neural';
  const { categories } = useBookCategories();

  // Stats calculados
  const stats = useMemo(() => {
    const total = books?.length || 0;
    const inProgress = books?.filter(b => 
      (b.progress?.progressPercent || 0) > 0 && 
      !b.progress?.isCompleted
    ).length || 0;
    const completed = books?.filter(b => b.progress?.isCompleted).length || 0;
    return { total, inProgress, completed };
  }, [books]);

  // Sort books: Reading first, then new, then completed
  const sortedBooks = useMemo(() => {
    if (!books) return [];
    return [...books].sort((a, b) => {
      const aProgress = a.progress?.progressPercent || 0;
      const bProgress = b.progress?.progressPercent || 0;
      const aCompleted = a.progress?.isCompleted || false;
      const bCompleted = b.progress?.isCompleted || false;
      
      // Completed last
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      
      // Reading (in progress) first
      if (aProgress > 0 && bProgress === 0) return -1;
      if (aProgress === 0 && bProgress > 0) return 1;
      
      // Then by progress percentage
      return bProgress - aProgress;
    });
  }, [books]);

  // Get cover for each book by index
  const getBookCover = useCallback((index: number, book: WebBookListItem) => {
    // First priority: Fixed cover by index
    if (BOOK_COVERS_BY_INDEX[index]) {
      return BOOK_COVERS_BY_INDEX[index];
    }
    // Fallback: Book's own cover or category cover
    return book.coverUrl || getCategoryConfig(book.category)?.cover || '';
  }, []);

  if (isLoading) {
    return (
      <div className={cn("min-h-screen", className)}>
        <CyberBackground variant="grid" />
        <div className="container mx-auto px-4 py-8">
          <UltimateLoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("min-h-screen", className)}>
        <CyberBackground variant="grid" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-red-400">Erro ao carregar biblioteca: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pb-20", className)}>
      <CyberBackground variant="grid" />
      
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Livros do <span className="text-[#E23636]">MOISA</span>
          </h1>
          <p className="text-muted-foreground/70 mt-2">Biblioteca Premium Exclusiva</p>
        </div>

        <div className="mt-8 space-y-8">
          {/* Stats Panel */}
          <StatsPanel 
            totalBooks={stats.total}
            inProgress={stats.inProgress}
            completed={stats.completed}
            isHighEnd={isHighEnd}
          />

          {/* XP Banner */}
          <XPPowerBanner isHighEnd={isHighEnd} />

          {/* Books Grid */}
          {(!books || books.length === 0) ? (
            <UltimateEmptyState />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-gradient-to-b from-[#E23636] to-red-600 rounded-full" />
                <h2 className="text-2xl font-bold text-white">Sua Biblioteca</h2>
                <Badge className="bg-[#E23636]/20 text-[#E23636] border-[#E23636]/30">
                  {books.length} livros
                </Badge>
              </div>

              {/* Netflix Book Sections */}
              <div className="space-y-6">
                {sortedBooks.map((book, index) => (
                  <NetflixBookSection
                    key={book.id}
                    book={book}
                    index={index}
                    coverUrl={getBookCover(index, book)}
                    onSelect={() => onBookSelect(book.id)}
                    isHighEnd={isHighEnd}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(WebBookLibrary);
