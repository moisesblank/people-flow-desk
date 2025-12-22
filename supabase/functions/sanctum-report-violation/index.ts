// ============================================
// 🌌 SANCTUM REPORT VIOLATION — EDGE FUNCTION
// Registra violação de segurança e aplica risco
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "moisesblank@gmail.com";

// Função para criar hash SHA-256 (para IP e UA)
async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Usar service key para poder escrever nas tabelas
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1) Tentar autenticar usuário (pode ser anônimo)
    let userId: string | null = null;
    let userEmail: string | null = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      userId = user?.id ?? null;
      userEmail = user?.email ?? null;
      
      // Owner MASTER ignora violações (para testes)
      if (userEmail?.toLowerCase() === OWNER_EMAIL) {
        return new Response(JSON.stringify({ 
          ok: true, 
          locked: false, 
          message: "OWNER_BYPASS" 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 2) Obter dados da violação
    const body = await req.json();
    const { 
      violationType, 
      severity = 25, 
      assetId = null, 
      metadata = {} 
    } = body;

    if (!violationType) {
      return new Response(JSON.stringify({ error: "VIOLATION_TYPE_REQUIRED" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3) Hash de IP e User-Agent para privacidade
    const ip = req.headers.get("x-forwarded-for") ?? 
               req.headers.get("cf-connecting-ip") ?? 
               req.headers.get("x-real-ip") ?? 
               "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    
    const ipHash = await sha256Hash(ip);
    const uaHash = await sha256Hash(ua);

    // 4) Registrar violação via RPC
    const { data: result, error: rpcError } = await supabase.rpc("fn_register_sanctum_violation", {
      p_user_id: userId,
      p_user_email: userEmail,
      p_violation_type: violationType,
      p_severity: severity,
      p_asset_id: assetId,
      p_domain: req.headers.get("host") ?? "",
      p_route: req.headers.get("referer") ?? "",
      p_ip_hash: ipHash,
      p_ua_hash: uaHash,
      p_metadata: metadata
    });

    if (rpcError) {
      console.error("[SANCTUM] Erro ao registrar violação:", rpcError);
      return new Response(JSON.stringify({ error: "INTERNAL_ERROR", details: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 5) Retornar resultado
    return new Response(JSON.stringify({
      ok: result?.ok ?? true,
      locked: result?.is_locked ?? false,
      lockedUntil: result?.locked_until ?? null,
      riskScore: result?.risk_score ?? 0
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[SANCTUM] Erro interno:", err);
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
