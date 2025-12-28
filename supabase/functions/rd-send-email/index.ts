// ============================================
// MOISÉS MEDEIROS v10.0 - RD STATION EMAIL
// Gateway centralizado para envio de emails via RD Station
// Substitui o Resend em todo o sistema
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tipos de email suportados e seus identificadores de conversão no RD Station
const EMAIL_CONVERSION_MAP: Record<string, string> = {
  // Emails de boas-vindas e onboarding
  "welcome": "email_boas_vindas",
  "welcome_beta": "email_boas_vindas_beta",
  "welcome_premium": "email_boas_vindas_premium",
  
  // Emails de compra/pagamento
  "purchase_confirmed": "email_compra_confirmada",
  "payment_success": "email_pagamento_sucesso",
  "refund_processed": "email_reembolso",
  
  // Emails de acesso
  "password_reset": "email_reset_senha",
  "access_created": "email_acesso_criado",
  "new_device_login": "email_novo_dispositivo",
  
  // Emails de notificação
  "task_reminder": "email_lembrete_tarefa",
  "weekly_report": "email_relatorio_semanal",
  "suspicious_activity": "email_atividade_suspeita",
  
  // Emails de vencimento
  "payment_due": "email_vencimento",
  "subscription_expiring": "email_assinatura_expirando",
  
  // Emails genéricos
  "notification": "email_notificacao_geral",
  "marketing": "email_marketing",
};

interface SendEmailRequest {
  to: string;
  emailType: string;
  subject?: string;
  data?: Record<string, any>;
  name?: string;
}

interface RDStationPayload {
  event_type: string;
  event_family: string;
  payload: Record<string, any>;
}

async function sendViaRDStation(
  email: string,
  conversionIdentifier: string,
  name: string,
  extraData: Record<string, any>
): Promise<{ success: boolean; message: string; responseBody?: string }> {
  const rdApiKey = Deno.env.get("RD_STATION_API_KEY");
  
  if (!rdApiKey) {
    console.error("[RD-EMAIL] RD_STATION_API_KEY não configurada");
    return { success: false, message: "RD Station API key não configurada" };
  }

  const rdPayload: RDStationPayload = {
    event_type: "CONVERSION",
    event_family: "CDP",
    payload: {
      conversion_identifier: conversionIdentifier,
      email: email,
      name: name || "Lead",
      cf_origem: "plataforma_moises_medeiros",
      cf_data_evento: new Date().toISOString(),
      cf_plataforma: "pro.moisesmedeiros.com.br",
      ...extraData,
    }
  };

  console.log(`[RD-EMAIL] Enviando para ${email} - Conversão: ${conversionIdentifier}`);
  console.log(`[RD-EMAIL] Payload:`, JSON.stringify(rdPayload, null, 2));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.rd.services/platform/conversions?api_key=${rdApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(rdPayload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    let responseBody = "";
    try {
      responseBody = await response.text();
    } catch (e) {
      responseBody = "Não foi possível ler resposta";
    }

    console.log(`[RD-EMAIL] Response status: ${response.status}`);
    console.log(`[RD-EMAIL] Response body: ${responseBody}`);

    if (response.ok || response.status === 200) {
      return { 
        success: true, 
        message: "Email enviado via RD Station",
        responseBody 
      };
    } else {
      return { 
        success: false, 
        message: `RD Station retornou status ${response.status}`,
        responseBody 
      };
    }
  } catch (error) {
    console.error("[RD-EMAIL] Erro ao enviar:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const requestData: SendEmailRequest = await req.json();
    const { to, emailType, subject, data, name } = requestData;

    console.log(`[RD-EMAIL] ========== REQUEST ==========`);
    console.log(`[RD-EMAIL] To: ${to}`);
    console.log(`[RD-EMAIL] Type: ${emailType}`);
    console.log(`[RD-EMAIL] Subject: ${subject}`);

    // Validar email
    if (!to || !to.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar tipo de email
    if (!emailType) {
      return new Response(
        JSON.stringify({ success: false, error: "Tipo de email obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mapear para identificador de conversão do RD Station
    const conversionIdentifier = EMAIL_CONVERSION_MAP[emailType] || `email_${emailType}`;

    // Preparar dados extras
    const extraData: Record<string, any> = {
      cf_tipo_email: emailType,
      cf_assunto: subject || "",
      ...data,
    };

    // Enviar via RD Station
    const result = await sendViaRDStation(to, conversionIdentifier, name || "", extraData);

    // Registrar evento no banco
    await supabaseAdmin.from("integration_events").insert({
      event_type: "rd_station_email",
      source: "rd_send_email",
      source_id: `email_${Date.now()}`,
      payload: {
        to,
        email_type: emailType,
        conversion_identifier: conversionIdentifier,
        subject,
        result_success: result.success,
        result_message: result.message,
      },
      processed: result.success,
      error_message: result.success ? null : result.message,
    });

    if (result.success) {
      console.log(`[RD-EMAIL] ✅ Email enviado com sucesso`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: result.message,
          conversionIdentifier 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error(`[RD-EMAIL] ❌ Falha: ${result.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: any) {
    console.error("[RD-EMAIL] Erro geral:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
