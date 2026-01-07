import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const payload = await req.json();
    
    console.log("[GA Sync] Received data:", JSON.stringify(payload).substring(0, 500));
    
    // 🛡️ PATCH-008: Secret OBRIGATÓRIO e sem fallback hardcoded
    const expectedSecret = Deno.env.get("GA_WEBHOOK_SECRET");
    const secret = req.headers.get("x-webhook-secret");
    
    if (!expectedSecret) {
      console.error("[GA Sync] ❌ GA_WEBHOOK_SECRET não configurado");
      return new Response(JSON.stringify({ error: "Misconfig: GA_WEBHOOK_SECRET ausente" }), { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    if (!secret || secret !== expectedSecret) {
      console.error("[GA Sync] ❌ Secret inválido ou ausente");
      return new Response(JSON.stringify({ error: "Não autorizado" }), { 
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Extrair dados do Site Kit ou dados diretos
    const gaData = payload.analytics || payload.data || payload;
    
    const metricsData = {
      date: payload.date || new Date().toISOString().split('T')[0],
      users: gaData.users || gaData.visitors || gaData.all_visitors || 0,
      sessions: gaData.sessions || gaData.total_sessions || 0,
      page_views: gaData.page_views || gaData.pageviews || gaData.total_pageviews || 0,
      bounce_rate: gaData.bounce_rate || gaData.bounceRate || 0,
      avg_session_duration: gaData.avg_session_duration || gaData.avgSessionDuration || 0,
      new_users: gaData.new_users || gaData.newUsers || 0,
      direct: gaData.direct || gaData.traffic_direct || 0,
      referral: gaData.referral || gaData.traffic_referral || 0,
      organic_search: gaData.organic_search || gaData.organic || gaData.traffic_organic || 0,
      social: gaData.social || gaData.traffic_social || 0,
      top_pages: gaData.top_pages || gaData.topPages || null,
      devices: gaData.devices || null,
      locations: gaData.locations || null,
    };
    
    console.log("[GA Sync] Processed metrics:", metricsData);
    
    // Upsert na tabela google_analytics_metrics
    const { data, error } = await supabase
      .from("google_analytics_metrics")
      .upsert(metricsData, {
        onConflict: "date",
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) {
      console.error("[GA Sync] Database error:", error);
      throw error;
    }
    
    console.log("[GA Sync] ✅ Metrics saved successfully for date:", metricsData.date);
    
    // Registrar evento
    await supabase.from("integration_events").insert({
      event_type: "ga_sync",
      source: "google_analytics",
      payload: { metrics: metricsData, source: payload.source || "wordpress_sitekit" },
      processed: true,
      processed_at: new Date().toISOString(),
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      date: metricsData.date,
      message: "Google Analytics data synced successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[GA Sync] Fatal error:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
