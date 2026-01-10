// ============================================
// 📚 LIVROS DO MOISA — NETFLIX ULTRA PREMIUM FINAL
// LAYOUT HORIZONTAL: Poster à Esquerda + Conteúdo à Direita
// EXATAMENTE como SimuladoCard + AlunoCoursesHierarchy
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
  ArrowRight
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
// TIPOS
// ============================================

interface WebBookLibraryProps {
  onBookSelect: (bookId: string) => void;
  externalCategory?: string | null;
  className?: string;
}

// ============================================
// 🎯 HUD STAT ORB — NETFLIX PREMIUM (Cursos Style)
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
      {/* Outer glow ring */}
      {isHighEnd && (
        <div className={cn(
          "absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500 -z-10",
          glowColor || "bg-primary"
        )} />
      )}
      
      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-current opacity-50 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-current opacity-50 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-current opacity-50 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-current opacity-50 rounded-br-xl" />
      
      <div className="flex items-center gap-4">
        {/* Icon container with pulse */}
        <div className="relative">
          {isHighEnd && (
            <div className="absolute inset-0 rounded-xl bg-current opacity-20 blur-md animate-pulse" />
          )}
          <div className="relative p-3 rounded-xl bg-background/30 backdrop-blur-sm border border-current/30 shadow-inner">
            {icon}
          </div>
        </div>
        
        {/* Value and label */}
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
          {/* Icon Container */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#E23636] via-red-500 to-amber-500 flex items-center justify-center shadow-lg">
            <BookMarked className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>

          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1">
              Biblioteca <span className="text-[#E23636]">Premium</span> do MOISA
            </h3>
            <p className="text-cyan-100/70 text-sm md:text-base max-w-xl">
              Materiais exclusivos para sua aprovação. Cada página te aproxima do sonho!
            </p>
          </div>

          {/* XP Badges */}
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
// 📚 BOOK CARD — NETFLIX ULTRA PREMIUM HORIZONTAL
// EXATAMENTE COMO SIMULADO CARD: POSTER + CONTENT
// ============================================

interface BookCardProps {
  book: WebBookListItem;
  index: number;
  coverUrl: string | null;
  onSelect: () => void;
  isHighEnd: boolean;
}

const BookCard = memo(function BookCard({
  book,
  index,
  coverUrl,
  onSelect,
  isHighEnd
}: BookCardProps) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const coverImage = book.coverUrl || coverUrl || getCategoryConfig(book.category)?.cover;

  // Status configuration
  const isNew = !hasStarted && !isCompleted;
  const isReading = hasStarted && !isCompleted;

  return (
    <div className="group">
      {/* 🎬 NETFLIX ULTRA PREMIUM CARD — HORIZONTAL LAYOUT */}
      <div 
        className={cn(
          "relative flex rounded-2xl overflow-hidden cursor-pointer",
          "bg-gradient-to-br from-black/90 via-card/95 to-black/80",
          "border-2 transition-all duration-300 ease-out",
          "hover:scale-[1.02] hover:-translate-y-0.5",
          isCompleted 
            ? "border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_15px_40px_-10px_rgba(16,185,129,0.3)]"
            : isReading
              ? "border-amber-500/30 hover:border-amber-500/60 hover:shadow-[0_15px_40px_-10px_rgba(245,158,11,0.3)]"
              : "border-[#E23636]/30 hover:border-[#E23636]/60 hover:shadow-[0_15px_40px_-10px_rgba(226,54,54,0.3)]"
        )}
        onClick={onSelect}
      >
        {/* 🖼️ POSTER — LADO ESQUERDO (Like SimuladoCard) */}
        <div className="relative w-32 md:w-44 lg:w-52 flex-shrink-0 overflow-hidden">
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E23636]/40 to-[#E23636]/20 flex items-center justify-center">
              <Book className="w-16 h-16 text-[#E23636]/60" />
            </div>
          )}
          
          {/* Gradient blend para o content */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/90" />
          
          {/* Hover glow */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            isCompleted 
              ? "bg-gradient-to-br from-emerald-500/25 via-transparent to-transparent"
              : isReading
                ? "bg-gradient-to-br from-amber-500/25 via-transparent to-transparent"
                : "bg-gradient-to-br from-[#E23636]/25 via-transparent to-transparent"
          )} />

          {/* Scanlines (High-End Only) */}
          {isHighEnd && (
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)`
              }}
            />
          )}
          
          {/* 📍 NUMBER BADGE — Top Left Corner */}
          <div className="absolute top-3 left-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border-2",
              "bg-black/70 backdrop-blur-sm shadow-xl",
              isCompleted 
                ? "text-emerald-400 border-emerald-500/50"
                : isReading
                  ? "text-amber-400 border-amber-500/50"
                  : "text-[#E23636] border-[#E23636]/50"
            )}>
              {String(index + 1).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* 📋 CONTEÚDO — LADO DIREITO */}
        <div className="flex-1 p-4 md:p-5 lg:p-6 flex flex-col justify-between min-w-0">
          
          {/* TOP: Status Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {isCompleted ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Crown className="w-3 h-3 mr-1.5" />
                Dominado
              </span>
            ) : isReading ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Timer className="w-3 h-3 mr-1.5" />
                Lendo • {progress.toFixed(0)}%
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#E23636]/20 text-[#E23636] border border-[#E23636]/30">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Novo
              </span>
            )}
            
          </div>

          {/* MIDDLE: Title & Author */}
          <div className="flex-1 min-w-0 mb-4">
            <h3 className={cn(
              "text-lg md:text-xl lg:text-2xl font-bold tracking-tight mb-2 transition-colors duration-200 line-clamp-2",
              isCompleted 
                ? "text-white group-hover:text-emerald-300"
                : isReading
                  ? "text-white group-hover:text-amber-300"
                  : "text-white group-hover:text-[#FF6B6B]"
            )}>
              {book.title}
            </h3>
            {book.author && (
              <p className="text-sm text-muted-foreground/70 mb-2">
                por <span className="text-muted-foreground">{book.author}</span>
              </p>
            )}
            {book.subtitle && (
              <p className="text-xs text-muted-foreground/60 line-clamp-2">
                {book.subtitle}
              </p>
            )}
          </div>

          {/* BOTTOM: Stats Row + Action */}
          <div className="flex items-center justify-between gap-4">
            {/* Stats Row — Netflix Style */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-semibold text-white">{book.totalPages || 0}</span>
                <span className="text-[10px] text-slate-500 uppercase">págs</span>
              </div>
              
              {(book.viewCount || 0) > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm font-semibold text-white">{book.viewCount}</span>
                  <span className="text-[10px] text-slate-500 uppercase">views</span>
                </div>
              )}

              {/* Progress Bar (Only if reading) */}
              {isReading && (
                <div className="hidden sm:flex items-center gap-2 flex-1 max-w-[120px]">
                  <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Button — Spider-Man Red */}
            <Button 
              size="sm"
              className={cn(
                "font-bold shadow-lg gap-2 transition-all duration-200",
                isCompleted 
                  ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white"
                  : isReading
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
                    : "bg-gradient-to-r from-[#E23636] to-red-600 hover:from-[#FF4444] hover:to-red-500 text-white"
              )}
            >
              {isCompleted ? (
                <>Revisar</>
              ) : isReading ? (
                <>Continuar</>
              ) : (
                <>Iniciar</>
              )}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ✨ CORNER ACCENTS — CSS only (Like SimuladoCard) */}
        <div className={cn(
          "absolute top-0 left-0 w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
          isCompleted 
            ? "border-l-2 border-t-2 border-emerald-500/50 rounded-tl-2xl"
            : isReading
              ? "border-l-2 border-t-2 border-amber-500/50 rounded-tl-2xl"
              : "border-l-2 border-t-2 border-[#E23636]/50 rounded-tl-2xl"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
          isCompleted 
            ? "border-r-2 border-b-2 border-emerald-500/50 rounded-br-2xl"
            : isReading
              ? "border-r-2 border-b-2 border-amber-500/50 rounded-br-2xl"
              : "border-r-2 border-b-2 border-[#E23636]/50 rounded-br-2xl"
        )} />
      </div>
    </div>
  );
});

// ============================================
// 📁 BOOK SECTION — COLLAPSIBLE (Like CourseSection)
// ============================================

interface BookSectionProps {
  title: string;
  books: WebBookListItem[];
  categories: Record<string, any>;
  onSelect: (bookId: string) => void;
  isHighEnd: boolean;
  defaultOpen?: boolean;
  icon: React.ReactNode;
  accentColor: 'red' | 'amber' | 'emerald';
}

const BookSection = memo(function BookSection({
  title,
  books,
  categories,
  onSelect,
  isHighEnd,
  defaultOpen = true,
  icon,
  accentColor
}: BookSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (books.length === 0) return null;

  const colorClasses = {
    red: {
      border: 'border-[#E23636]/40 hover:border-[#E23636]/70',
      shadow: 'shadow-[#E23636]/15 hover:shadow-[#E23636]/40',
      header: 'from-[#E23636]/20 via-[#0a0e14]/80 to-[#E23636]/15',
      headerHover: 'hover:from-[#E23636]/30 hover:to-[#E23636]/25',
      icon: 'from-[#E23636]/50 to-[#E23636]/35 border-[#E23636]/60 shadow-[#E23636]/40',
      iconGlow: 'bg-[#E23636]/50',
      text: 'text-[#FF6B6B]',
      badge: 'bg-[#E23636]/25 text-[#FF6B6B] border-[#E23636]/50',
      corner: 'border-[#E23636]'
    },
    amber: {
      border: 'border-amber-500/40 hover:border-amber-500/70',
      shadow: 'shadow-amber-500/15 hover:shadow-amber-500/40',
      header: 'from-amber-500/20 via-[#0a0e14]/80 to-amber-500/15',
      headerHover: 'hover:from-amber-500/30 hover:to-amber-500/25',
      icon: 'from-amber-500/50 to-amber-500/35 border-amber-500/60 shadow-amber-500/40',
      iconGlow: 'bg-amber-500/50',
      text: 'text-amber-300',
      badge: 'bg-amber-500/25 text-amber-300 border-amber-500/50',
      corner: 'border-amber-500'
    },
    emerald: {
      border: 'border-emerald-500/40 hover:border-emerald-500/70',
      shadow: 'shadow-emerald-500/15 hover:shadow-emerald-500/40',
      header: 'from-emerald-500/20 via-[#0a0e14]/80 to-emerald-500/15',
      headerHover: 'hover:from-emerald-500/30 hover:to-emerald-500/25',
      icon: 'from-emerald-500/50 to-emerald-500/35 border-emerald-500/60 shadow-emerald-500/40',
      iconGlow: 'bg-emerald-500/50',
      text: 'text-emerald-300',
      badge: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50',
      corner: 'border-emerald-500'
    }
  };

  const colors = colorClasses[accentColor];

  return (
    <Card className={cn(
      "group/card relative overflow-hidden transition-all duration-500 animate-fade-in",
      "bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#1a0a0a]",
      "border-2 shadow-2xl rounded-3xl",
      colors.border,
      colors.shadow
    )}>
      {/* Spider-Man style corner accents */}
      <div className={cn("absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 rounded-tl-3xl pointer-events-none opacity-60", colors.corner)} />
      <div className={cn("absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 rounded-tr-3xl pointer-events-none opacity-50", colors.corner)} />
      <div className={cn("absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 rounded-bl-3xl pointer-events-none opacity-50", colors.corner)} />
      <div className={cn("absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 rounded-br-3xl pointer-events-none opacity-60", colors.corner)} />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn(
            "cursor-pointer relative z-10 py-6 px-6 border-b-2 border-inherit/25 transition-all duration-300",
            `bg-gradient-to-r ${colors.header} ${colors.headerHover}`
          )}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Netflix-style icon orb */}
                <div className="relative">
                  {isHighEnd && (
                    <div className={cn("absolute inset-0 rounded-2xl blur-2xl opacity-70 group-hover/card:opacity-100 transition-opacity", colors.iconGlow)} />
                  )}
                  <div className={cn(
                    "relative p-4 rounded-2xl bg-gradient-to-br border-2 shadow-xl",
                    colors.icon
                  )}>
                    {icon}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-3 flex-wrap text-white">
                    {title}
                    <Badge className={cn("px-3 py-1 text-sm border-2 shadow-lg", colors.badge)}>
                      {books.length} {books.length === 1 ? 'livro' : 'livros'}
                    </Badge>
                  </CardTitle>
                </div>
              </div>
              
              {/* Toggle button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "rounded-xl border-2 transition-all duration-300",
                  colors.border,
                  isOpen && "rotate-180"
                )}
              >
                <ChevronDown className="h-6 w-6" />
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-6 space-y-4">
            {books.map((book, idx) => (
              <BookCard
                key={book.id}
                book={book}
                index={idx}
                coverUrl={categories[normalizeCategoryId(book.category)]?.cover || null}
                onSelect={() => onSelect(book.id)}
                isHighEnd={isHighEnd}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

// ============================================
// ⏳ LOADING STATE — CINEMATIC
// ============================================

const UltimateLoadingState = memo(function UltimateLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      {/* Orbital Loading */}
      <div className="relative w-32 h-32">
        {/* Central orb */}
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#E23636] to-red-600 shadow-[0_0_60px_rgba(226,54,54,0.5)] animate-pulse" />
        
        {/* Orbital rings */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-[#E23636]/40"
          style={{ animation: 'spin 3s linear infinite' }}
        />
        <div 
          className="absolute inset-4 rounded-full border border-[#E23636]/30"
          style={{ animation: 'spin 2s linear infinite reverse' }}
        />
      </div>
      
      <div className="text-center">
        <p className="text-lg font-bold text-[#FF6B6B] mb-1">Carregando Biblioteca...</p>
        <p className="text-sm text-muted-foreground">Preparando seus livros premium</p>
      </div>
    </div>
  );
});

// ============================================
// 📚 MAIN COMPONENT — NETFLIX ULTRA PREMIUM
// ============================================

const WebBookLibrary = memo(function WebBookLibrary({
  onBookSelect,
  externalCategory,
  className
}: WebBookLibraryProps) {
  const { books, isLoading, error } = useWebBookLibrary();
  const categories = useBookCategories();
  const { isLowEnd, shouldShowParticles } = useConstitutionPerformance();
  const isHighEnd = !isLowEnd;

  // Organize books by status
  const { newBooks, readingBooks, completedBooks, stats } = useMemo(() => {
    if (!books.length) return { newBooks: [], readingBooks: [], completedBooks: [], stats: { total: 0, reading: 0, completed: 0 } };

    const newB: WebBookListItem[] = [];
    const readingB: WebBookListItem[] = [];
    const completedB: WebBookListItem[] = [];

    books.forEach(book => {
      const progress = book.progress?.progressPercent || 0;
      const isCompleted = book.progress?.isCompleted || false;
      
      if (isCompleted) {
        completedB.push(book);
      } else if (progress > 0) {
        readingB.push(book);
      } else {
        newB.push(book);
      }
    });

    return {
      newBooks: newB,
      readingBooks: readingB,
      completedBooks: completedB,
      stats: {
        total: books.length,
        reading: readingB.length,
        completed: completedB.length
      }
    };
  }, [books]);

  // Handler
  const handleSelect = useCallback((bookId: string) => {
    onBookSelect(bookId);
  }, [onBookSelect]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("relative min-h-screen", className)}>
        {shouldShowParticles && <CyberBackground variant="grid" intensity={isLowEnd ? "low" : "medium"} />}
        <div className="relative z-10 container mx-auto p-4 md:p-6 lg:p-8">
          <UltimateLoadingState />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <BookOpen className="w-16 h-16 text-destructive/50 mb-4" />
        <p className="text-lg font-semibold text-destructive">Erro ao carregar biblioteca</p>
        <p className="text-sm text-muted-foreground">{String(error)}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* 🌌 Cinematic Background */}
      {shouldShowParticles && <CyberBackground variant="grid" intensity={isLowEnd ? "low" : "medium"} />}
      
      <div className="relative z-10 container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* 🎬 Hero Header — Like Simulados */}
        <FuturisticPageHeader
          title="Biblioteca Premium"
          subtitle="Materiais exclusivos para dominar Química e conquistar sua aprovação"
          icon={Library}
          badge="EXCLUSIVO"
          accentColor="primary"
          stats={[
            { label: "Total", value: stats.total, icon: BookOpen },
            { label: "Em Leitura", value: stats.reading, icon: Flame },
            { label: "Dominados", value: stats.completed, icon: Crown },
          ]}
        />

        {/* ⚡ XP Banner */}
        <XPPowerBanner isHighEnd={isHighEnd} />

        {/* 📊 Stats Panel */}
        <StatsPanel 
          totalBooks={stats.total}
          inProgress={stats.reading}
          completed={stats.completed}
          isHighEnd={isHighEnd}
        />

        {/* 📚 BOOK SECTIONS — Organized by Status */}
        <div className="space-y-8">
          
          {/* 🔥 EM LEITURA (Priority) */}
          {readingBooks.length > 0 && (
            <BookSection
              title="Continuar Lendo"
              books={readingBooks}
              categories={categories}
              onSelect={handleSelect}
              isHighEnd={isHighEnd}
              defaultOpen={true}
              icon={<Flame className="h-8 w-8 text-amber-300" />}
              accentColor="amber"
            />
          )}

          {/* ✨ NOVOS / DISPONÍVEIS */}
          {newBooks.length > 0 && (
            <BookSection
              title="Disponíveis"
              books={newBooks}
              categories={categories}
              onSelect={handleSelect}
              isHighEnd={isHighEnd}
              defaultOpen={true}
              icon={<Sparkles className="h-8 w-8 text-[#FF6B6B]" />}
              accentColor="red"
            />
          )}

          {/* 👑 DOMINADOS */}
          {completedBooks.length > 0 && (
            <BookSection
              title="Dominados"
              books={completedBooks}
              categories={categories}
              onSelect={handleSelect}
              isHighEnd={isHighEnd}
              defaultOpen={false}
              icon={<Crown className="h-8 w-8 text-emerald-300" />}
              accentColor="emerald"
            />
          )}
        </div>

        {/* Empty state */}
        {books.length === 0 && (
          <Card className="p-12 text-center border-2 border-dashed border-[#E23636]/30 bg-gradient-to-br from-[#0a0e14] to-[#1a0a0a]">
            <Library className="w-20 h-20 mx-auto text-[#E23636]/40 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Biblioteca Vazia</h3>
            <p className="text-muted-foreground">Novos livros serão adicionados em breve!</p>
          </Card>
        )}
      </div>
    </div>
  );
});

WebBookLibrary.displayName = 'WebBookLibrary';

export default WebBookLibrary;
