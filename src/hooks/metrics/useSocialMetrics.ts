// ============================================
// 📊 useSocialMetrics — Métricas de Redes Sociais
// Extraído do useIntegratedMetrics (Single Responsibility)
// ============================================

import { supabase } from "@/integrations/supabase/client";
import { useSubspaceQuery } from '../useSubspaceCommunication';

export interface YouTubeMetrics {
  id: string;
  data: string;
  channel_id: string | null;
  channel_name: string | null;
  inscritos: number | null;
  visualizacoes_totais: number | null;
  total_videos: number | null;
  visualizacoes_recentes: number | null;
  engagement_rate: number | null;
}

export interface InstagramMetrics {
  id: string;
  data: string;
  seguidores: number | null;
  impressoes: number | null;
  alcance: number | null;
  visualizacoes_perfil: number | null;
  engajamento_rate: number | null;
  novos_seguidores: number | null;
  posts_count: number | null;
}

export interface TikTokMetrics {
  id: string;
  data: string;
  username: string | null;
  seguidores: number | null;
  seguindo: number | null;
  curtidas_totais: number | null;
  total_videos: number | null;
  visualizacoes_perfil: number | null;
  engagement_rate: number | null;
}

export interface SocialMetricsData {
  youtube: YouTubeMetrics | null;
  instagram: InstagramMetrics | null;
  tiktok: TikTokMetrics | null;
  totals: {
    totalFollowers: number;
    totalEngagement: number;
  };
}

export function useSocialMetrics() {
  return useSubspaceQuery<SocialMetricsData>(
    ["social-metrics"],
    async (): Promise<SocialMetricsData> => {
      const [youtubeResult, instagramResult, tiktokResult] = await Promise.all([
        supabase
          .from("youtube_metrics")
          .select("*")
          .order("data", { ascending: false })
          .limit(1),
        supabase
          .from("instagram_metrics")
          .select("*")
          .order("data", { ascending: false })
          .limit(1),
        supabase
          .from("tiktok_metrics")
          .select("*")
          .order("data", { ascending: false })
          .limit(1),
      ]);

      const youtube = youtubeResult.data?.[0] || null;
      const instagram = instagramResult.data?.[0] || null;
      const tiktok = tiktokResult.data?.[0] || null;

      const totalFollowers = 
        (youtube?.inscritos || 0) + 
        (instagram?.seguidores || 0) + 
        (tiktok?.seguidores || 0);

      const engagementRates = [
        youtube?.engagement_rate,
        instagram?.engajamento_rate,
        tiktok?.engagement_rate,
      ].filter((r): r is number => r !== null && r !== undefined);

      const totalEngagement = engagementRates.length > 0
        ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
        : 0;

      return {
        youtube,
        instagram,
        tiktok,
        totals: { totalFollowers, totalEngagement },
      };
    },
    { profile: 'semiStatic', persistKey: 'social_metrics' }
  );
}
