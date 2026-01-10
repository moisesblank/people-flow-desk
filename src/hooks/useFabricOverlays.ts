// ============================================
// 🎨 FABRIC OVERLAYS HOOK
// Gerencia overlays Fabric.js por página com persistência
// Serialização JSON para Supabase
// ============================================

import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { FabricCanvasData } from '@/components/books/FabricDrawingCanvas';

export interface FabricPageOverlay {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  fabric_data: FabricCanvasData;
  created_at: string;
  updated_at: string;
}

export function useFabricOverlays(bookId: string) {
  const queryClient = useQueryClient();
  const pendingChangesRef = useRef<Map<number, FabricCanvasData>>(new Map());
  const [dirtyPages, setDirtyPages] = useState<Set<number>>(new Set());

  // ============================================
  // FETCH OVERLAYS DO SERVIDOR
  // ============================================
  const {
    data: overlays = [],
    isLoading: isLoadingOverlays,
    refetch: refetchOverlays,
  } = useQuery({
    queryKey: ['fabric-overlays', bookId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      console.log('[useFabricOverlays] Buscando overlays para:', {
        bookId,
        userId: userData.user.id
      });

      const { data, error } = await supabase
        .from('book_user_page_overlays')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', userData.user.id)
        .order('page_number', { ascending: true });

      if (error) {
        console.error('[useFabricOverlays] Erro ao buscar:', error);
        throw error;
      }

      console.log('[useFabricOverlays] Encontrados:', data?.length || 0, 'overlays');

      // Converter formato antigo (strokes/texts) para novo (fabric_data)
      return (data || []).map((row) => {
        // Se já tem fabric_data no formato correto
        if (row.strokes && typeof row.strokes === 'object' && 'version' in (row.strokes as any)) {
          return {
            id: row.id,
            user_id: row.user_id,
            book_id: row.book_id,
            page_number: row.page_number,
            fabric_data: row.strokes as unknown as FabricCanvasData,
            created_at: row.created_at,
            updated_at: row.updated_at
          } as FabricPageOverlay;
        }

        // Formato antigo - retornar vazio (migração automática ao salvar)
        return {
          id: row.id,
          user_id: row.user_id,
          book_id: row.book_id,
          page_number: row.page_number,
          fabric_data: {
            version: '6.0.0',
            objects: [],
            pageNumber: row.page_number
          },
          created_at: row.created_at,
          updated_at: row.updated_at
        } as FabricPageOverlay;
      });
    },
    enabled: !!bookId,
    staleTime: 30_000,
  });

  // ============================================
  // MAPA DE OVERLAYS POR PÁGINA
  // ============================================
  const overlaysByPage = useMemo(() => {
    const map = new Map<number, FabricCanvasData>();
    overlays.forEach((o) => map.set(o.page_number, o.fabric_data));
    return map;
  }, [overlays]);

  // ============================================
  // OBTER OVERLAY PARA PÁGINA
  // ============================================
  const getOverlayForPage = useCallback(
    (pageNumber: number): FabricCanvasData | null => {
      // Primeiro verificar mudanças pendentes
      if (pendingChangesRef.current.has(pageNumber)) {
        return pendingChangesRef.current.get(pageNumber) || null;
      }
      return overlaysByPage.get(pageNumber) || null;
    },
    [overlaysByPage]
  );

  // ============================================
  // REGISTRAR MUDANÇA LOCAL (SEM SALVAR)
  // ============================================
  const registerChange = useCallback((pageNumber: number, data: FabricCanvasData) => {
    pendingChangesRef.current.set(pageNumber, data);
    setDirtyPages(prev => new Set(prev).add(pageNumber));
  }, []);

  // ============================================
  // MUTATION PARA SALVAR
  // ============================================
  const saveMutation = useMutation({
    mutationFn: async (pages: Map<number, FabricCanvasData>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const payload = Array.from(pages.entries()).map(([pageNumber, fabricData]) => ({
        user_id: userData.user.id,
        book_id: bookId,
        page_number: pageNumber,
        // Usar campo strokes para armazenar fabric_data (compatibilidade com schema existente)
        strokes: fabricData as unknown as Json,
        texts: [] as unknown as Json, // Vazio - tudo está em fabric_data
      }));

      console.log('[useFabricOverlays] SALVANDO:', {
        userId: userData.user.id,
        bookId,
        pages: Array.from(pages.keys()),
        totalObjects: Array.from(pages.values()).reduce((acc, d) => acc + d.objects.length, 0)
      });

      const { data, error } = await supabase
        .from('book_user_page_overlays')
        .upsert(payload, { onConflict: 'user_id,book_id,page_number' })
        .select();

      if (error) {
        console.error('[useFabricOverlays] ERRO ao salvar:', error);
        throw error;
      }

      console.log('[useFabricOverlays] ✅ SALVO com sucesso:', data?.length, 'registros');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabric-overlays', bookId] });
    },
  });

  // ============================================
  // SALVAR TODAS AS MUDANÇAS PENDENTES
  // ============================================
  const saveAllChanges = useCallback(async () => {
    if (pendingChangesRef.current.size === 0) {
      console.log('[useFabricOverlays] Nenhuma mudança pendente para salvar');
      return;
    }

    const changesToSave = new Map(pendingChangesRef.current);
    pendingChangesRef.current.clear();
    setDirtyPages(new Set());

    await saveMutation.mutateAsync(changesToSave);
  }, [saveMutation]);

  // ============================================
  // VERIFICAR SE TEM MUDANÇAS
  // ============================================
  const hasUnsavedChanges = useCallback(() => {
    return pendingChangesRef.current.size > 0;
  }, []);

  // ============================================
  // LIMPAR MUDANÇAS PENDENTES
  // ============================================
  const clearPendingChanges = useCallback(() => {
    pendingChangesRef.current.clear();
    setDirtyPages(new Set());
  }, []);

  return {
    overlays,
    overlaysByPage,
    getOverlayForPage,
    isLoadingOverlays,
    isSavingOverlays: saveMutation.isPending,
    registerChange,
    saveAllChanges,
    hasUnsavedChanges,
    clearPendingChanges,
    refetchOverlays,
    dirtyPages,
  };
}
