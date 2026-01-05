// ============================================
// 📚 CATEGORY COVER — Capas Futuristas 2300
// Biblioteca Digital do Mestre Moisés
// 5 Macro-Categorias com identidade visual
// Agora com suporte a imagens do banco de dados
// ============================================

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useBookCategories, normalizeCategoryId, type CategoryWithFallback } from '@/hooks/useBookCategories';

// Importar capas estáticas como fallback
import coverQuimicaGeral from '@/assets/covers/cover-quimica-geral.png';
import coverQuimicaOrganica from '@/assets/covers/cover-quimica-organica.png';
import coverFisicoQuimica from '@/assets/covers/cover-fisico-quimica.png';
import coverRevisao from '@/assets/covers/cover-revisao.png';
import coverPrevisao from '@/assets/covers/cover-previsao.png';

// ============================================
// TIPOS E CONSTANTES (FALLBACKS ESTÁTICOS)
// ============================================

export type MacroCategory = 
  | 'quimica-geral'
  | 'quimica-organica'
  | 'fisico-quimica'
  | 'quimica-ambiental'
  | 'bioquimica'
  | 'revisao'
  | 'previsao';

interface CategoryConfig {
  id: MacroCategory;
  name: string;
  cover: string;
  banner: string;
  color: string;
  gradient: string;
}

// Fallbacks estáticos (usados quando banco não retorna imagem)
export const MACRO_CATEGORIES: CategoryConfig[] = [
  {
    id: 'quimica-geral',
    name: 'Química Geral',
    cover: coverQuimicaGeral,
    banner: coverQuimicaGeral,
    color: 'hsl(0, 70%, 50%)',
    gradient: 'from-red-600 to-red-900',
  },
  {
    id: 'quimica-organica',
    name: 'Química Orgânica',
    cover: coverQuimicaOrganica,
    banner: coverQuimicaOrganica,
    color: 'hsl(220, 70%, 30%)',
    gradient: 'from-blue-800 to-blue-950',
  },
  {
    id: 'fisico-quimica',
    name: 'Físico Química',
    cover: coverFisicoQuimica,
    banner: coverFisicoQuimica,
    color: 'hsl(140, 60%, 40%)',
    gradient: 'from-emerald-600 to-emerald-900',
  },
  {
    id: 'revisao',
    name: 'Revisão',
    cover: coverRevisao,
    banner: coverRevisao,
    color: 'hsl(190, 80%, 50%)',
    gradient: 'from-cyan-500 to-cyan-700',
  },
  {
    id: 'previsao',
    name: 'Previsão',
    cover: coverPrevisao,
    banner: coverPrevisao,
    color: 'hsl(45, 90%, 50%)',
    gradient: 'from-yellow-500 to-amber-600',
  },
];

// ============================================
// UTILITÁRIOS
// ============================================

export { normalizeCategoryId };

/**
 * Retorna a configuração estática da categoria
 */
export function getCategoryConfig(categoryIdOrName?: string | null): CategoryConfig | null {
  if (!categoryIdOrName) return null;
  
  const normalizedId = normalizeCategoryId(categoryIdOrName);
  if (!normalizedId) return null;
  
  return MACRO_CATEGORIES.find(c => c.id === normalizedId) || null;
}

/**
 * Retorna a capa da categoria (fallback estático)
 */
export function getCategoryCover(categoryIdOrName?: string | null): string | null {
  const config = getCategoryConfig(categoryIdOrName);
  return config?.cover || null;
}

/**
 * Retorna o banner da categoria (fallback estático)
 */
export function getCategoryBanner(categoryIdOrName?: string | null): string | null {
  const config = getCategoryConfig(categoryIdOrName);
  return config?.banner || null;
}

// ============================================
// COMPONENTES
// ============================================

interface CategoryCoverProps {
  category?: string | null;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  /** Usar banner horizontal ao invés de capa vertical */
  useBanner?: boolean;
  /** Dados da categoria do banco (evita refetch) */
  categoryData?: CategoryWithFallback;
}

/**
 * Componente de capa da categoria
 * Prioriza imagens do banco, fallback para assets estáticos
 */
export const CategoryCover = memo(function CategoryCover({
  category,
  className,
  showLabel = false,
  size = 'md',
  onClick,
  useBanner = false,
  categoryData,
}: CategoryCoverProps) {
  // Buscar do banco se não recebeu dados
  const { categories } = useBookCategories();
  
  // Encontrar categoria
  const normalizedId = normalizeCategoryId(category);
  const dbCategory = categoryData || categories.find(c => c.id === normalizedId);
  const staticConfig = getCategoryConfig(category);
  
  // Determinar imagem a usar (prioridade: banco > estático)
  const imageUrl = useBanner
    ? (dbCategory?.effectiveBanner || staticConfig?.banner)
    : (dbCategory?.effectiveCover || staticConfig?.cover);
  
  const displayName = dbCategory?.name || staticConfig?.name || 'Sem categoria';
  
  const sizeClasses = {
    sm: 'w-20 h-28',
    md: 'w-32 h-44',
    lg: 'w-48 h-64',
  };
  
  // Tamanhos para banner (formato horizontal)
  const bannerSizeClasses = {
    sm: 'w-28 h-16',
    md: 'w-40 h-24',
    lg: 'w-56 h-32',
  };
  
  if (!imageUrl) {
    return (
      <div 
        className={cn(
          "relative rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center",
          useBanner ? bannerSizeClasses[size] : sizeClasses[size],
          onClick && "cursor-pointer hover:scale-105 transition-transform",
          className
        )}
        onClick={onClick}
      >
        <span className="text-muted-foreground text-xs text-center px-2">
          Sem imagem
        </span>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden shadow-lg",
        useBanner ? bannerSizeClasses[size] : sizeClasses[size],
        onClick && "cursor-pointer hover:scale-105 transition-transform duration-200",
        className
      )}
      onClick={onClick}
    >
      <img 
        src={imageUrl} 
        alt={displayName}
        className="w-full h-full object-cover"
        draggable={false}
      />
      
      {showLabel && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <span className="text-white text-xs font-medium line-clamp-1">
            {displayName}
          </span>
        </div>
      )}
    </div>
  );
});

CategoryCover.displayName = 'CategoryCover';

// ============================================
// FILTROS COM BANNER HORIZONTAL
// ============================================

interface CategoryBannerFilterProps {
  categories: CategoryWithFallback[];
  activeCategory?: string | null;
  onCategoryChange?: (categoryId: string | null) => void;
  className?: string;
}

/**
 * Filtros horizontais com banners das categorias
 * Usa imagens do banco com fallback
 */
export const CategoryBannerFilter = memo(function CategoryBannerFilter({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}: CategoryBannerFilterProps) {
  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-2", className)}>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange?.(isActive ? null : cat.id)}
            className={cn(
              "relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200",
              "w-36 h-24 md:w-44 md:h-28",
              isActive 
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" 
                : "hover:scale-105 opacity-80 hover:opacity-100"
            )}
          >
            <img 
              src={cat.effectiveBanner} 
              alt={cat.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
            
            {/* Overlay com nome */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end">
              <span className="text-white text-xs font-medium p-2 line-clamp-1">
                {cat.name}
              </span>
            </div>
            
            {/* Indicador de seleção */}
            {isActive && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
});

CategoryBannerFilter.displayName = 'CategoryBannerFilter';

// ============================================
// BOTÕES DE MACRO-CATEGORIA (Texto)
// ============================================

interface CategoryFilterButtonProps {
  category: CategoryConfig | CategoryWithFallback;
  isActive?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const CategoryFilterButton = memo(function CategoryFilterButton({
  category,
  isActive = false,
  onClick,
  size = 'md',
}: CategoryFilterButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };
  
  // Determinar gradient
  const gradientClass = 'gradient' in category && typeof category.gradient === 'string' && category.gradient.startsWith('from-')
    ? category.gradient
    : 'from-primary to-primary/80';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg font-medium transition-all duration-200 border-2",
        sizeClasses[size],
        isActive 
          ? `bg-gradient-to-r ${gradientClass} text-white border-transparent shadow-lg`
          : "bg-background border-border hover:border-primary/50 text-foreground"
      )}
    >
      {category.name}
    </button>
  );
});

CategoryFilterButton.displayName = 'CategoryFilterButton';

// ============================================
// BARRA DE FILTROS POR MACRO-CATEGORIA
// ============================================

interface CategoryFilterBarProps {
  activeCategory?: MacroCategory | string | null;
  onCategoryChange?: (category: MacroCategory | null) => void;
  showAll?: boolean;
  className?: string;
}

export const CategoryFilterBar = memo(function CategoryFilterBar({
  activeCategory,
  onCategoryChange,
  showAll = true,
  className,
}: CategoryFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {showAll && (
        <button
          onClick={() => onCategoryChange?.(null)}
          className={cn(
            "px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 border-2",
            !activeCategory
              ? "bg-primary text-primary-foreground border-transparent shadow-lg"
              : "bg-background border-border hover:border-primary/50 text-foreground"
          )}
        >
          Todos
        </button>
      )}
      
      {MACRO_CATEGORIES.map((cat) => (
        <CategoryFilterButton
          key={cat.id}
          category={cat}
          isActive={activeCategory === cat.id}
          onClick={() => onCategoryChange?.(cat.id)}
        />
      ))}
    </div>
  );
});

CategoryFilterBar.displayName = 'CategoryFilterBar';

export default CategoryCover;
