// ============================================
// MOISÉS MEDEIROS v10.0 - Integrated Metrics Hook
// Métricas integradas em tempo real de todas as plataformas
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";

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

export interface FacebookAdsMetrics {
  id: string;
  campanha_id: string;
  campanha_nome: string | null;
  data: string;
  impressoes: number | null;
  alcance: number | null;
  cliques: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  investimento: number | null;
  receita: number | null;
  roi: number | null;
  conversoes: number | null;
  status: string | null;
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

export interface HotmartMetrics {
  totalVendas: number;
  totalReceita: number;
  totalAlunos: number;
  totalComissoes: number;
  vendasHoje: number;
  receitaHoje: number;
}

export interface IntegratedData {
  youtube: YouTubeMetrics | null;
  instagram: InstagramMetrics | null;
  facebookAds: FacebookAdsMetrics[];
  tiktok: TikTokMetrics | null;
  hotmart: HotmartMetrics;
  totals: {
    totalFollowers: number;
    totalReach: number;
    totalEngagement: number;
    totalInvestment: number;
    totalROI: number;
    totalRevenue: number;
  };
}

export function useIntegratedMetrics() {
  const [realtimeData, setRealtimeData] = useState<IntegratedData | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["integrated-metrics"],
    queryFn: async (): Promise<IntegratedData> => {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all metrics in parallel
      const [
        youtubeResult,
        instagramResult,
        facebookResult,
        tiktokResult,
        alunosResult,
        entradasResult,
        comissoesResult
      ] = await Promise.all([
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
          .from("facebook_ads_metrics")
          .select("*")
          .order("data", { ascending: false })
          .limit(10),
        supabase
          .from("tiktok_metrics")
          .select("*")
          .order("data", { ascending: false })
          .limit(1),
        supabase
          .from("alunos")
          .select("id, valor_pago, data_matricula, status")
          .eq("status", "ativo"),
        supabase
          .from("entradas")
          .select("valor, data, fonte")
          .gte("data", thirtyDaysAgo),
        supabase
          .from("comissoes")
          .select("valor, status")
      ]);

      const youtube = youtubeResult.data?.[0] || null;
      const instagram = instagramResult.data?.[0] || null;
      const facebookAds = facebookResult.data || [];
      const tiktok = tiktokResult.data?.[0] || null;
      const alunos = alunosResult.data || [];
      const entradas = entradasResult.data || [];
      const comissoes = comissoesResult.data || [];

      // Calculate Hotmart metrics
      const todayStart = new Date(today).toISOString();
      const entradasHoje = entradas.filter(e => 
        e.data && new Date(e.data).toISOString().split('T')[0] === today
      );
      
      const hotmart: HotmartMetrics = {
        totalVendas: alunos.length,
        totalReceita: entradas.reduce((sum, e) => sum + (e.valor || 0), 0),
        totalAlunos: alunos.length,
        totalComissoes: comissoes.reduce((sum, c) => sum + (c.valor || 0), 0),
        vendasHoje: entradasHoje.length,
        receitaHoje: entradasHoje.reduce((sum, e) => sum + (e.valor || 0), 0)
      };

      // Calculate totals
      const totalFollowers = 
        (youtube?.inscritos || 0) + 
        (instagram?.seguidores || 0) + 
        (tiktok?.seguidores || 0);

      const totalReach = 
        (instagram?.alcance || 0) + 
        facebookAds.reduce((sum, fb) => sum + (fb.alcance || 0), 0);

      const totalEngagement = (
        (youtube?.engagement_rate || 0) +
        (instagram?.engajamento_rate || 0) +
        (tiktok?.engagement_rate || 0)
      ) / 3;

      const totalInvestment = facebookAds.reduce((sum, fb) => sum + (fb.investimento || 0), 0);
      const totalROI = facebookAds.length > 0 
        ? facebookAds.reduce((sum, fb) => sum + (fb.roi || 0), 0) / facebookAds.length 
        : 0;

      return {
        youtube,
        instagram,
        facebookAds,
        tiktok,
        hotmart,
        totals: {
          totalFollowers,
          totalReach,
          totalEngagement,
          totalInvestment,
          totalROI,
          totalRevenue: hotmart.totalReceita
        }
      };
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000
  });

  // Setup realtime subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel('youtube-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'youtube_metrics' }, () => refetch()),
      supabase.channel('instagram-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'instagram_metrics' }, () => refetch()),
      supabase.channel('facebook-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'facebook_ads_metrics' }, () => refetch()),
      supabase.channel('tiktok-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tiktok_metrics' }, () => refetch()),
      supabase.channel('entradas-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, () => refetch()),
      supabase.channel('alunos-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, () => refetch())
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [refetch]);

  // Sync functions
  const syncYouTube = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('youtube-sync');
    if (!error) refetch();
    return { data, error };
  }, [refetch]);

  const syncInstagram = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('instagram-sync');
    if (!error) refetch();
    return { data, error };
  }, [refetch]);

  const syncFacebookAds = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('facebook-ads-sync');
    if (!error) refetch();
    return { data, error };
  }, [refetch]);

  const syncTikTok = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('tiktok-sync');
    if (!error) refetch();
    return { data, error };
  }, [refetch]);

  const syncAll = useCallback(async () => {
    await Promise.all([
      syncYouTube(),
      syncInstagram(),
      syncFacebookAds(),
      syncTikTok()
    ]);
  }, [syncYouTube, syncInstagram, syncFacebookAds, syncTikTok]);

  return {
    data: data || null,
    isLoading,
    error,
    refetch,
    syncYouTube,
    syncInstagram,
    syncFacebookAds,
    syncTikTok,
    syncAll
  };
}
