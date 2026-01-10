// ============================================
// 📚 MATERIAL BOOK CARD — NETFLIX ULTRA PREMIUM
// YEAR 2300 CINEMATIC EXPERIENCE
// ⚡ Estrutura duplicada de WebBookLibrary.tsx
// 🎯 SHELL ESTRUTURAL: Receberá PDFs posteriormente
// ============================================

import { memo } from 'react';
import { 
  Play,
  FileText,
  Eye,
  BookMarked,
  Sparkles,
  Crown,
  Star,
  Timer,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';

// ============================================
// 🎨 CORES POR CATEGORIA — MATERIAL TYPES
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
  quimica_ambiental: {
    border: "border-emerald-500/30",
    borderHover: "hover:border-emerald-500/70",
    glow: "hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.45)]",
    hoverBg: "group-hover:from-emerald-500/25",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    accent: "#10B981"
  },
  bioquimica: {
    border: "border-pink-500/30",
    borderHover: "hover:border-pink-500/70",
    glow: "hover:shadow-[0_20px_60px_-15px_rgba(236,72,153,0.45)]",
    hoverBg: "group-hover:from-pink-500/25",
    text: "text-pink-400",
    badge: "bg-pink-500/20 text-pink-400 border-pink-500/40",
    accent: "#EC4899"
  },
};

// Fallback
const DEFAULT_CATEGORY_COLORS: CategoryColorTheme = {
  border: "border-[#E50914]/30",
  borderHover: "hover:border-[#E50914]/70",
  glow: "hover:shadow-[0_20px_60px_-15px_rgba(229,9,20,0.45)]",
  hoverBg: "group-hover:from-[#E50914]/25",
  text: "text-[#E50914]",
  badge: "bg-[#E50914]/20 text-[#E50914] border-[#E50914]/40",
  accent: "#E50914"
};

function getCategoryColors(category: string): CategoryColorTheme {
  return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLORS;
}

// ============================================
// TIPOS
// ============================================

export interface MaterialBookItem {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  category: string; // quimica_geral, quimica_organica, fisico_quimica, quimica_ambiental, bioquimica
  coverUrl?: string;
  totalPages?: number;
  viewCount?: number;
  progress?: {
    progressPercent: number;
    isCompleted: boolean;
  };
  isPremium?: boolean;
}

interface MaterialBookCardProps {
  item: MaterialBookItem;
  index: number;
  onSelect: () => void;
}

// ============================================
// 🎬 MATERIAL BOOK CARD — NETFLIX ULTRA PREMIUM
// ============================================

export const MaterialBookCard = memo(function MaterialBookCard({ 
  item, 
  index, 
  onSelect 
}: MaterialBookCardProps) {
  const { tier } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural';
  
  const progress = item.progress?.progressPercent || 0;
  const isCompleted = item.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const isReading = hasStarted && !isCompleted;
  const isNew = !hasStarted && !isCompleted;

  const categoryColors = getCategoryColors(item.category);

  // Placeholder cover se não tiver
  const coverUrl = item.coverUrl || `https://placehold.co/320x400/1a1a2e/white?text=${encodeURIComponent(item.title.slice(0, 10))}`;

  return (
    <div className="group">
      {/* 🎬 NETFLIX ULTRA PREMIUM CARD — +50% DIMENSION INCREASE */}
      <div 
        className={cn(
          "relative flex rounded-2xl overflow-hidden cursor-pointer",
          // 🎨 Strong background contrast
          "bg-gradient-to-br from-[#0d1218] via-[#121922] to-[#1a1020]",
          // Enhanced border
          "border-2 transition-all duration-300 ease-out",
          "hover:scale-[1.025] hover:-translate-y-3",
          // Strong shadows and elevation
          "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7),0_4px_16px_-4px_rgba(0,0,0,0.5)]",
          "hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),0_8px_24px_-6px_rgba(0,0,0,0.6)]",
          // Category-based border and glow
          categoryColors.border.replace('/30', '/50'),
          categoryColors.borderHover.replace('/70', '/90'),
          isHighEnd && categoryColors.glow.replace('/0.45', '/0.6'),
          // Click animation
          "active:scale-[0.98] active:bg-gray-300/20"
        )}
        onClick={onSelect}
      >
        {/* 🖼️ POSTER — LADO ESQUERDO (Netflix Style) — +50% SIZE */}
        <div className="relative w-48 md:w-64 lg:w-80 flex-shrink-0 overflow-hidden">
          <img 
            src={coverUrl} 
            alt={item.title}
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

        {/* 📋 CONTEÚDO — LADO DIREITO — +50% PADDING */}
        <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-between min-w-0">
          
          {/* TOP: Status Badges */}
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
            
            {item.isPremium && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Star className="w-2.5 h-2.5 mr-1" />
                Premium
              </span>
            )}
          </div>

          {/* MIDDLE: Title & Author — CATEGORY-BASED HOVER */}
          <div className="flex-1 min-w-0 mb-3 relative">
            <h3 
              className="text-lg md:text-xl lg:text-2xl font-black tracking-tight mb-1.5 transition-colors duration-200 line-clamp-2 text-white relative"
            >
              {/* Base title */}
              <span className="transition-opacity duration-200 group-hover:opacity-0">
                {item.title}
              </span>
              {/* Hover title with category color */}
              <span 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 line-clamp-2"
                style={{ color: categoryColors.accent }}
              >
                {item.title}
              </span>
            </h3>
            {item.subtitle && (
              <p className="text-sm text-muted-foreground/70 line-clamp-1 mb-1">
                {item.subtitle}
              </p>
            )}
            {item.author && (
              <p className="text-sm text-muted-foreground/70 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {item.author}
              </p>
            )}
          </div>

          {/* STATS: Compact HUD Row */}
          <div className="flex items-center gap-3 md:gap-4 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-3">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-bold text-white">{item.totalPages || 0}</span>
              <span className="text-[9px] text-muted-foreground hidden md:inline uppercase">páginas</span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            {(item.viewCount || 0) > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-sm font-bold text-white">{item.viewCount}</span>
                  <span className="text-[9px] text-muted-foreground hidden md:inline uppercase">views</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
              </>
            )}
            
            <div className="flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">Material</span>
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
                  : "bg-gradient-to-r from-[#E50914] to-red-500 hover:shadow-[#E50914]/30"
              )}
            >
              <Play className="w-4 h-4" />
              <span>{isCompleted ? "Revisar" : isReading ? "Continuar" : "Abrir"}</span>
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

export default MaterialBookCard;
