// ============================================
// 🎨 Filtro de Categorias - DESIGNER 2300
// Visual Cinematográfico Profissional
// CSS-only animations para performance
// ============================================

import { memo } from 'react';
import { Atom, FlaskConical, Hexagon, BookOpen, Globe } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  subtitle: string;
  gradient: string;
  borderGlow: string;
  bgGlow: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'quimica-geral',
    name: 'QUÍMICA',
    subtitle: 'GERAL',
    gradient: 'from-red-700 via-red-600 to-rose-500',
    borderGlow: 'hover:shadow-[0_0_40px_rgba(220,38,38,0.6),inset_0_0_30px_rgba(220,38,38,0.2)]',
    bgGlow: 'bg-red-500/20',
    icon: FlaskConical,
  },
  {
    id: 'quimica-organica',
    name: 'QUÍMICA',
    subtitle: 'ORGÂNICA',
    gradient: 'from-violet-700 via-purple-600 to-fuchsia-500',
    borderGlow: 'hover:shadow-[0_0_40px_rgba(139,92,246,0.6),inset_0_0_30px_rgba(139,92,246,0.2)]',
    bgGlow: 'bg-violet-500/20',
    icon: Hexagon,
  },
  {
    id: 'fisico-quimica',
    name: 'FÍSICO',
    subtitle: 'QUÍMICA',
    gradient: 'from-emerald-700 via-green-600 to-teal-500',
    borderGlow: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.6),inset_0_0_30px_rgba(16,185,129,0.2)]',
    bgGlow: 'bg-emerald-500/20',
    icon: Atom,
  },
  {
    id: 'revisao',
    name: 'REVISÃO',
    subtitle: 'COMPLETA',
    gradient: 'from-blue-700 via-blue-600 to-cyan-500',
    borderGlow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.6),inset_0_0_30px_rgba(59,130,246,0.2)]',
    bgGlow: 'bg-blue-500/20',
    icon: BookOpen,
  },
  {
    id: 'previsao',
    name: 'PREVISÃO',
    subtitle: 'ESTRATÉGICA',
    gradient: 'from-amber-600 via-yellow-500 to-orange-500',
    borderGlow: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.6),inset_0_0_30px_rgba(245,158,11,0.2)]',
    bgGlow: 'bg-amber-500/20',
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
    <section className="mb-10">
      {/* Grid: 3 em cima, 2 embaixo centralizado */}
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Linha 1: 3 cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-5">
          {CATEGORIES.slice(0, 3).map((cat, index) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isActive={selectedCategory === cat.id}
              onClick={() => onCategoryClick(cat.id)}
              index={index}
            />
          ))}
        </div>
        
        {/* Linha 2: 2 cards centralizados */}
        <div className="grid grid-cols-2 gap-3 md:gap-5 max-w-[66%] mx-auto w-full">
          {CATEGORIES.slice(3, 5).map((cat, index) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isActive={selectedCategory === cat.id}
              onClick={() => onCategoryClick(cat.id)}
              index={index + 3}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

interface CategoryCardProps {
  category: CategoryItem;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

const CategoryCard = memo(function CategoryCard({
  category,
  isActive,
  onClick,
}: CategoryCardProps) {
  const Icon = category.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-xl md:rounded-2xl aspect-[3/4]
        bg-gradient-to-b ${category.gradient}
        transition-all duration-500 ease-out
        transform hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98]
        ${category.borderGlow}
        ${isActive 
          ? 'ring-2 ring-white/70 shadow-[0_0_50px_rgba(255,255,255,0.3)]' 
          : 'shadow-xl'
        }
      `}
    >
      {/* Frame metálico externo */}
      <div className="absolute inset-0 rounded-xl md:rounded-2xl border border-white/30 pointer-events-none" />
      <div className="absolute inset-[3px] rounded-lg md:rounded-xl border border-white/10 pointer-events-none" />
      
      {/* Overlay escuro para profundidade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      
      {/* Grid tech sutil */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Cantos tecnológicos */}
      <div className="absolute top-2 left-2 w-5 h-5 md:w-6 md:h-6">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-white/80 to-transparent" />
        <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-white/80 to-transparent" />
      </div>
      <div className="absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6">
        <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-white/80 to-transparent" />
        <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-white/80 to-transparent" />
      </div>
      <div className="absolute bottom-2 left-2 w-5 h-5 md:w-6 md:h-6">
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-white/80 to-transparent" />
        <div className="absolute bottom-0 left-0 w-[2px] h-full bg-gradient-to-t from-white/80 to-transparent" />
      </div>
      <div className="absolute bottom-2 right-2 w-5 h-5 md:w-6 md:h-6">
        <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-white/80 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[2px] h-full bg-gradient-to-t from-white/80 to-transparent" />
      </div>
      
      {/* Ícone central com glow */}
      <div className="absolute inset-0 flex items-center justify-center pb-8">
        <div className={`
          relative p-4 md:p-6 rounded-2xl ${category.bgGlow}
          transition-all duration-300 group-hover:scale-110
          ${isActive ? 'scale-110' : ''}
        `}>
          {/* Glow atrás do ícone */}
          <div className={`
            absolute inset-0 rounded-2xl blur-xl ${category.bgGlow} opacity-60
            transition-opacity duration-300 group-hover:opacity-100
          `} />
          <Icon 
            className={`
              relative w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white
              drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]
              transition-all duration-300
              ${isActive ? 'drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : ''}
            `}
            strokeWidth={1.5}
          />
        </div>
      </div>
      
      {/* Texto - Nome da categoria */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
        <div className="text-center">
          <h3 className="text-white text-[10px] sm:text-xs md:text-sm font-black tracking-[0.2em] uppercase drop-shadow-lg">
            {category.name}
          </h3>
          <p className="text-white/80 text-[8px] sm:text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase mt-0.5">
            {category.subtitle}
          </p>
        </div>
        
        {/* Linha decorativa inferior */}
        <div className={`
          mt-2 mx-auto h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent
          transition-all duration-500
          ${isActive ? 'w-full opacity-100' : 'w-1/2 opacity-50 group-hover:w-3/4 group-hover:opacity-80'}
        `} />
      </div>
      
      {/* Scan line effect quando ativo */}
      {isActive && (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            animation: 'scan 2s linear infinite',
          }}
        />
      )}
      
      {/* Indicador de seleção */}
      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </div>
      )}

      {/* Efeito de brilho no hover */}
      <div className="
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-t from-transparent via-white/5 to-white/10
        pointer-events-none
      " />
    </button>
  );
});

// CSS keyframes para scan animation
const ScanStyles = () => (
  <style>{`
    @keyframes scan {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(200%); }
    }
  `}</style>
);

export default FuturisticCategoryFilter;
