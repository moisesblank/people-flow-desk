// ============================================
// 🚀 CATEGORIA FILTER - IRON MAN HUD 2300
// Interface de Nave Espacial / Stark Industries
// Cinematográfico Ultra Premium
// ============================================

import { memo, useEffect, useState } from 'react';
import { Atom, FlaskConical, Hexagon, BookOpen, Globe } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  subtitle: string;
  colors: {
    main: string;
    dark: string;
    glow: string;
    neon: string;
    plasma: string;
    rgb: string;
  };
  icon: React.ElementType;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'quimica-geral',
    name: 'QUÍMICA',
    subtitle: 'GERAL',
    colors: {
      main: '#FF0040',
      dark: '#4A0012',
      glow: '#FF3366',
      neon: '#FF6B8A',
      plasma: '#FF99AA',
      rgb: '255, 0, 64',
    },
    icon: FlaskConical,
  },
  {
    id: 'quimica-organica',
    name: 'QUÍMICA',
    subtitle: 'ORGÂNICA',
    colors: {
      main: '#8B00FF',
      dark: '#2D004D',
      glow: '#A64DFF',
      neon: '#BF80FF',
      plasma: '#D9B3FF',
      rgb: '139, 0, 255',
    },
    icon: Hexagon,
  },
  {
    id: 'fisico-quimica',
    name: 'FÍSICO',
    subtitle: 'QUÍMICA',
    colors: {
      main: '#00FF88',
      dark: '#003D21',
      glow: '#33FF9F',
      neon: '#66FFB6',
      plasma: '#99FFCD',
      rgb: '0, 255, 136',
    },
    icon: Atom,
  },
  {
    id: 'revisao',
    name: 'REVISÃO',
    subtitle: 'INTENSIVA',
    colors: {
      main: '#00AAFF',
      dark: '#002D44',
      glow: '#33BBFF',
      neon: '#66CCFF',
      plasma: '#99DDFF',
      rgb: '0, 170, 255',
    },
    icon: BookOpen,
  },
  {
    id: 'previsao',
    name: 'PREVISÃO',
    subtitle: 'ESTRATÉGICA',
    colors: {
      main: '#FFD000',
      dark: '#443800',
      glow: '#FFD933',
      neon: '#FFE266',
      plasma: '#FFEB99',
      rgb: '255, 208, 0',
    },
    icon: Globe,
  },
];

interface FuturisticCategoryFilterProps {
  selectedCategory: string | null;
  onCategoryClick: (categoryId: string) => void;
}

export const FuturisticCategoryFilter = memo(function FuturisticCategoryFilter({
  selectedCategory,
  onCategoryClick,
}: FuturisticCategoryFilterProps) {
  return (
    <section className="relative mb-16 py-8">
      {/* ═══ COSMIC BACKGROUND ═══ */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        {/* Deep space */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
        
        {/* Nebula clouds */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px]" />
        
        {/* Star field */}
        <div className="stars-field absolute inset-0" />
      </div>

      {/* ═══ HUD FRAME ═══ */}
      <div className="absolute inset-4 border border-cyan-500/20 rounded-2xl pointer-events-none">
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      {/* ═══ SECTION TITLE ═══ */}
      <div className="relative text-center mb-8">
        <div className="inline-flex items-center gap-4">
          <div className="w-16 md:w-32 h-px bg-gradient-to-r from-transparent to-cyan-400" />
          <h2 className="text-xs md:text-sm font-mono tracking-[0.5em] text-cyan-400/80 uppercase">
            Selecione a Categoria
          </h2>
          <div className="w-16 md:w-32 h-px bg-gradient-to-l from-transparent to-cyan-400" />
        </div>
      </div>

      {/* ═══ CARDS GRID ═══ */}
      <div className="relative flex flex-col gap-6 md:gap-10 px-4">
        {/* Row 1: 3 cards */}
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {CATEGORIES.slice(0, 3).map((cat, i) => (
            <HolographicCard
              key={cat.id}
              category={cat}
              isActive={selectedCategory === cat.id}
              onClick={() => onCategoryClick(cat.id)}
              index={i}
            />
          ))}
        </div>
        
        {/* Row 2: 2 cards centered */}
        <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-[70%] mx-auto w-full">
          {CATEGORIES.slice(3, 5).map((cat, i) => (
            <HolographicCard
              key={cat.id}
              category={cat}
              isActive={selectedCategory === cat.id}
              onClick={() => onCategoryClick(cat.id)}
              index={i + 3}
            />
          ))}
        </div>
      </div>

      {/* ═══ GLOBAL STYLES ═══ */}
      <style>{`
        .stars-field {
          background-image: 
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 90px 40px, white, transparent),
            radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.9), transparent),
            radial-gradient(1px 1px at 230px 80px, white, transparent),
            radial-gradient(2px 2px at 300px 150px, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 350px 30px, white, transparent),
            radial-gradient(1px 1px at 400px 100px, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 450px 60px, white, transparent),
            radial-gradient(1px 1px at 500px 140px, rgba(255,255,255,0.6), transparent);
          background-size: 550px 200px;
          animation: stars-drift 60s linear infinite;
        }
        @keyframes stars-drift {
          from { background-position: 0 0; }
          to { background-position: 550px 200px; }
        }
        @keyframes plasma-flow {
          0%, 100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(180deg); }
        }
        @keyframes hologram-flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.6; }
          94% { opacity: 1; }
          97% { opacity: 0.8; }
          98% { opacity: 1; }
        }
        @keyframes energy-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes energy-ring-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes power-surge {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 0.8; transform: scaleY(1.5); }
        }
        @keyframes core-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.15); filter: brightness(1.3); }
        }
        @keyframes scan-beam {
          0% { transform: translateY(-200%) rotate(-5deg); }
          100% { transform: translateY(400%) rotate(-5deg); }
        }
        @keyframes circuit-trace {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
        .holo-card {
          transform-style: preserve-3d;
          perspective: 1500px;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .holo-card:hover {
          transform: translateY(-12px) rotateX(8deg) scale(1.02);
        }
        .holo-card:active {
          transform: translateY(-6px) scale(0.98);
        }
        .holo-card.active {
          transform: translateY(-8px) scale(1.03);
        }
      `}</style>
    </section>
  );
});

interface HolographicCardProps {
  category: CategoryItem;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

const HolographicCard = memo(function HolographicCard({
  category,
  isActive,
  onClick,
  index,
}: HolographicCardProps) {
  const Icon = category.icon;
  const { main, dark, glow, neon, plasma, rgb } = category.colors;
  
  return (
    <button
      onClick={onClick}
      className={`holo-card group relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer ${isActive ? 'active' : ''}`}
      style={{
        background: `linear-gradient(145deg, ${dark} 0%, #000000 50%, ${dark} 100%)`,
        boxShadow: isActive 
          ? `0 0 80px rgba(${rgb}, 0.6), 0 0 160px rgba(${rgb}, 0.3), 0 30px 60px rgba(0,0,0,0.8), inset 0 0 100px rgba(${rgb}, 0.15)` 
          : `0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(${rgb}, 0.1)`,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* ══════ LAYER 1: Holographic Base ══════ */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(${rgb}, 0.2) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 100%, rgba(${rgb}, 0.15) 0%, transparent 50%)
          `,
        }}
      />

      {/* ══════ LAYER 2: Circuit Pattern ══════ */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`circuit-grad-${category.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={glow} stopOpacity="0" />
            <stop offset="50%" stopColor={glow} stopOpacity="1" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Horizontal lines */}
        <path d="M0 50 L80 50 L90 60 L200 60" fill="none" stroke={`url(#circuit-grad-${category.id})`} strokeWidth="0.5" strokeDasharray="200" style={{ animation: isActive ? 'circuit-trace 3s linear infinite' : undefined }} />
        <path d="M0 150 L60 150 L70 140 L120 140 L130 150 L200 150" fill="none" stroke={`url(#circuit-grad-${category.id})`} strokeWidth="0.5" strokeDasharray="200" style={{ animation: isActive ? 'circuit-trace 4s linear infinite' : undefined }} />
        <path d="M0 250 L100 250 L110 240 L200 240" fill="none" stroke={`url(#circuit-grad-${category.id})`} strokeWidth="0.5" strokeDasharray="200" style={{ animation: isActive ? 'circuit-trace 3.5s linear infinite' : undefined }} />
        {/* Vertical lines */}
        <path d="M50 0 L50 100 L60 110 L60 200" fill="none" stroke={`url(#circuit-grad-${category.id})`} strokeWidth="0.5" strokeDasharray="200" style={{ animation: isActive ? 'circuit-trace 4s linear infinite' : undefined }} />
        <path d="M150 300 L150 200 L140 190 L140 100" fill="none" stroke={`url(#circuit-grad-${category.id})`} strokeWidth="0.5" strokeDasharray="200" style={{ animation: isActive ? 'circuit-trace 3.5s linear infinite' : undefined }} />
        {/* Connection nodes */}
        <circle cx="90" cy="60" r="3" fill={glow} opacity="0.8" />
        <circle cx="70" cy="140" r="3" fill={glow} opacity="0.8" />
        <circle cx="130" cy="150" r="3" fill={glow} opacity="0.8" />
        <circle cx="50" cy="100" r="3" fill={glow} opacity="0.8" />
        <circle cx="140" cy="190" r="3" fill={glow} opacity="0.8" />
      </svg>

      {/* ══════ LAYER 3: Premium Frame ══════ */}
      <div className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none">
        {/* Outer glow border */}
        <div 
          className="absolute inset-0 rounded-2xl md:rounded-3xl"
          style={{
            border: `3px solid ${main}`,
            boxShadow: `inset 0 0 30px rgba(${rgb}, 0.3), 0 0 20px rgba(${rgb}, 0.5)`,
            animation: isActive ? 'hologram-flicker 4s infinite' : undefined,
          }}
        />
        {/* Inner frame */}
        <div 
          className="absolute inset-2 rounded-xl md:rounded-2xl"
          style={{
            border: `1px solid rgba(${rgb}, 0.3)`,
          }}
        />
      </div>

      {/* ══════ LAYER 4: Corner Tech Brackets ══════ */}
      <CornerBracket position="top-left" color={neon} isActive={isActive} />
      <CornerBracket position="top-right" color={neon} isActive={isActive} />
      <CornerBracket position="bottom-left" color={neon} isActive={isActive} />
      <CornerBracket position="bottom-right" color={neon} isActive={isActive} />

      {/* ══════ LAYER 5: Energy Core ══════ */}
      <div className="absolute inset-0 flex items-center justify-center pb-16 md:pb-20">
        {/* Outer rotating ring */}
        <div 
          className="absolute w-24 h-24 md:w-36 md:h-36 lg:w-44 lg:h-44 rounded-full"
          style={{
            border: `2px solid ${glow}`,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            boxShadow: `0 0 30px rgba(${rgb}, 0.4)`,
            animation: isActive ? 'energy-ring 8s linear infinite' : undefined,
          }}
        />
        
        {/* Middle counter-rotating ring */}
        <div 
          className="absolute w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full"
          style={{
            border: `1px dashed ${neon}`,
            opacity: 0.6,
            animation: isActive ? 'energy-ring-reverse 12s linear infinite' : undefined,
          }}
        />

        {/* Inner pulsing core */}
        <div 
          className="absolute w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(${rgb}, 0.4) 0%, rgba(${rgb}, 0.1) 50%, transparent 70%)`,
            boxShadow: `0 0 60px rgba(${rgb}, 0.6), inset 0 0 40px rgba(${rgb}, 0.3)`,
            animation: isActive ? 'core-pulse 2s ease-in-out infinite' : undefined,
          }}
        />

        {/* Icon */}
        <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
          <Icon 
            className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16"
            strokeWidth={1}
            style={{
              color: plasma,
              filter: `drop-shadow(0 0 20px ${neon}) drop-shadow(0 0 40px ${glow}) drop-shadow(0 0 60px ${main})`,
            }}
          />
        </div>
      </div>

      {/* ══════ LAYER 6: Power Lines (Active) ══════ */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-[3px] rounded-full"
              style={{
                height: '40%',
                left: `${20 + i * 20}%`,
                bottom: 0,
                background: `linear-gradient(0deg, ${main}, transparent)`,
                boxShadow: `0 0 15px ${glow}`,
                animation: `power-surge ${1 + i * 0.2}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ══════ LAYER 7: Floating Particles ══════ */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${10 + i * 11}%`,
                bottom: '10%',
                backgroundColor: neon,
                boxShadow: `0 0 10px ${glow}`,
                animation: `float-particle ${2 + i * 0.3}s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ══════ LAYER 8: Scan Beam ══════ */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-x-0 h-1/4"
            style={{
              background: `linear-gradient(180deg, transparent, rgba(${rgb}, 0.2), transparent)`,
              animation: 'scan-beam 4s linear infinite',
            }}
          />
        </div>
      )}

      {/* ══════ LAYER 9: Bottom Panel ══════ */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        {/* Top separator */}
        <div 
          className="absolute inset-x-6 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${neon}, transparent)`,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />

        {/* Category name */}
        <div className="relative text-center pt-2">
          <h3 
            className="text-white text-sm sm:text-base md:text-xl lg:text-2xl font-black tracking-[0.3em] uppercase"
            style={{
              textShadow: `0 0 30px ${glow}, 0 0 60px ${main}, 0 2px 10px rgba(0,0,0,0.8)`,
              animation: isActive ? 'hologram-flicker 5s infinite' : undefined,
            }}
          >
            {category.name}
          </h3>
          <p 
            className="text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase mt-1"
            style={{
              color: neon,
              textShadow: `0 0 20px ${glow}`,
            }}
          >
            {category.subtitle}
          </p>
        </div>

        {/* Bottom progress bar */}
        <div className="mt-3 relative h-1 rounded-full overflow-hidden bg-white/10">
          <div 
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: isActive ? '100%' : '0%',
              background: `linear-gradient(90deg, ${main}, ${neon})`,
              boxShadow: `0 0 20px ${glow}`,
            }}
          />
        </div>
      </div>

      {/* ══════ LAYER 10: Status Indicator ══════ */}
      {isActive && (
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <span 
            className="text-[10px] font-mono tracking-wider uppercase"
            style={{ color: neon, textShadow: `0 0 10px ${glow}` }}
          >
            ACTIVE
          </span>
          <div 
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: main,
              boxShadow: `0 0 15px ${glow}, 0 0 30px ${main}`,
              animation: 'core-pulse 1s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* ══════ LAYER 11: Shine Effect ══════ */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.1) 50%, transparent 80%)',
        }}
      />
    </button>
  );
});

// ═══════════════════════════════════════
// Corner Bracket Component
// ═══════════════════════════════════════
const CornerBracket = memo(function CornerBracket({ 
  position, 
  color, 
  isActive 
}: { 
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; 
  color: string; 
  isActive: boolean;
}) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const lineStyles = {
    'top-left': {
      h: { top: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, ${color}, transparent)` },
      v: { top: 0, left: 0, width: 3, height: '100%', background: `linear-gradient(180deg, ${color}, transparent)` },
      dot: { top: 0, left: 0 },
    },
    'top-right': {
      h: { top: 0, right: 0, width: '100%', height: 3, background: `linear-gradient(-90deg, ${color}, transparent)` },
      v: { top: 0, right: 0, width: 3, height: '100%', background: `linear-gradient(180deg, ${color}, transparent)` },
      dot: { top: 0, right: 0 },
    },
    'bottom-left': {
      h: { bottom: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, ${color}, transparent)` },
      v: { bottom: 0, left: 0, width: 3, height: '100%', background: `linear-gradient(0deg, ${color}, transparent)` },
      dot: { bottom: 0, left: 0 },
    },
    'bottom-right': {
      h: { bottom: 0, right: 0, width: '100%', height: 3, background: `linear-gradient(-90deg, ${color}, transparent)` },
      v: { bottom: 0, right: 0, width: 3, height: '100%', background: `linear-gradient(0deg, ${color}, transparent)` },
      dot: { bottom: 0, right: 0 },
    },
  };

  const styles = lineStyles[position];

  return (
    <div className={`absolute w-8 h-8 md:w-12 md:h-12 ${positionClasses[position]}`}>
      <div className="absolute rounded-sm" style={{ ...styles.h as React.CSSProperties, boxShadow: `0 0 10px ${color}` }} />
      <div className="absolute rounded-sm" style={{ ...styles.v as React.CSSProperties, boxShadow: `0 0 10px ${color}` }} />
      {(position === 'top-left' || position === 'top-right') && (
        <div 
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{ 
            ...styles.dot as React.CSSProperties, 
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}, 0 0 30px ${color}`,
            animation: isActive ? 'core-pulse 2s ease-in-out infinite' : undefined,
          }}
        />
      )}
    </div>
  );
});

export default FuturisticCategoryFilter;
