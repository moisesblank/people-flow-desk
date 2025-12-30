// ============================================
// 🎬 CATEGORIA FILTER - CINEMATOGRÁFICO 2300
// Estilo Marvel/Avengers Opening
// Ultra Premium Design System
// ============================================

import { memo } from 'react';
import { Atom, FlaskConical, Hexagon, BookOpen, Globe } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  subtitle: string;
  colorScheme: {
    primary: string;
    secondary: string;
    glow: string;
    neon: string;
    rgb: string;
  };
  icon: React.ElementType;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'quimica-geral',
    name: 'QUÍMICA',
    subtitle: 'GERAL',
    colorScheme: {
      primary: '#DC2626',
      secondary: '#7F1D1D',
      glow: '#EF4444',
      neon: '#FF6B6B',
      rgb: '220, 38, 38',
    },
    icon: FlaskConical,
  },
  {
    id: 'quimica-organica',
    name: 'QUÍMICA',
    subtitle: 'ORGÂNICA',
    colorScheme: {
      primary: '#7C3AED',
      secondary: '#4C1D95',
      glow: '#8B5CF6',
      neon: '#A78BFA',
      rgb: '139, 92, 246',
    },
    icon: Hexagon,
  },
  {
    id: 'fisico-quimica',
    name: 'FÍSICO',
    subtitle: 'QUÍMICA',
    colorScheme: {
      primary: '#059669',
      secondary: '#064E3B',
      glow: '#10B981',
      neon: '#34D399',
      rgb: '16, 185, 129',
    },
    icon: Atom,
  },
  {
    id: 'revisao',
    name: 'REVISÃO',
    subtitle: 'INTENSIVA',
    colorScheme: {
      primary: '#2563EB',
      secondary: '#1E3A8A',
      glow: '#3B82F6',
      neon: '#60A5FA',
      rgb: '59, 130, 246',
    },
    icon: BookOpen,
  },
  {
    id: 'previsao',
    name: 'PREVISÃO',
    subtitle: 'ESTRATÉGICA',
    colorScheme: {
      primary: '#D97706',
      secondary: '#78350F',
      glow: '#F59E0B',
      neon: '#FBBF24',
      rgb: '245, 158, 11',
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
    <section className="mb-12 relative">
      {/* Ambient glow background */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-30">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-red-500 rounded-full mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-emerald-500 rounded-full mix-blend-screen" />
      </div>

      {/* Grid Layout */}
      <div className="flex flex-col gap-5 md:gap-8">
        {/* Row 1: 3 cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {CATEGORIES.slice(0, 3).map((cat) => (
            <CinematicCard
              key={cat.id}
              category={cat}
              isActive={selectedCategory === cat.id}
              onClick={() => onCategoryClick(cat.id)}
            />
          ))}
        </div>
        
        {/* Row 2: 2 cards centered */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-[68%] mx-auto w-full">
          {CATEGORIES.slice(3, 5).map((cat) => (
            <CinematicCard
              key={cat.id}
              category={cat}
              isActive={selectedCategory === cat.id}
              onClick={() => onCategoryClick(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Inline Styles for animations */}
      <style>{`
        @keyframes energy-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes neon-flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.8; }
          94% { opacity: 1; }
          96% { opacity: 0.9; }
          97% { opacity: 1; }
        }
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes circuit-flow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes core-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes data-stream {
          0% { transform: translateY(100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
        .cinematic-card {
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .cinematic-card:hover {
          transform: translateY(-8px) rotateX(5deg);
        }
        .cinematic-card:active {
          transform: translateY(-4px) scale(0.98);
        }
      `}</style>
    </section>
  );
});

interface CinematicCardProps {
  category: CategoryItem;
  isActive: boolean;
  onClick: () => void;
}

const CinematicCard = memo(function CinematicCard({
  category,
  isActive,
  onClick,
}: CinematicCardProps) {
  const Icon = category.icon;
  const { primary, secondary, glow, neon, rgb } = category.colorScheme;
  
  return (
    <button
      onClick={onClick}
      className="cinematic-card group relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${secondary} 0%, ${primary} 50%, ${secondary} 100%)`,
        boxShadow: isActive 
          ? `0 0 60px rgba(${rgb}, 0.8), 0 0 120px rgba(${rgb}, 0.4), inset 0 0 60px rgba(${rgb}, 0.3)` 
          : `0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(${rgb}, 0.2)`,
      }}
    >
      {/* === LAYER 1: Base Dark Overlay === */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90" />

      {/* === LAYER 2: Tech Grid Pattern === */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 50px 50px, 10px 10px, 10px 10px',
        }}
      />

      {/* === LAYER 3: Hexagon Pattern === */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`hex-${category.id}`} width="20" height="23" patternUnits="userSpaceOnUse">
            <path 
              d="M10 0 L20 5.77 L20 17.32 L10 23.09 L0 17.32 L0 5.77 Z" 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#hex-${category.id})`} />
      </svg>

      {/* === LAYER 4: Metallic Frame === */}
      <div 
        className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none"
        style={{
          border: `2px solid ${glow}`,
          boxShadow: `inset 0 0 20px rgba(${rgb}, 0.3)`,
        }}
      />
      <div 
        className="absolute inset-[4px] rounded-xl md:rounded-2xl pointer-events-none"
        style={{
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      />

      {/* === LAYER 5: Corner Brackets === */}
      {/* Top Left */}
      <div className="absolute top-3 left-3 w-8 h-8 md:w-12 md:h-12">
        <div 
          className="absolute top-0 left-0 w-full h-[3px] rounded-full"
          style={{ background: `linear-gradient(90deg, ${neon}, transparent)` }}
        />
        <div 
          className="absolute top-0 left-0 w-[3px] h-full rounded-full"
          style={{ background: `linear-gradient(180deg, ${neon}, transparent)` }}
        />
        <div 
          className="absolute top-1 left-1 w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: neon,
            boxShadow: `0 0 10px ${neon}, 0 0 20px ${neon}`,
            animation: isActive ? 'neon-flicker 3s infinite' : undefined,
          }}
        />
      </div>
      {/* Top Right */}
      <div className="absolute top-3 right-3 w-8 h-8 md:w-12 md:h-12">
        <div 
          className="absolute top-0 right-0 w-full h-[3px] rounded-full"
          style={{ background: `linear-gradient(-90deg, ${neon}, transparent)` }}
        />
        <div 
          className="absolute top-0 right-0 w-[3px] h-full rounded-full"
          style={{ background: `linear-gradient(180deg, ${neon}, transparent)` }}
        />
        <div 
          className="absolute top-1 right-1 w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: neon,
            boxShadow: `0 0 10px ${neon}, 0 0 20px ${neon}`,
            animation: isActive ? 'neon-flicker 3s infinite 0.5s' : undefined,
          }}
        />
      </div>
      {/* Bottom Left */}
      <div className="absolute bottom-3 left-3 w-8 h-8 md:w-12 md:h-12">
        <div 
          className="absolute bottom-0 left-0 w-full h-[3px] rounded-full"
          style={{ background: `linear-gradient(90deg, ${neon}, transparent)` }}
        />
        <div 
          className="absolute bottom-0 left-0 w-[3px] h-full rounded-full"
          style={{ background: `linear-gradient(0deg, ${neon}, transparent)` }}
        />
      </div>
      {/* Bottom Right */}
      <div className="absolute bottom-3 right-3 w-8 h-8 md:w-12 md:h-12">
        <div 
          className="absolute bottom-0 right-0 w-full h-[3px] rounded-full"
          style={{ background: `linear-gradient(-90deg, ${neon}, transparent)` }}
        />
        <div 
          className="absolute bottom-0 right-0 w-[3px] h-full rounded-full"
          style={{ background: `linear-gradient(0deg, ${neon}, transparent)` }}
        />
      </div>

      {/* === LAYER 6: Energy Core with Icon === */}
      <div className="absolute inset-0 flex items-center justify-center pb-12 md:pb-16">
        {/* Outer rotating ring */}
        <div 
          className="absolute w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full opacity-30"
          style={{
            border: `2px dashed ${glow}`,
            animation: isActive ? 'core-rotate 20s linear infinite' : undefined,
          }}
        />
        
        {/* Middle pulsing ring */}
        <div 
          className="absolute w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full"
          style={{
            border: `1px solid ${glow}`,
            boxShadow: `0 0 30px rgba(${rgb}, 0.5), inset 0 0 30px rgba(${rgb}, 0.3)`,
            animation: isActive ? 'energy-pulse 2s ease-in-out infinite' : undefined,
          }}
        />

        {/* Icon container */}
        <div 
          className="relative p-4 md:p-6 lg:p-8 rounded-2xl transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `radial-gradient(circle, rgba(${rgb}, 0.4) 0%, transparent 70%)`,
          }}
        >
          {/* Icon glow */}
          <div 
            className="absolute inset-0 rounded-2xl blur-xl"
            style={{
              background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
              opacity: isActive ? 0.8 : 0.4,
            }}
          />
          
          <Icon 
            className="relative w-10 h-10 md:w-14 md:h-14 lg:w-20 lg:h-20 transition-all duration-300"
            strokeWidth={1.2}
            style={{
              color: 'white',
              filter: `drop-shadow(0 0 15px ${neon}) drop-shadow(0 0 30px ${glow})`,
            }}
          />
        </div>
      </div>

      {/* === LAYER 7: Data Stream Lines (active only) === */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-[2px] h-8"
              style={{
                left: `${15 + i * 14}%`,
                background: `linear-gradient(180deg, transparent, ${neon}, transparent)`,
                animation: `data-stream ${1.5 + i * 0.2}s linear infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* === LAYER 8: Scan Line Effect === */}
      {isActive && (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div 
            className="absolute inset-x-0 h-[30%]"
            style={{
              background: `linear-gradient(180deg, transparent 0%, rgba(${rgb}, 0.15) 50%, transparent 100%)`,
              animation: 'scan-line 3s linear infinite',
            }}
          />
        </div>
      )}

      {/* === LAYER 9: Bottom Info Panel === */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        {/* Holographic bar */}
        <div 
          className="absolute inset-x-4 top-0 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${neon}, transparent)`,
          }}
        />

        {/* Text */}
        <div className="relative text-center">
          <h3 
            className="text-white text-xs sm:text-sm md:text-lg lg:text-xl font-black tracking-[0.25em] uppercase"
            style={{
              textShadow: `0 0 20px ${glow}, 0 0 40px ${glow}`,
            }}
          >
            {category.name}
          </h3>
          <p 
            className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mt-0.5 md:mt-1"
            style={{
              color: neon,
              textShadow: `0 0 10px ${glow}`,
            }}
          >
            {category.subtitle}
          </p>
        </div>

        {/* Bottom decorative line */}
        <div 
          className="mt-3 mx-auto h-[2px] rounded-full transition-all duration-500"
          style={{
            width: isActive ? '100%' : '50%',
            background: `linear-gradient(90deg, transparent, ${neon}, transparent)`,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />
      </div>

      {/* === LAYER 10: Selection Indicator === */}
      {isActive && (
        <div className="absolute top-4 right-4 md:top-5 md:right-5 flex items-center gap-2">
          <div 
            className="w-3 h-3 md:w-4 md:h-4 rounded-full"
            style={{
              backgroundColor: neon,
              boxShadow: `0 0 15px ${neon}, 0 0 30px ${glow}`,
              animation: 'energy-pulse 1s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* === LAYER 11: Hover Shine Effect === */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
        }}
      />
    </button>
  );
});

export default FuturisticCategoryFilter;
