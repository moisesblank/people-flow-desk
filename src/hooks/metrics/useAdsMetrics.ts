// ============================================
// 💰 useAdsMetrics — Métricas de Anúncios
// Extraído do useIntegratedMetrics (Single Responsibility)
// ============================================

import { supabase } from "@/integrations/supabase/client";
import { useSubspaceQuery } from '../useSubspaceCommunication';

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

export interface AdsMetricsData {
  facebookAds: FacebookAdsMetrics[];
  totals: {
    totalInvestment: number;
    totalRevenue: number;
    totalROI: number;
    totalReach: number;
  };
}

export function useAdsMetrics() {
  return useSubspaceQuery<AdsMetricsData>(
    ["ads-metrics"],
    async (): Promise<AdsMetricsData> => {
      const { data: facebookAds } = await supabase
        .from("facebook_ads_metrics")
        .select("*")
        .order("data", { ascending: false })
        .limit(10);

      const campaigns = facebookAds || [];
      
      const totalInvestment = campaigns.reduce((sum, c) => sum + (c.investimento || 0), 0);
      const totalRevenue = campaigns.reduce((sum, c) => sum + (c.receita || 0), 0);
      const totalReach = campaigns.reduce((sum, c) => sum + (c.alcance || 0), 0);
      const totalROI = totalInvestment > 0 
        ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 
        : 0;

      return {
        facebookAds: campaigns,
        totals: { totalInvestment, totalRevenue, totalROI, totalReach },
      };
    },
    { profile: 'semiStatic', persistKey: 'ads_metrics' }
  );
}
