// ============================================
// MOISÉS MEDEIROS v10.0 - Integrated Metrics Hook
// Métricas integradas em tempo real de todas as plataformas
// Com fallback para dados demo quando necessário
// WordPress removido em 2025-12-28
// ============================================

import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useSubspaceQuery } from './useSubspaceCommunication';

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

export interface GoogleAnalyticsMetrics {
  id: string;
  date: string;
  sessions: number;
  users: number;
  new_users: number;
  page_views: number;
  pages_per_session: number;
  avg_session_duration: number;
  bounce_rate: number;
  organic_search: number;
  direct: number;
  social: number;
  referral: number;
  paid_search: number;
  top_pages: Array<{ page: string; views: number }>;
  devices: Array<{ device: string; sessions: number }>;
  locations: Array<{ country: string; sessions: number }>;
}

export interface WooCommerceOrder {
  id: string;
  order_id: string;
  order_number: string | null;
  status: string;
  currency: string;
  total: number;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  payment_method: string | null;
  payment_method_title: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_country: string | null;
  items_count: number;
  products: Array<{ name: string; quantity: number; total: string; product_id: number }>;
  date_created: string;
  date_paid: string | null;
  created_at: string;
}

export interface WooCommerceDailyMetrics {
  id: string;
  date: string;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  items_sold: number;
  new_customers: number;
  returning_customers: number;
  abandoned_carts: number;
  conversion_rate: number;
  top_products: Array<{ name: string; quantity: number }>;
  payment_methods: Array<{ method: string; count: number }>;
}

export interface IntegratedData {
  youtube: YouTubeMetrics | null;
  instagram: InstagramMetrics | null;
  facebookAds: FacebookAdsMetrics[];
  tiktok: TikTokMetrics | null;
  hotmart: HotmartMetrics;
  googleAnalytics: GoogleAnalyticsMetrics | null;
  woocommerce: {
    metrics: WooCommerceDailyMetrics | null;
    recentOrders: WooCommerceOrder[];
    todayRevenue: number;
    todayOrders: number;
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
  googleAnalytics: {
    id: "demo-ga",
    date: new Date().toISOString().split('T')[0],
    sessions: 15678,
    users: 12456,
    new_users: 3456,
    page_views: 45678,
    pages_per_session: 2.9,
    avg_session_duration: 245,
    bounce_rate: 42.5,
    organic_search: 6789,
    direct: 3456,
    social: 2345,
    referral: 1234,
    paid_search: 1854,
    top_pages: [
      { page: "/cursos", views: 12345 },
      { page: "/home", views: 8765 },
      { page: "/sobre", views: 4567 }
    ],
    devices: [
      { device: "mobile", sessions: 9876 },
      { device: "desktop", sessions: 4567 },
      { device: "tablet", sessions: 1235 }
    ],
    locations: [
      { country: "Brasil", sessions: 14567 },
      { country: "Portugal", sessions: 567 },
      { country: "Angola", sessions: 234 }
    ]
  },
  woocommerce: {
    metrics: {
      id: "demo-woo",
      date: new Date().toISOString().split('T')[0],
      total_orders: 34,
      total_revenue: 16987.50,
      average_order_value: 499.63,
      items_sold: 45,
      new_customers: 12,
      returning_customers: 22,
      abandoned_carts: 8,
      conversion_rate: 3.2,
      top_products: [
        { name: "Curso ENEM Intensivo", quantity: 18 },
        { name: "Vestibular Química", quantity: 12 },
        { name: "Resolução Exercícios", quantity: 15 }
      ],
      payment_methods: [
        { method: "Pix", count: 20 },
        { method: "Cartão", count: 10 },
        { method: "Boleto", count: 4 }
      ]
    },
    recentOrders: [
      {
        id: "demo-order-1",
        order_id: "12345",
        order_number: "12345",
        status: "completed",
        currency: "BRL",
        total: 497,
        subtotal: 497,
        discount_total: 0,
        shipping_total: 0,
        tax_total: 0,
        payment_method: "pix",
        payment_method_title: "PIX",
        customer_email: "aluno1@exemplo.com",
        customer_name: "João Silva",
        customer_phone: "(11) 99999-0001",
        billing_city: "São Paulo",
        billing_state: "SP",
        billing_country: "BR",
        items_count: 1,
        products: [{ name: "ENEM Intensivo 2025", quantity: 1, total: "497", product_id: 1 }],
        date_created: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        date_paid: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString()
      },
      {
        id: "demo-order-2",
        order_id: "12346",
        order_number: "12346",
        status: "processing",
        currency: "BRL",
        total: 697,
        subtotal: 697,
        discount_total: 0,
        shipping_total: 0,
        tax_total: 0,
        payment_method: "credit_card",
        payment_method_title: "Cartão de Crédito",
        customer_email: "aluno2@exemplo.com",
        customer_name: "Maria Santos",
        customer_phone: "(21) 99999-0002",
        billing_city: "Rio de Janeiro",
        billing_state: "RJ",
        billing_country: "BR",
        items_count: 1,
        products: [{ name: "Vestibular Premium", quantity: 1, total: "697", product_id: 2 }],
        date_created: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
        date_paid: null,
        created_at: new Date(Date.now() - 4 * 60 * 60000).toISOString()
      }
    ],
    todayRevenue: 5994.00,
    todayOrders: 12
  },
  totals: {
    totalFollowers: 260981,
    totalReach: 200350,
    totalEngagement: 5.6,
    totalInvestment: 4469.00,
    totalROI: 332.67,
    totalRevenue: 429581.50
  }
};

export function useIntegratedMetrics() {
  const [data, setData] = useState<IntegratedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useDemo, setUseDemo] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Parallel fetch all metrics (WordPress removido)
      const [
        youtubeResult,
        instagramResult,
        facebookResult,
        tiktokResult,
        alunosResult,
        entradasResult,
        comissoesResult,
        gaMetricsResult,
        wooMetricsResult,
        wooOrdersResult
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
          .from("google_analytics_metrics")
          .select("*")
          .order("date", { ascending: false })
          .limit(1),
        supabase
          .from("woocommerce_daily_metrics")
          .select("*")
          .eq("date", today)
          .single(),
        supabase
          .from("woocommerce_orders")
          .select("*")
          .order("date_created", { ascending: false })
          .limit(10)
      ]);

      const youtube = youtubeResult.data?.[0] || null;
      const instagram = instagramResult.data?.[0] || null;
      const facebookAds = facebookResult.data || [];
      const tiktok = tiktokResult.data?.[0] || null;
      const alunos = alunosResult.data || [];
      const entradas = entradasResult.data || [];
      const comissoes = comissoesResult.data || [];
      const gaMetrics = gaMetricsResult.data?.[0] || null;
      const wooMetrics = wooMetricsResult.data || null;
      const wooOrders = wooOrdersResult.data || [];

      // Check if we have any real data
      const hasRealData = youtube || instagram || facebookAds.length > 0 || tiktok || alunos.length > 0 || gaMetrics || wooOrders.length > 0;
      
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

      // Calculate WooCommerce today metrics
      const todayOrders = wooOrders.filter(o => 
        o.date_created && new Date(o.date_created).toISOString().split('T')[0] === today
      );
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      return {
        youtube,
        instagram,
        facebookAds,
        tiktok,
        hotmart,
        googleAnalytics: gaMetrics as unknown as GoogleAnalyticsMetrics | null,
        woocommerce: {
          metrics: wooMetrics as unknown as WooCommerceDailyMetrics | null,
          recentOrders: wooOrders as unknown as WooCommerceOrder[],
          todayRevenue,
          todayOrders: todayOrders.length
        },
        totals: {
          totalFollowers,
          totalReach,
          totalEngagement,
          totalInvestment,
          totalROI,
          totalRevenue: hotmart.totalReceita + todayRevenue
        }
      };
    } catch (err) {
      console.error("Error fetching integrated metrics:", err);
      setUseDemo(true);
      return DEMO_DATA;
    }
  }, []);

  const refresh = useCallback(async () => {
    const result = await fetchData();
    setData(result);
    setLastUpdated(new Date());
    setIsLoading(false);
  }, [fetchData]);

  useEffect(() => {
    refresh();

    // Auto-refresh every 5 minutes
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    data: useDemo ? DEMO_DATA : data,
    isLoading,
    error,
    useDemo,
    lastUpdated,
    refresh
  };
}

// Export hook for external use
export default useIntegratedMetrics;
