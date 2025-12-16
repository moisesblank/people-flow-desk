// ============================================
// MOISÉS MEDEIROS v7.0 - Verify 2FA Code
// Verifica código de autenticação de dois fatores
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Verify2FARequest {
  userId: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, code }: Verify2FARequest = await req.json();

    console.log(`[2FA Verify] Verificando código para user: ${userId}`);

    if (!userId || !code) {
      return new Response(
        JSON.stringify({ valid: false, error: "userId e code são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar formato do código (6 dígitos)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ valid: false, error: "Código inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Buscar código válido
    const { data: validCode, error: fetchError } = await supabaseAdmin
      .from("two_factor_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", code)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !validCode) {
      console.log(`[2FA Verify] Código inválido ou expirado`);
      
      // Verificar se código existe mas expirou
      const { data: expiredCode } = await supabaseAdmin
        .from("two_factor_codes")
        .select("expires_at")
        .eq("user_id", userId)
        .eq("code", code)
        .single();

      if (expiredCode) {
        return new Response(
          JSON.stringify({ valid: false, error: "Código expirado. Solicite um novo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: false, error: "Código inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar código como usado
    const { error: updateError } = await supabaseAdmin
      .from("two_factor_codes")
      .update({ verified: true })
      .eq("id", validCode.id);

    if (updateError) {
      console.error("[2FA Verify] Erro ao atualizar código:", updateError);
    }

    // Registrar login no activity log
    await supabaseAdmin
      .from("activity_log")
      .insert({
        user_id: userId,
        action: "2FA_VERIFIED",
        new_value: { method: "email", verified_at: new Date().toISOString() }
      });

    console.log(`[2FA Verify] Código verificado com sucesso!`);

    return new Response(
      JSON.stringify({ valid: true, message: "Código verificado com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[2FA Verify] Erro:", error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
