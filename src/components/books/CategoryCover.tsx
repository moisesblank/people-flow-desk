// ============================================
// 📚 CATEGORY COVER — Capas Futuristas 2300
// Biblioteca Digital do Mestre Moisés
// 5 Macro-Categorias com identidade visual
// ============================================

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

// Importar capas estáticas
import coverQuimicaGeral from '@/assets/covers/cover-quimica-geral.png';
import coverQuimicaOrganica from '@/assets/covers/cover-quimica-organica.png';
import coverFisicoQuimica from '@/assets/covers/cover-fisico-quimica.png';
import coverRevisao from '@/assets/covers/cover-revisao.png';
import coverPrevisao from '@/assets/covers/cover-previsao.png';

// ============================================
// TIPOS E CONSTANTES
// ============================================

export type MacroCategory = 
  | 'quimica-geral'
  | 'quimica-organica'
  | 'fisico-quimica'
  | 'revisao'
  | 'previsao';

interface CategoryConfig {
  id: MacroCategory;
  name: string;
  cover: string;
  color: string;
  gradient: string;
}

// Mapeamento das 5 macro-categorias
export const MACRO_CATEGORIES: CategoryConfig[] = [
  {
    id: 'quimica-geral',
    name: 'Química Geral',
    cover: coverQuimicaGeral,
    color: 'hsl(0, 70%, 50%)', // Vermelho
    gradient: 'from-red-600 to-red-900',
  },
  {
    id: 'quimica-organica',
    name: 'Química Orgânica',
    cover: coverQuimicaOrganica,
    color: 'hsl(220, 70%, 30%)', // Azul escuro
    gradient: 'from-blue-800 to-blue-950',
  },
  {
    id: 'fisico-quimica',
    name: 'Físico Química',
    cover: coverFisicoQuimica,
    color: 'hsl(140, 60%, 40%)', // Verde
    gradient: 'from-emerald-600 to-emerald-900',
  },
  {
    id: 'revisao',
    name: 'Revisão',
    cover: coverRevisao,
    color: 'hsl(190, 80%, 50%)', // Azul claro
    gradient: 'from-cyan-500 to-cyan-700',
  },
  {
    id: 'previsao',
    name: 'Previsão',
    cover: coverPrevisao,
    color: 'hsl(45, 90%, 50%)', // Amarelo
    gradient: 'from-yellow-500 to-amber-600',
  },
];

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Normaliza texto da categoria para o ID padrão
 * Aceita variações como "Química Geral", "quimica geral", "QUIMICA_GERAL", etc.
 */
export function normalizeCategoryId(category?: string | null): MacroCategory | null {
  if (!category) return null;
  
  const normalized = category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[_\s]+/g, '-') // Converte espaços e underscores para hífen
    .trim();
  
  // Mapeamentos conhecidos (inclui variações antigas do banco)
  const mappings: Record<string, MacroCategory> = {
    // Química Geral
    'quimica-geral': 'quimica-geral',
    'quimica_geral': 'quimica-geral',
    'quimicageral': 'quimica-geral',
    'geral': 'quimica-geral',
    
    // Química Orgânica
    'quimica-organica': 'quimica-organica',
    'quimica_organica': 'quimica-organica',
    'quimicaorganica': 'quimica-organica',
    'organica': 'quimica-organica',
    
    // Físico Química
    'fisico-quimica': 'fisico-quimica',
    'fisico_quimica': 'fisico-quimica',
    'fisicoquimica': 'fisico-quimica',
    'fisico': 'fisico-quimica',
    
    // Revisão
    'revisao': 'revisao',
    'revisao-ciclica': 'revisao',
    'revisao_ciclica': 'revisao',
    'review': 'revisao',
    
    // Previsão
    'previsao': 'previsao',
    'previsao-final': 'previsao',
    'previsao_final': 'previsao',
    'forecast': 'previsao',
    'prediction': 'previsao',
  };
  
  return mappings[normalized] || null;
}

/**
 * Retorna a configuração da categoria pelo ID ou nome
 */
export function getCategoryConfig(categoryIdOrName?: string | null): CategoryConfig | null {
  if (!categoryIdOrName) return null;
  
  const normalizedId = normalizeCategoryId(categoryIdOrName);
  if (!normalizedId) return null;
  
  return MACRO_CATEGORIES.find(c => c.id === normalizedId) || null;
}

/**
 * Retorna a capa da categoria
 */
export function getCategoryCover(categoryIdOrName?: string | null): string | null {
  const config = getCategoryConfig(categoryIdOrName);
  return config?.cover || null;
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
}

/**
 * Componente de capa da categoria
 * Exibe a capa futurista 2300 baseada na macro-categoria
 */
export const CategoryCover = memo(function CategoryCover({
  category,
  className,
  showLabel = false,
  size = 'md',
  onClick,
}: CategoryCoverProps) {
  const config = getCategoryConfig(category);
  
  const sizeClasses = {
    sm: 'w-20 h-28',
    md: 'w-32 h-44',
    lg: 'w-48 h-64',
  };
  
  if (!config) {
    // Fallback: capa genérica
    return (
      <div 
        className={cn(
          "relative rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center",
          sizeClasses[size],
          onClick && "cursor-pointer hover:scale-105 transition-transform",
          className
        )}
        onClick={onClick}
      >
        <span className="text-muted-foreground text-xs text-center px-2">
          Sem categoria
        </span>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden shadow-lg",
        sizeClasses[size],
        onClick && "cursor-pointer hover:scale-105 transition-transform duration-200",
        className
      )}
      onClick={onClick}
    >
      <img 
        src={config.cover} 
        alt={config.name}
        className="w-full h-full object-cover"
        draggable={false}
      />
      
      {showLabel && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <span className="text-white text-xs font-medium line-clamp-1">
            {config.name}
          </span>
        </div>
      )}
    </div>
  );
});

CategoryCover.displayName = 'CategoryCover';

// ============================================
// BOTÕES DE MACRO-CATEGORIA (Para filtros)
// ============================================

interface CategoryFilterButtonProps {
  category: CategoryConfig;
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
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg font-medium transition-all duration-200 border-2",
        sizeClasses[size],
        isActive 
          ? `bg-gradient-to-r ${category.gradient} text-white border-transparent shadow-lg`
          : "bg-background border-border hover:border-primary/50 text-foreground"
      )}
      style={{
        '--category-color': category.color,
      } as React.CSSProperties}
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
  activeCategory?: MacroCategory | null;
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
