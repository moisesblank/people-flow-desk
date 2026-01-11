// ============================================
// 📚 BIBLIOTECA DE LIVROS — NETFLIX ULTRA PREMIUM
// YEAR 2300 CINEMATIC EXPERIENCE
// ⚡ PERFORMANCE-OPTIMIZED: CSS-only, zero JS animations
// 🎬 NETFLIX RED (#E50914) Theme
// ============================================

import React, { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  border: "border-[#E50914]/30",
  borderHover: "hover:border-[#E50914]/70",
  glow: "hover:shadow-[0_20px_60px_-15px_rgba(229,9,20,0.45)]",
  hoverBg: "group-hover:from-[#E50914]/25",
  text: "text-[#E50914]",
  badge: "bg-[#E50914]/20 text-[#E50914] border-[#E50914]/40",
  accent: "#E50914"
};

// Helper para obter cores por categoria
// 🎨 TODAS as animações de hover usam a cor do PRIMEIRO livro (Amber/Química Geral)
function getCategoryColors(_category: string): CategoryColorTheme {
  // Retorna SEMPRE as cores amber (quimica_geral) para TODOS os livros
  return CATEGORY_COLORS.quimica_geral;
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

  return (
    <div className="group perspective-1000">
      {/* 🎬 NETFLIX ULTRA PREMIUM 2300 BOOK CARD — CINEMATIC EXPERIENCE */}
      <div 
        className={cn(
          "relative flex rounded-2xl overflow-hidden cursor-pointer",
          // 🌌 RICH GRADIENT BACKGROUND — Layered depth
          "bg-gradient-to-br from-[#080c12] via-[#0f1520] to-[#15101f]",
          // 🔥 ENHANCED BORDER with glow
          "border transition-all duration-500 ease-out",
          "hover:scale-[1.02] hover:-translate-y-2",
          // 🎭 DRAMATIC SHADOWS — Netflix Premium depth
          "shadow-[0_8px_40px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]",
          "hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_40px_-10px_var(--card-glow)]",
          // Category-based border
          categoryColors.border.replace('/30', '/40'),
          categoryColors.borderHover.replace('/70', '/80'),
          isHighEnd && categoryColors.glow,
          // 🎨 CLICK FEEDBACK
          "active:scale-[0.98] active:brightness-110"
        )}
        style={{ 
          '--card-glow': `${categoryColors.accent}40`
        } as React.CSSProperties}
        onClick={onSelect}
      >
        {/* 🌟 TOP EDGE GLOW — Cinematic highlight */}
        <div 
          className="absolute inset-x-0 top-0 h-px opacity-60 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${categoryColors.accent}60, transparent)` }}
        />

        {/* 🖼️ POSTER — LADO ESQUERDO (Netflix Cinematic) */}
        <div className="relative w-44 md:w-56 lg:w-72 flex-shrink-0 overflow-hidden">
          {/* Cover Image with hover zoom */}
          <img 
            src={coverUrl} 
            alt={book.title}
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110"
            loading="lazy"
            decoding="async"
          />
          
          {/* 🎬 CINEMATIC VIGNETTE — Darker corners */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Gradient blend to content — smoother transition */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0e14]" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-r from-transparent to-[#0a0e14]" />
          
          {/* 🔥 Hover glow overlay — CATEGORY-BASED COLOR with animation */}
          {isHighEnd && (
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none mix-blend-soft-light"
              style={{ background: `linear-gradient(135deg, ${categoryColors.accent}30, transparent 60%)` }}
            />
          )}
          
          {/* 📍 NUMBER BADGE — Premium glass morphism */}
          <div className="absolute top-4 left-4">
            <div 
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg",
                "backdrop-blur-xl shadow-2xl transition-all duration-300",
                "border-2 group-hover:scale-110 group-hover:rotate-3",
                "bg-gradient-to-br from-black/70 via-black/50 to-black/70",
                categoryColors.text,
                categoryColors.border.replace('/30', '/70')
              )}
              style={{ 
                boxShadow: `0 8px 32px -8px ${categoryColors.accent}50, inset 0 1px 0 rgba(255,255,255,0.1)` 
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
          </div>

          {/* 🎬 PLAY OVERLAY — Appears on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md border-2 border-white/30 shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-500"
              style={{ 
                background: `linear-gradient(135deg, ${categoryColors.accent}90, ${categoryColors.accent}60)`,
                boxShadow: `0 0 40px ${categoryColors.accent}60`
              }}
            >
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
          </div>
          
          {/* Scanlines (High-End only) — subtle texture */}
          {isHighEnd && (
            <div 
              className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none"
              style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)` }}
            />
          )}
        </div>

        {/* 📋 CONTEÚDO — LADO DIREITO */}
        <div className="flex-1 p-5 md:p-7 lg:p-8 flex flex-col justify-between min-w-0 relative">
          
          {/* 🌟 AMBIENT GLOW behind content */}
          {isHighEnd && (
            <div 
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-700 blur-3xl pointer-events-none"
              style={{ background: categoryColors.accent }}
            />
          )}
          
          {/* TOP: Status Badges — Enhanced pills */}
          <div className="flex items-center gap-2 flex-wrap mb-4 relative z-10">
            {isCompleted ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-lg bg-gradient-to-r from-emerald-500/30 to-cyan-500/20 text-emerald-300 border-emerald-500/50">
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                Dominado
              </span>
            ) : isReading ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-lg bg-gradient-to-r from-amber-500/30 to-orange-500/20 text-amber-300 border-amber-500/50">
                <Timer className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                Lendo • {progress.toFixed(0)}%
              </span>
            ) : (
              <span 
                className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${categoryColors.accent}30, ${categoryColors.accent}15)`,
                  color: categoryColors.accent,
                  borderColor: `${categoryColors.accent}50`
                }}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Novo
              </span>
            )}
            
            {/* Premium badge with shimmer */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm">
              <Star className="w-3 h-3 mr-1" />
              Premium
            </span>
          </div>

          {/* MIDDLE: Title & Author — ENHANCED TYPOGRAPHY */}
          <div className="flex-1 min-w-0 mb-4 relative z-10">
            <h3 className="text-lg md:text-xl lg:text-2xl font-black tracking-tight mb-2 transition-all duration-300 line-clamp-2">
              {/* Title with category color on hover */}
              <span 
                className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent group-hover:from-white group-hover:to-white/80 transition-all duration-300"
                style={{ 
                  '--tw-gradient-from': 'white',
                  '--tw-gradient-to': 'rgba(255,255,255,0.9)'
                } as React.CSSProperties}
              >
                {book.title}
              </span>
              {/* Underline accent on hover */}
              <span 
                className="block h-0.5 w-0 group-hover:w-full transition-all duration-500 mt-1 rounded-full"
                style={{ background: `linear-gradient(90deg, ${categoryColors.accent}, transparent)` }}
              />
            </h3>
            {book.author && (
              <p className="text-sm text-muted-foreground/60 flex items-center gap-2 group-hover:text-muted-foreground/80 transition-colors">
                <User className="w-4 h-4" />
                <span>{book.author}</span>
              </p>
            )}
          </div>

          {/* STATS: Premium HUD Row with glass effect */}
          <div className="flex items-center gap-3 md:gap-4 py-3 px-4 rounded-xl mb-4 relative z-10 bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-500/20">
                <FileText className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none">{book.totalPages || 0}</span>
                <span className="text-[9px] text-muted-foreground/60 uppercase">páginas</span>
              </div>
            </div>
            
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            
            {(book.viewCount || 0) > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20">
                    <Eye className="w-4 h-4 text-purple-300" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-none">{book.viewCount}</span>
                    <span className="text-[9px] text-muted-foreground/60 uppercase">views</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              </>
            )}
            
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20">
                <BookMarked className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="text-sm font-bold text-cyan-300">Exclusivo</span>
            </div>
          </div>

          {/* Progress Bar (If reading) — Enhanced gradient */}
          {isReading && (
            <div className="mb-4 relative z-10">
              <div className="h-2 bg-gradient-to-r from-white/5 to-white/10 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full transition-all duration-700 relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM: CTA Button — Premium gradient with glow */}
          <div className="flex items-center justify-between gap-3 relative z-10">
            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest hidden md:block">
              ⚡ Material Exclusivo
            </span>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className={cn(
                "px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider",
                "transition-all duration-300 flex items-center gap-2",
                "text-white shadow-xl hover:scale-105 hover:-translate-y-0.5",
                "border border-white/10"
              )}
              style={{
                background: isCompleted 
                  ? 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)'
                  : isReading
                  ? 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
                  : `linear-gradient(135deg, ${categoryColors.accent} 0%, #EF4444 100%)`,
                boxShadow: isCompleted 
                  ? '0 10px 40px -10px rgba(16,185,129,0.5)'
                  : isReading
                  ? '0 10px 40px -10px rgba(245,158,11,0.5)'
                  : `0 10px 40px -10px ${categoryColors.accent}80`
              }}
            >
              <PlayCircle className="w-5 h-5" />
              <span>{isCompleted ? "Revisar" : isReading ? "Continuar" : "Ler Agora"}</span>
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </button>
          </div>
        </div>

        {/* ✨ CORNER ACCENTS — Animated on hover */}
        <div 
          className="absolute top-0 left-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none border-l-2 border-t-2 rounded-tl-2xl"
          style={{ borderColor: categoryColors.accent }}
        />
        <div 
          className="absolute bottom-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none border-r-2 border-b-2 rounded-br-2xl"
          style={{ borderColor: categoryColors.accent }}
        />
        
        {/* 🌟 BOTTOM EDGE GLOW */}
        <div 
          className="absolute inset-x-0 bottom-0 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${categoryColors.accent}60, transparent)` }}
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
  accentColor: 'red' | 'amber' | 'emerald' | 'cyan' | 'blue' | 'yellow' | 'purple';
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
  defaultOpen = false, // 🎯 FECHADO por padrão — aluno clica para abrir
  targetBookId,
  categoryKey
}: BookSectionProps) {
  // Auto-open if this section contains the target book
  const containsTargetBook = targetBookId ? books.some(b => b.id === targetBookId) : false;
  
  // 🎯 Estado collapsible — fechado por padrão, abre ao clicar no header
  const [isOpen, setIsOpen] = React.useState(containsTargetBook || defaultOpen);
  
  // Ref for scroll-to-view
  const sectionRef = React.useRef<HTMLDivElement>(null);
  
  // Auto-open when target book is in this section
  React.useEffect(() => {
    if (containsTargetBook && !isOpen) {
      setIsOpen(true);
    }
  }, [containsTargetBook]);
  
  // Effect to scroll when section opens with target book
  React.useEffect(() => {
    if (containsTargetBook && isOpen && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [containsTargetBook, isOpen, targetBookId]);
  
  if (books.length === 0) return null;

  const colorClasses = {
    red: {
      border: "border-[#E50914]/40 hover:border-[#E50914]/70",
      iconColor: "text-[#FF6B6B]",
      badge: "bg-[#E50914]/25 text-[#FF6B6B] border-[#E50914]/40",
      accent: "text-[#E50914]"
    },
    amber: {
      border: "border-amber-500/40 hover:border-amber-500/70",
      iconColor: "text-amber-300",
      badge: "bg-amber-500/25 text-amber-300 border-amber-500/40",
      accent: "text-amber-400"
    },
    purple: {
      border: "border-purple-500/40 hover:border-purple-500/70",
      iconColor: "text-purple-300",
      badge: "bg-purple-500/25 text-purple-300 border-purple-500/40",
      accent: "text-purple-400"
    },
    emerald: {
      border: "border-emerald-500/40 hover:border-emerald-500/70",
      iconColor: "text-emerald-300",
      badge: "bg-emerald-500/25 text-emerald-300 border-emerald-500/40",
      accent: "text-emerald-400"
    },
    cyan: {
      border: "border-cyan-500/40 hover:border-cyan-500/70",
      iconColor: "text-cyan-300",
      badge: "bg-cyan-500/25 text-cyan-300 border-cyan-500/40",
      accent: "text-cyan-400"
    },
    blue: {
      border: "border-blue-600/40 hover:border-blue-600/70",
      iconColor: "text-blue-300",
      badge: "bg-blue-600/25 text-blue-300 border-blue-600/40",
      accent: "text-blue-400"
    },
    yellow: {
      border: "border-yellow-500/40 hover:border-yellow-500/70",
      iconColor: "text-yellow-300",
      badge: "bg-yellow-500/25 text-yellow-300 border-yellow-500/40",
      accent: "text-yellow-400"
    }
  };

  const colors = colorClasses[accentColor];

  return (
    <div 
      ref={sectionRef}
      className="relative"
      data-category={categoryKey}
    >
      {/* 🎬 FUTURISTIC SECTION HEADER — Year 2300 Cinematic Design — CLICÁVEL */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center gap-3 px-4 py-3 mb-4 rounded-xl cursor-pointer select-none",
          "border border-white/10",
          // 🌌 Futuristic gradient background
          "bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-yellow-500/10",
          // ✨ Glassmorphism effect
          "backdrop-blur-sm",
          // 🎯 Glow effect
          "shadow-[0_0_30px_-5px_rgba(245,158,11,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]",
          // 📏 Overflow hidden for pseudo-elements
          "overflow-hidden",
          // 🖱️ Hover effect
          "hover:border-amber-400/40 hover:shadow-[0_0_40px_-5px_rgba(245,158,11,0.5)] transition-all duration-200"
        )}
      >
        {/* 🌟 Animated gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60" />
        
        {/* 💫 Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-amber-400/50 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-amber-400/50 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-amber-400/50 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-amber-400/50 rounded-br-lg" />
        
        {/* 🎨 Icon with glow */}
        <div className={cn(
          "w-7 h-7 flex items-center justify-center rounded-lg",
          "bg-gradient-to-br from-amber-500/30 to-orange-500/20",
          "border border-amber-400/30",
          "shadow-[0_0_15px_rgba(245,158,11,0.4)]",
          colors.iconColor
        )}>
          {icon}
        </div>
        
        {/* 📝 Title with gradient text */}
        <span className={cn(
          "text-base font-bold tracking-wide uppercase",
          "bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent",
          "drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        )}>
          {title}
        </span>
        
        {/* 🏷️ Badge with futuristic style */}
        <Badge className={cn(
          "px-3 py-1 text-xs font-bold border rounded-lg",
          "bg-gradient-to-r from-amber-500/25 to-orange-500/20",
          "text-amber-300 border-amber-400/40",
          "shadow-[0_0_10px_rgba(245,158,11,0.3)]"
        )}>
          {books.length}
        </Badge>
        
        {/* 🔽 Chevron indicator — rotates when open */}
        <div className="ml-auto">
          <ChevronDown 
            className={cn(
              "w-5 h-5 text-amber-400 transition-transform duration-300",
              isOpen && "rotate-180"
            )} 
          />
        </div>
        
        {/* ⚡ Scan line animation */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 📚 BOOK CARDS — Visíveis apenas quando seção aberta */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            key="book-cards"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-4 pl-2 pb-3 overflow-hidden"
          >
            {books.map((book, idx) => {
              const isPrevisaoFinal = book.category === 'previsao_final';
              const bookCard = (
                <BookCard
                  key={book.id}
                  book={book}
                  index={idx}
                  coverUrl={book.coverUrl || BOOK_COVERS_BY_CATEGORY[book.category || ''] || BOOK_COVERS_BY_INDEX[idx] || '/placeholder.svg'}
                  onSelect={() => onBookSelect(book.id)}
                  isHighEnd={isHighEnd}
                />
              );
              
              // 🔒 CHRONOLOCK: Previsão Final bloqueado até 28/09
              if (isPrevisaoFinal) {
                return (
                  <DateLock 
                    key={book.id}
                    releaseDate="28/09"
                    variant="danger"
                    subtitle="Este material será liberado em breve"
                  >
                    {bookCard}
                  </DateLock>
                );
              }
              
              return bookCard;
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#E50914] via-red-600 to-[#E50914] animate-pulse flex items-center justify-center shadow-2xl shadow-[#E50914]/40">
            <Library className="w-10 h-10 text-white" />
          </div>
          
          {/* Orbital rings */}
          {isHighEnd && (
            <>
              <div className="absolute inset-[-20px] border-2 border-[#E50914]/30 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
              <div className="absolute inset-[-40px] border border-[#E50914]/20 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
            </>
          )}
          
          {/* Loading text */}
          <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-sm text-[#E50914] font-bold uppercase tracking-widest whitespace-nowrap">
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
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#E50914]/15 rounded-full blur-3xl" />
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
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/60 to-[#E50914]/40 rounded-2xl blur-2xl opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-[-4px] bg-gradient-to-r from-cyan-500 via-[#E50914] to-cyan-500 rounded-2xl opacity-30" />
                  </>
                )}
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-[#0f1419] via-[#1a1f26] to-[#0f1419] flex items-center justify-center shadow-2xl border-2 border-cyan-500/40 overflow-hidden">
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-[#E50914]/20" />
                  {/* Icon bars (book spine style) */}
                  <div className="relative flex gap-1">
                    <div className="w-2 h-12 md:h-14 bg-gradient-to-b from-[#E50914] to-orange-500 rounded-sm" />
                    <div className="w-2 h-10 md:h-12 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-sm mt-1" />
                    <div className="w-2 h-14 md:h-16 bg-gradient-to-b from-[#E50914] to-rose-500 rounded-sm -mt-1" />
                    <div className="w-2 h-11 md:h-13 bg-gradient-to-b from-amber-400 to-orange-500 rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="flex-1 text-center lg:text-left space-y-3">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
                  <span className="text-white">Biblioteca </span>
                  <span className="bg-gradient-to-r from-cyan-400 via-[#E50914] to-orange-500 bg-clip-text text-transparent">Premium</span>
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
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/30">
                    <Award className="w-3 h-3" />
                    Material Premium
                  </span>
                </div>
              </div>

              {/* Stats HUD Orbs */}
              <div className="flex gap-3 md:gap-4">
                {/* TOTAL */}
                <div className="relative group flex flex-col items-center gap-2">
                  {isHighEnd && <div className="absolute inset-0 bg-[#E50914]/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />}
                  <div className="relative px-5 py-4 rounded-2xl bg-gradient-to-br from-[#E50914] via-red-500 to-orange-500 shadow-lg shadow-[#E50914]/40 border border-[#E50914]/60 overflow-hidden">
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
          <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-[#E50914]/40 rounded-tr-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-[#E50914]/40 rounded-bl-3xl pointer-events-none" />
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
                radial-gradient(circle at 80% 50%, rgba(229,9,20,0.6) 0%, transparent 30%),
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
                <div className="absolute -inset-3 bg-gradient-to-r from-purple-500 via-[#E50914] to-purple-500 rounded-2xl blur-xl opacity-40" />
              )}
              {/* Static ring */}
              <div 
                className="absolute -inset-2 rounded-2xl border border-purple-500/30"
                style={{ 
                  background: 'linear-gradient(135deg, transparent 40%, rgba(168,85,247,0.3) 50%, transparent 60%)'
                }}
              />
              {/* Icon container */}
              <div className="relative p-4 rounded-xl bg-gradient-to-br from-purple-600/40 via-purple-500/20 to-[#E50914]/30 border border-purple-400/60 shadow-xl shadow-purple-500/30 backdrop-blur-sm overflow-hidden">
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
                    background: 'linear-gradient(135deg, #a855f7 0%, #E50914 50%, #f97316 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: isHighEnd ? 'drop-shadow(0 0 10px rgba(229,9,20,0.5))' : 'none'
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#E50914]/15 text-[#E50914] border border-[#E50914]/40">
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
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-[#E50914] to-orange-500 rounded-2xl blur-lg opacity-40" />
                )}
                {/* Outer ring */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 via-[#E50914] to-orange-500 opacity-80" />
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
          <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-[#E50914]/50 rounded-tr-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-[#E50914]/50 rounded-bl-3xl pointer-events-none" />
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
          // 📚 NORMAL MODE — NETFLIX STYLE ROWS (SEM DUPLICAÇÃO DE HEADERS)
          <div className="space-y-8">
            {/* 🎬 Química Geral */}
            <BookSection
              title="Química Geral"
              icon={<span className="text-lg">⚗️</span>}
              books={booksByCategory.quimica_geral}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="amber"
              defaultOpen={!targetBookId}
              targetBookId={targetBookId}
              categoryKey="quimica_geral"
            />

            {/* 🎬 Química Orgânica */}
            <BookSection
              title="Química Orgânica"
              icon={<span className="text-lg">🧪</span>}
              books={booksByCategory.quimica_organica}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="purple"
              defaultOpen={false}
              targetBookId={targetBookId}
              categoryKey="quimica_organica"
            />

            {/* 🎬 Físico-Química */}
            <BookSection
              title="Físico-Química"
              icon={<span className="text-lg">📊</span>}
              books={booksByCategory.fisico_quimica}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="cyan"
              defaultOpen={false}
              targetBookId={targetBookId}
              categoryKey="fisico_quimica"
            />

            {/* 🎬 Revisão Cíclica */}
            <BookSection
              title="Revisão Cíclica"
              icon={<span className="text-lg">🔄</span>}
              books={booksByCategory.revisao_ciclica}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="emerald"
              defaultOpen={false}
              targetBookId={targetBookId}
              categoryKey="revisao_ciclica"
            />

            {/* 🎬 Previsão Final */}
            <BookSection
              title="Previsão Final"
              icon={<span className="text-lg">🎯</span>}
              books={booksByCategory.previsao_final}
              onBookSelect={onBookSelect}
              isHighEnd={isHighEnd}
              accentColor="blue"
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E50914]/30 to-[#E50914]/10 border-2 border-[#E50914]/40 flex items-center justify-center">
                <Library className="w-12 h-12 text-[#E50914]" />
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
