// ============================================
// 🔥 VIDEO HEARTBEAT - EDGE FUNCTION
// Mantém sessão viva e valida acesso contínuo
// Autor: MESTRE (Claude Opus 4.5 PHD)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface HeartbeatRequest {
  session_token: string;
  position_seconds?: number;
  is_playing?: boolean;
  quality?: string;
  buffer_health?: number;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "METHOD_NOT_ALLOWED" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const body: HeartbeatRequest = await req.json();
    
    // Também aceitar token do header
    const sessionToken = body.session_token || req.headers.get("x-session-token");
    
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "MISSING_SESSION_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Executar heartbeat via RPC
    const { data: result, error } = await supabase.rpc("video_session_heartbeat", {
      p_session_token: sessionToken,
      p_position_seconds: body.position_seconds || null,
    });

    if (error) {
      console.error("Heartbeat error:", error);
      return new Response(
        JSON.stringify({ error: "HEARTBEAT_FAILED", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!result.success) {
      // Sessão inválida/expirada/revogada
      return new Response(
        JSON.stringify({ 
          error: result.error,
          reason: result.reason,
          shouldStop: true,
          requireReauthorization: true,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sucesso
    return new Response(
      JSON.stringify({
        success: true,
        status: result.status,
        expiresAt: result.expires_at,
        nextHeartbeat: 30000, // 30 segundos
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        } 
      }
    );

  } catch (error) {
    console.error("Heartbeat error:", error);
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
