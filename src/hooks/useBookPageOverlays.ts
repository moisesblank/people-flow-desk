import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface BookUserPageOverlay {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  strokes: Json;
  texts: Json;
  created_at: string;
  updated_at: string;
}

export interface UpsertBookUserPageOverlayInput {
  book_id: string;
  page_number: number;
  strokes: Json;
  texts: Json;
}

export function useBookPageOverlays(bookId: string) {
  const queryClient = useQueryClient();

  const {
    data: overlays = [],
    isLoading: isLoadingOverlays,
    refetch: refetchOverlays,
  } = useQuery({
    queryKey: ['book-page-overlays', bookId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('book_user_page_overlays')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', userData.user.id)
        .order('page_number', { ascending: true });

      if (error) throw error;
      return (data || []) as BookUserPageOverlay[];
    },
    enabled: !!bookId,
    staleTime: 30_000, // PATCH 5K: 30s cache
  });

  const overlaysByPage = useMemo(() => {
    const map = new Map<number, BookUserPageOverlay>();
    overlays.forEach((o) => map.set(o.page_number, o));
    return map;
  }, [overlays]);

  const getOverlayForPage = useCallback(
    (pageNumber: number) => overlaysByPage.get(pageNumber) || null,
    [overlaysByPage]
  );

  const upsertManyMutation = useMutation({
    mutationFn: async (items: UpsertBookUserPageOverlayInput[]) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const payload = items.map((i) => ({
        user_id: userData.user.id,
        book_id: i.book_id,
        page_number: i.page_number,
        strokes: (i.strokes ?? []) as Json,
        texts: (i.texts ?? []) as Json,
      }));

      console.log('[useBookPageOverlays] SALVANDO overlays:', {
        userId: userData.user.id,
        userEmail: userData.user.email,
        bookId,
        pages: items.map((i) => i.page_number),
        totalStrokes: items.reduce((acc, i) => acc + ((i.strokes as any[])?.length || 0), 0),
        totalTexts: items.reduce((acc, i) => acc + ((i.texts as any[])?.length || 0), 0),
      });

      const { data, error } = await supabase
        .from('book_user_page_overlays')
        .upsert(payload, { onConflict: 'user_id,book_id,page_number' })
        .select();

      if (error) {
        console.error('[useBookPageOverlays] ERRO ao salvar:', error);
        throw error;
      }

      console.log('[useBookPageOverlays] ✅ SALVO com sucesso:', data?.length, 'registros');
      return data as BookUserPageOverlay[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-page-overlays', bookId] });
    },
  });

  const saveOverlays = useCallback(
    async (items: UpsertBookUserPageOverlayInput[]) => {
      if (!items.length) return;
      await upsertManyMutation.mutateAsync(items);
    },
    [upsertManyMutation]
  );

  return {
    overlays,
    overlaysByPage,
    getOverlayForPage,
    isLoadingOverlays,
    isSavingOverlays: upsertManyMutation.isPending,
    saveOverlays,
    refetchOverlays,
  };
}
