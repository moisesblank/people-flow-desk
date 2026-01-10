// ============================================
// 📚 BIBLIOTECA DE LIVROS — NETFLIX ULTRA PREMIUM
// YEAR 2300 CINEMATIC EXPERIENCE
// ⚡ PERFORMANCE-OPTIMIZED: CSS-only, zero JS animations
// 🎬 SPIDER-MAN RED (#E23636) Theme
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
  User,
  Layers,
  PlayCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { CyberBackground } from '@/components/ui/cyber-background';
import '@/styles/dashboard-2300.css';

// ============================================
// 🖼️ CAPAS PERMANENTES DOS LIVROS (por CATEGORIA)
// ============================================

import capa1RevisaoCiclica from '@/assets/book-covers/capa-1-revisao-ciclica.png';
import capa2FisicoQuimica from '@/assets/book-covers/capa-2-fisico-quimica.png';
import capa3PrevisaoFinal from '@/assets/book-covers/capa-3-previsao-final.png';
import capa4QuimicaOrganica from '@/assets/book-covers/capa-4-quimica-organica.png';
import capa5QuimicaGeral from '@/assets/book-covers/capa-5-quimica-geral.png';

// Mapeamento por CATEGORIA → Capa correspondente
// Qualquer livro dessa categoria terá essa capa automaticamente
const BOOK_COVERS_BY_CATEGORY: Record<string, string> = {
  quimica_geral: capa5QuimicaGeral,
  quimica_organica: capa4QuimicaOrganica,
  fisico_quimica: capa2FisicoQuimica,
  revisao_ciclica: capa1RevisaoCiclica,
  previsao_final: capa3PrevisaoFinal,
};

// Fallback por posição (caso categoria não seja reconhecida)
const BOOK_COVERS_BY_INDEX: Record<number, string> = {
  0: capa5QuimicaGeral,
  1: capa4QuimicaOrganica,
  2: capa2FisicoQuimica,
  3: capa1RevisaoCiclica,
  4: capa3PrevisaoFinal,
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
// 🎬 BOOK CARD — NETFLIX ULTRA PREMIUM + YEAR 2300
// ⚡ PERFORMANCE-OPTIMIZED: CSS-only transitions
// Layout horizontal como SimuladoCard
// ============================================

interface BookCardProps {
  book: WebBookListItem;
  index: number;
  coverUrl: string;
  onSelect: () => void;
  isHighEnd: boolean;
}

const BookCard = memo(function BookCard({ book, index, coverUrl, onSelect, isHighEnd }: BookCardProps) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const isReading = hasStarted && !isCompleted;
  const isNew = !hasStarted && !isCompleted;

  // Theme colors based on status
  const themeColors = isCompleted 
    ? { border: "border-emerald-500/30 hover:border-emerald-500/60", glow: "hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.35)]", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" }
    : isReading 
    ? { border: "border-amber-500/30 hover:border-amber-500/60", glow: "hover:shadow-[0_20px_60px_-15px_rgba(245,158,11,0.35)]", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-400 border-amber-500/40" }
    : { border: "border-[#E23636]/30 hover:border-[#E23636]/60", glow: "hover:shadow-[0_20px_60px_-15px_rgba(226,54,54,0.35)]", text: "text-[#E23636]", badge: "bg-[#E23636]/20 text-[#E23636] border-[#E23636]/40" };

  return (
    <div className="group">
      {/* 🎬 NETFLIX ULTRA PREMIUM CARD - CSS-only */}
      <div 
        className={cn(
          "relative flex rounded-2xl overflow-hidden cursor-pointer",
          "bg-gradient-to-br from-[#0a0e14] via-[#0f1419]/95 to-[#1a0a0a]",
          "border-2 transition-all duration-300 ease-out",
          "hover:scale-[1.015] hover:-translate-y-1",
          themeColors.border,
          isHighEnd && themeColors.glow
        )}
        onClick={onSelect}
      >
        {/* 🖼️ POSTER — LADO ESQUERDO (Netflix Style) */}
        <div className="relative w-32 md:w-44 lg:w-52 flex-shrink-0 overflow-hidden">
          <img 
            src={coverUrl} 
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          
          {/* Gradient blend to content */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0e14]" />
          
          {/* Hover glow overlay */}
          {isHighEnd && (
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
              isCompleted ? "bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent"
                : isReading ? "bg-gradient-to-br from-amber-500/20 via-transparent to-transparent"
                : "bg-gradient-to-br from-[#E23636]/20 via-transparent to-transparent"
            )} />
          )}
          
          {/* 📍 NUMBER BADGE — Top Left */}
          <div className="absolute top-3 left-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-black text-base",
              "border-2 backdrop-blur-md shadow-lg",
              "bg-black/60",
              isCompleted ? "text-emerald-400 border-emerald-500/60" 
                : isReading ? "text-amber-400 border-amber-500/60"
                : "text-[#E23636] border-[#E23636]/60"
            )}>
              {String(index + 1).padStart(2, '0')}
            </div>
          </div>
          
          {/* Scanlines (High-End only) */}
          {isHighEnd && (
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)` }}
            />
          )}
        </div>

        {/* 📋 CONTEÚDO — LADO DIREITO */}
        <div className="flex-1 p-4 md:p-5 lg:p-6 flex flex-col justify-between min-w-0">
          
          {/* TOP: Status Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {isCompleted ? (
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                themeColors.badge
              )}>
                <Crown className="w-3 h-3 mr-1" />
                Dominado
              </span>
            ) : isReading ? (
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                themeColors.badge
              )}>
                <Timer className="w-3 h-3 mr-1" />
                Lendo • {progress.toFixed(0)}%
              </span>
            ) : (
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                themeColors.badge
              )}>
                <Sparkles className="w-3 h-3 mr-1" />
                Novo
              </span>
            )}
            
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Star className="w-2.5 h-2.5 mr-1" />
              Premium
            </span>
          </div>

          {/* MIDDLE: Title & Author */}
          <div className="flex-1 min-w-0 mb-3">
            <h3 className={cn(
              "text-lg md:text-xl lg:text-2xl font-black tracking-tight mb-1.5 transition-colors duration-200 line-clamp-2",
              "text-white",
              isCompleted ? "group-hover:text-emerald-300" 
                : isReading ? "group-hover:text-amber-300"
                : "group-hover:text-[#FF6B6B]"
            )}>
              {book.title}
            </h3>
            {book.author && (
              <p className="text-sm text-muted-foreground/70 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {book.author}
              </p>
            )}
          </div>

          {/* STATS: Compact HUD Row */}
          <div className="flex items-center gap-3 md:gap-4 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-3">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-bold text-white">{book.totalPages || 0}</span>
              <span className="text-[9px] text-muted-foreground hidden md:inline uppercase">páginas</span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            {(book.viewCount || 0) > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-sm font-bold text-white">{book.viewCount}</span>
                  <span className="text-[9px] text-muted-foreground hidden md:inline uppercase">views</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
              </>
            )}
            
            <div className="flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">Premium</span>
            </div>
          </div>

          {/* Progress Bar (If reading) */}
          {isReading && (
            <div className="mb-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* BOTTOM: CTA Button */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Material Exclusivo
            </span>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider",
                "transition-all duration-200 flex items-center gap-2",
                "text-white hover:scale-105 shadow-lg",
                isCompleted 
                  ? "bg-gradient-to-r from-emerald-600 to-cyan-500 hover:shadow-emerald-500/30"
                  : isReading
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-amber-500/30"
                  : "bg-gradient-to-r from-[#E23636] to-red-500 hover:shadow-[#E23636]/30"
              )}
            >
              <Play className="w-4 h-4" />
              <span>{isCompleted ? "Revisar" : isReading ? "Continuar" : "Ler Agora"}</span>
            </button>
          </div>
        </div>

        {/* ✨ SPIDER-MAN CORNER ACCENTS — CSS only */}
        <div className={cn(
          "absolute top-0 left-0 w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
          isCompleted ? "border-l-2 border-t-2 border-emerald-500/50 rounded-tl-2xl" 
            : isReading ? "border-l-2 border-t-2 border-amber-500/50 rounded-tl-2xl"
            : "border-l-2 border-t-2 border-[#E23636]/50 rounded-tl-2xl"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
          isCompleted ? "border-r-2 border-b-2 border-emerald-500/50 rounded-br-2xl" 
            : isReading ? "border-r-2 border-b-2 border-amber-500/50 rounded-br-2xl"
            : "border-r-2 border-b-2 border-[#E23636]/50 rounded-br-2xl"
        )} />
      </div>
    </div>
  );
});

// ============================================
// 📂 BOOK SECTION — NETFLIX STYLE COLLAPSIBLE
// Design igual CourseSection em AlunoCoursesHierarchy
// ============================================

interface BookSectionProps {
  title: string;
  icon: React.ReactNode;
  books: WebBookListItem[];
  onBookSelect: (bookId: string) => void;
  isHighEnd: boolean;
  accentColor: 'red' | 'amber' | 'emerald';
  defaultOpen?: boolean;
}

const BookSection = memo(function BookSection({ 
  title, 
  icon, 
  books, 
  onBookSelect, 
  isHighEnd,
  accentColor,
  defaultOpen = true
}: BookSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (books.length === 0) return null;

  const colorClasses = {
    red: {
      border: "border-[#E23636]/40 hover:border-[#E23636]/70",
      shadow: "shadow-[#E23636]/15 hover:shadow-[#E23636]/40",
      headerBg: "from-[#E23636]/20 via-[#0a0e14]/80 to-[#E23636]/15",
      iconBg: "from-[#E23636]/50 to-[#E23636]/35 border-[#E23636]/60 shadow-[#E23636]/40",
      iconGlow: "bg-[#E23636]/50",
      iconColor: "text-[#FF6B6B]",
      badge: "bg-[#E23636]/25 text-[#FF6B6B] border-[#E23636]/40",
      corner: "border-[#E23636]/60",
      accent: "text-[#E23636]"
    },
    amber: {
      border: "border-amber-500/40 hover:border-amber-500/70",
      shadow: "shadow-amber-500/15 hover:shadow-amber-500/40",
      headerBg: "from-amber-500/20 via-[#0a0e14]/80 to-amber-500/15",
      iconBg: "from-amber-500/50 to-amber-500/35 border-amber-500/60 shadow-amber-500/40",
      iconGlow: "bg-amber-500/50",
      iconColor: "text-amber-300",
      badge: "bg-amber-500/25 text-amber-300 border-amber-500/40",
      corner: "border-amber-500/60",
      accent: "text-amber-400"
    },
    emerald: {
      border: "border-emerald-500/40 hover:border-emerald-500/70",
      shadow: "shadow-emerald-500/15 hover:shadow-emerald-500/40",
      headerBg: "from-emerald-500/20 via-[#0a0e14]/80 to-emerald-500/15",
      iconBg: "from-emerald-500/50 to-emerald-500/35 border-emerald-500/60 shadow-emerald-500/40",
      iconGlow: "bg-emerald-500/50",
      iconColor: "text-emerald-300",
      badge: "bg-emerald-500/25 text-emerald-300 border-emerald-500/40",
      corner: "border-emerald-500/60",
      accent: "text-emerald-400"
    }
  };

  const colors = colorClasses[accentColor];

  return (
    <Card className={cn(
      "group/card relative overflow-hidden transition-all duration-500",
      "bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#1a0a0a]",
      "border-2 shadow-2xl rounded-3xl",
      colors.border,
      isHighEnd && colors.shadow
    )}>
      {/* Spider-Man style corner accents */}
      <div className={cn("absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl pointer-events-none", colors.corner)} />
      <div className={cn("absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl pointer-events-none opacity-80", colors.corner)} />
      <div className={cn("absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl pointer-events-none opacity-80", colors.corner)} />
      <div className={cn("absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl pointer-events-none", colors.corner)} />
      
      {/* Background glow on hover */}
      {isHighEnd && (
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-all duration-500 pointer-events-none",
          accentColor === 'red' ? "bg-gradient-to-br from-[#E23636]/5 via-transparent to-[#E23636]/5"
            : accentColor === 'amber' ? "bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5"
            : "bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5"
        )} />
      )}
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn(
            "cursor-pointer relative z-10 py-5 px-6",
            "border-b-2 transition-all duration-300",
            `bg-gradient-to-r ${colors.headerBg}`,
            accentColor === 'red' ? "border-[#E23636]/25 hover:from-[#E23636]/30 hover:to-[#E23636]/25"
              : accentColor === 'amber' ? "border-amber-500/25 hover:from-amber-500/30 hover:to-amber-500/25"
              : "border-emerald-500/25 hover:from-emerald-500/30 hover:to-emerald-500/25"
          )}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Icon with glow */}
                <div className="relative">
                  {isHighEnd && (
                    <div className={cn("absolute inset-0 rounded-2xl blur-2xl opacity-70 group-hover/card:opacity-100 transition-opacity", colors.iconGlow)} />
                  )}
                  <div className={cn(
                    "relative p-3.5 rounded-2xl bg-gradient-to-br border-2 shadow-xl",
                    colors.iconBg
                  )}>
                    {icon}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <CardTitle className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                    {title}
                  </CardTitle>
                  
                  {/* Stats row */}
                  <div className="flex items-center gap-3">
                    <Badge className={cn("px-2.5 py-1 text-xs font-bold border-2 shadow-lg", colors.badge)}>
                      <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                      {books.length} {books.length === 1 ? 'livro' : 'livros'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Toggle button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-10 w-10 rounded-xl border-2 transition-all shadow-lg",
                  accentColor === 'red' ? "border-[#E23636]/50 bg-[#E23636]/15 hover:bg-[#E23636]/35 hover:border-[#E23636]/70 shadow-[#E23636]/20"
                    : accentColor === 'amber' ? "border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/35 hover:border-amber-500/70 shadow-amber-500/20"
                    : "border-emerald-500/50 bg-emerald-500/15 hover:bg-emerald-500/35 hover:border-emerald-500/70 shadow-emerald-500/20"
                )}
              >
                {isOpen ? <ChevronUp className={cn("h-5 w-5", colors.iconColor)} /> : <ChevronDown className={cn("h-5 w-5", colors.iconColor)} />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* ⚡ LAZY RENDERING: Só monta BookCards quando seção está aberta */}
          {isOpen && (
            <CardContent className="p-5 space-y-4 bg-gradient-to-b from-transparent to-black/20">
              {books.map((book, idx) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={idx}
                  // Prioridade: 1) Upload manual, 2) Categoria, 3) Posição, 4) Placeholder
                  coverUrl={book.coverUrl || BOOK_COVERS_BY_CATEGORY[book.category || ''] || BOOK_COVERS_BY_INDEX[idx] || '/placeholder.svg'}
                  onSelect={() => onBookSelect(book.id)}
                  isHighEnd={isHighEnd}
                />
              ))}
            </CardContent>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

// ============================================
// 🏠 MAIN COMPONENT — NETFLIX ULTRA PREMIUM
// ============================================

const WebBookLibrary = memo(function WebBookLibrary({ 
  onBookSelect,
  externalCategory,
  className 
}: WebBookLibraryProps) {
  const { books, isLoading, error } = useWebBookLibrary();
  
  // ⚡ Performance flags - LEI I
  const { shouldShowParticles, isLowEnd, tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'enhanced' || tier === 'standard' || !isLowEnd;
  
  // Categorizar livros
  const { reading, available, completed, stats } = useMemo(() => {
    if (!books) return { reading: [], available: [], completed: [], stats: { total: 0, reading: 0, completed: 0 } };
    
    const reading: WebBookListItem[] = [];
    const available: WebBookListItem[] = [];
    const completed: WebBookListItem[] = [];
    
    books.forEach(book => {
      const progress = book.progress?.progressPercent || 0;
      const isCompleted = book.progress?.isCompleted || false;
      
      if (isCompleted) {
        completed.push(book);
      } else if (progress > 0) {
        reading.push(book);
      } else {
        available.push(book);
      }
    });
    
    return {
      reading,
      available,
      completed,
      stats: {
        total: books.length,
        reading: reading.length,
        completed: completed.length
      }
    };
  }, [books]);

  // ============================================
  // LOADING STATE — YEAR 2300 CINEMATIC
  // ============================================
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a0a0a]">
        <div className="relative">
          {/* Central orb */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#E23636] via-red-600 to-[#E23636] animate-pulse flex items-center justify-center shadow-2xl shadow-[#E23636]/40">
            <Library className="w-10 h-10 text-white" />
          </div>
          
          {/* Orbital rings */}
          {isHighEnd && (
            <>
              <div className="absolute inset-[-20px] border-2 border-[#E23636]/30 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
              <div className="absolute inset-[-40px] border border-[#E23636]/20 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
            </>
          )}
          
          {/* Loading text */}
          <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-sm text-[#E23636] font-bold uppercase tracking-widest whitespace-nowrap">
            Carregando Biblioteca...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
            <Library className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-red-400">Erro ao carregar biblioteca</h3>
          <p className="text-sm text-muted-foreground">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  // ============================================
  // 🎬 MAIN RENDER — NETFLIX ULTRA PREMIUM
  // ============================================

  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* 🌌 Cinematic Background */}
      {shouldShowParticles && <CyberBackground variant="grid" intensity={isLowEnd ? "low" : "medium"} />}
      
      <div className="relative z-10 container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* 🎬 HERO HEADER — NETFLIX ULTRA PREMIUM 2300 */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e14] via-[#0c1219] to-[#0a0a12]" />
          
          {/* Holographic mesh overlay */}
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
              backgroundSize: '30px 30px'
            }}
          />
          
          {/* Glow orbs */}
          {isHighEnd && (
            <>
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#E23636]/15 rounded-full blur-3xl" />
            </>
          )}
          
          {/* Scanlines */}
          {isHighEnd && (
            <div 
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)` }}
            />
          )}
          
          <div className="relative z-10 p-6 md:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              
              {/* Icon Orb — Holographic */}
              <div className="relative group">
                {isHighEnd && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/60 to-[#E23636]/40 rounded-2xl blur-2xl opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-[-4px] bg-gradient-to-r from-cyan-500 via-[#E23636] to-cyan-500 rounded-2xl opacity-30 animate-pulse" style={{ animationDuration: '3s' }} />
                  </>
                )}
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-[#0f1419] via-[#1a1f26] to-[#0f1419] flex items-center justify-center shadow-2xl border-2 border-cyan-500/40 overflow-hidden">
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-[#E23636]/20" />
                  {/* Icon bars (book spine style) */}
                  <div className="relative flex gap-1">
                    <div className="w-2 h-12 md:h-14 bg-gradient-to-b from-[#E23636] to-orange-500 rounded-sm" />
                    <div className="w-2 h-10 md:h-12 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-sm mt-1" />
                    <div className="w-2 h-14 md:h-16 bg-gradient-to-b from-[#E23636] to-rose-500 rounded-sm -mt-1" />
                    <div className="w-2 h-11 md:h-13 bg-gradient-to-b from-amber-400 to-orange-500 rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="flex-1 text-center lg:text-left space-y-3">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
                  <span className="text-white">Biblioteca </span>
                  <span className="bg-gradient-to-r from-cyan-400 via-[#E23636] to-orange-500 bg-clip-text text-transparent">Premium</span>
                </h1>
                <p className="text-cyan-100/60 text-sm md:text-base max-w-xl leading-relaxed">
                  Materiais exclusivos criados pelo Moisa para sua aprovação. Cada página te aproxima do sonho!
                </p>
                
                {/* Micro-tags */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Zap className="w-3 h-3" />
                    Conteúdo Exclusivo
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E23636]/10 text-[#E23636] border border-[#E23636]/30">
                    <Award className="w-3 h-3" />
                    Material Premium
                  </span>
                </div>
              </div>

              {/* Stats HUD Orbs */}
              <div className="flex gap-3 md:gap-4">
                {/* TOTAL */}
                <div className="relative group flex flex-col items-center gap-2">
                  {isHighEnd && <div className="absolute inset-0 bg-[#E23636]/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />}
                  <div className="relative px-5 py-4 rounded-2xl bg-gradient-to-br from-[#E23636] via-red-500 to-orange-500 shadow-lg shadow-[#E23636]/40 border border-[#E23636]/60 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="relative flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-white/90" />
                      <span className="text-2xl md:text-3xl font-black text-white">{stats.total}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Total</span>
                </div>
                
                {/* LENDO */}
                <div className="relative group flex flex-col items-center gap-2">
                  {isHighEnd && <div className="absolute inset-0 bg-amber-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />}
                  <div className="relative px-5 py-4 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-lg shadow-amber-500/40 border border-amber-500/60 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="relative flex items-center gap-2">
                      <Flame className="w-5 h-5 text-white/90" />
                      <span className="text-2xl md:text-3xl font-black text-white">{stats.reading}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Lendo</span>
                </div>
                
                {/* DOMINADOS */}
                <div className="relative group flex flex-col items-center gap-2">
                  {isHighEnd && <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />}
                  <div className="relative px-5 py-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/40 border border-emerald-500/60 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="relative flex items-center gap-2">
                      <Crown className="w-5 h-5 text-white/90" />
                      <span className="text-2xl md:text-3xl font-black text-white">{stats.completed}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Dominados</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-500/40 rounded-tl-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-[#E23636]/40 rounded-tr-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-[#E23636]/40 rounded-bl-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-cyan-500/40 rounded-br-3xl pointer-events-none" />
        </div>

        {/* 📢 AVISO — VERSÃO 2026 — NETFLIX FUTURISTIC */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-[#0a0e14] via-[#0f0a14] to-[#0a0e14] shadow-lg shadow-purple-500/10">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-[#E23636]/5 to-purple-500/5" />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(168,85,247,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.4) 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}
          />
          
          <div className="relative z-10 p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Icon */}
            <div className="relative">
              {isHighEnd && (
                <div className="absolute inset-0 bg-purple-500/40 rounded-xl blur-xl" />
              )}
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500/30 to-[#E23636]/20 border border-purple-500/50 shadow-lg">
                <Rocket className="w-7 h-7 text-purple-400" />
              </div>
            </div>
            
            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                Aguarde a versão dos livros de <span className="bg-gradient-to-r from-purple-400 to-[#E23636] bg-clip-text text-transparent font-black">2026</span>
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground/60">
                Novos materiais atualizados serão liberados em breve!
              </p>
            </div>
            
            {/* Date badge */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                {isHighEnd && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-[#E23636] rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                )}
                <div className="relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/90 to-[#E23636]/90 border border-purple-400/50 shadow-lg">
                  <span className="text-lg font-black text-white">31/01</span>
                </div>
              </div>
              <span className="text-[10px] text-purple-300/60 uppercase tracking-widest font-bold">Lançamento</span>
            </div>
          </div>
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-purple-500/40 rounded-tl-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-purple-500/40 rounded-br-2xl pointer-events-none" />
        </div>

        {/* 📚 BOOK SECTIONS — NETFLIX COLLAPSIBLE STYLE */}
        <div className="space-y-6">
          
          {/* 🔥 CONTINUAR LENDO */}
          <BookSection
            title="Continuar Lendo"
            icon={<Flame className="h-7 w-7 text-amber-300" />}
            books={reading}
            onBookSelect={onBookSelect}
            isHighEnd={isHighEnd}
            accentColor="amber"
            defaultOpen={true}
          />
          
          {/* 📖 DISPONÍVEIS */}
          <BookSection
            title="Disponíveis para Você"
            icon={<BookOpen className="h-7 w-7 text-[#FF6B6B]" />}
            books={available}
            onBookSelect={onBookSelect}
            isHighEnd={isHighEnd}
            accentColor="red"
            defaultOpen={true}
          />
          
          {/* ✅ DOMINADOS */}
          <BookSection
            title="Livros Dominados"
            icon={<Crown className="h-7 w-7 text-emerald-300" />}
            books={completed}
            onBookSelect={onBookSelect}
            isHighEnd={isHighEnd}
            accentColor="emerald"
            defaultOpen={false}
          />
        </div>

        {/* Empty State */}
        {books?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E23636]/30 to-[#E23636]/10 border-2 border-[#E23636]/40 flex items-center justify-center">
                <Library className="w-12 h-12 text-[#E23636]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Biblioteca Vazia</h3>
            <p className="text-muted-foreground max-w-md">
              Nenhum livro disponível no momento. Em breve novos materiais serão adicionados!
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default WebBookLibrary;
