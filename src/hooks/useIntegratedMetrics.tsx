// ============================================
// MOISÉS MEDEIROS v10.0 - Integrated Metrics Hook
// Métricas integradas em tempo real de todas as plataformas
// Com fallback para dados demo quando necessário
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

export interface WordPressEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  user_email: string | null;
  user_name: string | null;
  user_ip: string | null;
  page_url: string | null;
  created_at: string;
}

export interface WordPressMetrics {
  id: string;
  date: string;
  total_users: number;
  new_registrations: number;
  active_users: number;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  top_pages: unknown[];
  traffic_sources: unknown[];
}

export interface IntegratedData {
  youtube: YouTubeMetrics | null;
  instagram: InstagramMetrics | null;
  facebookAds: FacebookAdsMetrics[];
  tiktok: TikTokMetrics | null;
  hotmart: HotmartMetrics;
  wordpress: {
    metrics: WordPressMetrics | null;
    recentEvents: WordPressEvent[];
  };
  totals: {
    totalFollowers: number;
    totalReach: number;
    totalEngagement: number;
    totalInvestment: number;
    totalROI: number;
    totalRevenue: number;
  };
}

// Demo data for when real data is not available
const DEMO_DATA: IntegratedData = {
  youtube: {
    id: "demo-yt",
    data: new Date().toISOString(),
    channel_id: "UC_demo",
    channel_name: "Prof. Moisés Medeiros",
    inscritos: 125847,
    visualizacoes_totais: 8547621,
    total_videos: 342,
    visualizacoes_recentes: 45230,
    engagement_rate: 4.8
  },
  instagram: {
    id: "demo-ig",
    data: new Date().toISOString(),
    seguidores: 89456,
    impressoes: 156780,
    alcance: 78450,
    visualizacoes_perfil: 12340,
    engajamento_rate: 5.2,
    novos_seguidores: 234,
    posts_count: 567
  },
  facebookAds: [
    {
      id: "demo-fb-1",
      campanha_id: "camp_vestibular_2025",
      campanha_nome: "Vestibular 2025 - Química",
      data: new Date().toISOString(),
      impressoes: 245670,
      alcance: 89450,
      cliques: 4523,
      ctr: 0.0184,
      cpc: 0.45,
      cpm: 8.25,
      investimento: 2025.50,
      receita: 8547.00,
      roi: 322,
      conversoes: 47,
      status: "active"
    },
    {
      id: "demo-fb-2",
      campanha_id: "camp_enem_intensivo",
      campanha_nome: "ENEM Intensivo",
      data: new Date().toISOString(),
      impressoes: 189340,
      alcance: 67890,
      cliques: 3456,
      ctr: 0.0182,
      cpc: 0.52,
      cpm: 9.45,
      investimento: 1789.00,
      receita: 6234.00,
      roi: 248,
      conversoes: 32,
      status: "active"
    },
    {
      id: "demo-fb-3",
      campanha_id: "camp_remarketing",
      campanha_nome: "Remarketing Leads",
      data: new Date().toISOString(),
      impressoes: 78450,
      alcance: 34560,
      cliques: 2345,
      ctr: 0.0298,
      cpc: 0.28,
      cpm: 8.35,
      investimento: 654.50,
      receita: 3456.00,
      roi: 428,
      conversoes: 18,
      status: "active"
    }
  ],
  tiktok: {
    id: "demo-tt",
    data: new Date().toISOString(),
    username: "prof.moises",
    seguidores: 45678,
    seguindo: 234,
    curtidas_totais: 1234567,
    total_videos: 156,
    visualizacoes_perfil: 23456,
    engagement_rate: 6.8
  },
  hotmart: {
    totalVendas: 847,
    totalReceita: 423587.50,
    totalAlunos: 1247,
    totalComissoes: 42358.75,
    vendasHoje: 12,
    receitaHoje: 5994.00
  },
  wordpress: {
    metrics: {
      id: "demo-wp",
      date: new Date().toISOString().split('T')[0],
      total_users: 2456,
      new_registrations: 34,
      active_users: 189,
      page_views: 12456,
      unique_visitors: 3421,
      bounce_rate: 42.5,
      avg_session_duration: 245,
      top_pages: [],
      traffic_sources: []
    },
    recentEvents: [
      {
        id: "demo-event-1",
        event_type: "user_registered",
        event_data: {},
        user_email: "aluno@exemplo.com",
        user_name: "João Silva",
        user_ip: "189.40.xxx.xxx",
        page_url: "https://app.moisesmedeiros.com.br/registro",
        created_at: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        id: "demo-event-2",
        event_type: "user_login",
        event_data: {},
        user_email: "maria@exemplo.com",
        user_name: "Maria Santos",
        user_ip: "177.20.xxx.xxx",
        page_url: "https://app.moisesmedeiros.com.br/login",
        created_at: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: "demo-event-3",
        event_type: "user_registered",
        event_data: {},
        user_email: "pedro@exemplo.com",
        user_name: "Pedro Costa",
        user_ip: "200.150.xxx.xxx",
        page_url: "https://app.moisesmedeiros.com.br/registro",
        created_at: new Date(Date.now() - 45 * 60000).toISOString()
      }
    ]
  },
  totals: {
    totalFollowers: 260981,
    totalReach: 168900,
    totalEngagement: 5.6,
    totalInvestment: 4469.00,
    totalROI: 332.67,
    totalRevenue: 423587.50
  }
};

export function useIntegratedMetrics() {
  const [useDemo, setUseDemo] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["integrated-metrics"],
    queryFn: async (): Promise<IntegratedData> => {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      try {
        // Fetch all metrics in parallel
        const [
          youtubeResult,
          instagramResult,
          facebookResult,
          tiktokResult,
          alunosResult,
          entradasResult,
          comissoesResult,
          wpMetricsResult,
          wpEventsResult
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
            .select("valor, status"),
          supabase
            .from("wordpress_metrics")
            .select("*")
            .order("date", { ascending: false })
            .limit(1),
          supabase
            .from("wordpress_events")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20)
        ]);

        const youtube = youtubeResult.data?.[0] || null;
        const instagram = instagramResult.data?.[0] || null;
        const facebookAds = facebookResult.data || [];
        const tiktok = tiktokResult.data?.[0] || null;
        const alunos = alunosResult.data || [];
        const entradas = entradasResult.data || [];
        const comissoes = comissoesResult.data || [];
        const wpMetrics = wpMetricsResult.data?.[0] || null;
        const wpEvents = wpEventsResult.data || [];

        // Check if we have any real data
        const hasRealData = youtube || instagram || facebookAds.length > 0 || tiktok || alunos.length > 0;
        
        if (!hasRealData) {
          setUseDemo(true);
          return DEMO_DATA;
        }

        setUseDemo(false);

        // Calculate Hotmart metrics from real data
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

        // Calculate average engagement (only from platforms that have data)
        const engagements = [
          youtube?.engagement_rate,
          instagram?.engajamento_rate,
          tiktok?.engagement_rate
        ].filter(e => e !== null && e !== undefined) as number[];
        
        const totalEngagement = engagements.length > 0 
          ? engagements.reduce((sum, e) => sum + e, 0) / engagements.length 
          : 0;

        const totalInvestment = facebookAds.reduce((sum, fb) => sum + (fb.investimento || 0), 0);
        
        const roiValues = facebookAds.filter(fb => fb.roi !== null && fb.roi !== undefined);
        const totalROI = roiValues.length > 0 
          ? roiValues.reduce((sum, fb) => sum + (fb.roi || 0), 0) / roiValues.length 
          : 0;

        return {
          youtube,
          instagram,
          facebookAds,
          tiktok,
          hotmart,
          wordpress: {
            metrics: wpMetrics as WordPressMetrics | null,
            recentEvents: wpEvents as WordPressEvent[]
          },
          totals: {
            totalFollowers,
            totalReach,
            totalEngagement,
            totalInvestment,
            totalROI,
            totalRevenue: hotmart.totalReceita
          }
        };
      } catch (err) {
        console.error("Error fetching integrated metrics:", err);
        setUseDemo(true);
        return DEMO_DATA;
      }
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
    retry: 1
  });

  // Setup realtime subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel('youtube-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'youtube_metrics' }, () => {
          refetch();
        }),
      supabase.channel('instagram-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'instagram_metrics' }, () => {
          refetch();
        }),
      supabase.channel('facebook-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'facebook_ads_metrics' }, () => {
          refetch();
        }),
      supabase.channel('tiktok-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tiktok_metrics' }, () => {
          refetch();
        }),
      supabase.channel('entradas-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, () => {
          refetch();
        }),
      supabase.channel('alunos-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, () => {
          refetch();
        }),
      supabase.channel('wordpress-events-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wordpress_events' }, () => {
          refetch();
        }),
      supabase.channel('wordpress-metrics-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wordpress_metrics' }, () => {
          refetch();
        })
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [refetch]);

  // Sync functions with better error handling
  const syncYouTube = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('youtube-sync');
      if (error) {
        console.error("YouTube sync error:", error);
        return { data: null, error };
      }
      await refetch();
      return { data, error: null };
    } catch (err) {
      console.error("YouTube sync exception:", err);
      return { data: null, error: err };
    }
  }, [refetch]);

  const syncInstagram = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('instagram-sync');
      if (error) {
        console.error("Instagram sync error:", error);
        return { data: null, error };
      }
      await refetch();
      return { data, error: null };
    } catch (err) {
      console.error("Instagram sync exception:", err);
      return { data: null, error: err };
    }
  }, [refetch]);

  const syncFacebookAds = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-ads-sync');
      if (error) {
        console.error("Facebook Ads sync error:", error);
        return { data: null, error };
      }
      await refetch();
      return { data, error: null };
    } catch (err) {
      console.error("Facebook Ads sync exception:", err);
      return { data: null, error: err };
    }
  }, [refetch]);

  const syncTikTok = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-sync');
      if (error) {
        console.error("TikTok sync error:", error);
        return { data: null, error };
      }
      await refetch();
      return { data, error: null };
    } catch (err) {
      console.error("TikTok sync exception:", err);
      return { data: null, error: err };
    }
  }, [refetch]);

  const syncAll = useCallback(async () => {
    const results = await Promise.allSettled([
      syncYouTube(),
      syncInstagram(),
      syncFacebookAds(),
      syncTikTok()
    ]);
    
    const errors = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error));
    if (errors.length > 0) {
      console.warn(`${errors.length} sync operations had issues`);
    }
    
    await refetch();
    return { success: errors.length === 0, errors };
  }, [syncYouTube, syncInstagram, syncFacebookAds, syncTikTok, refetch]);

  return {
    data: data || DEMO_DATA,
    isLoading,
    error,
    refetch,
    syncYouTube,
    syncInstagram,
    syncFacebookAds,
    syncTikTok,
    syncAll,
    isDemo: useDemo
  };
}
