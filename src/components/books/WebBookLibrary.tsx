// ============================================
// 📚 BIBLIOTECA DE LIVROS — NETFLIX ULTRA PREMIUM
// YEAR 2300 CINEMATIC EXPERIENCE
// ⚡ PERFORMANCE-OPTIMIZED: CSS-only, zero JS animations
// 🎬 SPIDER-MAN RED (#E23636) Theme
// ============================================

import React, { memo, useState, useCallback, useMemo } from 'react';
import { useWebBookLibrary, WebBookListItem } from '@/hooks/useWebBook';
import { DateLock } from '@/components/ui/chronolock';
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
  PlayCircle,
  GripVertical,
  Save,
  X
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
// 🎨 CORES POR CATEGORIA — BOOK WEB TYPES
// Mapeamento centralizado para hover e elementos visuais
// ============================================

type CategoryColorTheme = {
  border: string;
  borderHover: string;
  glow: string;
  hoverBg: string;
  text: string;
  badge: string;
  accent: string;
};

const CATEGORY_COLORS: Record<string, CategoryColorTheme> = {
  quimica_geral: {
    border: "border-amber-500/30",
    borderHover: "hover:border-amber-500/70",
    glow: "hover:shadow-[0_20px_60px_-15px_rgba(245,158,11,0.45)]",
    hoverBg: "group-hover:from-amber-500/25",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    accent: "#F59E0B"
  },
  quimica_organica: {
    border: "border-purple-500/30",
    borderHover: "hover:border-purple-500/70",
    glow: "hover:shadow-[0_20px_60px_-15px_rgba(168,85,247,0.45)]",
    hoverBg: "group-hover:from-purple-500/25",
    text: "text-purple-400",
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    accent: "#A855F7"
  },
  fisico_quimica: {
    border: "border-cyan-500/30",
    borderHover: "hover:border-cyan-500/70",
    glow: "hover:shadow-[0_20px_60px_-15px_rgba(6,182,212,0.45)]",
    hoverBg: "group-hover:from-cyan-500/25",
    text: "text-cyan-400",
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    accent: "#06B6D4"
  },
  revisao_ciclica: {
    border: "border-emerald-500/30",
    borderHover: "hover:border-emerald-500/70",
    glow: "hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.45)]",
    hoverBg: "group-hover:from-emerald-500/25",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    accent: "#10B981"
  },
  previsao_final: {
    border: "border-blue-500/30",
    borderHover: "hover:border-blue-500/70",
    glow: "hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.45)]",
    hoverBg: "group-hover:from-blue-500/25",
    text: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    accent: "#3B82F6"
  },
};

// Fallback para categorias desconhecidas (vermelho Spider-Man)
const DEFAULT_CATEGORY_COLORS: CategoryColorTheme = {
  border: "border-[#E23636]/30",
  borderHover: "hover:border-[#E23636]/70",
  glow: "hover:shadow-[0_20px_60px_-15px_rgba(226,54,54,0.45)]",
  hoverBg: "group-hover:from-[#E23636]/25",
  text: "text-[#E23636]",
  badge: "bg-[#E23636]/20 text-[#E23636] border-[#E23636]/40",
  accent: "#E23636"
};

// Helper para obter cores por categoria
function getCategoryColors(category: string): CategoryColorTheme {
  return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLORS;
}

// ============================================
// TIPOS
// ============================================

interface WebBookLibraryProps {
  onBookSelect: (bookId: string) => void;
  externalCategory?: string | null;
  targetBookId?: string | null; // Auto-open section containing this book
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

  // 🎨 CATEGORY-BASED COLORS — Primary hover color from Book-Web type
  const categoryColors = getCategoryColors(book.category);
  
  // Status-specific badge colors (secondary)
  const statusBadge = isCompleted 
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
    : isReading 
    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
    : categoryColors.badge;

  return (
    <div className="group">
      {/* 🎬 NETFLIX ULTRA PREMIUM CARD — 50% MORE PROMINENT */}
      {/* 🎨 ENHANCED: Stronger contrast, elevation, and visual weight */}
      <div 
        className={cn(
          "relative flex rounded-2xl overflow-hidden cursor-pointer",
          // 🎨 REBALANCED: 50% stronger background contrast
          "bg-gradient-to-br from-[#0d1218] via-[#121922] to-[#1a1020]",
          // Enhanced border: 50% more visible
          "border-2 transition-all duration-300 ease-out",
          "hover:scale-[1.025] hover:-translate-y-3",
          // 50% stronger shadows and elevation
          "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7),0_4px_16px_-4px_rgba(0,0,0,0.5)]",
          "hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),0_8px_24px_-6px_rgba(0,0,0,0.6)]",
          // Category-based border and glow (MANDATORY) — enhanced opacity
          categoryColors.border.replace('/30', '/50'),
          categoryColors.borderHover.replace('/70', '/90'),
          isHighEnd && categoryColors.glow.replace('/0.45', '/0.6')
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
          
          {/* Hover glow overlay — CATEGORY-BASED COLOR */}
          {isHighEnd && (
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
              `bg-gradient-to-br via-transparent to-transparent`,
              categoryColors.hoverBg
            )} />
          )}
          
          {/* 📍 NUMBER BADGE — Top Left — CATEGORY COLOR */}
          <div className="absolute top-3 left-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-black text-base",
              "border-2 backdrop-blur-md shadow-lg",
              "bg-black/60",
              categoryColors.text,
              categoryColors.border.replace('/30', '/60')
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
          
          {/* TOP: Status Badges — Status uses fixed colors, but category badge uses category color */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {isCompleted ? (
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              )}>
                <Crown className="w-3 h-3 mr-1" />
                Dominado
              </span>
            ) : isReading ? (
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                "bg-amber-500/20 text-amber-400 border-amber-500/40"
              )}>
                <Timer className="w-3 h-3 mr-1" />
                Lendo • {progress.toFixed(0)}%
              </span>
            ) : (
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                categoryColors.badge
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

          {/* MIDDLE: Title & Author — CATEGORY-BASED HOVER */}
          <div className="flex-1 min-w-0 mb-3 relative">
            <h3 
              className="text-lg md:text-xl lg:text-2xl font-black tracking-tight mb-1.5 transition-colors duration-200 line-clamp-2 text-white relative"
            >
              {/* Base title */}
              <span className="transition-opacity duration-200 group-hover:opacity-0">
                {book.title}
              </span>
              {/* Hover title with category color */}
              <span 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 line-clamp-2"
                style={{ color: categoryColors.accent }}
              >
                {book.title}
              </span>
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

        {/* ✨ CORNER ACCENTS — CATEGORY-BASED COLOR */}
        <div 
          className={cn(
            "absolute top-0 left-0 w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
            "border-l-2 border-t-2 rounded-tl-2xl"
          )}
          style={{ borderColor: `${categoryColors.accent}80` }}
        />
        <div 
          className={cn(
            "absolute bottom-0 right-0 w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
            "border-r-2 border-b-2 rounded-br-2xl"
          )}
          style={{ borderColor: `${categoryColors.accent}80` }}
        />
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
  accentColor: 'red' | 'amber' | 'emerald' | 'cyan' | 'blue' | 'yellow';
  defaultOpen?: boolean;
  targetBookId?: string | null; // Auto-open if this book is in this section
  categoryKey: string; // For scroll-to-view
}

const BookSection = memo(function BookSection({ 
  title, 
  icon, 
  books, 
  onBookSelect, 
  isHighEnd,
  accentColor,
  defaultOpen = true,
  targetBookId,
  categoryKey
}: BookSectionProps) {
  // Auto-open if this section contains the target book
  const containsTargetBook = targetBookId ? books.some(b => b.id === targetBookId) : false;
  const shouldBeOpen = containsTargetBook || defaultOpen;
  const [isOpen, setIsOpen] = useState(shouldBeOpen);
  
  // Ref for scroll-to-view
  const sectionRef = React.useRef<HTMLDivElement>(null);
  
  // Effect to auto-open and scroll when targetBookId changes
  React.useEffect(() => {
    if (containsTargetBook && !isOpen) {
      setIsOpen(true);
    }
    // Scroll into view after opening
    if (containsTargetBook && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [containsTargetBook, targetBookId]);
  
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
    },
    cyan: {
      border: "border-cyan-500/40 hover:border-cyan-500/70",
      shadow: "shadow-cyan-500/15 hover:shadow-cyan-500/40",
      headerBg: "from-cyan-500/20 via-[#0a0e14]/80 to-cyan-500/15",
      iconBg: "from-cyan-500/50 to-cyan-500/35 border-cyan-500/60 shadow-cyan-500/40",
      iconGlow: "bg-cyan-500/50",
      iconColor: "text-cyan-300",
      badge: "bg-cyan-500/25 text-cyan-300 border-cyan-500/40",
      corner: "border-cyan-500/60",
      accent: "text-cyan-400"
    },
    blue: {
      border: "border-blue-600/40 hover:border-blue-600/70",
      shadow: "shadow-blue-600/15 hover:shadow-blue-600/40",
      headerBg: "from-blue-600/20 via-[#0a0e14]/80 to-blue-600/15",
      iconBg: "from-blue-600/50 to-blue-600/35 border-blue-600/60 shadow-blue-600/40",
      iconGlow: "bg-blue-600/50",
      iconColor: "text-blue-300",
      badge: "bg-blue-600/25 text-blue-300 border-blue-600/40",
      corner: "border-blue-600/60",
      accent: "text-blue-400"
    },
    yellow: {
      border: "border-yellow-500/40 hover:border-yellow-500/70",
      shadow: "shadow-yellow-500/15 hover:shadow-yellow-500/40",
      headerBg: "from-yellow-500/20 via-[#0a0e14]/80 to-yellow-500/15",
      iconBg: "from-yellow-500/50 to-yellow-500/35 border-yellow-500/60 shadow-yellow-500/40",
      iconGlow: "bg-yellow-500/50",
      iconColor: "text-yellow-300",
      badge: "bg-yellow-500/25 text-yellow-300 border-yellow-500/40",
      corner: "border-yellow-500/60",
      accent: "text-yellow-400"
    }
  };

  const colors = colorClasses[accentColor];

  return (
    <Card 
      ref={sectionRef}
      className={cn(
        "group/card relative overflow-hidden transition-all duration-500",
        // 🎨 REBALANCED: 80% less visual weight — ultra-subtle container
        "bg-gradient-to-br from-[#0a0e14]/15 via-[#0f1419]/10 to-transparent",
        "border shadow-none rounded-2xl",
        "border-white/[0.04]", // ~80% reduction from original
        isHighEnd && "hover:border-white/[0.08]"
      )}
      data-category={categoryKey}
    >
      {/* Corner accents: 80% less visible — almost invisible container hints */}
      <div className="absolute top-0 left-0 w-6 h-6 border-l border-t rounded-tl-2xl pointer-events-none border-white/[0.06] opacity-40" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-r border-b rounded-br-2xl pointer-events-none border-white/[0.06] opacity-40" />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn(
            "cursor-pointer relative z-10 py-2.5 px-3",
            // 🎨 REBALANCED: Minimal header — 80% less prominent
            "border-b transition-all duration-300",
            "bg-transparent hover:bg-white/[0.02]",
            "border-white/[0.03] hover:border-white/[0.06]"
          )}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {/* Icon: Minimal, subtle */}
                <div className={cn(
                  "p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] opacity-50",
                  colors.iconColor
                )}>
                  {icon}
                </div>
                
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm md:text-base font-medium text-white/50">
                    {title}
                  </CardTitle>
                  <Badge className="px-1.5 py-0.5 text-[9px] font-normal border bg-white/[0.03] text-white/40 border-white/[0.06]">
                    {books.length}
                  </Badge>
                </div>
              </div>
              
              {/* Toggle button: Ultra-subtle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-md border-0 transition-all opacity-40 hover:opacity-70 bg-transparent hover:bg-white/[0.05]"
              >
                {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-white/40" /> : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* ⚡ LAZY RENDERING: Só monta BookCards quando seção está aberta */}
          {isOpen && (
            <CardContent className="p-4 space-y-4 bg-transparent">
              {books.map((book, idx) => {
                const isPrevisaoFinal = book.category === 'previsao_final';
                const bookCard = (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={idx}
                    // Prioridade: 1) Upload manual, 2) Categoria, 3) Posição, 4) Placeholder
                    coverUrl={book.coverUrl || BOOK_COVERS_BY_CATEGORY[book.category || ''] || BOOK_COVERS_BY_INDEX[idx] || '/placeholder.svg'}
                    onSelect={() => onBookSelect(book.id)}
                    isHighEnd={isHighEnd}
                  />
                );
                
                // 🔒 CHRONOLOCK: Previsão Final bloqueado até 31/01
                if (isPrevisaoFinal) {
                  return (
                    <DateLock 
                      key={book.id}
                      releaseDate="31/01"
                      variant="danger"
                      subtitle="Este material será liberado em breve"
                    >
                      {bookCard}
                    </DateLock>
                  );
                }
                
                return bookCard;
              })}
            </CardContent>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

// ============================================
// 🔀 SORTABLE BOOK CARD — OWNER ONLY DRAG
// ============================================

interface SortableBookCardProps {
  book: WebBookListItem;
  index: number;
  coverUrl: string;
  onSelect: () => void;
  isHighEnd: boolean;
  isEditMode: boolean;
}

const SortableBookCard = memo(function SortableBookCard({ 
  book, 
  index, 
  coverUrl, 
  onSelect, 
  isHighEnd,
  isEditMode 
}: SortableBookCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isEditMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 p-2 bg-purple-500/80 hover:bg-purple-500 rounded-xl cursor-grab active:cursor-grabbing shadow-lg border-2 border-purple-300/50 transition-all"
        >
          <GripVertical className="w-5 h-5 text-white" />
        </div>
      )}
      <BookCard
        book={book}
        index={index}
        coverUrl={coverUrl}
        onSelect={onSelect}
        isHighEnd={isHighEnd}
      />
    </div>
  );
});

// ============================================
// 🏠 MAIN COMPONENT — NETFLIX ULTRA PREMIUM
// ============================================

const WebBookLibrary = memo(function WebBookLibrary({ 
  onBookSelect,
  externalCategory,
  targetBookId,
  className 
}: WebBookLibraryProps) {
  const { books, isLoading, error, refreshBooks } = useWebBookLibrary();
  const { isOwner } = useRolePermissions();
  
  // ⚡ Performance flags - LEI I
  const { shouldShowParticles, isLowEnd, tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'enhanced' || tier === 'standard' || !isLowEnd;
  
  // 🔀 Owner reorder state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localBooks, setLocalBooks] = useState<WebBookListItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sync local books with server books when not in edit mode
  React.useEffect(() => {
    if (books && !isEditMode) {
      setLocalBooks(books);
    }
  }, [books, isEditMode]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setLocalBooks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Save new order to database
  const handleSaveOrder = useCallback(async () => {
    setIsSaving(true);
    try {
      // Update positions in database
      const updates = localBooks.map((book, index) => 
        supabase.from('web_books').update({ position: index }).eq('id', book.id)
      );
      
      await Promise.all(updates);
      
      toast.success('Ordem dos livros salva com sucesso!');
      setIsEditMode(false);
      refreshBooks?.();
    } catch (error) {
      console.error('Error saving book order:', error);
      toast.error('Erro ao salvar ordem dos livros');
    } finally {
      setIsSaving(false);
    }
  }, [localBooks, refreshBooks]);

  // Cancel edit mode
  const handleCancelEdit = useCallback(() => {
    setLocalBooks(books || []);
    setIsEditMode(false);
  }, [books]);
  
  // Estatísticas + agrupamento por categoria (ordem canônica do Livro Web)
  const { stats, booksByCategory } = useMemo(() => {
    const safeBooks = books ?? [];

    const booksByCategory: Record<string, WebBookListItem[]> = {
      quimica_geral: [],
      quimica_organica: [],
      fisico_quimica: [],
      revisao_ciclica: [],
      previsao_final: [],
    };

    let readingCount = 0;
    let completedCount = 0;

    safeBooks.forEach((book) => {
      const progress = book.progress?.progressPercent || 0;
      const isCompleted = book.progress?.isCompleted || false;

      if (isCompleted) completedCount += 1;
      else if (progress > 0) readingCount += 1;

      // Só distribuímos nas 5 categorias canônicas; qualquer outra cai fora (não aparece na UI)
      if (book.category in booksByCategory) {
        booksByCategory[book.category].push(book);
      }
    });

    return {
      booksByCategory,
      stats: {
        total: safeBooks.length,
        reading: readingCount,
        completed: completedCount,
      },
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
                    <div className="absolute inset-[-4px] bg-gradient-to-r from-cyan-500 via-[#E23636] to-cyan-500 rounded-2xl opacity-30" />
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

        {/* 📢 AVISO — VERSÃO 2026 — NETFLIX ULTRA PREMIUM 2300 */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-purple-500/40 bg-gradient-to-r from-[#08060f] via-[#0d0815] to-[#08060f] shadow-2xl shadow-purple-500/20 group hover:border-purple-400/60 transition-all duration-500">
          
          {/* Static gradient overlay */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.15) 25%, rgba(226,54,54,0.15) 50%, rgba(168,85,247,0.15) 75%, transparent 100%)'
            }}
          />
          
          {/* Holographic mesh overlay */}
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(168,85,247,0.6) 0%, transparent 30%),
                radial-gradient(circle at 80% 50%, rgba(226,54,54,0.6) 0%, transparent 30%),
                linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 100% 100%, 24px 24px, 24px 24px'
            }}
          />
          
          <div className="relative z-10 p-5 md:p-7 flex flex-col md:flex-row items-center gap-5 md:gap-8">
            
            {/* Icon orb - holographic */}
            <div className="relative flex-shrink-0">
              {/* Outer glow */}
              {isHighEnd && (
                <div className="absolute -inset-3 bg-gradient-to-r from-purple-500 via-[#E23636] to-purple-500 rounded-2xl blur-xl opacity-40" />
              )}
              {/* Static ring */}
              <div 
                className="absolute -inset-2 rounded-2xl border border-purple-500/30"
                style={{ 
                  background: 'linear-gradient(135deg, transparent 40%, rgba(168,85,247,0.3) 50%, transparent 60%)'
                }}
              />
              {/* Icon container */}
              <div className="relative p-4 rounded-xl bg-gradient-to-br from-purple-600/40 via-purple-500/20 to-[#E23636]/30 border border-purple-400/60 shadow-xl shadow-purple-500/30 backdrop-blur-sm overflow-hidden">
                {/* Inner shimmer */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent" />
                <Rocket className="relative w-8 h-8 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              </div>
            </div>
            
            {/* Text content */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Aguarde a versão dos livros de{' '}
                <span 
                  className="relative inline-block"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #E23636 50%, #f97316 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: isHighEnd ? 'drop-shadow(0 0 10px rgba(226,54,54,0.5))' : 'none'
                  }}
                >
                  2026
                </span>
              </h3>
              <p className="text-sm md:text-base text-purple-200/50 font-medium tracking-wide">
                Novos materiais atualizados serão liberados em breve!
              </p>
              {/* Micro tags */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <Sparkles className="w-2.5 h-2.5" />
                  Conteúdo Inédito
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#E23636]/15 text-[#E23636] border border-[#E23636]/40">
                  <Award className="w-2.5 h-2.5" />
                  Atualizado
                </span>
              </div>
            </div>
            
            {/* Date badge - static */}
            <div className="relative flex items-center gap-4 flex-shrink-0">
              <div className="relative">
                {/* Static glow */}
                {isHighEnd && (
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-[#E23636] to-orange-500 rounded-2xl blur-lg opacity-40" />
                )}
                {/* Outer ring */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 via-[#E23636] to-orange-500 opacity-80" />
                {/* Badge */}
                <div className="relative px-6 py-3 rounded-xl bg-gradient-to-br from-[#1a0a20] via-[#150812] to-[#1a0a20] border border-purple-400/30 shadow-inner">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-300 via-white to-orange-300 bg-clip-text text-transparent drop-shadow-lg">31/01</span>
                    <span className="text-[8px] text-purple-300/70 uppercase tracking-[0.2em] font-bold mt-0.5">Lançamento</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Corner accents - enhanced */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-purple-500/50 rounded-tl-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-[#E23636]/50 rounded-tr-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-[#E23636]/50 rounded-bl-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-purple-500/50 rounded-br-3xl pointer-events-none" />
          
          {/* Scanline effect */}
          {isHighEnd && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168,85,247,0.3) 2px, rgba(168,85,247,0.3) 3px)'
              }}
            />
          )}
        </div>

        {/* 🔀 OWNER EDIT MODE — DRAG & DROP */}
        {isOwner && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/40 bg-gradient-to-r from-[#0d0815] via-[#120820] to-[#0d0815] p-4 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40">
                  <GripVertical className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Reordenar Livros</h4>
                  <p className="text-xs text-purple-300/60">Owner Mode: Arraste para reorganizar</p>
                </div>
              </div>
              
              {isEditMode ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveOrder}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? 'Salvando...' : 'Salvar Ordem'}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                >
                  <GripVertical className="w-4 h-4 mr-1" />
                  Editar Ordem
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 📚 BOOK SECTIONS — OWNER DRAG MODE OR NORMAL */}
        {isEditMode && isOwner ? (
          // 🔀 DRAG & DROP MODE — Lista completa ordenável
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
              <Card className={cn(
                "relative overflow-hidden transition-all duration-500",
                "bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#1a0a0a]",
                "border-2 border-purple-500/40 shadow-2xl rounded-3xl"
              )}>
                <CardHeader className="py-5 px-6 border-b-2 border-purple-500/25 bg-gradient-to-r from-purple-500/20 via-[#0a0e14]/80 to-purple-500/15">
                  <div className="flex items-center gap-4">
                    <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500/50 to-purple-500/35 border-2 border-purple-500/60 shadow-lg">
                      <GripVertical className="h-6 w-6 text-purple-300" />
                    </div>
                    <div>
                      <CardTitle className="text-xl md:text-2xl font-black text-white tracking-tight">
                        Todos os Livros — Modo Edição
                      </CardTitle>
                      <p className="text-sm text-purple-300/60 mt-1">Arraste para reordenar • A posição será salva no banco</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4 bg-gradient-to-b from-transparent to-black/20">
                  <SortableContext items={localBooks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    {localBooks.map((book, idx) => (
                      <SortableBookCard
                        key={book.id}
                        book={book}
                        index={idx}
                        coverUrl={book.coverUrl || BOOK_COVERS_BY_CATEGORY[book.category || ''] || BOOK_COVERS_BY_INDEX[idx] || '/placeholder.svg'}
                        onSelect={() => onBookSelect(book.id)}
                        isHighEnd={isHighEnd}
                        isEditMode={true}
                      />
                    ))}
                  </SortableContext>
                </CardContent>
              </Card>
            </div>
          </DndContext>
        ) : (
          // 📚 NORMAL MODE — ORGANIZAÇÃO POR CATEGORIA (CANÔNICA)
          <div className="space-y-6">
            <BookSection
              title="Química Geral"
              icon={<span className="text-2xl">⚗️</span>}
              books={booksByCategory.quimica_geral}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="red"
              defaultOpen={!targetBookId}
              targetBookId={targetBookId}
              categoryKey="quimica_geral"
            />

            <BookSection
              title="Química Orgânica"
              icon={<span className="text-2xl">🧪</span>}
              books={booksByCategory.quimica_organica}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="cyan"
              defaultOpen={false}
              targetBookId={targetBookId}
              categoryKey="quimica_organica"
            />

            <BookSection
              title="Físico-Química"
              icon={<span className="text-2xl">📊</span>}
              books={booksByCategory.fisico_quimica}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="emerald"
              defaultOpen={false}
              targetBookId={targetBookId}
              categoryKey="fisico_quimica"
            />

            <BookSection
              title="Revisão Cíclica"
              icon={<span className="text-2xl">🔄</span>}
              books={booksByCategory.revisao_ciclica}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="blue"
              defaultOpen={false}
              targetBookId={targetBookId}
              categoryKey="revisao_ciclica"
            />

            <BookSection
              title="Previsão Final"
              icon={<span className="text-2xl">🎯</span>}
              books={booksByCategory.previsao_final}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="yellow"
              defaultOpen={false}
              targetBookId={targetBookId}
              categoryKey="previsao_final"
            />
          </div>
        )}

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
