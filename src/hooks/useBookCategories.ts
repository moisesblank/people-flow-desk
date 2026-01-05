// ============================================
// 📚 HOOK: useBookCategories
// Busca categorias do banco com fallback para assets locais
// Suporta 2 formatos: banner (horizontal) + cover (vertical)
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Importar fallbacks estáticos
import coverQuimicaGeral from '@/assets/covers/cover-quimica-geral.png';
import coverQuimicaOrganica from '@/assets/covers/cover-quimica-organica.png';
import coverFisicoQuimica from '@/assets/covers/cover-fisico-quimica.png';
import coverRevisao from '@/assets/covers/cover-revisao.png';
import coverPrevisao from '@/assets/covers/cover-previsao.png';

// ============================================
// TIPOS
// ============================================

export interface BookCategory {
  id: string;
  name: string;
  color: string | null;
  gradient_start: string | null;
  gradient_end: string | null;
  banner_url: string | null;
  cover_url: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithFallback extends BookCategory {
  // URLs finais com fallback aplicado
  effectiveBanner: string;
  effectiveCover: string;
  gradient: string;
}

// ============================================
// FALLBACKS ESTÁTICOS
// ============================================

const STATIC_FALLBACKS: Record<string, { cover: string; banner: string }> = {
  'quimica-geral': { cover: coverQuimicaGeral, banner: coverQuimicaGeral },
  'quimica-organica': { cover: coverQuimicaOrganica, banner: coverQuimicaOrganica },
  'fisico-quimica': { cover: coverFisicoQuimica, banner: coverFisicoQuimica },
  'revisao': { cover: coverRevisao, banner: coverRevisao },
  'previsao': { cover: coverPrevisao, banner: coverPrevisao },
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useBookCategories() {
  const queryClient = useQueryClient();

  // Buscar categorias do banco
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['book-categories'],
    queryFn: async (): Promise<CategoryWithFallback[]> => {
      const { data, error } = await supabase
        .from('web_book_categories')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) throw error;

      // Aplicar fallbacks
      return (data || []).map((cat) => {
        const fallback = STATIC_FALLBACKS[cat.id] || { cover: '', banner: '' };
        
        return {
          ...cat,
          effectiveBanner: cat.banner_url || fallback.banner,
          effectiveCover: cat.cover_url || fallback.cover,
          gradient: cat.gradient_start && cat.gradient_end
            ? `linear-gradient(135deg, ${cat.gradient_start}, ${cat.gradient_end})`
            : 'linear-gradient(135deg, #333, #111)',
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para atualizar imagens
  const updateCategoryImages = useMutation({
    mutationFn: async ({ 
      categoryId, 
      bannerUrl, 
      coverUrl 
    }: { 
      categoryId: string; 
      bannerUrl?: string | null; 
      coverUrl?: string | null;
    }) => {
      const updates: Record<string, string | null> = {};
      if (bannerUrl !== undefined) updates.banner_url = bannerUrl;
      if (coverUrl !== undefined) updates.cover_url = coverUrl;

      const { error } = await supabase
        .from('web_book_categories')
        .update(updates)
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-categories'] });
      toast.success('Imagens da categoria atualizadas!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar categoria:', error);
      toast.error('Erro ao atualizar imagens');
    },
  });

  return {
    categories: categories || [],
    isLoading,
    error,
    refetch,
    updateCategoryImages,
  };
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Normaliza texto da categoria para o ID padrão
 */
export function normalizeCategoryId(category?: string | null): string | null {
  if (!category) return null;
  
  const normalized = category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '-')
    .trim();
  
  const mappings: Record<string, string> = {
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
    // Físico-Química
    'fisico-quimica': 'fisico-quimica',
    'fisico_quimica': 'fisico-quimica',
    'fisicoquimica': 'fisico-quimica',
    'fisico': 'fisico-quimica',
    // Química Ambiental
    'quimica-ambiental': 'quimica-ambiental',
    'quimica_ambiental': 'quimica-ambiental',
    'quimicaambiental': 'quimica-ambiental',
    'ambiental': 'quimica-ambiental',
    // Bioquímica
    'bioquimica': 'bioquimica',
    'bio-quimica': 'bioquimica',
    'bio_quimica': 'bioquimica',
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
