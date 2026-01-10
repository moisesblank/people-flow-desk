// ============================================
// 📝 HOOK: useBookAnnotations
// Sistema de Anotações do Aluno - Modo Leitura
// CRUD completo com persistência no banco
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

export type AnnotationType = 'note' | 'highlight' | 'question' | 'important';

export interface BookAnnotation {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  annotation_type: AnnotationType;
  content: string;
  color: string;
  position_x?: number;
  position_y?: number;
  created_at: string;
  updated_at: string;
}

export interface BookBookmark {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  label?: string;
  color: string;
  created_at: string;
}

export interface CreateAnnotationInput {
  book_id: string;
  page_number: number;
  annotation_type: AnnotationType;
  content: string;
  color?: string;
  position_x?: number;
  position_y?: number;
}

export interface UpdateAnnotationInput {
  id: string;
  content?: string;
  color?: string;
  annotation_type?: AnnotationType;
}

export interface CreateBookmarkInput {
  book_id: string;
  page_number: number;
  label?: string;
  color?: string;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useBookAnnotations(bookId: string) {
  const queryClient = useQueryClient();
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // ============================================
  // QUERIES
  // ============================================

  // Buscar todas as anotações do livro
  const {
    data: annotations = [],
    isLoading: isLoadingAnnotations,
    refetch: refetchAnnotations
  } = useQuery({
    queryKey: ['book-annotations', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_user_annotations')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BookAnnotation[];
    },
    enabled: !!bookId,
    staleTime: 30_000, // PATCH 5K: 30s cache
  });

  // Buscar todos os bookmarks do livro
  const {
    data: bookmarks = [],
    isLoading: isLoadingBookmarks,
    refetch: refetchBookmarks
  } = useQuery({
    queryKey: ['book-bookmarks', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_user_bookmarks')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      return (data || []) as BookBookmark[];
    },
    enabled: !!bookId,
    staleTime: 30_000, // PATCH 5K: 30s cache
  });

  // ============================================
  // MUTATIONS - ANOTAÇÕES
  // ============================================

  // Criar anotação
  const createAnnotationMutation = useMutation({
    mutationFn: async (input: CreateAnnotationInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('book_user_annotations')
        .insert({
          user_id: userData.user.id,
          book_id: input.book_id,
          page_number: input.page_number,
          annotation_type: input.annotation_type,
          content: input.content,
          color: input.color || '#ef4444',
          position_x: input.position_x,
          position_y: input.position_y,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BookAnnotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-annotations', bookId] });
      toast.success('Anotação salva!');
    },
    onError: (error) => {
      console.error('Erro ao criar anotação:', error);
      toast.error('Erro ao salvar anotação');
    }
  });

  // Atualizar anotação
  const updateAnnotationMutation = useMutation({
    mutationFn: async (input: UpdateAnnotationInput) => {
      const { data, error } = await supabase
        .from('book_user_annotations')
        .update({
          content: input.content,
          color: input.color,
          annotation_type: input.annotation_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as BookAnnotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-annotations', bookId] });
      toast.success('Anotação atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar anotação:', error);
      toast.error('Erro ao atualizar anotação');
    }
  });

  // Deletar anotação
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (annotationId: string) => {
      const { error } = await supabase
        .from('book_user_annotations')
        .delete()
        .eq('id', annotationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-annotations', bookId] });
      toast.success('Anotação removida');
    },
    onError: (error) => {
      console.error('Erro ao deletar anotação:', error);
      toast.error('Erro ao remover anotação');
    }
  });

  // ============================================
  // MUTATIONS - BOOKMARKS
  // ============================================

  // Criar/Toggle bookmark
  const toggleBookmarkMutation = useMutation({
    mutationFn: async (input: CreateBookmarkInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('book_user_bookmarks')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('book_id', input.book_id)
        .eq('page_number', input.page_number)
        .maybeSingle();

      if (existing) {
        // Remover
        const { error } = await supabase
          .from('book_user_bookmarks')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        // Criar
        const { data, error } = await supabase
          .from('book_user_bookmarks')
          .insert({
            user_id: userData.user.id,
            book_id: input.book_id,
            page_number: input.page_number,
            label: input.label,
            color: input.color || '#ef4444',
          })
          .select()
          .single();
        if (error) throw error;
        return { action: 'added' as const, data };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['book-bookmarks', bookId] });
      toast.success(result.action === 'added' ? 'Página favoritada!' : 'Favorito removido');
    },
    onError: (error) => {
      console.error('Erro ao toggle bookmark:', error);
      toast.error('Erro ao favoritar página');
    }
  });

  // Atualizar label do bookmark
  const updateBookmarkMutation = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { data, error } = await supabase
        .from('book_user_bookmarks')
        .update({ label })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BookBookmark;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-bookmarks', bookId] });
    }
  });

  // Deletar bookmark
  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: string) => {
      const { error } = await supabase
        .from('book_user_bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-bookmarks', bookId] });
      toast.success('Favorito removido');
    }
  });

  // ============================================
  // HELPERS - MEMOIZAÇÃO AGRESSIVA
  // ============================================

  // ✅ OTIMIZADO: Mapa de anotações por página (acesso O(1) em vez de O(n))
  const annotationsByPage = useMemo(() => {
    const map = new Map<number, BookAnnotation[]>();
    annotations.forEach(a => {
      const existing = map.get(a.page_number) || [];
      existing.push(a);
      map.set(a.page_number, existing);
    });
    return map;
  }, [annotations]);

  // ✅ OTIMIZADO: Mapa de bookmarks por página (acesso O(1))
  const bookmarksByPage = useMemo(() => {
    const map = new Map<number, BookBookmark>();
    bookmarks.forEach(b => map.set(b.page_number, b));
    return map;
  }, [bookmarks]);

  // Anotações da página atual - agora O(1)
  const getAnnotationsForPage = useCallback((pageNumber: number) => {
    return annotationsByPage.get(pageNumber) || [];
  }, [annotationsByPage]);

  // Verificar se página está favoritada - agora O(1)
  const isPageBookmarked = useCallback((pageNumber: number) => {
    return bookmarksByPage.has(pageNumber);
  }, [bookmarksByPage]);

  // Contadores
  const stats = useMemo(() => ({
    totalAnnotations: annotations.length,
    totalBookmarks: bookmarks.length,
    noteCount: annotations.filter(a => a.annotation_type === 'note').length,
    highlightCount: annotations.filter(a => a.annotation_type === 'highlight').length,
    questionCount: annotations.filter(a => a.annotation_type === 'question').length,
    importantCount: annotations.filter(a => a.annotation_type === 'important').length,
  }), [annotations, bookmarks]);

  // ============================================
  // RETORNO
  // ============================================

  return {
    // Data
    annotations,
    bookmarks,
    stats,
    
    // Loading states
    isLoading: isLoadingAnnotations || isLoadingBookmarks,
    isLoadingAnnotations,
    isLoadingBookmarks,
    
    // UI state
    isCreatingNote,
    setIsCreatingNote,
    
    // Annotation actions
    createAnnotation: createAnnotationMutation.mutate,
    updateAnnotation: updateAnnotationMutation.mutate,
    deleteAnnotation: deleteAnnotationMutation.mutate,
    isCreatingAnnotation: createAnnotationMutation.isPending,
    
    // Bookmark actions
    toggleBookmark: toggleBookmarkMutation.mutate,
    updateBookmark: updateBookmarkMutation.mutate,
    deleteBookmark: deleteBookmarkMutation.mutate,
    isTogglingBookmark: toggleBookmarkMutation.isPending,
    
    // Helpers
    getAnnotationsForPage,
    isPageBookmarked,
    
    // Refetch
    refetch: () => {
      refetchAnnotations();
      refetchBookmarks();
    }
  };
}
