import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Nota: A API oficial do TikTok é muito restrita
// Esta função salva métricas que podem ser inseridas manualmente
// ou via scraping externo (Apify, etc.)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TIKTOK_USERNAME = Deno.env.get("TIKTOK_USERNAME") || "moises.profquimica";
    
    console.log("[TikTok Sync] Starting sync for:", TIKTOK_USERNAME);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Verificar se há dados enviados no body (atualização manual ou via webhook)
    let metricsFromBody = null;
    try {
      const body = await req.json();
      if (body.metrics) {
        metricsFromBody = body.metrics;
      }
    } catch {
      // Sem body, continuar normalmente
    }
    
    if (metricsFromBody) {
      // Salvar métricas enviadas manualmente
      const metricsData = {
        data: new Date().toISOString(),
        username: TIKTOK_USERNAME,
        seguidores: metricsFromBody.followers || 0,
        seguindo: metricsFromBody.following || 0,
        curtidas_totais: metricsFromBody.likes || 0,
        total_videos: metricsFromBody.videos || 0,
        visualizacoes_perfil: metricsFromBody.profileViews || 0,
        engagement_rate: metricsFromBody.engagementRate || 0,
        created_at: new Date().toISOString(),
      };
      
      const { error: insertError } = await supabase
        .from("tiktok_metrics")
        .insert(metricsData);
      
      if (insertError) {
        console.error("[TikTok Sync] Error saving metrics:", insertError);
        throw insertError;
      }
      
      console.log("[TikTok Sync] Manual metrics saved:", metricsData);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: "Metrics saved successfully",
        data: metricsData
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Se não há dados no body, retornar instruções
    // A API oficial do TikTok requer aprovação especial
    return new Response(JSON.stringify({ 
      success: true,
      message: "TikTok sync endpoint ready",
      instructions: {
        manual: "POST metrics via body: { metrics: { followers, following, likes, videos } }",
        automated: "Configure Apify ou Make.com para enviar dados automaticamente",
        webhookUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/tiktok-sync`
      },
      currentConfig: {
        username: TIKTOK_USERNAME
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[TikTok Sync] Error:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
