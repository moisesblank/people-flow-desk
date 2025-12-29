// ============================================
// MOISÉS MEDEIROS v10.0 - Custom Password Reset
// Fluxo customizado com email bonito
// FIX: Separar validação (check) de consumo (consume)
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RequestBody {
  action: "request" | "validate" | "reset";
  email?: string;
  token?: string;
  newPassword?: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const body: RequestBody = await req.json();
    console.log("[custom-password-reset] Action:", body.action);

    // ============================================
    // ACTION: REQUEST - Gerar token e enviar email
    // ============================================
    if (body.action === "request") {
      const email = body.email?.trim().toLowerCase();
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Gerar token via função do banco
      const { data: tokenData, error: tokenError } = await supabase.rpc("create_password_reset_token", {
        _email: email,
      });

      // Sempre retornar sucesso (não revelar se email existe)
      // Mas só enviar email se token foi gerado
      if (tokenData && tokenData.length > 0) {
        const token = tokenData[0].token;
        const resetUrl = `https://pro.moisesmedeiros.com.br/auth?reset_token=${token}`;

        console.log("[custom-password-reset] Token gerado, enviando email...");

        // Enviar email usando send-notification-email
        const { error: emailError } = await supabase.functions.invoke("send-notification-email", {
          body: {
            to: email,
            type: "password_recovery",
            data: {
              confirmation_url: resetUrl,
            },
          },
        });

        if (emailError) {
          console.error("[custom-password-reset] Erro ao enviar email:", emailError);
        } else {
          console.log("[custom-password-reset] ✅ Email enviado com sucesso");
        }
      } else {
        console.log("[custom-password-reset] Email não encontrado ou erro:", tokenError);
      }

      // Sempre retornar sucesso (segurança)
      return new Response(
        JSON.stringify({ success: true, message: "Se o email existir, você receberá instruções de recuperação." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // ACTION: VALIDATE - Verificar se token é válido (SEM CONSUMIR)
    // ============================================
    if (body.action === "validate") {
      const token = body.token;
      if (!token) {
        return new Response(
          JSON.stringify({ valid: false, error: "Token obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 🎯 FIX: Usar check_password_reset_token (NÃO CONSOME)
      const { data, error } = await supabase.rpc("check_password_reset_token", {
        _token: token,
      });

      console.log("[custom-password-reset] Validate result:", { data, error });

      if (error || !data || data.length === 0 || !data[0].valid) {
        return new Response(
          JSON.stringify({ valid: false, error: "Token inválido ou expirado" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, email: data[0].email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // ACTION: RESET - Definir nova senha (CONSOME TOKEN)
    // ============================================
    if (body.action === "reset") {
      const { token, newPassword } = body;

      if (!token || !newPassword) {
        return new Response(
          JSON.stringify({ error: "Token e nova senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validar força da senha
      const hasLower = /[a-z]/.test(newPassword);
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);
      const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(newPassword);

      if (newPassword.length < 8 || !hasLower || !hasUpper || !hasNumber || !hasSpecial) {
        return new Response(
          JSON.stringify({ error: "Senha deve ter no mínimo 8 caracteres com maiúscula, minúscula, número e caractere especial" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 🎯 FIX: Usar consume_password_reset_token (CONSOME AGORA)
      const { data: tokenData, error: tokenError } = await supabase.rpc("consume_password_reset_token", {
        _token: token,
      });

      console.log("[custom-password-reset] Consume result:", { tokenData, tokenError });

      if (tokenError || !tokenData || tokenData.length === 0 || !tokenData[0].valid) {
        console.error("[custom-password-reset] Token inválido:", tokenError);
        return new Response(
          JSON.stringify({ error: "Token inválido ou expirado. Solicite uma nova recuperação." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userId = tokenData[0].user_id;
      console.log("[custom-password-reset] Atualizando senha para user:", userId);

      // Atualizar senha usando admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        console.error("[custom-password-reset] Erro ao atualizar senha:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar senha. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[custom-password-reset] ✅ Senha atualizada com sucesso para user:", userId);

      return new Response(
        JSON.stringify({ success: true, message: "Senha atualizada com sucesso!" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[custom-password-reset] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
