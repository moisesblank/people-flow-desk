// ============================================
// 📚 HOOK: MATERIALS WITH PROGRESS
// Converte materials do DB para MaterialBookItem
// Sincronização Realtime + Progress tracking
// ============================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MaterialBookItem } from '@/components/materials/MaterialBookCard';

interface RawMaterial {
  id: string;
  title: string;
  description?: string;
  category: string;
  content_type: string;
  macro?: string;
  micro?: string;
  status: string;
  total_pages: number;
  view_count: number;
  download_count: number;
  cover_url?: string | null;
  file_path: string;
  watermark_enabled: boolean;
  is_premium: boolean;
  position?: number;
}

export function useMaterialsWithProgress() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Buscar materiais
  const fetchMaterials = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData.user?.id || null);

      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'ready')
        .order('position', { ascending: true });

      if (error) throw error;
      setMaterials((data as RawMaterial[]) || []);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime sync
  useEffect(() => {
    fetchMaterials();

    const channel = supabase
      .channel('materials_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        fetchMaterials();
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [fetchMaterials]);

  // Converter para MaterialBookItem format
  const bookItems = useMemo<MaterialBookItem[]>(() => {
    return materials.map(m => ({
      id: m.id,
      title: m.title,
      subtitle: m.micro || m.description?.slice(0, 50),
      category: m.macro || 'quimica_geral',
      coverUrl: m.cover_url || undefined,
      totalPages: m.total_pages || 0,
      viewCount: m.view_count || 0,
      isPremium: m.is_premium,
      progress: undefined, // TODO: Fetch from material_access_logs
    }));
  }, [materials]);

  // Stats
  const stats = useMemo(() => ({
    total: materials.length,
    byCategory: {
      quimica_geral: materials.filter(m => m.macro === 'quimica_geral').length,
      quimica_organica: materials.filter(m => m.macro === 'quimica_organica').length,
      fisico_quimica: materials.filter(m => m.macro === 'fisico_quimica').length,
      quimica_ambiental: materials.filter(m => m.macro === 'quimica_ambiental').length,
      bioquimica: materials.filter(m => m.macro === 'bioquimica').length,
    }
  }), [materials]);

  return {
    materials,
    bookItems,
    loading,
    userId,
    stats,
    refetch: fetchMaterials,
  };
}
