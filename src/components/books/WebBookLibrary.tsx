// ============================================
// 📚 LIVROS DO MOISA — APOTEÓTICO v20.0
// Year 2300 Cinematic + Spider-Man Red (#E23636)
// CADA LIVRO = UMA SEÇÃO CINEMATOGRÁFICA
// PERFORMANCE ADAPTATIVA — 5000+ USUÁRIOS
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
  Target
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCategoryConfig, normalizeCategoryId } from './CategoryCover';
import { useBookCategories } from '@/hooks/useBookCategories';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { CyberBackground } from '@/components/ui/cyber-background';
import { FuturisticPageHeader } from '@/components/ui/futuristic-page-header';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ============================================
// TIPOS
// ============================================

interface WebBookLibraryProps {
  onBookSelect: (bookId: string) => void;
  externalCategory?: string | null;
  className?: string;
}

// ============================================
// CSS KEYFRAMES — GPU OPTIMIZED + YEAR 2300
// ============================================

const APOTEOTIC_STYLES = `
  @keyframes apo-pulse {
    0%, 100% { box-shadow: 0 0 40px rgba(226,54,54,0.3), inset 0 0 20px rgba(226,54,54,0.1); }
    50% { box-shadow: 0 0 80px rgba(226,54,54,0.5), inset 0 0 40px rgba(226,54,54,0.2); }
  }
  @keyframes apo-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes apo-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes apo-glow-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  @keyframes apo-orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes apo-scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  .apo-section {
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .apo-section:hover {
    transform: scale(1.005);
  }
  .apo-book-cover {
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .apo-book-cover:hover {
    transform: scale(1.03) translateY(-4px);
    box-shadow: 0 30px 80px rgba(226,54,54,0.4), 0 0 120px rgba(226,54,54,0.2);
  }
  .perf-reduced .apo-pulse { animation: none !important; }
  .perf-reduced .apo-glow { display: none !important; }
  .perf-reduced .apo-orbit { animation: none !important; }
  .perf-reduced .apo-book-cover:hover { transform: scale(1.02); }
`;

// ============================================
// 🎯 HUD STAT ORB — YEAR 2300 APOTEOTIC
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
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-current opacity-20 blur-md animate-pulse" />
          <div className="relative p-2.5 rounded-xl bg-background/30 backdrop-blur-sm border border-current/30 shadow-inner">
            {icon}
          </div>
        </div>
        
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
// 📊 STATS PANEL — YEAR 2300 APOTEOTIC HUD
// ============================================

const StatsPanel = memo(function StatsPanel({ 
  totalBooks, 
  inProgress, 
  completed
}: { 
  totalBooks: number;
  inProgress: number;
  completed: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <HudStatOrb
        icon={<Library className="h-5 w-5 md:h-6 md:w-6 text-[#E23636]" />}
        value={totalBooks}
        label="Biblioteca"
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
    </div>
  );
});

// ============================================
// 📚 BOOK SECTION — APOTEOTIC CINEMATIC CARD
// Cada livro é uma seção própria com design cinematográfico
// ============================================

interface BookSectionProps {
  book: WebBookListItem;
  index: number;
  coverUrl: string | null;
  onSelect: () => void;
  isHighEnd: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const BookSection = memo(function BookSection({
  book,
  index,
  coverUrl,
  onSelect,
  isHighEnd,
  isOpen,
  onToggle
}: BookSectionProps) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const coverImage = book.coverUrl || coverUrl || getCategoryConfig(book.category)?.cover;

  // Status config
  const statusConfig = isCompleted 
    ? { color: 'emerald', icon: CheckCircle, label: 'CONCLUÍDO', glow: 'rgba(16,185,129,0.4)' }
    : hasStarted 
      ? { color: 'amber', icon: Clock, label: `${progress.toFixed(0)}% LIDO`, glow: 'rgba(245,158,11,0.4)' }
      : { color: 'primary', icon: BookOpen, label: 'NOVO', glow: 'rgba(226,54,54,0.4)' };

  return (
    <div 
      className="apo-section animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 0.08, 0.5)}s` }}
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        {/* 🎬 SECTION HEADER — APOTEOTIC CINEMATIC */}
        <CollapsibleTrigger asChild>
          <div className={cn(
            "group relative cursor-pointer overflow-hidden",
            "rounded-3xl border-2 transition-all duration-500",
            "bg-gradient-to-r from-[#0a0e14] via-[#0f1419] to-[#0a0e14]",
            isOpen 
              ? "border-[#E23636]/70 shadow-2xl shadow-[#E23636]/20" 
              : "border-[#E23636]/30 hover:border-[#E23636]/60 hover:shadow-xl hover:shadow-[#E23636]/10"
          )}>
            {/* Background Gradient Sweep */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
              "bg-gradient-to-r from-[#E23636]/5 via-[#E23636]/10 to-[#E23636]/5"
            )} />

            {/* Spider-Man Corner Accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-[#E23636]/50 rounded-tl-3xl pointer-events-none group-hover:border-[#E23636] transition-colors" />
            <div className="absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-[#E23636]/40 rounded-tr-3xl pointer-events-none group-hover:border-[#E23636] transition-colors" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-[#E23636]/40 rounded-bl-3xl pointer-events-none group-hover:border-[#E23636] transition-colors" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-[#E23636]/50 rounded-br-3xl pointer-events-none group-hover:border-[#E23636] transition-colors" />

            {/* Ambient Glow */}
            {isHighEnd && (
              <div 
                className="apo-glow absolute -inset-4 rounded-[40px] -z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(ellipse at center, ${statusConfig.glow} 0%, transparent 70%)`,
                  filter: 'blur(40px)'
                }}
              />
            )}

            <div className="relative flex items-center gap-6 p-6 md:p-8">
              {/* 📘 BOOK NUMBER — Cinematic Badge */}
              <div className="hidden md:flex flex-col items-center justify-center">
                <div 
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center border-2 overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(226,54,54,0.3) 0%, rgba(180,30,30,0.2) 100%)',
                    borderColor: 'rgba(226,54,54,0.5)',
                    boxShadow: '0 0 30px rgba(226,54,54,0.3)'
                  }}
                >
                  {/* Orbital ring */}
                  {isHighEnd && (
                    <div 
                      className="absolute inset-0 rounded-2xl border border-[#E23636]/30 apo-orbit"
                      style={{ animation: 'apo-orbit 20s linear infinite' }}
                    />
                  )}
                  <span className="text-4xl font-black text-[#E23636] drop-shadow-lg">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] text-white/40 mt-2 uppercase tracking-widest font-bold">LIVRO</span>
              </div>

              {/* 📚 BOOK COVER — Large Cinematic */}
              <div className="relative flex-shrink-0">
                <div 
                  className="apo-book-cover relative w-32 h-44 md:w-40 md:h-56 rounded-2xl overflow-hidden border-2 border-[#E23636]/40 group-hover:border-[#E23636]/80"
                  style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(226,54,54,0.2)' }}
                >
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={book.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-[#E23636]/30" />
                    </div>
                  )}
                  
                  {/* Cover Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Status Badge */}
                  <div 
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold text-white border"
                    style={{
                      background: isCompleted 
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.9) 0%, rgba(5,150,105,0.9) 100%)'
                        : hasStarted
                          ? 'linear-gradient(135deg, rgba(245,158,11,0.9) 0%, rgba(217,119,6,0.9) 100%)'
                          : 'linear-gradient(135deg, rgba(226,54,54,0.9) 0%, rgba(180,30,30,0.9) 100%)',
                      borderColor: isCompleted ? 'rgba(16,185,129,0.5)' : hasStarted ? 'rgba(245,158,11,0.5)' : 'rgba(226,54,54,0.5)',
                      boxShadow: `0 0 15px ${statusConfig.glow}`
                    }}
                  >
                    <statusConfig.icon className="w-3 h-3" />
                    {statusConfig.label}
                  </div>

                  {/* Scanlines (High-End) */}
                  {isHighEnd && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.03]"
                      style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)`
                      }}
                    />
                  )}
                </div>
              </div>

              {/* 📋 BOOK INFO — Year 2300 Typography */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-3 group-hover:text-[#FF6B6B] transition-colors">
                  {book.title}
                </h2>

                {/* Subtitle / Description */}
                {book.subtitle && (
                  <p className="text-white/60 text-sm md:text-base mb-4 line-clamp-2">
                    {book.subtitle}
                  </p>
                )}

                {/* Meta Stats — HUD Style */}
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4">
                  {book.totalPages > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <FileText className="w-4 h-4 text-[#E23636]" />
                      <span className="text-sm font-bold text-white">{book.totalPages}</span>
                      <span className="text-xs text-white/50">páginas</span>
                    </div>
                  )}
                  {book.viewCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-bold text-white">{book.viewCount}</span>
                      <span className="text-xs text-white/50">views</span>
                    </div>
                  )}
                  {book.author && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-white/70">{book.author}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar (if reading) */}
                {hasStarted && !isCompleted && (
                  <div className="max-w-md">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Progresso</span>
                      <span className="text-xs font-bold text-[#E23636]">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #E23636 0%, #FF6B6B 50%, #E23636 100%)',
                          backgroundSize: '200% 100%',
                          animation: isHighEnd ? 'apo-shimmer 2s ease-in-out infinite' : undefined,
                          boxShadow: '0 0 20px rgba(226,54,54,0.6)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 🎮 EXPAND INDICATOR */}
              <div className="flex flex-col items-center gap-2">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                    isOpen 
                      ? "bg-[#E23636]/30 border-[#E23636]/60 rotate-180" 
                      : "bg-white/5 border-white/20 group-hover:bg-[#E23636]/20 group-hover:border-[#E23636]/40"
                  )}
                >
                  <ChevronDown className={cn("w-6 h-6 transition-colors", isOpen ? "text-[#E23636]" : "text-white/60")} />
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest hidden md:block">
                  {isOpen ? 'FECHAR' : 'ABRIR'}
                </span>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* 📖 EXPANDED CONTENT — APOTEOTIC ACTION PANEL */}
        <CollapsibleContent>
          <div className="mt-4 animate-fade-in">
            <div className={cn(
              "relative rounded-3xl overflow-hidden border-2 border-[#E23636]/30",
              "bg-gradient-to-br from-[#0f1419]/90 via-[#1a0a0a]/80 to-[#0f1419]/90"
            )}>
              {/* Background Pattern */}
              <div 
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              />

              <div className="relative p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Main CTA — READ NOW */}
                  <button
                    onClick={onSelect}
                    className={cn(
                      "group/cta relative flex-1 w-full md:w-auto overflow-hidden",
                      "px-10 py-6 rounded-2xl border-2",
                      "transition-all duration-500 transform hover:scale-[1.02]"
                    )}
                    style={{
                      background: 'linear-gradient(135deg, rgba(226,54,54,0.9) 0%, rgba(180,30,30,0.9) 100%)',
                      borderColor: 'rgba(255,107,107,0.5)',
                      boxShadow: '0 10px 40px rgba(226,54,54,0.4), 0 0 60px rgba(226,54,54,0.2)'
                    }}
                  >
                    {/* Shimmer Effect */}
                    {isHighEnd && (
                      <div 
                        className="absolute inset-0 opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'apo-shimmer 1.5s ease-in-out infinite'
                        }}
                      />
                    )}
                    
                    <div className="relative flex items-center justify-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{ 
                          background: 'rgba(255,255,255,0.2)',
                          boxShadow: '0 0 30px rgba(255,255,255,0.3)'
                        }}
                      >
                        <Play className="w-8 h-8 text-white ml-1" fill="white" />
                      </div>
                      <div className="text-left">
                        <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                          {hasStarted ? 'CONTINUAR LENDO' : 'COMEÇAR A LER'}
                        </div>
                        <div className="text-white/70 text-sm font-medium">
                          {hasStarted 
                            ? `Página ${Math.round((progress / 100) * book.totalPages)} de ${book.totalPages}` 
                            : `${book.totalPages} páginas disponíveis`}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Secondary Info — Stats HUD */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    {/* Reading Time Estimate */}
                    <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/10">
                      <Clock className="w-6 h-6 text-amber-400 mb-2" />
                      <span className="text-lg font-bold text-white">{Math.ceil(book.totalPages * 1.5)} min</span>
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">Tempo Est.</span>
                    </div>
                    
                    {/* Category */}
                    <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/10">
                      <BookMarked className="w-6 h-6 text-[#E23636] mb-2" />
                      <span className="text-sm font-bold text-white capitalize">
                        {book.category?.replace(/_/g, ' ') || 'Geral'}
                      </span>
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">Categoria</span>
                    </div>

                    {/* XP Reward */}
                    <div className="flex flex-col items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <Zap className="w-6 h-6 text-emerald-400 mb-2" />
                      <span className="text-lg font-bold text-emerald-400">+{book.totalPages * 2} XP</span>
                      <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Potencial</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});

// ============================================
// 🎬 LOADING STATE — YEAR 2300 APOTEOTIC
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
              animation: isHighEnd ? 'apo-pulse 2s ease-in-out infinite' : undefined,
              boxShadow: '0 0 60px rgba(226,54,54,0.4)'
            }}
          >
            <Library className="w-14 h-14 text-[#E23636]" />
          </div>
          
          {/* Orbital Rings */}
          {isHighEnd && [1, 2, 3].map((ring) => (
            <div 
              key={ring}
              className="absolute rounded-full border pointer-events-none apo-orbit"
              style={{
                inset: `${-ring * 20}px`,
                borderColor: `rgba(226,54,54,${0.4 - ring * 0.1})`,
                borderWidth: ring === 1 ? '2px' : '1px',
                animation: `apo-orbit ${4 + ring * 2}s linear infinite${ring % 2 === 0 ? ' reverse' : ''}`
              }}
            />
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-white text-2xl font-bold tracking-wide animate-pulse">
            Carregando Biblioteca...
          </p>
          <p className="text-white/40 text-sm mt-2">Preparando sua experiência apoteótica</p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 🚀 COMPONENTE PRINCIPAL — YEAR 2300 APOTEOTIC
// ============================================

export const WebBookLibrary = memo(function WebBookLibrary({
  onBookSelect,
  externalCategory,
  className
}: WebBookLibraryProps) {
  const { books, isLoading, error, loadBooks } = useWebBookLibrary();
  const { categories: dbCategories } = useBookCategories();
  const [openBooks, setOpenBooks] = useState<Set<string>>(new Set());
  
  // Performance tier detection
  const { tier, isLowEnd } = useConstitutionPerformance();
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

  // Toggle book section
  const toggleBook = useCallback((bookId: string) => {
    setOpenBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  }, []);

  // Stats
  const stats = useMemo(() => {
    const inProgress = books.filter(b => (b.progress?.progressPercent || 0) > 0 && !b.progress?.isCompleted).length;
    const completed = books.filter(b => b.progress?.isCompleted).length;
    return { total: books.length, inProgress, completed };
  }, [books]);

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
      
      {/* Apoteotic Styles */}
      <style>{APOTEOTIC_STYLES}</style>

      <div className="relative z-10 p-3 md:p-4 lg:p-6">
        <div className="mx-auto max-w-[98vw] space-y-6">
          
          {/* Futuristic Header */}
          <FuturisticPageHeader
            title="Livros do Moisa"
            subtitle="Sua biblioteca digital exclusiva — Materiais completos para dominar a Química"
            icon={BookOpen}
            accentColor="primary"
            badge="EXCLUSIVO"
            stats={[
              { label: "Biblioteca", value: stats.total, icon: Library },
              { label: "Lendo", value: stats.inProgress, icon: Clock },
              { label: "Concluídos", value: stats.completed, icon: CheckCircle },
            ]}
          />

          {/* Stats Panel Mobile */}
          <div className="md:hidden">
            <StatsPanel
              totalBooks={stats.total}
              inProgress={stats.inProgress}
              completed={stats.completed}
            />
          </div>

          {/* 📚 BOOK SECTIONS — Each book is a cinematic section */}
          <div className="space-y-5">
            {books.map((book, index) => (
              <BookSection
                key={book.id}
                book={book}
                index={index}
                coverUrl={getCoverForBook(book)}
                onSelect={() => onBookSelect(book.id)}
                isHighEnd={isHighEnd}
                isOpen={openBooks.has(book.id)}
                onToggle={() => toggleBook(book.id)}
              />
            ))}
          </div>

          {/* Empty State */}
          {books.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div 
                className="w-32 h-32 rounded-3xl flex items-center justify-center border-2 border-[#E23636]/30 mb-6"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(226,54,54,0.15) 0%, rgba(180,30,30,0.1) 100%)',
                  boxShadow: '0 0 40px rgba(226,54,54,0.2)'
                }}
              >
                <Library className="w-16 h-16 text-[#E23636]/50" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Biblioteca Vazia</h3>
              <p className="text-white/50 text-center max-w-md">
                Ainda não há livros disponíveis na sua biblioteca. Aguarde novos materiais!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default WebBookLibrary;
