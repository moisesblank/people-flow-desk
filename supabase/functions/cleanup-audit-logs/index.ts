// ============================================
// 🧹 CLEANUP AUDIT LOGS - Job de Limpeza Automática
// Executa limpeza de logs antigos (>30 dias)
// Deve ser chamado via cron job ou manualmente
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[CLEANUP] Iniciando limpeza de audit_logs...");

    // Executar função de limpeza
    const { data, error } = await supabase.rpc("cleanup_old_audit_logs");

    if (error) {
      console.error("[CLEANUP] Erro:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter estatísticas atuais
    const { data: stats } = await supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true });

    const result = {
      success: true,
      deleted_records: data,
      remaining_records: stats?.length || 0,
      retention_days: 30,
      executed_at: new Date().toISOString(),
    };

    console.log("[CLEANUP] Limpeza concluída:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[CLEANUP] Erro fatal:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
