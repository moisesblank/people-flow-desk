import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// LEI VI: CORS seguro
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://gestao.moisesmedeiros.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FB_ACCESS_TOKEN = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
    const FB_AD_ACCOUNT_ID = Deno.env.get("FACEBOOK_AD_ACCOUNT_ID");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID || 
        FB_ACCESS_TOKEN === "CONFIGURAR_DEPOIS" || 
        FB_AD_ACCOUNT_ID === "CONFIGURAR_DEPOIS") {
      console.log("[Facebook Ads Sync] Credentials not configured, using mock data...");
      
      // Gerar dados mock para demonstração
      const mockCampaigns = [
        {
          campanha_id: `mock_campaign_${Date.now()}_1`,
          campanha_nome: "Campanha ENEM 2025",
          data: new Date().toISOString(),
          impressoes: Math.floor(Math.random() * 50000) + 10000,
          alcance: Math.floor(Math.random() * 40000) + 8000,
          cliques: Math.floor(Math.random() * 500) + 100,
          ctr: parseFloat((Math.random() * 2 + 0.5).toFixed(4)),
          cpc: parseFloat((Math.random() * 2 + 0.3).toFixed(2)),
          cpm: parseFloat((Math.random() * 15 + 5).toFixed(2)),
          investimento: parseFloat((Math.random() * 500 + 100).toFixed(2)),
          receita: parseFloat((Math.random() * 2000 + 500).toFixed(2)),
          roi: 0,
          conversoes: Math.floor(Math.random() * 20) + 5,
          status: "active",
        },
        {
          campanha_id: `mock_campaign_${Date.now()}_2`,
          campanha_nome: "Remarketing Alunos",
          data: new Date().toISOString(),
          impressoes: Math.floor(Math.random() * 30000) + 5000,
          alcance: Math.floor(Math.random() * 25000) + 4000,
          cliques: Math.floor(Math.random() * 300) + 50,
          ctr: parseFloat((Math.random() * 3 + 1).toFixed(4)),
          cpc: parseFloat((Math.random() * 1.5 + 0.2).toFixed(2)),
          cpm: parseFloat((Math.random() * 12 + 3).toFixed(2)),
          investimento: parseFloat((Math.random() * 300 + 50).toFixed(2)),
          receita: parseFloat((Math.random() * 1500 + 300).toFixed(2)),
          roi: 0,
          conversoes: Math.floor(Math.random() * 15) + 3,
          status: "active",
        }
      ];
      
      // Calcular ROI
      mockCampaigns.forEach(c => {
        c.roi = c.investimento > 0 ? parseFloat((((c.receita - c.investimento) / c.investimento) * 100).toFixed(2)) : 0;
      });
      
      // Salvar dados mock
      for (const campaign of mockCampaigns) {
        await supabase.from("facebook_ads_metrics").upsert(campaign, {
          onConflict: "campanha_id"
        });
      }
      
      console.log("[Facebook Ads Sync] Mock data saved:", mockCampaigns.length, "campaigns");
      
      return new Response(JSON.stringify({ 
        success: true,
        message: "Mock data generated (configure real credentials for live data)",
        campaignsCount: mockCampaigns.length,
        campaigns: mockCampaigns
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    console.log("[Facebook Ads Sync] Starting sync with real API...");
    
    // Buscar campanhas ativas
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/act_${FB_AD_ACCOUNT_ID}/campaigns?fields=id,name,status,objective&access_token=${FB_ACCESS_TOKEN}`
    );
    
    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.error("[Facebook Ads Sync] API Error:", errorText);
      throw new Error(`Facebook API error: ${campaignsResponse.status}`);
    }
    
    const campaigns = await campaignsResponse.json();
    
    console.log("[Facebook Ads Sync] Found campaigns:", campaigns.data?.length || 0);
    
    let processedCount = 0;
    
    for (const campaign of campaigns.data || []) {
      try {
        // Buscar insights da campanha (últimos 30 dias)
        const insightsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=impressions,reach,clicks,ctr,cpc,cpm,spend,conversions&date_preset=last_30d&access_token=${FB_ACCESS_TOKEN}`
        );
        
        if (!insightsResponse.ok) {
          console.error(`[Facebook Ads Sync] Error fetching insights for campaign ${campaign.id}`);
          continue;
        }
        
        const insights = await insightsResponse.json();
        
        if (insights.data && insights.data.length > 0) {
          const data = insights.data[0];
          
          // Buscar receita das vendas (do Hotmart) nos últimos 30 dias
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const { data: vendas } = await supabase
            .from("entradas")
            .select("valor")
            .gte("data", thirtyDaysAgo.toISOString())
            .eq("fonte", "Hotmart");
          
          const receita = vendas?.reduce((sum, v) => sum + (v.valor || 0), 0) || 0;
          
          // Calcular ROI
          const investimento = parseFloat(data.spend || 0);
          const roi = investimento > 0 ? ((receita - investimento) / investimento) * 100 : 0;
          
          console.log("[Facebook Ads Sync] Campaign metrics:", {
            campaign: campaign.name,
            investimento,
            receita,
            roi: `${roi.toFixed(2)}%`
          });
          
          // Salvar no banco
          await supabase.from("facebook_ads_metrics").upsert({
            campanha_id: campaign.id,
            campanha_nome: campaign.name,
            data: new Date().toISOString(),
            impressoes: parseInt(data.impressions || 0),
            alcance: parseInt(data.reach || 0),
            cliques: parseInt(data.clicks || 0),
            ctr: parseFloat(data.ctr || 0),
            cpc: parseFloat(data.cpc || 0),
            cpm: parseFloat(data.cpm || 0),
            investimento,
            receita,
            roi: parseFloat(roi.toFixed(2)),
            conversoes: parseInt(data.conversions || 0),
            status: campaign.status === "ACTIVE" ? "active" : "paused",
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "campanha_id"
          });
          
          processedCount++;
        }
      } catch (campaignError) {
        console.error(`[Facebook Ads Sync] Error processing campaign ${campaign.id}:`, campaignError);
      }
    }
    
    console.log("[Facebook Ads Sync] ✅ Sync completed successfully");
    
    return new Response(JSON.stringify({ 
      success: true,
      campaignsCount: processedCount
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Facebook Ads Sync] Error:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
