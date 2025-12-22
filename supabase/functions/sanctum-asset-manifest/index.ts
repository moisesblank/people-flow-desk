// ============================================
// 🌌 SANCTUM ASSET MANIFEST — EDGE FUNCTION
// Retorna manifest assinado de páginas de assets
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "moisesblank@gmail.com";

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // 1) Autenticar usuário
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2) Obter assetId (query param ou body)
    let assetId = "";
    const url = new URL(req.url);
    assetId = url.searchParams.get("assetId") ?? "";
    
    if (!assetId && req.method === "POST") {
      try {
        const body = await req.json();
        assetId = body.assetId ?? "";
      } catch {}
    }
    
    if (!assetId) {
      return new Response(JSON.stringify({ error: "ASSET_ID_REQUIRED" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3) Chamar função SQL que verifica permissões e retorna manifest
    const { data: manifest, error: manifestErr } = await supabase
      .rpc("fn_get_asset_manifest", { 
        p_asset_id: assetId, 
        p_user_id: user.id 
      });
    
    if (manifestErr) {
      console.error("[SANCTUM] Erro ao obter manifest:", manifestErr);
      return new Response(JSON.stringify({ error: "INTERNAL_ERROR", details: manifestErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4) Verificar se houve erro no manifest
    if (manifest?.error) {
      const errorMap: Record<string, number> = {
        "FORBIDDEN": 403,
        "USER_LOCKED": 423,
        "ACCESS_EXPIRED": 402,
        "ASSET_NOT_FOUND": 404,
        "ASSET_NOT_READY": 503,
        "PROFILE_NOT_FOUND": 404,
      };
      const status = errorMap[manifest.error] ?? 400;
      
      return new Response(JSON.stringify(manifest), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 5) Gerar signed URLs para cada página (TTL curto: 2 minutos)
    const pages = manifest.pages || [];
    const signedPages: Array<{ page: number; url: string; width?: number; height?: number }> = [];
    const transmutedBucket = "ena-assets-transmuted";
    
    for (const page of pages) {
      const { data: signedData } = await supabase.storage
        .from(transmutedBucket)
        .createSignedUrl(page.path, 120); // 2 minutos
      
      if (signedData?.signedUrl) {
        signedPages.push({
          page: page.page,
          url: signedData.signedUrl,
          width: page.width,
          height: page.height
        });
      }
    }

    // 6) Retornar manifest com URLs assinadas
    return new Response(JSON.stringify({
      assetId: manifest.asset_id,
      title: manifest.title,
      kind: manifest.kind,
      pageCount: manifest.page_count,
      expiresInSec: 120,
      pages: signedPages,
      watermarkSeed: manifest.watermark_seed,
      timestamp: new Date().toISOString()
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
