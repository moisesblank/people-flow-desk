// ============================================
// 🛡️ DOGMA XI: BANIMENTO IMEDIATO (REVERSÍVEL)
// Edge Function para Admin/Owner banir usuário
// Revoga sessões + bloqueia login
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// P1-2 FIX: OWNER_EMAIL removido - usar role='owner' do banco

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[admin-ban-user] ❌ Sem header de autorização");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar quem está chamando
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      console.error("[admin-ban-user] ❌ Token inválido:", authError);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // P1-2 FIX: Verificar role no banco (fonte da verdade)
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .maybeSingle();

    const callerRole = roleData?.role;
    if (callerRole !== "owner" && callerRole !== "admin") {
      console.error("[admin-ban-user] ❌ Permissão negada. Role:", callerRole);
      return new Response(
        JSON.stringify({ error: "Apenas Admin ou Owner podem banir usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const isOwner = callerRole === "owner";
    const callerEmail = caller.email || "unknown";

    // Parsear body
    const body = await req.json();
    const { action, targetUserId, targetEmail, reason } = body;

    console.log("[admin-ban-user] 📥 Request:", { action, targetUserId, targetEmail, callerEmail });

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Ação não especificada (ban/unban)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolver targetUserId se apenas email foi fornecido
    let resolvedUserId = targetUserId;
    if (!resolvedUserId && targetEmail) {
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", targetEmail.toLowerCase())
        .maybeSingle();

      if (!profileData) {
        return new Response(
          JSON.stringify({ error: "Usuário não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      resolvedUserId = profileData.id;
    }

    if (!resolvedUserId) {
      return new Response(
        JSON.stringify({ error: "targetUserId ou targetEmail é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // P1-2 FIX: Proteção - verificar se target é owner via role no banco
    const { data: targetRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", resolvedUserId)
      .maybeSingle();

    if (targetRole?.role === "owner") {
      console.error("[admin-ban-user] ❌ Tentativa de banir Owner bloqueada");
      return new Response(
        JSON.stringify({ error: "Não é possível banir o Owner do sistema" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Executar ação
    if (action === "ban") {
      console.log("[admin-ban-user] 🔒 Banindo usuário:", resolvedUserId);

      // Usar RPC para banir e revogar sessões atomicamente
      const { data: banResult, error: banError } = await supabaseAdmin.rpc(
        "ban_user_and_revoke_sessions",
        {
          p_target_user_id: resolvedUserId,
          p_reason: reason || "Banido pelo administrador",
          p_banned_by: caller.id,
        }
      );

      if (banError) {
        console.error("[admin-ban-user] ❌ Erro ao banir:", banError);
        return new Response(
          JSON.stringify({ error: "Erro ao banir usuário", details: banError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[admin-ban-user] ✅ Usuário banido com sucesso:", banResult);

      return new Response(
        JSON.stringify({
          success: true,
          action: "ban",
          userId: resolvedUserId,
          sessionsRevoked: banResult?.sessions_revoked || 0,
          message: "Usuário banido e todas as sessões foram revogadas",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "unban") {
      console.log("[admin-ban-user] 🔓 Desbanindo usuário:", resolvedUserId);

      const { data: unbanResult, error: unbanError } = await supabaseAdmin.rpc("unban_user", {
        p_target_user_id: resolvedUserId,
      });

      if (unbanError) {
        console.error("[admin-ban-user] ❌ Erro ao desbanir:", unbanError);
        return new Response(
          JSON.stringify({ error: "Erro ao desbanir usuário", details: unbanError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[admin-ban-user] ✅ Usuário desbanido:", unbanResult);

      return new Response(
        JSON.stringify({
          success: true,
          action: "unban",
          userId: resolvedUserId,
          message: "Usuário desbanido com sucesso",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Ação inválida. Use 'ban' ou 'unban'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: any) {
    console.error("[admin-ban-user] ❌ Erro crítico:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
