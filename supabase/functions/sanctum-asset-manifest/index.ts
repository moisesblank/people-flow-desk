// ============================================
// 🌌🔥 SANCTUM ASSET MANIFEST — EDGE FUNCTION NÍVEL NASA 🔥🌌
// ANO 2300 — ENTREGA SEGURA DE MANIFEST COM URLs ASSINADAS
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// CONSTANTES
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";
const SIGNED_URL_TTL_SECONDS = 120; // 2 minutos
const TRANSMUTED_BUCKET = "ena-assets-transmuted";

// ============================================
// CORS HEADERS
// ============================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

// ============================================
// TIPOS
// ============================================
interface PageData {
  page: number;
  url: string;
  width?: number;
  height?: number;
}

interface ManifestResponse {
  success: boolean;
  assetId?: string;
  title?: string;
  description?: string;
  totalPages?: number;
  pages?: PageData[];
  watermarkSeed?: string;
  expiresAt?: string;
  isOwner?: boolean;
  error?: string;
  errorCode?: string;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ============================================
    // 1) AUTENTICAÇÃO
    // ============================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado", errorCode: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido", errorCode: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 2) OBTER ASSET ID
    // ============================================
    let assetId: string | null = null;

    // Tentar obter de query params (GET)
    const url = new URL(req.url);
    assetId = url.searchParams.get("assetId");

    // Tentar obter de body (POST)
    if (!assetId && req.method === "POST") {
      try {
        const body = await req.json();
        assetId = body.assetId;
      } catch {
        // Ignorar erro de parse
      }
    }

    if (!assetId) {
      return new Response(
        JSON.stringify({ success: false, error: "Asset ID não fornecido", errorCode: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 3) CHAMAR FUNÇÃO DE MANIFEST
    // ============================================
    const { data: manifest, error: manifestError } = await supabase.rpc(
      "fn_get_asset_manifest",
      {
        p_user_id: user.id,
        p_asset_id: assetId,
      }
    );

    if (manifestError) {
      console.error("[Sanctum Manifest] Erro RPC:", manifestError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno", errorCode: "SERVER_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 4) VERIFICAR RESULTADO
    // ============================================
    if (!manifest?.success) {
      const errorCode = manifest?.errorCode || "UNKNOWN";
      let status = 500;

      switch (errorCode) {
        case "LOCKED":
          status = 423; // Locked
          break;
        case "UNAUTHORIZED":
          status = 403; // Forbidden
          break;
        case "NOT_FOUND":
          status = 404;
          break;
        case "NOT_READY":
          status = 503; // Service Unavailable
          break;
      }

      return new Response(
        JSON.stringify(manifest),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 5) GERAR SIGNED URLs PARA CADA PÁGINA
    // ============================================
    const pages = manifest.pages || [];
    const signedPages: PageData[] = [];

    for (const page of pages) {
      try {
        const { data: signedData, error: signError } = await supabase.storage
          .from(TRANSMUTED_BUCKET)
          .createSignedUrl(page.path, SIGNED_URL_TTL_SECONDS);

        if (signError) {
          console.error(`[Sanctum] Erro ao assinar página ${page.page}:`, signError);
          continue;
        }

        if (signedData?.signedUrl) {
          signedPages.push({
            page: page.page,
            url: signedData.signedUrl,
            width: page.width,
            height: page.height,
          });
        }
      } catch (err) {
        console.error(`[Sanctum] Exceção ao assinar página ${page.page}:`, err);
      }
    }

    // ============================================
    // 6) MONTAR RESPOSTA FINAL
    // ============================================
    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

    const response: ManifestResponse = {
      success: true,
      assetId: manifest.assetId,
      title: manifest.title,
      description: manifest.description,
      totalPages: manifest.totalPages,
      pages: signedPages,
      watermarkSeed: manifest.watermarkSeed,
      expiresAt,
      isOwner: manifest.isOwner || user.email?.toLowerCase() === OWNER_EMAIL,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Sanctum-Version": "3.0-omega",
        },
      }
    );

  } catch (err) {
    console.error("[Sanctum Manifest] Erro fatal:", err);
    
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor", errorCode: "SERVER_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
