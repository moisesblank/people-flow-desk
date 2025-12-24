// ============================================
// 🌌🔥 ENQUEUE TRANSMUTATION — SANCTUM 3.0 🔥🌌
// ANO 2300 — ENFILEIRA PDFs PARA TRANSMUTAÇÃO
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// Recebe um assetId e cria um job de transmutação
// O worker (ENA FORGE) processa e gera as páginas rasterizadas
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// CORS HEADERS
// ============================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// TIPOS
// ============================================
interface TransmutationRequest {
  assetId: string;
  priority?: number; // 1 = urgente, 5 = baixa (default: 3)
  options?: {
    format?: "webp" | "avif" | "png";
    quality?: number; // 1-100
    maxWidth?: number;
    burnWatermark?: boolean;
  };
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
    // 2) VERIFICAR PERMISSÃO (owner/admin/funcionario)
    // ============================================
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roles?.map(r => r.role) || [];
    const canEnqueue = userRoles.some(r => ["owner", "admin", "funcionario"].includes(r));

    if (!canEnqueue) {
      // Verificar se é o owner por email
      const OWNER_EMAIL = "moisesblank@gmail.com";
      if (user.email?.toLowerCase() !== OWNER_EMAIL) {
        return new Response(
          JSON.stringify({ success: false, error: "Sem permissão para enfileirar", errorCode: "FORBIDDEN" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============================================
    // 3) VERIFICAR SE USUÁRIO ESTÁ BLOQUEADO
    // ============================================
    const { data: lockCheck } = await supabase.rpc("fn_is_user_locked", {
      p_user_id: user.id,
    });

    if (lockCheck && lockCheck.length > 0 && lockCheck[0].is_locked) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Usuário bloqueado",
          errorCode: "LOCKED",
          lockedUntil: lockCheck[0].locked_until,
        }),
        { status: 423, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 4) PARSE REQUEST
    // ============================================
    const body: TransmutationRequest = await req.json();
    const { assetId, priority = 3, options = {} } = body;

    if (!assetId) {
      return new Response(
        JSON.stringify({ success: false, error: "assetId é obrigatório", errorCode: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 5) VERIFICAR SE ASSET EXISTE
    // ============================================
    const { data: asset, error: assetError } = await supabase
      .from("ena_assets")
      .select("id, status, kind, title")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      return new Response(
        JSON.stringify({ success: false, error: "Asset não encontrado", errorCode: "NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se já está pronto ou processando
    if (asset.status === "ready") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Asset já transmutado",
          assetId,
          status: "ready"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (asset.status === "processing") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Asset já em processamento",
          assetId,
          status: "processing"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 6) CRIAR JOB NA FILA
    // ============================================
    const { data: job, error: jobError } = await supabase
      .from("sanctum_jobs_queue")
      .insert({
        job_type: "transmute_pdf",
        asset_id: assetId,
        priority: Math.max(1, Math.min(5, priority)),
        input_data: {
          assetId,
          requestedBy: user.id,
          requestedAt: new Date().toISOString(),
          options: {
            format: options.format || "webp",
            quality: options.quality || 85,
            maxWidth: options.maxWidth || 1920,
            burnWatermark: options.burnWatermark ?? true,
          },
        },
        status: "queued",
      })
      .select("id, status, created_at")
      .single();

    if (jobError) {
      console.error("[Enqueue Transmutation] Erro ao criar job:", jobError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao enfileirar", errorCode: "SERVER_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 7) ATUALIZAR STATUS DO ASSET
    // ============================================
    await supabase
      .from("ena_assets")
      .update({ status: "queued", updated_at: new Date().toISOString() })
      .eq("id", assetId);

    // ============================================
    // 8) LOG DE AUDITORIA
    // ============================================
    await supabase.from("security_events").insert({
      user_id: user.id,
      event_type: "TRANSMUTATION_ENQUEUED",
      metadata: {
        assetId,
        jobId: job.id,
        priority,
        options,
      },
    });

    // ============================================
    // 9) RESPOSTA
    // ============================================
    console.log(`[Enqueue Transmutation] Job criado: ${job.id} para asset ${assetId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Job de transmutação enfileirado",
        jobId: job.id,
        assetId,
        status: "queued",
        createdAt: job.created_at,
      }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Sanctum-Version": "3.0-omega",
        },
      }
    );

  } catch (err) {
    console.error("[Enqueue Transmutation] Erro fatal:", err);
    
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor", errorCode: "SERVER_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
