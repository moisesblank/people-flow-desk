// ============================================
// 🎨 Filtro de Categorias Futurístico - Ano 2300
// Cards com visual de Química em estilo cinematográfico
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';

interface CategoryItem {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  icon: string;
}

const FUTURISTIC_CATEGORIES: CategoryItem[] = [
  {
    id: 'quimica-geral',
    name: 'Química Geral',
    color: 'from-red-600 via-red-500 to-rose-600',
    glowColor: 'shadow-red-500/50',
    icon: '⚗️',
  },
  {
    id: 'quimica-organica',
    name: 'Química Orgânica',
    color: 'from-violet-600 via-purple-500 to-blue-600',
    glowColor: 'shadow-purple-500/50',
    icon: '🔬',
  },
  {
    id: 'fisico-quimica',
    name: 'Físico-Química',
    color: 'from-emerald-600 via-green-500 to-teal-600',
    glowColor: 'shadow-green-500/50',
    icon: '⚛️',
  },
  {
    id: 'revisao',
    name: 'Revisão',
    color: 'from-blue-600 via-blue-500 to-cyan-600',
    glowColor: 'shadow-blue-500/50',
    icon: '📖',
  },
  {
    id: 'previsao',
    name: 'Previsão',
    color: 'from-amber-500 via-yellow-500 to-orange-500',
    glowColor: 'shadow-amber-500/50',
    icon: '🌐',
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
    <section className="mb-8">
      {/* Grid responsivo: 3 em cima, 2 embaixo (igual print) */}
      <div className="flex flex-col gap-4">
        {/* Linha 1: 3 cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {FUTURISTIC_CATEGORIES.slice(0, 3).map((cat, index) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isActive={selectedCategory === cat.id}
              onClick={() => onCategoryClick(cat.id)}
              delay={index * 0.1}
            />
          ))}
        </div>
        
        {/* Linha 2: 2 cards centralizados */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-[66.666%] mx-auto w-full">
          {FUTURISTIC_CATEGORIES.slice(3, 5).map((cat, index) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isActive={selectedCategory === cat.id}
              onClick={() => onCategoryClick(cat.id)}
              delay={(index + 3) * 0.1}
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
  delay?: number;
}

const CategoryCard = memo(function CategoryCard({
  category,
  isActive,
  onClick,
  delay = 0,
}: CategoryCardProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-2xl aspect-[3/4]
        bg-gradient-to-b ${category.color}
        shadow-lg ${isActive ? `shadow-2xl ${category.glowColor}` : ''}
        transition-all duration-300 group
        ${isActive ? 'ring-4 ring-white/50 ring-offset-2 ring-offset-background' : ''}
      `}
    >
      {/* Borda futurística */}
      <div className="absolute inset-0 rounded-2xl border-2 border-white/20 pointer-events-none" />
      
      {/* Efeito de brilho interno */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-white/10" />
      
      {/* Grid holográfico */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Cantos tecnológicos */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white/50 rounded-tl-lg" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white/50 rounded-tr-lg" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white/50 rounded-bl-lg" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white/50 rounded-br-lg" />
      
      {/* Ícone central com glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: isActive ? [1, 1.1, 1] : 1,
            opacity: isActive ? [0.8, 1, 0.8] : 0.6
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl md:text-5xl lg:text-6xl filter drop-shadow-lg"
        >
          {category.icon}
        </motion.div>
      </div>
      
      {/* Nome da categoria */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/90 to-transparent">
        <h3 className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-wide uppercase text-center drop-shadow-lg">
          {category.name}
        </h3>
        
        {/* Linha decorativa */}
        <div className={`
          mt-1 mx-auto h-0.5 rounded-full bg-white/60 transition-all duration-300
          ${isActive ? 'w-full' : 'w-1/2 group-hover:w-3/4'}
        `} />
      </div>
      
      {/* Efeito de scan quando ativo */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"
          initial={{ y: '-100%' }}
          animate={{ y: '200%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ height: '50%' }}
        />
      )}
      
      {/* Partículas flutuantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/50 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              bottom: '10%',
            }}
            animate={{
              y: [0, -60, -120],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}
      </div>
      
      {/* Indicador de seleção */}
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </motion.div>
      )}
    </motion.button>
  );
});

export default FuturisticCategoryFilter;
