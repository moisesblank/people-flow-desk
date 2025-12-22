// ============================================
// SANCTUM OMEGA ULTRA v3.0
// Edge Function: Asset Manifest
// Proteção de Conteúdo Nível NASA
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OWNER_EMAIL = "moisesblank@gmail.com";
const SIGNED_URL_TTL_SECONDS = 120;
const TRANSMUTED_BUCKET = "ena-assets-transmuted";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

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

serve(async (req: Request) => {
  console.log("[Sanctum Manifest] Request received:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[Sanctum Manifest] No auth header");
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado", errorCode: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.warn("[Sanctum Manifest] Invalid token:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido", errorCode: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Sanctum Manifest] User authenticated:", user.email);

    // Get assetId from query or body
    let assetId: string | null = null;
    const url = new URL(req.url);
    assetId = url.searchParams.get("assetId");

    if (!assetId && req.method === "POST") {
      try {
        const body = await req.json();
        assetId = body.assetId;
      } catch {
        console.warn("[Sanctum Manifest] Failed to parse body");
      }
    }

    if (!assetId) {
      console.warn("[Sanctum Manifest] No assetId provided");
      return new Response(
        JSON.stringify({ success: false, error: "Asset ID não fornecido", errorCode: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Sanctum Manifest] Fetching manifest for asset:", assetId);

    // Call the database function
    const { data: manifest, error: manifestError } = await supabase.rpc("fn_get_asset_manifest", {
      p_user_id: user.id,
      p_asset_id: assetId,
    });

    if (manifestError) {
      console.error("[Sanctum Manifest] RPC error:", manifestError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno", errorCode: "SERVER_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle non-success responses from function
    if (!manifest?.success) {
      const errorCode = manifest?.errorCode || "UNKNOWN";
      let status = 500;
      switch (errorCode) {
        case "LOCKED": status = 423; break;
        case "UNAUTHORIZED": status = 403; break;
        case "NOT_FOUND": status = 404; break;
        case "NOT_READY": status = 503; break;
      }
      console.warn("[Sanctum Manifest] Access denied:", errorCode);
      return new Response(
        JSON.stringify(manifest), 
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Sanctum Manifest] Manifest retrieved, signing pages...");

    // Sign URLs for each page
    const pages = manifest.pages || [];
    const signedPages: PageData[] = [];

    for (const page of pages) {
      try {
        const { data: signedData, error: signError } = await supabase.storage
          .from(TRANSMUTED_BUCKET)
          .createSignedUrl(page.path, SIGNED_URL_TTL_SECONDS);
        
        if (!signError && signedData?.signedUrl) {
          signedPages.push({ 
            page: page.page, 
            url: signedData.signedUrl, 
            width: page.width, 
            height: page.height 
          });
        } else {
          console.warn(`[Sanctum Manifest] Failed to sign page ${page.page}:`, signError?.message);
        }
      } catch (err) {
        console.error(`[Sanctum Manifest] Exception signing page ${page.page}:`, err);
      }
    }

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

    console.log("[Sanctum Manifest] Response ready, pages signed:", signedPages.length);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json", 
        "X-Sanctum-Version": "3.0-omega" 
      },
    });

  } catch (err) {
    console.error("[Sanctum Manifest] Fatal error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor", errorCode: "SERVER_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
