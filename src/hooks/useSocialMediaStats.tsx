// ============================================
// MOISÉS MEDEIROS v10.0 - Social Media Stats Hook
// Gerenciamento de métricas de redes sociais
// ============================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SocialMediaMetric {
  id: string;
  platform: string;
  username: string | null;
  profile_url: string | null;
  followers: number;
  following: number;
  posts_count: number;
  engagement_rate: number;
  growth_rate: number;
  views_count: number;
  subscribers: number;
  videos_count: number;
  last_fetched_at: string | null;
  is_auto_fetch: boolean;
  extra_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useSocialMediaStats() {
  const [metrics, setMetrics] = useState<SocialMediaMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar métricas do banco
  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('social_media_metrics')
        .select('id, platform, username, profile_url, followers, following, posts_count, engagement_rate, growth_rate, views_count, subscribers, videos_count, last_fetched_at, is_auto_fetch, extra_data, created_at, updated_at')
        .order('platform')
        .limit(50);

      if (fetchError) throw fetchError;

      // Cast para o tipo correto
      setMetrics((data || []).map(item => ({
        ...item,
        extra_data: (item.extra_data || {}) as Record<string, any>
      })));
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar métricas:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar dados em tempo real da API
  const refreshStats = useCallback(async (platform?: string) => {
    setIsFetching(true);
    
    try {
      const action = platform === 'youtube' ? 'fetch_youtube' : 'fetch_all';
      
      const { data, error: invokeError } = await supabase.functions.invoke('social-media-stats', {
        body: { action }
      });

      if (invokeError) throw invokeError;

      if (data?.success) {
        await fetchMetrics();
        toast.success("Métricas atualizadas!", {
          description: platform 
            ? `${platform} atualizado com sucesso`
            : "Todas as redes atualizadas"
        });
      } else {
        throw new Error(data?.error || 'Erro ao atualizar');
      }
    } catch (err: any) {
      console.error('Erro ao atualizar métricas:', err);
      toast.error("Erro ao atualizar métricas", {
        description: err.message
      });
    } finally {
      setIsFetching(false);
    }
  }, [fetchMetrics]);

  // Atualizar manualmente
  const updateMetric = useCallback(async (
    platform: string, 
    data: Partial<SocialMediaMetric>
  ) => {
    try {
      const { error: invokeError } = await supabase.functions.invoke('social-media-stats', {
        body: { 
          action: 'update_manual',
          platform,
          data
        }
      });

      if (invokeError) throw invokeError;

      await fetchMetrics();
      toast.success("Atualizado com sucesso!");
    } catch (err: any) {
      console.error('Erro ao atualizar:', err);
      toast.error("Erro ao atualizar", {
        description: err.message
      });
    }
  }, [fetchMetrics]);

  // Helper para formatar números
  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }, []);

  // Helper para obter métrica por plataforma
  const getMetricByPlatform = useCallback((platform: string): SocialMediaMetric | undefined => {
    return metrics.find(m => m.platform.toLowerCase() === platform.toLowerCase());
  }, [metrics]);

  // Carregar ao montar
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    isFetching,
    error,
    refreshStats,
    updateMetric,
    fetchMetrics,
    formatNumber,
    getMetricByPlatform
  };
}
