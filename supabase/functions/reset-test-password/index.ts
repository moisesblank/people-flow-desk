/**
 * 🔐 Reset Senha de Teste — TEMPORÁRIO
 * Apenas para o Owner resetar senha de usuário de teste
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  
  if (key !== "RESET_2025_OWNER") {
    return new Response(JSON.stringify({ error: "Chave inválida" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const targetEmail = "testedomoisa@gmail.com";
    const newPassword = "Eocomando32!!!";

    // Buscar usuário
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", targetEmail)
      .single();

    if (!profile?.id) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resetar senha
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Senha resetada com sucesso!",
      credentials: {
        email: targetEmail,
        password: newPassword,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
