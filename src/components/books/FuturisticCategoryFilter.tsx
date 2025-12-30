// ============================================
// 🚀 STARK INDUSTRIES COMMAND CENTER v5.0
// Iron Man JARVIS / Year 2300 HUD Interface
// Cinematográfico Ultra Premium — Marvel Studios Level
// Usa imagens unificadas do useBookCategories (banco)
// ============================================

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Atom, FlaskConical, Flame, RefreshCw, Eye } from 'lucide-react';
import { useBookCategories, type CategoryWithFallback } from '@/hooks/useBookCategories';

// ============================================
// CORES E METADADOS VISUAIS POR CATEGORIA
// (Usados para efeitos HUD, não para imagens)
// ============================================
interface CategoryVisualConfig {
  id: string;
  subtitle: string;
  systemCode: string;
  powerLevel: number;
  statusText: string;
  colors: {
    hue: number;
    hue2: number;
    main: string;
    glow: string;
    neon: string;
    rgb: string;
  };
  icon: React.ElementType;
}

const CATEGORY_VISUALS: Record<string, CategoryVisualConfig> = {
  'quimica-geral': {
    id: 'quimica-geral',
    subtitle: 'QUANTUM REACTOR',
    systemCode: 'QG-001',
    powerLevel: 98,
    statusText: 'NUCLEAR READY',
    colors: {
      hue: 350,
      hue2: 10,
      main: '#FF0A3C',
      glow: '#FF4D6D',
      neon: '#FF8FA3',
      rgb: '255, 10, 60',
    },
    icon: Atom,
  },
  'quimica-organica': {
    id: 'quimica-organica',
    subtitle: 'MOLECULAR MATRIX',
    systemCode: 'QO-002',
    powerLevel: 95,
    statusText: 'SYNTHESIS ACTIVE',
    colors: {
      hue: 260,
      hue2: 280,
      main: '#8B00FF',
      glow: '#A64DFF',
      neon: '#C99DFF',
      rgb: '139, 0, 255',
    },
    icon: FlaskConical,
  },
  'fisico-quimica': {
    id: 'fisico-quimica',
    subtitle: 'THERMO DYNAMICS',
    systemCode: 'FQ-003',
    powerLevel: 92,
    statusText: 'ENERGY STABLE',
    colors: {
      hue: 150,
      hue2: 170,
      main: '#00FF88',
      glow: '#33FF9F',
      neon: '#80FFBE',
      rgb: '0, 255, 136',
    },
    icon: Flame,
  },
  'revisao': {
    id: 'revisao',
    subtitle: 'NEURAL SYNC',
    systemCode: 'RV-004',
    powerLevel: 88,
    statusText: 'MEMORY LINKED',
    colors: {
      hue: 200,
      hue2: 220,
      main: '#00C8FF',
      glow: '#33D6FF',
      neon: '#80E8FF',
      rgb: '0, 200, 255',
    },
    icon: RefreshCw,
  },
  'previsao': {
    id: 'previsao',
    subtitle: 'ORACLE SYSTEM',
    systemCode: 'PV-005',
    powerLevel: 94,
    statusText: 'FORECAST ONLINE',
    colors: {
      hue: 45,
      hue2: 60,
      main: '#FFD000',
      glow: '#FFE033',
      neon: '#FFEB80',
      rgb: '255, 208, 0',
    },
    icon: Eye,
  },
};

// Ordem das categorias para exibição
const CATEGORY_ORDER = ['quimica-geral', 'quimica-organica', 'fisico-quimica', 'revisao', 'previsao'];

interface FuturisticCategoryFilterProps {
  categories?: Array<{ id: string; name: string; slug?: string; }>;
  selectedCategory: string | null;
  onCategorySelect?: (categoryId: string | null) => void;
  onCategoryClick?: (categoryId: string) => void;
  className?: string;
}

export const FuturisticCategoryFilter = memo(function FuturisticCategoryFilter({
  selectedCategory,
  onCategorySelect,
  onCategoryClick,
  className,
}: FuturisticCategoryFilterProps) {
  // Buscar categorias do banco com fallback
  const { categories: dbCategories, isLoading } = useBookCategories();
  
  // Ordenar categorias na ordem desejada e combinar com visuais
  const orderedCategories = CATEGORY_ORDER
    .map(id => {
      const dbCat = dbCategories.find(c => c.id === id);
      const visuals = CATEGORY_VISUALS[id];
      if (!visuals) return null;
      return {
        ...visuals,
        name: dbCat?.name || id.replace('-', ' ').toUpperCase(),
        bannerUrl: dbCat?.effectiveBanner || '',
      };
    })
    .filter(Boolean) as Array<CategoryVisualConfig & { name: string; bannerUrl: string }>;
  
  const handleClick = (categoryId: string) => {
    if (onCategorySelect) {
      onCategorySelect(selectedCategory === categoryId ? null : categoryId);
    } else if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
  };

  return (
    <section className={cn("relative py-12 overflow-hidden", className)}>
      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 0: COSMIC VOID — Deep Space Background
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 -z-10">
        {/* Absolute black void */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#030308] to-[#000000]" />
        
        {/* Nebula clouds */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 60% at 20% 30%, hsla(280,100%,40%,0.12) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 80% 70%, hsla(200,100%,50%,0.08) 0%, transparent 50%),
              radial-gradient(ellipse 120% 80% at 50% 100%, hsla(350,100%,40%,0.06) 0%, transparent 40%)
            `
          }}
        />
        
        {/* Animated star field */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(120)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 10 === 0 ? '3px' : i % 5 === 0 ? '2px' : '1px',
                height: i % 10 === 0 ? '3px' : i % 5 === 0 ? '2px' : '1px',
                left: `${(i * 7.3) % 100}%`,
                top: `${(i * 11.7) % 100}%`,
                background: i % 3 === 0 ? 'hsl(200,100%,80%)' : i % 3 === 1 ? 'hsl(280,100%,85%)' : 'white',
                boxShadow: `0 0 ${4 + (i % 8)}px currentColor`,
                animation: `stark-star-twinkle ${1.5 + (i % 5) * 0.5}s ease-in-out infinite`,
                animationDelay: `${(i % 20) * 0.1}s`,
                opacity: 0.3 + (i % 10) * 0.07
              }}
            />
          ))}
        </div>
        
        {/* Holographic grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, hsla(200,100%,70%,0.8) 1px, transparent 1px),
              linear-gradient(0deg, hsla(200,100%,70%,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
            animation: 'stark-grid-drift 30s linear infinite'
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 1: STARK INDUSTRIES HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 text-center mb-12">
        {/* Top tech ornament */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-[2px] w-24 md:w-40 bg-gradient-to-r from-transparent via-cyan-500/60 to-cyan-400" 
               style={{ boxShadow: '0 0 20px hsla(180,100%,50%,0.4)' }} />
          
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5"
               style={{ boxShadow: '0 0 30px hsla(180,100%,50%,0.15), inset 0 0 20px hsla(180,100%,50%,0.05)' }}>
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" 
                 style={{ boxShadow: '0 0 10px hsl(180,100%,50%)' }} />
            <span className="text-[10px] md:text-xs font-mono text-cyan-400 tracking-[0.4em] uppercase">
              Stark Industries
            </span>
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" 
                 style={{ boxShadow: '0 0 10px hsl(180,100%,50%)' }} />
          </div>
          
          <div className="h-[2px] w-24 md:w-40 bg-gradient-to-l from-transparent via-cyan-500/60 to-cyan-400" 
               style={{ boxShadow: '0 0 20px hsla(180,100%,50%,0.4)' }} />
        </div>

        {/* Main title */}
        <h2 
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[0.15em] uppercase"
          style={{
            background: 'linear-gradient(180deg, hsl(200,100%,80%) 0%, hsl(180,100%,70%) 50%, hsl(200,100%,60%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 60px hsla(180,100%,50%,0.5)',
            filter: 'drop-shadow(0 0 40px hsla(180,100%,50%,0.3))'
          }}
        >
          Knowledge Hub
        </h2>
        
        {/* Subtitle */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="w-4 h-4 rotate-45 border border-cyan-500/50" />
          <p className="text-cyan-400/70 text-xs md:text-sm font-mono tracking-[0.5em] uppercase animate-pulse">
            Select Quantum Module
          </p>
          <div className="w-4 h-4 rotate-45 border border-cyan-500/50" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 2: CATEGORY CARDS GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Row 1: First 3 categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {orderedCategories.slice(0, 3).map((cat, index) => (
            <StarkModuleCard
              key={cat.id}
              category={cat}
              bannerUrl={cat.bannerUrl}
              isActive={selectedCategory === cat.id}
              onClick={() => handleClick(cat.id)}
              index={index}
            />
          ))}
        </div>
        
        {/* Row 2: Last 2 categories centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {orderedCategories.slice(3, 5).map((cat, index) => (
            <StarkModuleCard
              key={cat.id}
              category={cat}
              bannerUrl={cat.bannerUrl}
              isActive={selectedCategory === cat.id}
              onClick={() => handleClick(cat.id)}
              index={index + 3}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          GLOBAL KEYFRAME ANIMATIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes stark-star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes stark-grid-drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(100px, 100px); }
        }
        @keyframes stark-core-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.15); filter: brightness(1.4); }
        }
        @keyframes stark-ring-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes stark-ring-spin-reverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes stark-scan-sweep {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(500%); opacity: 0; }
        }
        @keyframes stark-data-stream {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-200px); opacity: 0; }
        }
        @keyframes stark-bracket-pulse {
          0%, 100% { opacity: 0.6; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.5); }
        }
        @keyframes stark-power-flow {
          0%, 100% { transform: scaleX(0.3); opacity: 0.5; }
          50% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes stark-hex-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(60deg); }
        }
        @keyframes stark-particle-rise {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-80px) translateX(10px); opacity: 0; }
        }
        @keyframes stark-circuit-flow {
          0% { stroke-dashoffset: 300; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes stark-energy-wave {
          0%, 100% { transform: scale(0.9); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes stark-hologram-glitch {
          0%, 100% { opacity: 1; transform: translateX(0); }
          92% { opacity: 1; }
          93% { opacity: 0.4; transform: translateX(-2px); }
          94% { opacity: 1; transform: translateX(2px); }
          95% { opacity: 0.6; transform: translateX(-1px); }
          96% { opacity: 1; transform: translateX(0); }
        }
        @keyframes stark-status-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes stark-shield-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .stark-card {
          transform-style: preserve-3d;
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .stark-card:hover {
          transform: translateY(-8px) scale(1.02);
        }
        .stark-card.active {
          transform: translateY(-12px) scale(1.03);
        }
      `}</style>
    </section>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// STARK MODULE CARD — Individual HUD Module Component
// ═══════════════════════════════════════════════════════════════════════════
interface StarkModuleCardProps {
  category: CategoryVisualConfig & { name: string; bannerUrl: string };
  bannerUrl: string;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

const StarkModuleCard = memo(function StarkModuleCard({
  category,
  bannerUrl,
  isActive,
  onClick,
  index,
}: StarkModuleCardProps) {
  const Icon = category.icon;
  const { hue, hue2, main, glow, neon, rgb } = category.colors;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "stark-card group relative aspect-[5/3] rounded-xl overflow-hidden cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50",
        isActive && "active"
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue},30%,6%) 0%, hsl(${hue},20%,3%) 50%, hsl(${hue},25%,5%) 100%)`,
        boxShadow: isActive 
          ? `0 0 60px rgba(${rgb},0.5), 0 0 120px rgba(${rgb},0.25), 0 25px 50px rgba(0,0,0,0.8), inset 0 0 60px rgba(${rgb},0.1)`
          : `0 20px 40px rgba(0,0,0,0.7), 0 0 30px rgba(${rgb},0.1)`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          LAYER 0.5: BANNER IMAGE FROM DATABASE
      ══════════════════════════════════════════════════════════════════ */}
      {bannerUrl && (
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerUrl} 
            alt={category.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
            style={{
              filter: isActive 
                ? 'saturate(1.2) contrast(1.1)' 
                : 'saturate(0.8) contrast(0.9)',
            }}
            draggable={false}
          />
          {/* Overlay gradient for text readability */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)`
            }}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 1: Hexagonal Grid Pattern
      ══════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpath d='M30 0L60 15v22L30 52 0 37V15z' fill='none' stroke='${encodeURIComponent(main)}' stroke-width='0.5' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 52px',
          animation: isActive ? 'stark-hex-rotate 30s linear infinite' : 'none'
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 2: Circuit Board SVG
      ══════════════════════════════════════════════════════════════════ */}
      <svg className="absolute inset-0 w-full h-full opacity-20 group-hover:opacity-40 transition-opacity duration-500" viewBox="0 0 300 200">
        <defs>
          <linearGradient id={`circuit-${category.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={glow} stopOpacity="0" />
            <stop offset="50%" stopColor={glow} stopOpacity="1" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Main circuit paths */}
        <path 
          d="M0,40 L60,40 L75,25 L140,25 L160,45 L250,45" 
          fill="none" 
          stroke={`url(#circuit-${category.id})`} 
          strokeWidth="1"
          strokeDasharray="300"
          style={{ animation: isActive ? 'stark-circuit-flow 4s linear infinite' : 'none' }}
        />
        <path 
          d="M300,80 L240,80 L220,100 L150,100 L130,80 L50,80" 
          fill="none" 
          stroke={`url(#circuit-${category.id})`} 
          strokeWidth="1"
          strokeDasharray="300"
          style={{ animation: isActive ? 'stark-circuit-flow 5s linear infinite 0.5s' : 'none' }}
        />
        <path 
          d="M0,150 L80,150 L100,130 L200,130 L220,150 L300,150" 
          fill="none" 
          stroke={`url(#circuit-${category.id})`} 
          strokeWidth="1"
          strokeDasharray="300"
          style={{ animation: isActive ? 'stark-circuit-flow 4.5s linear infinite 1s' : 'none' }}
        />
        
        {/* Circuit nodes */}
        {[
          { cx: 75, cy: 25 }, { cx: 160, cy: 45 }, { cx: 220, cy: 100 },
          { cx: 130, cy: 80 }, { cx: 100, cy: 130 }, { cx: 220, cy: 150 }
        ].map((node, i) => (
          <g key={i}>
            <circle cx={node.cx} cy={node.cy} r="4" fill={glow} opacity="0.8"
              style={{ 
                filter: `drop-shadow(0 0 6px ${main})`,
                animation: isActive ? `stark-core-pulse 2s ease-in-out infinite ${i * 0.2}s` : 'none'
              }}
            />
            <circle cx={node.cx} cy={node.cy} r="8" fill="none" stroke={glow} strokeWidth="0.5" opacity="0.4" />
          </g>
        ))}
      </svg>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 3: Premium Frame with Metallic Border
      ══════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute inset-0 rounded-xl transition-all duration-500"
        style={{
          background: `
            linear-gradient(135deg, rgba(${rgb},${isActive ? 0.2 : 0.1}) 0%, transparent 50%),
            linear-gradient(-45deg, rgba(${rgb},${isActive ? 0.15 : 0.05}) 0%, transparent 50%)
          `,
          boxShadow: `inset 0 0 ${isActive ? 40 : 20}px rgba(${rgb},${isActive ? 0.2 : 0.1})`
        }}
      />
      
      {/* Border gradient with animation */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          padding: '2px',
          background: `linear-gradient(135deg, 
            rgba(${rgb},${isActive ? 0.9 : 0.5}) 0%, 
            rgba(${rgb},${isActive ? 0.4 : 0.2}) 25%,
            rgba(${rgb},${isActive ? 0.6 : 0.3}) 50%,
            rgba(${rgb},${isActive ? 0.4 : 0.2}) 75%,
            rgba(${rgb},${isActive ? 0.9 : 0.5}) 100%
          )`,
          backgroundSize: '200% 200%',
          animation: isActive ? 'stark-shield-shimmer 3s linear infinite' : 'none',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 4: Corner Tech Brackets with LEDs
      ══════════════════════════════════════════════════════════════════ */}
      {['top-2 left-2', 'top-2 right-2', 'bottom-2 right-2', 'bottom-2 left-2'].map((pos, i) => (
        <div 
          key={i}
          className={cn("absolute w-10 h-10 pointer-events-none", pos)}
          style={{ 
            transform: `rotate(${i * 90}deg)`,
            animation: isActive ? `stark-bracket-pulse 2s ease-in-out infinite ${i * 0.2}s` : 'none'
          }}
        >
          {/* L-bracket */}
          <div 
            className="absolute top-0 left-0 w-full h-[3px] rounded-full"
            style={{
              background: `linear-gradient(90deg, ${main} 0%, transparent 100%)`,
              boxShadow: `0 0 12px ${main}`
            }}
          />
          <div 
            className="absolute top-0 left-0 w-[3px] h-full rounded-full"
            style={{
              background: `linear-gradient(180deg, ${main} 0%, transparent 100%)`,
              boxShadow: `0 0 12px ${main}`
            }}
          />
          {/* LED dot */}
          <div 
            className="absolute top-0 left-0 w-3 h-3 rounded-full"
            style={{
              background: main,
              boxShadow: `0 0 15px ${main}, 0 0 30px ${main}`,
              animation: isActive ? 'stark-core-pulse 1.5s ease-in-out infinite' : 'none'
            }}
          />
        </div>
      ))}

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 5: Central Energy Core with Rotating Rings
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Outer ring 3 - dashed */}
        <div 
          className="absolute w-28 h-28 md:w-32 md:h-32 rounded-full left-1/2 top-1/2 opacity-30 group-hover:opacity-50"
          style={{
            border: `2px dashed ${glow}`,
            animation: isActive ? 'stark-ring-spin 15s linear infinite' : 'none',
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Outer ring 2 - solid */}
        <div 
          className="absolute w-20 h-20 md:w-24 md:h-24 rounded-full left-1/2 top-1/2 opacity-40 group-hover:opacity-60"
          style={{
            border: `2px solid ${glow}`,
            boxShadow: `0 0 20px rgba(${rgb},0.3)`,
            animation: isActive ? 'stark-ring-spin-reverse 10s linear infinite' : 'none',
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Inner ring - thick glow */}
        <div 
          className="absolute w-14 h-14 md:w-18 md:h-18 rounded-full left-1/2 top-1/2 opacity-60 group-hover:opacity-80"
          style={{
            border: `3px solid ${main}`,
            boxShadow: `0 0 30px rgba(${rgb},0.5), inset 0 0 20px rgba(${rgb},0.3)`,
            animation: isActive ? 'stark-ring-spin 6s linear infinite' : 'none',
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Energy wave */}
        <div 
          className="absolute w-12 h-12 md:w-16 md:h-16 rounded-full left-1/2 top-1/2"
          style={{
            background: `radial-gradient(circle, rgba(${rgb},0.4) 0%, transparent 70%)`,
            animation: isActive ? 'stark-energy-wave 3s ease-in-out infinite' : 'none',
            transform: 'translate(-50%, -50%)'
          }}
        />

        {/* Core background */}
        <div 
          className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500"
          style={{
            background: `radial-gradient(circle, rgba(${rgb},0.5) 0%, rgba(${rgb},0.2) 50%, rgba(${rgb},0.05) 100%)`,
            boxShadow: isActive 
              ? `0 0 40px rgba(${rgb},0.7), 0 0 80px rgba(${rgb},0.4), inset 0 0 30px rgba(${rgb},0.4)`
              : `0 0 20px rgba(${rgb},0.4), inset 0 0 15px rgba(${rgb},0.2)`,
            animation: isActive ? 'stark-core-pulse 2.5s ease-in-out infinite' : 'none'
          }}
        >
          <Icon 
            className="w-6 h-6 md:w-7 md:h-7 transition-all duration-500 group-hover:scale-110"
            strokeWidth={1.5}
            style={{
              color: neon,
              filter: `drop-shadow(0 0 15px ${main}) drop-shadow(0 0 30px ${glow})`
            }}
          />
        </div>

        {/* Orbiting particles */}
        {isActive && [...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full left-1/2 top-1/2"
            style={{
              background: neon,
              boxShadow: `0 0 10px ${main}`,
              transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateX(50px)`,
              animation: `stark-ring-spin 4s linear infinite`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 6: Top Status Bar
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        {/* System code badge */}
        <div 
          className="flex items-center gap-2 px-2.5 py-1 rounded"
          style={{
            background: `linear-gradient(135deg, rgba(${rgb},0.2) 0%, rgba(${rgb},0.05) 100%)`,
            border: `1px solid rgba(${rgb},0.4)`
          }}
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{
              background: isActive ? '#00FF00' : main,
              boxShadow: isActive ? '0 0 10px #00FF00' : `0 0 8px ${main}`,
              animation: 'stark-status-blink 1s ease-in-out infinite'
            }}
          />
          <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest" style={{ color: neon }}>
            {category.systemCode}
          </span>
        </div>

        {/* Status indicator */}
        <div 
          className="px-2.5 py-1 rounded text-[9px] md:text-[10px] font-mono font-bold tracking-wider"
          style={{
            background: `linear-gradient(135deg, rgba(${rgb},0.2) 0%, rgba(${rgb},0.05) 100%)`,
            border: `1px solid rgba(${rgb},0.4)`,
            color: isActive ? '#00FF00' : glow,
            animation: isActive ? 'stark-hologram-glitch 5s ease-in-out infinite' : 'none'
          }}
        >
          {isActive ? '● ONLINE' : category.statusText}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 7: Bottom Info Panel — CENTRALIZADO
      ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-6">
        {/* Gradient fade */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, hsl(${hue},20%,4%) 0%, transparent 100%)`
          }}
        />
        
        <div className="relative text-center">
          {/* Subtitle */}
          <p 
            className="text-[11px] md:text-sm font-mono tracking-[0.4em] uppercase mb-1"
            style={{ 
              color: `rgba(${rgb},0.8)`,
              textShadow: `0 0 15px rgba(${rgb},0.4)`
            }}
          >
            {category.subtitle}
          </p>
          
          {/* Main title — MAIOR E CENTRALIZADO */}
          <h3 
            className="text-xl md:text-2xl lg:text-3xl font-black tracking-wider uppercase mb-2"
            style={{
              color: neon,
              textShadow: isActive 
                ? `0 0 30px rgba(${rgb},0.9), 0 0 60px rgba(${rgb},0.5)`
                : `0 0 20px rgba(${rgb},0.5)`,
              animation: isActive ? 'stark-hologram-glitch 6s ease-in-out infinite' : 'none'
            }}
          >
            {category.name}
          </h3>
          
          {/* Power bar — CENTRALIZADO */}
          <div className="flex items-center justify-center gap-3 max-w-[200px] mx-auto">
            <span className="text-[9px] font-mono text-white/40 tracking-widest">PWR</span>
            <div 
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{
                background: `rgba(${rgb},0.15)`,
                border: `1px solid rgba(${rgb},0.3)`
              }}
            >
              <div 
                className="h-full rounded-full transition-all duration-700 origin-left"
                style={{
                  width: `${category.powerLevel}%`,
                  background: `linear-gradient(90deg, ${main} 0%, ${glow} 50%, ${neon} 100%)`,
                  boxShadow: `0 0 15px rgba(${rgb},0.6)`,
                  animation: isActive ? 'stark-power-flow 2s ease-in-out infinite' : 'none'
                }}
              />
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: neon }}>
              {category.powerLevel}%
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 8: Scan Beam (Active State)
      ══════════════════════════════════════════════════════════════════ */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-x-0 h-1"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${main} 50%, transparent 100%)`,
              boxShadow: `0 0 30px ${main}, 0 0 60px ${glow}`,
              animation: 'stark-scan-sweep 2.5s ease-in-out infinite'
            }}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 9: Data Streams (Sides)
      ══════════════════════════════════════════════════════════════════ */}
      {isActive && (
        <>
          <div className="absolute left-1.5 top-16 bottom-16 w-[2px] overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-6 rounded-full"
                style={{
                  background: `linear-gradient(to top, transparent, ${main}, transparent)`,
                  animation: `stark-data-stream 1.5s linear infinite`,
                  animationDelay: `${i * 0.25}s`,
                  top: `${i * 30}px`
                }}
              />
            ))}
          </div>
          <div className="absolute right-1.5 top-16 bottom-16 w-[2px] overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-6 rounded-full"
                style={{
                  background: `linear-gradient(to top, transparent, ${main}, transparent)`,
                  animation: `stark-data-stream 1.5s linear infinite`,
                  animationDelay: `${i * 0.25 + 0.125}s`,
                  top: `${i * 30}px`
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 10: Floating Particles
      ══════════════════════════════════════════════════════════════════ */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${8 + i * 8}%`,
                bottom: '15%',
                background: neon,
                boxShadow: `0 0 8px ${main}`,
                animation: `stark-particle-rise ${2 + (i % 4) * 0.4}s ease-out infinite`,
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LAYER 11: Hover Energy Surge
      ══════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        style={{
          background: `linear-gradient(90deg, ${main} 0%, ${glow} 50%, ${neon} 100%)`,
          boxShadow: `0 0 20px ${main}, 0 0 40px ${glow}`
        }}
      />
    </button>
  );
});

FuturisticCategoryFilter.displayName = "FuturisticCategoryFilter";
