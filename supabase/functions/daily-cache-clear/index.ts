// ============================================
// 🧹 DAILY CACHE CLEAR - Cron Job Diário
// Incrementa cache_epoch para forçar limpeza
// de localStorage em todos os dispositivos
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[daily-cache-clear] 🧹 Iniciando limpeza diária de cache...");

    // Inicializar cliente Supabase com service_role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar epoch atual antes
    const { data: beforeData, error: beforeError } = await supabase
      .from("system_guard")
      .select("cache_epoch, last_cache_clear_at")
      .single();

    if (beforeError) {
      console.error("[daily-cache-clear] ❌ Erro ao buscar epoch atual:", beforeError);
      throw beforeError;
    }

    const epochBefore = beforeData?.cache_epoch || 0;
    console.log(`[daily-cache-clear] 📊 Epoch atual: ${epochBefore}`);

    // Chamar função que incrementa o epoch
    const { error: rpcError } = await supabase.rpc("increment_cache_epoch");

    if (rpcError) {
      console.error("[daily-cache-clear] ❌ Erro ao incrementar epoch:", rpcError);
      throw rpcError;
    }

    // Buscar epoch depois
    const { data: afterData, error: afterError } = await supabase
      .from("system_guard")
      .select("cache_epoch, last_cache_clear_at")
      .single();

    if (afterError) {
      console.error("[daily-cache-clear] ❌ Erro ao verificar novo epoch:", afterError);
      throw afterError;
    }

    const epochAfter = afterData?.cache_epoch || 0;
    const lastClear = afterData?.last_cache_clear_at;

    console.log(`[daily-cache-clear] ✅ Epoch incrementado: ${epochBefore} → ${epochAfter}`);
    console.log(`[daily-cache-clear] ✅ Última limpeza: ${lastClear}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cache epoch incrementado com sucesso",
        epoch_before: epochBefore,
        epoch_after: epochAfter,
        last_cache_clear_at: lastClear,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[daily-cache-clear] ❌ Erro:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
