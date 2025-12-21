// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// SISTEMA NERVOSO DIVINO - Processador de Reembolsos
// Processa payment.refunded e revoga acesso do usuário
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event } = await req.json();
    const { customer, transaction } = event.payload;

    console.log(`🔄 Processando reembolso para: ${customer?.email}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (!customer?.email) {
      throw new Error("Email do cliente não encontrado no payload");
    }

    // 1. Buscar usuário pelo email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", customer.email.toLowerCase())
      .single();

    if (!profile) {
      console.log(`⚠️ Usuário não encontrado: ${customer.email}`);
      return new Response(
        JSON.stringify({ success: true, message: "User not found, nothing to revoke" }),
        { headers: corsHeaders }
      );
    }

    const userId = profile.id;

    // 2. Revogar acesso BETA
    const { error: revokeError } = await supabaseAdmin.rpc("revoke_beta_access", {
      p_user_id: userId,
    });

    if (revokeError) {
      console.error("❌ Erro ao revogar acesso:", revokeError);
      // Fallback manual
      await supabaseAdmin.from("user_access_expiration")
        .update({ is_active: false })
        .eq("user_id", userId);
        
      await supabaseAdmin.from("user_roles")
        .update({ role: "aluno_gratuito" })
        .eq("user_id", userId);
    }

    // 3. Atualizar status do aluno
    await supabaseAdmin.from("alunos")
      .update({ 
        status: "inativo",
        observacoes: `Reembolso processado em ${new Date().toISOString()}. Transação: ${transaction?.id || "N/A"}`,
        updated_at: new Date().toISOString(),
      })
      .eq("email", customer.email.toLowerCase());

    // 4. Cancelar comissões pendentes
    if (transaction?.id) {
      await supabaseAdmin.from("comissoes")
        .update({ status: "cancelado" })
        .eq("transaction_id", transaction.id)
        .eq("status", "pendente");
    }

    // 5. Registrar log de auditoria
    await supabaseAdmin.from("audit_logs").insert({
      action: "access_revoked",
      user_id: userId,
      table_name: "user_access_expiration",
      metadata: {
        reason: "refund",
        transaction_id: transaction?.id,
        email: customer.email,
        processed_at: new Date().toISOString(),
      },
    });

    // 6. Publicar evento de revogação
    await supabaseAdmin.rpc("publish_event", {
      p_name: "access.revoked",
      p_payload: JSON.parse(JSON.stringify({
        user_id: userId,
        email: customer.email,
        reason: "refund",
        transaction_id: transaction?.id,
      })),
      p_entity_type: "user",
      p_entity_id: userId,
    });

    // 7. Notificar owner
    await supabaseAdmin.from("alertas_sistema").insert({
      tipo: "financeiro",
      titulo: "🔄 Reembolso Processado",
      mensagem: `O aluno ${customer.email} teve acesso revogado por reembolso.`,
      origem: "webhook-refund",
      destinatarios: ["owner"],
      dados: {
        email: customer.email,
        transaction_id: transaction?.id,
        amount: transaction?.amount,
      },
    });

    console.log(`✅ Reembolso processado: ${customer.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email: customer.email,
        action: "access_revoked",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro em c-handle-refund:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
