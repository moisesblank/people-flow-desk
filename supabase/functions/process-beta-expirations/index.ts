// ============================================
// PROCESS BETA EXPIRATIONS - CONSTITUIÇÃO v10.x
// Scheduled function para expirar beta_expira e notificar
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpiredUser {
  expired_user_id: string;
  expired_email: string;
  expired_nome: string;
  expired_at: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[process-beta-expirations] 🚀 Starting expiration check...");

  try {
    // Verificar autorização (pode ser chamada por cron ou manualmente)
    const authHeader = req.headers.get("Authorization");
    const internalSecret = Deno.env.get("INTERNAL_SECRET");
    
    // Aceita chamada via cron (sem auth) ou via INTERNAL_SECRET
    const isCronCall = !authHeader;
    const isInternalCall = authHeader === `Bearer ${internalSecret}`;
    
    if (!isCronCall && !isInternalCall) {
      // Verificar se é um admin/owner chamando
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      
      const token = authHeader?.replace("Bearer ", "");
      if (!token) {
        console.warn("[process-beta-expirations] ❌ No authorization");
        return new Response(
          JSON.stringify({ success: false, error: "Não autorizado" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !user) {
        console.warn("[process-beta-expirations] ❌ Invalid token");
        return new Response(
          JSON.stringify({ success: false, error: "Token inválido" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Verificar se é owner ou admin
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])
        .maybeSingle();
      
      if (!roleData) {
        console.warn("[process-beta-expirations] ❌ User lacks permission:", user.email);
        return new Response(
          JSON.stringify({ success: false, error: "Sem permissão" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Conectar ao Supabase com service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar usuários que vão expirar ANTES de processar
    const { data: expiringUsers, error: queryError } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        expires_at,
        profiles!inner(email, nome)
      `)
      .eq("role", "beta_expira")
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString());

    if (queryError) {
      console.error("[process-beta-expirations] ❌ Query error:", queryError);
      throw queryError;
    }

    const expiredCount = expiringUsers?.length || 0;
    console.log(`[process-beta-expirations] 📊 Found ${expiredCount} users to expire`);

    if (expiredCount === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Nenhum usuário para expirar",
          expired_count: 0,
          notifications_sent: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Processar expirações no banco
    const { error: updateError } = await supabase
      .from("user_roles")
      .update({ role: "aluno_gratuito", expires_at: null })
      .eq("role", "beta_expira")
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString());

    if (updateError) {
      console.error("[process-beta-expirations] ❌ Update error:", updateError);
      throw updateError;
    }

    // Log de auditoria
    await supabase.from("audit_logs").insert({
      action: "EXPIRE_BETA_ROLE",
      table_name: "user_roles",
      metadata: {
        function: "process-beta-expirations",
        executed_at: new Date().toISOString(),
        expired_count: expiredCount,
        source: isCronCall ? "cron" : "manual",
      },
    });

    // Enviar notificações por email
    let notificationsSent = 0;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "Moisés Medeiros <noreply@moisesmedeiros.com.br>";

    if (resendApiKey && expiringUsers) {
      const resend = new Resend(resendApiKey);

      for (const user of expiringUsers) {
        const profile = (user as any).profiles;
        if (!profile?.email) continue;

        try {
          await resend.emails.send({
            from: resendFrom,
            to: [profile.email],
            subject: "Seu acesso premium expirou - Moisés Medeiros",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a1a2e;">Olá, ${profile.nome || "Aluno"}!</h1>
                
                <p>Seu período de acesso <strong>Beta Premium</strong> expirou em ${new Date(user.expires_at).toLocaleDateString("pt-BR")}.</p>
                
                <p>Sua conta foi convertida automaticamente para <strong>Aluno Gratuito</strong>. Isso significa que você ainda pode acessar:</p>
                <ul>
                  <li>✅ Área gratuita do portal</li>
                  <li>✅ Comunidade básica</li>
                  <li>✅ Materiais de amostra</li>
                </ul>
                
                <p>Para recuperar seu acesso premium completo com todas as videoaulas, simulados e materiais exclusivos, entre em contato conosco ou acesse a página de assinatura.</p>
                
                <div style="margin: 30px 0;">
                  <a href="https://pro.moisesmedeiros.com.br/alunos" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Acessar Minha Conta
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  Dúvidas? Responda este email ou entre em contato pelo WhatsApp.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                  Moisés Medeiros - Preparatório para Concursos<br>
                  Este é um email automático. Por favor, não responda diretamente.
                </p>
              </div>
            `,
          });
          notificationsSent++;
          console.log(`[process-beta-expirations] 📧 Email sent to: ${profile.email}`);
        } catch (emailError) {
          console.error(`[process-beta-expirations] ❌ Email failed for ${profile.email}:`, emailError);
        }
      }
    } else {
      console.warn("[process-beta-expirations] ⚠️ RESEND_API_KEY not configured, skipping notifications");
    }

    console.log(`[process-beta-expirations] ✅ Completed: ${expiredCount} expired, ${notificationsSent} notified`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${expiredCount} usuário(s) expirado(s), ${notificationsSent} notificado(s)`,
        expired_count: expiredCount,
        notifications_sent: notificationsSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[process-beta-expirations] ❌ Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
