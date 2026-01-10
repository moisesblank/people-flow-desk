// ============================================
// 📚 LIVROS DO MOISA — APOTEÓTICO ULTIMATE v30.0
// Netflix Ultra Premium + Year 2300 Cinematic
// Cada Livro = Uma EXPERIÊNCIA CINEMATOGRÁFICA
// Spider-Man Red (#E23636) + Holographic HUD
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
  GraduationCap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCategoryConfig, normalizeCategoryId } from './CategoryCover';
import { useBookCategories } from '@/hooks/useBookCategories';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { CyberBackground } from '@/components/ui/cyber-background';
import { FuturisticPageHeader } from '@/components/ui/futuristic-page-header';
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
// CSS KEYFRAMES — ULTIMATE CINEMATIC
// ============================================

const ULTIMATE_STYLES = `
  @keyframes ultimate-pulse {
    0%, 100% { 
      box-shadow: 0 0 60px rgba(226,54,54,0.4), 
                  inset 0 0 30px rgba(226,54,54,0.15),
                  0 0 120px rgba(226,54,54,0.2); 
    }
    50% { 
      box-shadow: 0 0 100px rgba(226,54,54,0.6), 
                  inset 0 0 50px rgba(226,54,54,0.25),
                  0 0 180px rgba(226,54,54,0.3); 
    }
  }
  
  @keyframes ultimate-float {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-12px) scale(1.02); }
  }
  
  @keyframes ultimate-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  
  @keyframes ultimate-glow-sweep {
    0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
    50% { opacity: 0.6; }
    100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
  }
  
  @keyframes ultimate-orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes ultimate-orbit-reverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }
  
  @keyframes ultimate-particle {
    0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
    50% { transform: translateY(-30px) translateX(20px) scale(1.5); opacity: 0.4; }
    100% { transform: translateY(-60px) translateX(-10px) scale(0.5); opacity: 0; }
  }
  
  @keyframes ultimate-scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  
  @keyframes ultimate-border-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes ultimate-hologram {
    0%, 100% { opacity: 0.7; filter: hue-rotate(0deg); }
    50% { opacity: 1; filter: hue-rotate(10deg); }
  }
  
  .ultimate-card {
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }
  
  .ultimate-card:hover {
    transform: translateY(-8px) scale(1.01);
  }
  
  .ultimate-cover {
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }
  
  .ultimate-cover:hover {
    transform: scale(1.08) rotateY(-5deg);
    box-shadow: 
      0 50px 100px rgba(226,54,54,0.5), 
      0 0 150px rgba(226,54,54,0.3),
      inset 0 0 60px rgba(255,255,255,0.1);
  }
  
  .ultimate-glow-sweep::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: ultimate-glow-sweep 3s ease-in-out infinite;
  }
  
  .perf-reduced .ultimate-pulse { animation: none !important; }
  .perf-reduced .ultimate-glow { display: none !important; }
  .perf-reduced .ultimate-orbit { animation: none !important; }
  .perf-reduced .ultimate-cover:hover { transform: scale(1.03); }
  .perf-reduced .ultimate-card:hover { transform: translateY(-4px); }
`;

// ============================================
// 🎯 HUD STAT ORB — ULTIMATE HOLOGRAPHIC
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
      "bg-gradient-to-br hover:scale-[1.05] hover:shadow-2xl",
      "cursor-default select-none overflow-hidden",
      color
    )}>
      {/* Holographic sweep effect */}
      {isHighEnd && <div className="ultimate-glow-sweep absolute inset-0 pointer-events-none" />}
      
      {/* Outer glow ring */}
      <div className={cn(
        "absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-50 blur-2xl transition-opacity duration-500 -z-10",
        glowColor || "bg-[#E23636]"
      )} />
      
      {/* Corner accents — Spider-Man style */}
      <div className="absolute top-0 left-0 w-6 h-6 border-l-3 border-t-3 border-current opacity-60 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-6 h-6 border-r-3 border-t-3 border-current opacity-60 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-3 border-b-3 border-current opacity-60 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-3 border-b-3 border-current opacity-60 rounded-br-xl" />
      
      <div className="relative z-10 flex items-center gap-4">
        {/* Icon container with intense pulse */}
        <div className="relative">
          {isHighEnd && (
            <div className="absolute inset-0 rounded-2xl bg-current opacity-30 blur-xl animate-pulse" />
          )}
          <div className="relative p-4 rounded-2xl bg-background/40 backdrop-blur-sm border-2 border-current/40 shadow-2xl">
            {icon}
          </div>
        </div>
        
        {/* Value and label */}
        <div>
          <p className="text-4xl md:text-5xl font-black tracking-tight tabular-nums drop-shadow-lg">
            {value.toLocaleString()}
          </p>
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] opacity-80">{label}</p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 📊 STATS PANEL — ULTIMATE HUD DASHBOARD
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
        icon={<Library className="h-7 w-7 md:h-8 md:w-8 text-[#E23636]" />}
        value={totalBooks}
        label="Biblioteca"
        color="from-[#E23636]/20 to-[#E23636]/5 border-[#E23636]/50 text-[#FF6B6B]"
        glowColor="bg-[#E23636]"
        isHighEnd={isHighEnd}
      />
      <HudStatOrb
        icon={<Flame className="h-7 w-7 md:h-8 md:w-8 text-amber-400" />}
        value={inProgress}
        label="Em Leitura"
        color="from-amber-500/20 to-amber-500/5 border-amber-500/50 text-amber-300"
        glowColor="bg-amber-500"
        isHighEnd={isHighEnd}
      />
      <HudStatOrb
        icon={<Crown className="h-7 w-7 md:h-8 md:w-8 text-emerald-400" />}
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
// 🎬 XP POWER BANNER — ULTIMATE MOTIVATIONAL
// ============================================

const XPPowerBanner = memo(function XPPowerBanner({ isHighEnd }: { isHighEnd: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#E23636]/40">
      {/* Background with cinematic gradient */}
      <div className="dashboard-hero-2300 p-6 md:p-8">
        {/* Orbital rings */}
        {isHighEnd && (
          <div className="absolute top-0 right-0 w-[400px] h-[400px] -translate-y-1/2 translate-x-1/2 pointer-events-none">
            <div 
              className="absolute inset-0 rounded-full border border-[#E23636]/20"
              style={{ animation: 'ultimate-orbit 20s linear infinite' }}
            />
            <div 
              className="absolute inset-8 rounded-full border border-[#E23636]/15"
              style={{ animation: 'ultimate-orbit-reverse 15s linear infinite' }}
            />
            <div 
              className="absolute inset-16 rounded-full border border-[#E23636]/10"
              style={{ animation: 'ultimate-orbit 25s linear infinite' }}
            />
          </div>
        )}
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Power Icon */}
          <div className="relative">
            {isHighEnd && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#E23636] to-amber-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
            )}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-[#E23636] via-red-500 to-amber-500 flex items-center justify-center shadow-2xl border-2 border-white/20">
              <BookMarked className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
            </div>
          </div>
          
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight">
              Biblioteca <span className="text-[#E23636]">Premium</span> do MOISA
            </h3>
            <p className="text-white/70 text-sm md:text-base max-w-2xl">
              Acesso exclusivo aos materiais mais completos para sua aprovação. 
              <span className="text-[#FF6B6B] font-semibold"> Cada página lida te aproxima do seu sonho!</span>
            </p>
          </div>
          
          {/* Stats Badges */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-amber-400 mb-1" />
              <span className="text-2xl font-black text-white">+XP</span>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">Por Livro</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Award className="w-6 h-6 text-emerald-400 mb-1" />
              <span className="text-2xl font-black text-white">100%</span>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">Exclusivo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 📚 BOOK SECTION — ULTIMATE CINEMATIC CARD
// CADA LIVRO É UMA EXPERIÊNCIA CINEMATOGRÁFICA
// ============================================

interface BookSectionProps {
  book: WebBookListItem;
  index: number;
  coverUrl: string | null;
  onSelect: () => void;
  isHighEnd: boolean;
  isOpen: boolean;
  onToggle: () => void;
  totalBooks: number;
}

const BookSection = memo(function BookSection({
  book,
  index,
  coverUrl,
  onSelect,
  isHighEnd,
  isOpen,
  onToggle,
  totalBooks
}: BookSectionProps) {
  const progress = book.progress?.progressPercent || 0;
  const isCompleted = book.progress?.isCompleted || false;
  const hasStarted = progress > 0;
  const coverImage = book.coverUrl || coverUrl || getCategoryConfig(book.category)?.cover;

  // Status configuration with intense colors
  const statusConfig = isCompleted 
    ? { 
        color: 'emerald', 
        icon: Crown, 
        label: 'DOMINADO', 
        glow: 'rgba(16,185,129,0.6)',
        gradient: 'from-emerald-500 to-green-600',
        borderColor: 'border-emerald-500/60'
      }
    : hasStarted 
      ? { 
          color: 'amber', 
          icon: Flame, 
          label: `${progress.toFixed(0)}% LIDO`, 
          glow: 'rgba(245,158,11,0.6)',
          gradient: 'from-amber-500 to-orange-600',
          borderColor: 'border-amber-500/60'
        }
      : { 
          color: 'primary', 
          icon: Sparkles, 
          label: 'NOVO', 
          glow: 'rgba(226,54,54,0.6)',
          gradient: 'from-[#E23636] to-red-600',
          borderColor: 'border-[#E23636]/60'
        };

  const StatusIcon = statusConfig.icon;

  return (
    <div 
      className="ultimate-card animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        {/* 🎬 SECTION HEADER — ULTIMATE CINEMATIC */}
        <CollapsibleTrigger asChild>
          <div className={cn(
            "group relative cursor-pointer overflow-hidden",
            "rounded-3xl border-2 transition-all duration-700",
            "bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#0a0e17]",
            isOpen 
              ? "border-[#E23636]/80 shadow-[0_0_60px_rgba(226,54,54,0.3)]" 
              : "border-[#E23636]/30 hover:border-[#E23636]/70 hover:shadow-[0_0_40px_rgba(226,54,54,0.2)]"
          )}>
            
            {/* 🌟 Background Effects Layer */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Gradient sweep on hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                "bg-gradient-to-r from-[#E23636]/10 via-[#E23636]/20 to-[#E23636]/10"
              )} />
              
              {/* Scanlines (High-End) */}
              {isHighEnd && (
                <div 
                  className="absolute inset-0 opacity-[0.02]"
                  style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`
                  }}
                />
              )}
            </div>

            {/* 🕸️ Spider-Man Corner Accents — INTENSE */}
            <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full border-l-4 border-t-4 border-[#E23636]/60 rounded-tl-3xl group-hover:border-[#E23636] transition-colors duration-500" />
              <div className="absolute top-2 left-2 w-[calc(100%-8px)] h-[calc(100%-8px)] border-l-2 border-t-2 border-[#E23636]/30 rounded-tl-2xl" />
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none">
              <div className="absolute top-0 right-0 w-full h-full border-r-4 border-t-4 border-[#E23636]/40 rounded-tr-3xl group-hover:border-[#E23636] transition-colors duration-500" />
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none">
              <div className="absolute bottom-0 left-0 w-full h-full border-l-4 border-b-4 border-[#E23636]/40 rounded-bl-3xl group-hover:border-[#E23636] transition-colors duration-500" />
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none">
              <div className="absolute bottom-0 right-0 w-full h-full border-r-4 border-b-4 border-[#E23636]/60 rounded-br-3xl group-hover:border-[#E23636] transition-colors duration-500" />
              <div className="absolute bottom-2 right-2 w-[calc(100%-8px)] h-[calc(100%-8px)] border-r-2 border-b-2 border-[#E23636]/30 rounded-br-2xl" />
            </div>

            {/* 🔥 Ambient Glow Effect */}
            {isHighEnd && (
              <div 
                className="ultimate-glow absolute -inset-8 rounded-[50px] -z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  background: `radial-gradient(ellipse at center, ${statusConfig.glow} 0%, transparent 70%)`,
                  filter: 'blur(50px)'
                }}
              />
            )}

            {/* 📦 MAIN CONTENT */}
            <div className="relative flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8 p-6 md:p-8 lg:p-10">
              
              {/* 📘 BOOK NUMBER — Orbital Badge */}
              <div className="hidden lg:flex flex-col items-center justify-center">
                <div 
                  className="relative w-24 h-24 rounded-3xl flex items-center justify-center border-3 overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(226,54,54,0.4) 0%, rgba(180,30,30,0.2) 100%)',
                    borderColor: 'rgba(226,54,54,0.6)',
                    boxShadow: isHighEnd 
                      ? '0 0 50px rgba(226,54,54,0.4), inset 0 0 30px rgba(226,54,54,0.2)'
                      : '0 0 30px rgba(226,54,54,0.3)'
                  }}
                >
                  {/* Orbital rings */}
                  {isHighEnd && [1, 2].map((ring) => (
                    <div 
                      key={ring}
                      className="absolute rounded-3xl border pointer-events-none"
                      style={{
                        inset: `${-ring * 8}px`,
                        borderColor: `rgba(226,54,54,${0.3 - ring * 0.1})`,
                        animation: `ultimate-orbit ${8 + ring * 4}s linear infinite${ring % 2 === 0 ? ' reverse' : ''}`
                      }}
                    />
                  ))}
                  <span className="text-5xl font-black text-[#E23636] drop-shadow-2xl relative z-10">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] text-white/50 mt-3 uppercase tracking-[0.3em] font-bold">
                  LIVRO {index + 1}/{totalBooks}
                </span>
              </div>

              {/* 📚 BOOK COVER — ULTRA CINEMATIC */}
              <div className="relative flex-shrink-0 self-center lg:self-start">
                <div 
                  className={cn(
                    "ultimate-cover relative rounded-2xl overflow-hidden border-3",
                    statusConfig.borderColor
                  )}
                  style={{ 
                    width: 'clamp(180px, 25vw, 240px)',
                    height: 'clamp(250px, 35vw, 340px)',
                    boxShadow: isHighEnd
                      ? `0 20px 60px rgba(0,0,0,0.6), 0 0 50px ${statusConfig.glow}`
                      : '0 15px 40px rgba(0,0,0,0.5)'
                  }}
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
                      <BookOpen className="w-16 h-16 text-[#E23636]/40" />
                    </div>
                  )}
                  
                  {/* Cover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Status Badge — INTENSE */}
                  <div 
                    className={cn(
                      "absolute top-4 left-4 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black text-white border-2 backdrop-blur-sm",
                      `bg-gradient-to-r ${statusConfig.gradient}`
                    )}
                    style={{
                      borderColor: 'rgba(255,255,255,0.3)',
                      boxShadow: `0 0 25px ${statusConfig.glow}`
                    }}
                  >
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </div>
                  
                  {/* Mobile book number */}
                  <div className="lg:hidden absolute bottom-4 right-4 w-12 h-12 rounded-xl bg-[#E23636]/90 border-2 border-white/30 flex items-center justify-center">
                    <span className="text-xl font-black text-white">{index + 1}</span>
                  </div>

                  {/* Holographic overlay (High-End) */}
                  {isHighEnd && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-30"
                      style={{
                        background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                        backgroundSize: '200% 200%',
                        animation: 'ultimate-shimmer 3s ease-in-out infinite'
                      }}
                    />
                  )}
                </div>
              </div>

              {/* 📋 BOOK INFO — Year 2300 Typography */}
              <div className="flex-1 min-w-0 flex flex-col justify-center text-center lg:text-left">
                {/* Title */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight mb-4 group-hover:text-[#FF6B6B] transition-colors duration-500">
                  {book.title}
                </h2>

                {/* Subtitle / Description */}
                {book.subtitle && (
                  <p className="text-white/60 text-sm md:text-base lg:text-lg mb-5 line-clamp-2">
                    {book.subtitle}
                  </p>
                )}

                {/* Meta Stats — HUD Style */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4 mb-5">
                  {book.totalPages > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <FileText className="w-5 h-5 text-[#E23636]" />
                      <span className="text-base font-black text-white">{book.totalPages}</span>
                      <span className="text-xs text-white/50 uppercase tracking-wider">páginas</span>
                    </div>
                  )}
                  {book.viewCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <Eye className="w-5 h-5 text-cyan-400" />
                      <span className="text-base font-black text-white">{book.viewCount}</span>
                      <span className="text-xs text-white/50 uppercase tracking-wider">views</span>
                    </div>
                  )}
                  {book.author && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <GraduationCap className="w-5 h-5 text-amber-400" />
                      <span className="text-sm text-white/80">{book.author}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar (if reading) — INTENSE */}
                {hasStarted && !isCompleted && (
                  <div className="max-w-xl mx-auto lg:mx-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/50 uppercase tracking-[0.2em] font-bold">Progresso de Leitura</span>
                      <span className="text-sm font-black text-[#E23636]">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden border border-white/5">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 relative"
                        style={{ 
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #E23636 0%, #FF6B6B 40%, #FFB347 70%, #E23636 100%)',
                          backgroundSize: '200% 100%',
                          animation: isHighEnd ? 'ultimate-shimmer 2s ease-in-out infinite' : undefined,
                          boxShadow: '0 0 30px rgba(226,54,54,0.7)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 🎮 EXPAND INDICATOR */}
              <div className="flex flex-row lg:flex-col items-center justify-center gap-4">
                <div 
                  className={cn(
                    "w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                    isOpen 
                      ? "bg-[#E23636]/40 border-[#E23636]/80 shadow-[0_0_30px_rgba(226,54,54,0.4)]" 
                      : "bg-white/5 border-white/20 group-hover:bg-[#E23636]/30 group-hover:border-[#E23636]/60"
                  )}
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                >
                  <ChevronDown className={cn(
                    "w-8 h-8 transition-colors", 
                    isOpen ? "text-white" : "text-white/60"
                  )} />
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
                  {isOpen ? 'FECHAR' : 'DETALHES'}
                </span>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* 🎬 EXPANDED CONTENT — ULTIMATE PANEL */}
        <CollapsibleContent>
          <div 
            className="mt-4 p-6 md:p-8 rounded-2xl border-2 border-[#E23636]/40 overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(226,54,54,0.08) 0%, rgba(10,14,20,0.95) 100%)'
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-[#E23636]/50 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-[#E23636]/50 rounded-tr-xl" />
            
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              {/* CTA Button — POWER */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className={cn(
                  "group/btn relative px-10 py-6 rounded-2xl text-xl font-black text-white overflow-hidden",
                  "bg-gradient-to-r from-[#E23636] via-red-500 to-[#E23636]",
                  "border-2 border-white/20 shadow-2xl",
                  "hover:shadow-[0_0_50px_rgba(226,54,54,0.6)] transition-all duration-500"
                )}
                style={{
                  backgroundSize: '200% 100%',
                  animation: isHighEnd ? 'ultimate-border-flow 3s ease infinite' : undefined
                }}
              >
                <div className="relative z-10 flex items-center gap-3">
                  <Play className="w-7 h-7 fill-current" />
                  <span>{hasStarted ? 'CONTINUAR LEITURA' : 'INICIAR LEITURA'}</span>
                </div>
                {/* Button glow effect */}
                {isHighEnd && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                )}
              </Button>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <Zap className="w-6 h-6 text-amber-400 mb-1" />
                  <span className="text-lg font-black text-white">+50 XP</span>
                  <span className="text-[10px] text-white/50 uppercase">Leitura</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <Target className="w-6 h-6 text-emerald-400 mb-1" />
                  <span className="text-lg font-black text-white">~{Math.ceil((book.totalPages || 100) / 20)}h</span>
                  <span className="text-[10px] text-white/50 uppercase">Estimado</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <TrendingUp className="w-6 h-6 text-[#E23636] mb-1" />
                  <span className="text-lg font-black text-white">{book.category || 'Geral'}</span>
                  <span className="text-[10px] text-white/50 uppercase">Categoria</span>
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
// 🔄 LOADING STATE — ULTIMATE ORBITAL
// ============================================

const UltimateLoadingState = memo(function UltimateLoadingState({ isHighEnd }: { isHighEnd: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="relative">
        {/* Central orb */}
        <div 
          className="w-24 h-24 rounded-3xl flex items-center justify-center border-3 border-[#E23636]/60"
          style={{
            background: 'linear-gradient(135deg, rgba(226,54,54,0.3) 0%, rgba(180,30,30,0.15) 100%)',
            boxShadow: '0 0 60px rgba(226,54,54,0.4), inset 0 0 30px rgba(226,54,54,0.2)',
            animation: 'ultimate-pulse 2s ease-in-out infinite'
          }}
        >
          <Library className="w-12 h-12 text-[#E23636]" />
        </div>

        {/* Orbital Rings */}
        {isHighEnd && [1, 2, 3].map((ring) => (
          <div 
            key={ring}
            className="absolute rounded-full border pointer-events-none"
            style={{
              inset: `${-ring * 25}px`,
              borderColor: `rgba(226,54,54,${0.5 - ring * 0.12})`,
              borderWidth: ring === 1 ? '3px' : '2px',
              borderStyle: ring === 2 ? 'dashed' : 'solid',
              animation: `ultimate-orbit ${5 + ring * 3}s linear infinite${ring % 2 === 0 ? ' reverse' : ''}`
            }}
          />
        ))}

        {/* Floating particles */}
        {isHighEnd && [0, 1, 2].map((i) => (
          <div 
            key={i}
            className="absolute w-3 h-3 rounded-full bg-[#E23636]"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 120}deg) translateX(60px)`,
              boxShadow: '0 0 15px rgba(226,54,54,0.8)',
              animation: `ultimate-particle 2s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`
            }}
          />
        ))}
      </div>
      
      <div className="mt-10 text-center">
        <p className="text-2xl font-black text-white tracking-tight mb-2">Carregando Biblioteca</p>
        <p className="text-white/50 text-sm uppercase tracking-[0.3em]">Preparando Experiência Premium</p>
      </div>
    </div>
  );
});

// ============================================
// 📚 MAIN COMPONENT — ULTIMATE LIBRARY
// ============================================

function WebBookLibraryComponent({
  onBookSelect,
  externalCategory,
  className
}: WebBookLibraryProps) {
  const { books, isLoading, error } = useWebBookLibrary();
  const { categories: dbCategories } = useBookCategories();
  const [openBooks, setOpenBooks] = useState<Set<string>>(new Set());
  
  // Performance tier detection
  const { tier, isLowEnd, shouldShowParticles } = useConstitutionPerformance();
  const isHighEnd = tier === 'quantum' || tier === 'neural' || tier === 'enhanced';

  // Category cover map
  const categoryCoverMap = useMemo(() => {
    const map: Record<string, string> = {};
    dbCategories?.forEach(cat => {
      if (cat.cover_url) {
        map[cat.id] = cat.cover_url;
        if (cat.name) map[cat.name.toLowerCase()] = cat.cover_url;
      }
    });
    return map;
  }, [dbCategories]);

  // Book stats
  const stats = useMemo(() => {
    if (!books) return { total: 0, inProgress: 0, completed: 0 };
    return {
      total: books.length,
      inProgress: books.filter(b => (b.progress?.progressPercent || 0) > 0 && !b.progress?.isCompleted).length,
      completed: books.filter(b => b.progress?.isCompleted).length
    };
  }, [books]);

  // Toggle book open/close
  const handleToggleBook = useCallback((bookId: string) => {
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

  // Get cover for book
  const getCoverUrl = useCallback((book: WebBookListItem) => {
    if (book.coverUrl) return book.coverUrl;
    if (book.category) {
      const normalizedCat = normalizeCategoryId(book.category);
      return categoryCoverMap[normalizedCat] || categoryCoverMap[book.category.toLowerCase()] || null;
    }
    return null;
  }, [categoryCoverMap]);

  return (
    <div className={cn("relative min-h-screen", !isHighEnd && "perf-reduced", className)}>
      {/* 🎨 Inject Ultimate Styles */}
      <style dangerouslySetInnerHTML={{ __html: ULTIMATE_STYLES }} />
      
      {/* 🌌 Cinematic Background */}
      {shouldShowParticles && <CyberBackground variant="grid" intensity={isLowEnd ? "low" : "medium"} />}
      
      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          
          {/* 🎬 Futuristic Header */}
          <FuturisticPageHeader
            title="Livros do MOISA"
            subtitle="Biblioteca Premium • Materiais Exclusivos para sua Aprovação"
            icon={BookOpen}
            badge="EXCLUSIVO"
            accentColor="primary"
          />

          {/* ⚡ XP Power Banner */}
          <XPPowerBanner isHighEnd={isHighEnd} />

          {/* 📊 Stats Panel */}
          <StatsPanel 
            totalBooks={stats.total}
            inProgress={stats.inProgress}
            completed={stats.completed}
            isHighEnd={isHighEnd}
          />

          {/* 📚 Books List — Each book is a cinematic section */}
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-4">
              <div className="h-1 flex-1 bg-gradient-to-r from-[#E23636]/60 via-[#E23636]/20 to-transparent rounded-full" />
              <h3 className="text-lg font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <Star className="w-5 h-5 text-[#E23636]" />
                SUA BIBLIOTECA
                <Star className="w-5 h-5 text-[#E23636]" />
              </h3>
              <div className="h-1 flex-1 bg-gradient-to-l from-[#E23636]/60 via-[#E23636]/20 to-transparent rounded-full" />
            </div>

            {isLoading ? (
              <UltimateLoadingState isHighEnd={isHighEnd} />
            ) : books && books.length > 0 ? (
              books.map((book, index) => (
                <BookSection
                  key={book.id}
                  book={book}
                  index={index}
                  coverUrl={getCoverUrl(book)}
                  onSelect={() => onBookSelect(book.id)}
                  isHighEnd={isHighEnd}
                  isOpen={openBooks.has(book.id)}
                  onToggle={() => handleToggleBook(book.id)}
                  totalBooks={books.length}
                />
              ))
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-24">
                <div 
                  className="w-32 h-32 rounded-3xl flex items-center justify-center border-3 border-[#E23636]/40 mb-8"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(226,54,54,0.2) 0%, rgba(180,30,30,0.1) 100%)',
                    boxShadow: '0 0 60px rgba(226,54,54,0.3)'
                  }}
                >
                  <Library className="w-16 h-16 text-[#E23636]/60" />
                </div>
                <h3 className="text-3xl font-black text-white mb-3">Biblioteca Vazia</h3>
                <p className="text-white/50 text-center max-w-md text-lg">
                  Ainda não há livros disponíveis na sua biblioteca. Aguarde novos materiais!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const WebBookLibrary = memo(WebBookLibraryComponent);
WebBookLibrary.displayName = 'WebBookLibrary';

export default WebBookLibrary;
